let FILES = [];
let openTabs = [];

async function loadFiles() {
    const res = await fetch("data/files.json");
    const data = await res.json();
    FILES = data.hunters;

    renderList();
}

function renderList() {
    const list = document.getElementById("viewer-list");
    list.innerHTML = "";

    FILES.forEach(h => {
        const div = document.createElement("div");
        div.textContent = h.id;

        div.onclick = () => openTab(h);

        list.appendChild(div);
    });
}

function openTab(h) {
    openTabs.push(h);
    renderTabs();
    renderDetail(h);
}

function renderTabs() {
    const tabs = document.getElementById("tabs");
    tabs.innerHTML = "";

    openTabs.forEach(h => {
        const t = document.createElement("div");
        t.className = "tab";
        t.textContent = h.id;
        tabs.appendChild(t);
    });
}

function renderDetail(h) {
    document.getElementById("viewer-detail").innerHTML = `
    <h2>${h.id}</h2>
    <p>${h.class}</p>
    <p>${h.description || ""}</p>
  `;
}

loadFiles();