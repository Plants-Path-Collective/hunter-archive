let tabs = [];
let active = 0;

async function loadAll() {
    const res = await fetch("data/files.json");
    const data = await res.json();

    tabs = data.hunters;

    const newH = JSON.parse(localStorage.getItem("newHunter"));
    if (newH) tabs.push(newH);

    renderTabs();
}

function renderTabs() {
    const el = document.getElementById("tabs");
    el.innerHTML = "";

    tabs.forEach((h, i) => {
        const t = document.createElement("div");
        t.className = "tab " + (i === active ? "active" : "");
        t.textContent = h.id;

        t.onclick = () => {
            active = i;
            renderTabs();
            renderEditor();
        };

        el.appendChild(t);
    });

    renderEditor();
}

function renderEditor() {
    const h = tabs[active];

    document.getElementById("base").innerHTML =
        `<p>${h.class} | ${h.mbti}</p>`;

    desc.value = h.description || "";
    passive.value = h.passive || "";
    activeInput.value = h.active?.base || "";

    renderPreview();
}

function renderPreview() {
    const h = tabs[active];

    preview.innerHTML = `
    <h2>${h.id}</h2>
    <p>${desc.value}</p>
  `;
}

update.onclick = renderPreview;

download.onclick = () => {
    const h = tabs[active];

    const updated = {
        ...h,
        description: desc.value,
        passive: passive.value,
        active: { base: activeInput.value }
    };

    const blob = new Blob([JSON.stringify(updated, null, 2)]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = h.id + ".json";
    a.click();
};

loadAll();