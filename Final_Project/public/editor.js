window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const journalId = params.get("id");
  const saved = params.get("saved");

  const backLink = document.getElementById("backLink");
  const viewLink = document.getElementById("viewLink");
  const saveForm = document.getElementById("saveForm");
  const titleInput = document.getElementById("titleInput");
  const templateSelect = document.getElementById("templateSelect");
  const deleteJournalBtn = document.getElementById("deleteJournalBtn");
  const titleHint = document.getElementById("titleHint");
  const previewStage = document.getElementById("previewStage");
  const previewTitle = document.getElementById("previewTitle");
  const previewPhotos = document.getElementById("previewPhotos");
  const uploadForm = document.getElementById("uploadForm");
  const entriesInput = document.getElementById("entriesInput");
  const imagesEl = document.getElementById("images");

  let currentImages = [];
  const template1Layout = [
    { x: "18%", y: "62%", r: "-3deg", s: "96px" },
    { x: "34%", y: "62%", r: "2deg", s: "96px" },
    { x: "50%", y: "62%", r: "-1deg", s: "96px" },
    { x: "66%", y: "62%", r: "3deg", s: "96px" },
    { x: "82%", y: "62%", r: "-2deg", s: "96px" },
    { x: "26%", y: "78%", r: "2deg", s: "104px" },
    { x: "42%", y: "78%", r: "-3deg", s: "104px" },
    { x: "58%", y: "78%", r: "1deg", s: "104px" },
    { x: "74%", y: "78%", r: "-2deg", s: "104px" },
  ];
  const template2Layout = [
    { x: "12%", y: "18%", r: "-12deg", s: "96px" },
    { x: "36%", y: "12%", r: "10deg", s: "96px" },
    { x: "58%", y: "13%", r: "18deg", s: "96px" },
    { x: "86%", y: "18%", r: "-6deg", s: "96px" },
    { x: "16%", y: "62%", r: "-8deg", s: "104px" },
    { x: "85%", y: "60%", r: "15deg", s: "104px" },
    { x: "32%", y: "85%", r: "-10deg", s: "104px" },
    { x: "56%", y: "85%", r: "-11deg", s: "104px" },
    { x: "72%", y: "88%", r: "8deg", s: "104px" },
  ];

  if (!journalId) {
    document.body.innerHTML = "<p>Missing journal id</p>";
    return;
  }

  // set navigation links
  viewLink.href = `journal.html?id=${journalId}`;
  backLink.href = `index.html`;
  saveForm.action = `/api/journals/${journalId}/save`;

  // set upload action (form submit to server)
  uploadForm.action = `/api/journals/${journalId}/images`;

  const renderPreview = () => {
    const templateId = templateSelect.value || "template1";
    const layoutList = templateId === "template2" ? template2Layout : template1Layout;
    previewStage.className = `preview-stage ${templateId}`;
    previewTitle.textContent = titleInput.value.trim() || "Untitled";
    previewPhotos.innerHTML = "";

    currentImages.forEach((img, index) => {
      const photo = document.createElement("div");
      const image = document.createElement("img");
      const layout = layoutList[index];

      if (!layout) {
        return;
      }

      photo.className = "preview-photo";
      photo.style.setProperty("--x", layout.x);
      photo.style.setProperty("--y", layout.y);
      photo.style.setProperty("--r", layout.r);
      photo.style.setProperty("--s", layout.s);

      image.src = img.imageUrl;
      image.alt = img.title || img.originalName || "image";

      photo.appendChild(image);
      previewPhotos.appendChild(photo);
    });
  };

  const updateEntriesField = () => {
    const entries = currentImages.map((img) => ({
      imageId: img._id,
      title: img.title || img.originalName || "Untitled",
      note: img.note || "",
    }));

    entriesInput.value = JSON.stringify(entries);
  };

  const renderImages = (images) => {
    currentImages = images;
    imagesEl.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "grid";

    images.forEach((img) => {
      const item = document.createElement("div");
      item.className = "item";

      const preview = document.createElement("img");
      preview.src = img.imageUrl;
      preview.alt = img.title || img.originalName || "image";

      const titleField = document.createElement("input");
      titleField.type = "text";
      titleField.value = img.title || img.originalName || "";
      titleField.placeholder = "Image title";
      titleField.addEventListener("input", () => {
        img.title = titleField.value;
        updateEntriesField();
      });

      const textarea = document.createElement("textarea");
      textarea.value = img.note || "";
      textarea.placeholder = "Type notes for this image...";
      textarea.addEventListener("input", () => {
        img.note = textarea.value;
        updateEntriesField();
      });

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete Image";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Delete this image?")) return;
        delBtn.disabled = true;
        delBtn.textContent = "Deleting...";
        const res = await fetch(`/api/images/${img._id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        await load();
      });

      const row = document.createElement("div");
      row.className = "smallrow";
      row.appendChild(delBtn);

      item.appendChild(preview);
      item.appendChild(titleField);
      item.appendChild(textarea);
      item.appendChild(row);

      grid.appendChild(item);
    });

    imagesEl.appendChild(grid);
    updateEntriesField();
    renderPreview();
  };

  const load = async () => {
    const res = await fetch(`/api/journals/${journalId}`);
    const data = await res.json();

    titleInput.value = data.title || "";
    templateSelect.value = data.templateId || "template1";
    renderImages(data.images || []);
  };

  titleInput.addEventListener("input", renderPreview);
  templateSelect.addEventListener("change", renderPreview);
  saveForm.addEventListener("submit", () => {
    updateEntriesField();
    titleHint.textContent = "Saving...";
  });

  if (saved === "1") {
    titleHint.textContent = "Saved.";
  }

  deleteJournalBtn.addEventListener("click", async () => {
    if (!confirm("Delete this journal page?")) return;

    deleteJournalBtn.disabled = true;
    deleteJournalBtn.textContent = "Deleting...";
    const res = await fetch(`/api/journals/${journalId}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "index.html";
      return;
    }
    deleteJournalBtn.textContent = "Delete Journal";
    deleteJournalBtn.disabled = false;
  });

  load();
};
