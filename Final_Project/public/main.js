window.onload = () => {
  const bg = document.getElementById("bg");
  const stage = document.querySelector(".stage");
  const editLink = document.getElementById("editLink");
  const titleEl = document.getElementById("title");
  const scatter = document.getElementById("scatter");
  const noteHeading = document.getElementById("noteHeading");
  const noteText = document.getElementById("noteText");

  const params = new URLSearchParams(window.location.search);
  const journalId = params.get("id");
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
    { x: "12%", y: "22%", r: "-12deg", s: "96px" },
    { x: "36%", y: "14%", r: "10deg", s: "96px" },
    { x: "58%", y: "16%", r: "18deg", s: "96px" },
    { x: "86%", y: "18%", r: "-6deg", s: "96px" },
    { x: "16%", y: "62%", r: "-8deg", s: "104px" },
    { x: "85%", y: "60%", r: "15deg", s: "104px" },
    { x: "32%", y: "85%", r: "-10deg", s: "104px" },
    { x: "56%", y: "85%", r: "-11deg", s: "104px" },
    { x: "72%", y: "88%", r: "8deg", s: "104px" },
  ];

  const load = async () => {
    let id = journalId;

    if (!id) {
      const listRes = await fetch("/api/journals");
      const list = await listRes.json();
      if (list.length === 0) {
        titleEl.textContent = "No Journals";
        return;
      }
      id = list[0]._id;
      history.replaceState(null, "", `journal.html?id=${id}`);
    }

    const res = await fetch(`/api/journals/${id}`);
    const data = await res.json();

    titleEl.textContent = data.title;
    editLink.href = `editor.html?id=${id}`;
    scatter.className = "scatter";

    scatter.innerHTML = "";
    const templateId = data.templateId || "template1";
    const layoutList = templateId === "template2" ? template2Layout : template1Layout;
    stage.className = `stage ${templateId}`;

    data.images.forEach((img, index) => {
      const div = document.createElement("div");
      div.className = "photo";
      const layout = layoutList[index];

      if (!layout) {
        return;
      }

      const x = layout.x;
      const y = layout.y;
      const r = layout.r;
      const s = layout.s;

      div.setAttribute("style", `--x: ${x}; --y: ${y}; --r: ${r}; --s: ${s};`);

      const image = document.createElement("img");
      image.src = img.imageUrl;
      image.alt = img.title || img.originalName || "photo";

      div.addEventListener("mouseenter", () => {
        bg.style.backgroundImage = `url("${img.imageUrl}")`;
        bg.classList.add("is-on");
      });

      div.addEventListener("mouseleave", () => {
        bg.classList.remove("is-on");
      });

      div.addEventListener("click", () => {
        noteHeading.textContent = img.title || "Image Notes";
        noteText.textContent = img.note || "No notes for this image yet.";
      });

      div.appendChild(image);
      scatter.appendChild(div);
    });
  };

  load();
};
