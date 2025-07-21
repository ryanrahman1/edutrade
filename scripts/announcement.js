document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("http://localhost:3000/api/announcement/pinned");
    const data = await res.json();

    const list = document.querySelector(".news-list");
    
    const announcement = data[0];

    const box = document.createElement("div");
    box.className = "news-item";

    const title = document.createElement("h3");
    title.className = "announcement-title";
    title.textContent = announcement.title;

    const expandText = document.createElement("p");
    expandText.className = "announcement-expand-hint";
    expandText.textContent = "click to expand";
    expandText.style.fontSize = "0.8rem";
    expandText.style.opacity = "0.6";
    expandText.style.margin = "0.25rem 0 0 0";

    const header = document.createElement("div");
    header.className = "announcement-header";
    header.appendChild(title);
    header.appendChild(expandText);

    box.appendChild(header);
    box.style.cursor = "pointer";
    box.addEventListener("click", () => openModal("announcement", announcement));
    function getAnData() {
        return announcement;
    }


    list.appendChild(box);
  } catch (err) {
    console.error("Failed to load announcement:", err);
  }
});
