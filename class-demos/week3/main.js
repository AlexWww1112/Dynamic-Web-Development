const q = document.getElementById("q");
const btn = document.getElementById("btn");
const statusEl = document.getElementById("status");

const resultsTitle = document.getElementById("resultsTitle");
const results = document.getElementById("results");

const charsTitle = document.getElementById("charsTitle");
const characters = document.getElementById("characters");

//Search
async function searchAnime() {
    const query = q.value.trim();
    if (!query) return;

    statusEl.innerText = "Loading results...";
    results.innerHTML = "";
    characters.innerHTML = "";
    charsTitle.style.display = "none";

    try {
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`;
        const res = await fetch(url);
        const data = await res.json();

        const list = data.data || [];
        if (list.length === 0) {
            resultsTitle.style.display = "none";
            statusEl.innerText = "No results found.";
            return;
        }

        resultsTitle.style.display = "block";
        statusEl.innerText = "Click a cover to load characters.";

        for (const anime of list) {
            const img = document.createElement("img");

            //larger images
            const cover =
                anime.images?.jpg?.large_image_url ||
                anime.images?.jpg?.image_url ||
                "";

            img.src = cover;
            img.alt = anime.title || "Anime cover";

            img.addEventListener("click", () => loadCharacters(anime.mal_id, anime.title));

            results.appendChild(img);
        }
    } catch (err) {
        console.error(err);
        statusEl.innerText = "Failed to load results. Try again.";
    }
}

//Characters
async function loadCharacters(animeId, animeTitle) {
    statusEl.innerText = `Loading characters for: ${animeTitle}...`;
    characters.innerHTML = "";
    charsTitle.style.display = "block";
    charsTitle.innerText = `Characters: ${animeTitle}`;

    try {
        const url = `https://api.jikan.moe/v4/anime/${animeId}/characters`;
        const res = await fetch(url);
        const data = await res.json();

        const list = data.data || [];
        if (list.length === 0) {
            statusEl.innerText = "No character data found.";
            return;
        }

        statusEl.innerText = `Showing ${list.length} characters.`;

        for (const item of list) {
            const card = document.createElement("div");
            card.className = "char-card";

            const img = document.createElement("img");
            img.src =
                item.character?.images?.jpg?.image_url ||
                item.character?.images?.webp?.image_url ||
                "";
            img.alt = item.character?.name || "Character";

            const name = document.createElement("p");
            name.innerText = item.character?.name || "Unknown";

            card.appendChild(img);
            card.appendChild(name);
            characters.appendChild(card);
        }
    } catch (err) {
        console.error(err);
        statusEl.innerText = "Failed to load characters. Try clicking again.";
    }
}

//Two ways of enter search
btn.addEventListener("click", searchAnime);

q.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchAnime();
});
