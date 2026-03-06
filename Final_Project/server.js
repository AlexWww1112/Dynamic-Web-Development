const express = require("express");
const path = require("path");
const fs = require("fs");
const Datastore = require("@seald-io/nedb");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3001;

//Paths
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");

// ensure folders exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

//Middlewares
app.use(express.json()); // for fetch JSON body
app.use(express.urlencoded({ extended: true })); // for form body
app.use(express.static(PUBLIC_DIR)); // serve public/*
app.use("/uploads", express.static(UPLOAD_DIR)); // serve uploads/*

app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

//database
const journalsDb = new Datastore({
  filename: path.join(DATA_DIR, "journals.db"),
  autoload: true,
});
const imagesDb = new Datastore({
  filename: path.join(DATA_DIR, "images.db"),
  autoload: true,
});

journalsDb.ensureIndex({ fieldName: "updatedAt" });
imagesDb.ensureIndex({ fieldName: "journalId" });

//Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

//helper functions
function now() {
  return Date.now();
}

function isJsonRequest(req) {
  return (req.headers["content-type"] || "").includes("application/json");
}

function parseEntries(raw) {
  if (!raw) return [];
  try {
    const entries = JSON.parse(raw);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function removeUploadedFiles(files) {
  files.forEach((file) => {
    const filePath = path.join(UPLOAD_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
}

function removeImageDocs(images, done) {
  if (images.length === 0) {
    done();
    return;
  }

  let pending = images.length;

  images.forEach((img) => {
    const filePath = path.join(UPLOAD_DIR, img.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    imagesDb.remove({ _id: img._id }, {}, () => {
      pending -= 1;
      if (pending === 0) done();
    });
  });
}

function removeJournalImages(journalId, done) {
  imagesDb.find({ journalId }).exec((findErr, images) => {
    if (findErr) return done(findErr);

    removeImageDocs(images, () => done(null));
  });
}

// list journals
app.get("/api/journals", (req, res) => {
  journalsDb.find({}).sort({ updatedAt: -1 }).exec((err, docs) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(docs);
  });
});

// create journal
app.post("/api/journals", (req, res) => {
  const title = (req.body?.title || "Untitled").toString();
  const templateId = (req.body?.templateId || "template1").toString();

  const doc = { title, templateId, createdAt: now(), updatedAt: now() };
  journalsDb.insert(doc, (err, created) => {
    if (isJsonRequest(req)) {
      return res.status(201).json(created);
    }

    res.redirect(`/editor.html?id=${created._id}`);
  });
});

// get journal detail with images
app.get("/api/journals/:id", (req, res) => {
  const journalId = req.params.id;

  journalsDb.findOne({ _id: journalId }, (err, journal) => {
    imagesDb.find({ journalId }).sort({ createdAt: 1 }).exec((e2, images) => {
      if (e2) return res.status(500).json({ error: e2.message });

      // unify imageUrl for frontend
      const mapped = images.map((img) => ({
        ...img,
        imageUrl: `/uploads/${img.filename}`,
      }));

      res.json({ ...journal, images: mapped });
    });
  });
});

// update journal title/template
app.patch("/api/journals/:id", (req, res) => {
  const journalId = req.params.id;
  const patch = { updatedAt: now() };

  if (typeof req.body.title === "string") patch.title = req.body.title;
  if (typeof req.body.templateId === "string") patch.templateId = req.body.templateId;

  journalsDb.update({ _id: journalId }, { $set: patch }, {}, (err, num) => {
    
    journalsDb.findOne({ _id: journalId }, (e2, doc) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json(doc);
    });
  });
});

app.post("/api/journals/:id/save", (req, res) => {
  const journalId = req.params.id;
  const title = (req.body?.title || "Untitled").toString();
  const templateId = (req.body?.templateId || "template1").toString();
  const entries = parseEntries(req.body?.entries);

  journalsDb.update(
    { _id: journalId },
    { $set: { title, templateId, updatedAt: now() } },
    {},
    (err, num) => {
      if (err) return res.status(500).send(err.message);
      if (num === 0) return res.status(404).send("Journal not found");

      if (entries.length === 0) {
        return res.redirect(`/editor.html?id=${journalId}&saved=1`);
      }

      let pending = entries.length;
      let hasFailed = false;

      entries.forEach((item) => {
        const note = typeof item.note === "string" ? item.note : "";
        const imageTitle = typeof item.title === "string" && item.title.trim()
          ? item.title.trim()
          : "Untitled";

        imagesDb.update(
          { _id: item.imageId, journalId },
          { $set: { note, title: imageTitle } },
          {},
          (imageErr) => {
            if (hasFailed) return;
            if (imageErr) {
              hasFailed = true;
              return res.status(500).send(imageErr.message);
            }

            pending -= 1;
            if (pending === 0) {
              res.redirect(`/editor.html?id=${journalId}&saved=1`);
            }
          }
        );
      });
    }
  );
});

// upload images -> redirect back to editor
app.post("/api/journals/:id/images", upload.array("images", 20), (req, res) => {
  const journalId = req.params.id;
  let files = req.files || [];

  if (files.length === 0) return res.status(400).send("No files uploaded");
  if (files.length > 9) {
    removeUploadedFiles(files.slice(9));
    files = files.slice(0, 9);
  }

  imagesDb.find({ journalId }).sort({ createdAt: 1 }).exec((findErr, existingImages) => {
    if (findErr) return res.status(500).send(findErr.message);

    const overflow = Math.max(0, existingImages.length + files.length - 9);
    const removedImages = existingImages.slice(0, overflow);
    const docs = files.map((f) => ({
      journalId,
      filename: f.filename,
      originalName: f.originalname,
      title: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      note: "",
      createdAt: now(),
    }));

    removeImageDocs(removedImages, () => {
      imagesDb.insert(docs, (err) => {
        if (err) return res.status(500).send(err.message);

        journalsDb.update({ _id: journalId }, { $set: { updatedAt: now() } }, {}, () => {});
        res.redirect(`/editor.html?id=${journalId}`);
      });
    });
  });
});

// update note
app.patch("/api/images/:imageId", (req, res) => {
  const imageId = req.params.imageId;
  if (typeof req.body.note !== "string") {
    return res.status(400).json({ error: "note must be a string" });
  }

  imagesDb.update({ _id: imageId }, { $set: { note: req.body.note } }, {}, (err, num) => {
    if (err) return res.status(500).json({ error: err.message });
    if (num === 0) return res.status(404).json({ error: "Image not found" });

    imagesDb.findOne({ _id: imageId }, (e2, doc) => {
      if (e2) return res.status(500).json({ error: e2.message });
      res.json({ ...doc, imageUrl: `/uploads/${doc.filename}` });
    });
  });
});

// delete image
app.delete("/api/images/:imageId", (req, res) => {
  const imageId = req.params.imageId;

  imagesDb.findOne({ _id: imageId }, (err, img) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!img) return res.status(404).json({ error: "Image not found" });

    const p = path.join(UPLOAD_DIR, img.filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);

    imagesDb.remove({ _id: imageId }, {}, (e2) => {
      if (e2) return res.status(500).json({ error: e2.message });
      journalsDb.update({ _id: img.journalId }, { $set: { updatedAt: now() } }, {}, () => {});
      res.json({ ok: true });
    });
  });
});

app.delete("/api/journals/:id", (req, res) => {
  const journalId = req.params.id;

  removeJournalImages(journalId, (imageErr) => {
    if (imageErr) return res.status(500).json({ error: imageErr.message });

    journalsDb.remove({ _id: journalId }, {}, (err, num) => {
      if (err) return res.status(500).json({ error: err.message });
      if (num === 0) return res.status(404).json({ error: "Journal not found" });
      res.json({ ok: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Serving static from: ${PUBLIC_DIR}`);
});
