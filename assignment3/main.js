async function searchAnime() {
    const input = document.getElementById("q");
    const results = document.getElementById("results");
    const status = document.getElementById("status");
    const resultsTitle = document.getElementById("resultsTitle");
    const charsTitle = document.getElementById("charsTitle");
    const characters = document.getElementById("characters");

    const query = input.value.trim();
    if (!query) {
        status.innerText = "Please enter an anime name.";
        return;
    }

    status.innerText = "Loading...";
    results.innerHTML = "";
    characters.innerHTML = "";
    charsTitle.style.display = "none";
    resultsTitle.style.display = "none";

    try {
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=25`;
        const response = await fetch(url);
        const data = await response.json();
        const list = data.data || [];

        const normalizeBase = (text) => (text || "").toLowerCase();
        const toSearchText = (text) =>
            normalizeBase(text).replace(/[^\p{L}\p{N}]+/gu, "");
        const toTokens = (text) =>
            normalizeBase(text)
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        const queryTokens = toTokens(query);
        const keywordMatches = list.filter((anime) => {
            const searchTitles = [
                anime.title,
                anime.title_english,
                anime.title_japanese
            ]
                .map(toSearchText)
                .filter(Boolean);

            return queryTokens.every((token) =>
                searchTitles.some((title) => title.includes(token))
            );
        });

        const prioritizedList = keywordMatches.length > 0 ? keywordMatches : list;
        const uniqueByCover = [];
        const seenCovers = new Set();

        for (const anime of prioritizedList) {
            const coverUrl =
                anime.images?.jpg?.large_image_url ||
                anime.images?.jpg?.image_url ||
                "";
            if (!coverUrl || seenCovers.has(coverUrl)) continue;

            seenCovers.add(coverUrl);
            uniqueByCover.push(anime);
        }

        const displayList = uniqueByCover.slice(0, 10);

        if (displayList.length === 0) {
            status.innerText = "No results found.";
            return;
        }

        resultsTitle.style.display = "block";
        if (keywordMatches.length > 0) {
            status.innerText = `Showing ${displayList.length} keyword match(es). Click a cover to load characters.`;
        } else {
            status.innerText = "Click a cover to load characters.";
        }

        for (const anime of displayList) {
            const card = document.createElement("div");
            card.className = "result-card";

            const img = document.createElement("img");
            img.src =
                anime.images?.jpg?.large_image_url ||
                anime.images?.jpg?.image_url ||
                "";
            img.alt = anime.title || "Anime cover";
            card.addEventListener("click", () => {
                loadCharacters(anime.mal_id, anime.title || "Unknown");
            });

            const title = document.createElement("p");
            title.className = "anime-title";
            title.innerText =
                anime.title_english ||
                anime.title ||
                anime.title_japanese ||
                "Unknown title";

            card.appendChild(img);
            card.appendChild(title);
            results.appendChild(card);
        }
    } catch (err) {
        console.error(err);
        status.innerText = "Search failed. Please try again.";
    }
}

async function loadCharacters(animeId, animeTitle) {
    const status = document.getElementById("status");
    const charsTitle = document.getElementById("charsTitle");
    const characters = document.getElementById("characters");

    status.innerText = `Loading characters for: ${animeTitle}...`;
    charsTitle.style.display = "block";
    charsTitle.innerText = `Characters: ${animeTitle}`;
    characters.innerHTML = "";

    try {
        const url = `https://api.jikan.moe/v4/anime/${animeId}/characters`;
        const response = await fetch(url);
        const data = await response.json();
        const list = data.data || [];

        if (list.length === 0) {
            status.innerText = "No character data found.";
            return;
        }

        status.innerText = `Showing ${list.length} characters.`;
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
        status.innerText = "Failed to load characters. Try clicking again.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btn");
    const input = document.getElementById("q");

    btn.addEventListener("click", searchAnime);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchAnime();
    });
});
