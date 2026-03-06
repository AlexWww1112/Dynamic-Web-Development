window.onload = () => {
  const listEl = document.getElementById("list");
  const formEl = document.getElementById("createForm");
  const inputEl = document.getElementById("newTitle");

  const render = (journals) => {
    listEl.innerHTML = "";

    journals.forEach((journal) => {
      const a = document.createElement("a");
      a.href = `journal.html?id=${journal._id}`;
      a.textContent = journal.title;
      listEl.appendChild(a);
    });
  };

  const load = async () => {
    const res = await fetch("/api/journals");
    const journals = await res.json();
    render(journals);
  };

  formEl.addEventListener("submit", () => {
    if (!inputEl.value.trim()) {
      inputEl.value = "Untitled";
    }
  });

  load();
};
