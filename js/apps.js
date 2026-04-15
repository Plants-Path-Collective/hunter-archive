/* =========================
   UTILIDADES
========================= */

function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = data.id + ".json";
    a.click();
}

/* =========================
   MAIN LOADER
========================= */

async function loadApp(name, el, data) {

    /* =========================
       GENERATOR
    ========================= */
    if (name === "generator") {

        const res = await fetch("data/data.json");
        const DATA = await res.json();

        el.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; height:100%;">

            <div class="panel">
                <h3>Generator</h3>

                <div class="panel" style="margin-top:6px">
                    <label>Género</label>
                    <select id="gender"></select>

                    <label>Clase</label>
                    <select id="class"></select>

                    <label>MBTI</label>
                    <select id="mbti"></select>
                </div>

                <button id="generate" style="margin-top:6px;">Generate</button>

                <div class="panel" id="result" style="margin-top:6px;">
                    <p>No generation yet.</p>
                </div>
            </div>

            <div class="panel" id="preview">
                <p>Waiting for generation...</p>
            </div>

        </div>
        `;

        const fill = (id, arr) => {
            const sel = el.querySelector("#" + id);
            arr.forEach(v => {
                const o = document.createElement("option");
                o.value = v;
                o.textContent = v;
                sel.appendChild(o);
            });
        };

        fill("gender", DATA.genders);
        fill("class", DATA.classes.map(c => c.name));
        fill("mbti", DATA.mbti);

        const rand = arr => arr[Math.floor(Math.random() * arr.length)];

        function generateSkills(concepts, cls) {
            let passive = "Adaptación básica al entorno";
            let active = "Acción primaria estándar";

            const text = concepts.join(" ").toLowerCase();

            if (text.includes("tiempo")) {
                passive = "Percibe eventos futuros cercanos";
                active = "Rebobinar acción reciente";
            }

            if (text.includes("insecto")) {
                passive = "Comunicación con enjambres";
                active = "Invocar unidad insectoide";
            }

            if (text.includes("vampiro")) {
                passive = "Regeneración por absorción";
                active = "Drenar energía vital";
            }

            if (text.includes("mecánico") || text.includes("máquina")) {
                passive = "Resistencia estructural aumentada";
                active = "Sobrecarga de sistema";
            }

            if (cls === "Archivista") {
                passive += " (memoria perfecta)";
            }

            return { passive, active };
        }

        el.querySelector("#generate").onclick = () => {

            const concepts = [
                rand(DATA.concepts.function).text,
                rand(DATA.concepts.aesthetic).text,
                rand(DATA.concepts.anomaly).text
            ];

            const cls = el.querySelector("#class").value;

            const skills = generateSkills(concepts, cls);

            const hunter = {
                id: "H-" + Date.now(),
                gender: el.querySelector("#gender").value,
                class: cls,
                mbti: el.querySelector("#mbti").value,
                concepts,
                passive: skills.passive,
                active: { base: skills.active },
                description: "",
                images: []
            };

            el.querySelector("#result").innerHTML = `
                <ul>${concepts.map(c => `<li>${c}</li>`).join("")}</ul>
                <button id="to-editor">Open in Editor</button>
            `;

            el.querySelector("#preview").innerHTML = `
                <div class="panel">
                    <h3>${hunter.id}</h3>
                    <p><b>${hunter.class}</b> — ${hunter.mbti}</p>

                    <div class="panel">
                        <ul>${concepts.map(c => `<li>${c}</li>`).join("")}</ul>
                    </div>

                    <div class="panel">
                        <p><b>Passive:</b> ${skills.passive}</p>
                        <p><b>Active:</b> ${skills.active}</p>
                    </div>
                </div>
            `;

            el.querySelector("#to-editor").onclick = () => {
                openApp("editor", hunter);
            };
        };
    }

    /* =========================
        EDITOR (UPGRADED)
    ========================= */
    if (name === "editor") {

        const h = data;

        el.innerHTML = `
    <div class="split split-30-70">

        <!-- LEFT: EDITOR -->
        <div class="stack">

            <h3>${h.id}</h3>

            <!-- BASIC INFO -->
            <div class="panel">
                <p><b>${h.class}</b> — ${h.mbti}</p>
                <p>${h.gender}</p>
            </div>

            <!-- CONCEPTS -->
            <div class="panel" style="margin-top:6px">
                <h3>Concepts</h3>
                <ul>
                    ${h.concepts.map(c => `<li>${c}</li>`).join("")}
                </ul>
            </div>

            <!-- IMAGES -->
            <div class="panel" style="margin-top:6px; aspect-ratio: 4:3">
                <h3>Images (Imgur URLs)</h3>

                <textarea id="imgs" placeholder="one url per line"></textarea>
            </div>

            <!-- DESCRIPTION -->
            <div class="panel" style="margin-top:6px">
                <h3>Description</h3>
                <textarea id="desc"></textarea>
            </div>

            <!-- ABILITIES -->
            <div class="panel" style="margin-top:6px">
                <h3>Abilities</h3>

                <label>Passive</label>
                <input id="passive">

                <label>Active</label>
                <input id="active">
            </div>

            <!-- ACTIONS -->
            <div style="margin-top:6px; display:flex; gap:6px;">
                <button id="update">Update</button>
                <button id="download">Download JSON</button>
                <button id="copy">Copy JSON</button>
            </div>

        </div>

        <!-- RIGHT: PREVIEW -->
        <div class="panel scroll" id="preview"></div>

    </div>
    `;

        const imgs = el.querySelector("#imgs");
        const desc = el.querySelector("#desc");
        const passive = el.querySelector("#passive");
        const active = el.querySelector("#active");

        /* =========================
           INITIAL VALUES
        ========================= */
        imgs.value = (h.images || []).join("\n");
        desc.value = h.description || "";
        passive.value = h.passive || "";
        active.value = h.active?.base || "";

        /* =========================
           BUILD FINAL OBJECT
        ========================= */
        function build() {
            return {
                ...h,
                description: desc.value,
                images: imgs.value
                    .split("\n")
                    .map(v => v.trim())
                    .filter(v => v),
                passive: passive.value,
                active: { base: active.value }
            };
        }

        /* =========================
           PREVIEW (HORIZONTAL)
        ========================= */
        function render() {

            const data = build();

            el.querySelector("#preview").innerHTML = `
            <div class="panel">

                <h3>${data.id}</h3>

                <div style="display:grid; grid-template-columns:220px 1fr; gap:6px; margin-top:6px;">

                    <!-- IMAGE -->
                    <div class="panel">
                        ${data.images[0]
                ? `<img src="${data.images[0]}" style="width:100%; image-rendering:pixelated;">`
                : `<div style="height:200px; display:flex; align-items:center; justify-content:center; aspect-ratio: 4:3">No Image</div>`
            }
                    </div>

                    <!-- INFO -->
                    <div class="panel">

                        <div class="panel">
                            <p><b>${data.class}</b> — ${data.mbti}</p>
                            <p>${data.gender}</p>
                        </div>

                        <div class="panel" style="margin-top:6px">
                            <h3>Concepts</h3>
                            <ul>
                                ${data.concepts.map(c => `<li>${c}</li>`).join("")}
                            </ul>
                        </div>

                    </div>

                </div>

                <div class="panel" style="margin-top:6px">
                    <h3>Description</h3>
                    <p>${data.description || "No description."}</p>
                </div>

                <div class="panel" style="margin-top:6px">
                    <h3>Abilities</h3>
                    <p><b>Passive:</b> ${data.passive}</p>
                    <p><b>Active:</b> ${data.active.base}</p>
                </div>

            </div>
        `;
        }

        /* =========================
           ACTIONS
        ========================= */

        el.querySelector("#update").onclick = render;

        el.querySelector("#download").onclick = () => {
            downloadJSON(build());
        };

        el.querySelector("#copy").onclick = () => {
            navigator.clipboard.writeText(
                JSON.stringify(build(), null, 2)
            );
            alert("Copied JSON to clipboard");
        };

        render();
    }

    /* =========================
       FILES (DESDE JSON)
    ========================= */
    if (name === "files") {

        let files = [];
        let openTabs = [];
        let activeTab = 0;

        el.innerHTML = `
        <div id="file-tabs" style="display:flex; gap:2px; margin-bottom:4px;"></div>

        <div class="split split-30-70">
            <div class="stack" id="file-sidebar"></div>
            <div class="panel scroll" id="file-content"></div>
        </div>
        `;

        const sidebar = el.querySelector("#file-sidebar");
        const content = el.querySelector("#file-content");
        const tabsEl = el.querySelector("#file-tabs");

        async function loadFiles() {
            const res = await fetch("data/files.json");
            files = await res.json();
            renderSidebar();
        }

        function renderSidebar() {
            sidebar.innerHTML = "";

            files.forEach(h => {
                const item = document.createElement("div");
                item.textContent = h.id;
                item.style.cursor = "pointer";

                let clickTimer = null;

                item.onclick = () => {
                    if (clickTimer) {
                        clearTimeout(clickTimer);
                        clickTimer = null;
                        openFile(h);
                    } else {
                        clickTimer = setTimeout(() => clickTimer = null, 250);
                    }
                };

                sidebar.appendChild(item);
            });
        }

        function openFile(h) {
            if (!openTabs.find(t => t.id === h.id)) {
                openTabs.push(h);
            }

            activeTab = openTabs.findIndex(t => t.id === h.id);
            renderTabs();
            renderContent();
        }

        function renderTabs() {
            tabsEl.innerHTML = "";

            openTabs.forEach((h, i) => {
                const tab = document.createElement("div");
                tab.textContent = h.id;

                tab.style.padding = "2px 6px";
                tab.style.background = i === activeTab ? "white" : "#c0c0c0";

                tab.onclick = () => {
                    activeTab = i;
                    renderTabs();
                    renderContent();
                };

                tabsEl.appendChild(tab);
            });
        }

        function renderContent() {
            if (!openTabs.length) {
                content.innerHTML = "<p>Select a file.</p>";
                return;
            }

            const h = openTabs[activeTab];

            content.innerHTML = `
        <div class="panel">

            <h3>${h.id}</h3>

            <div style="display:grid; grid-template-columns:220px 1fr; gap:6px; margin-top:6px;">

                <!-- LEFT: IMAGE -->
                <div class="panel">
                    ${h.images?.[0]
                ? `<img src="${h.images[0]}" style="width:100%; image-rendering:pixelated;">`
                : `<div style="height:200px; display:flex; align-items:center; justify-content:center; aspect-ratio: 4:3">
                            No Image
                           </div>`
            }
                </div>

                <!-- RIGHT: CORE INFO -->
                <div class="panel">

                    <div class="panel">
                        <p><b>${h.class}</b> — ${h.mbti}</p>
                        <p>${h.gender || ""}</p>
                    </div>

                    <div class="panel" style="margin-top:6px">
                        <h3>Concepts</h3>
                        <ul>
                            ${(h.concepts || []).map(c => `<li>${c}</li>`).join("")}
                        </ul>
                    </div>

                </div>

            </div>

            <!-- DESCRIPTION -->
            <div class="panel" style="margin-top:6px">
                <h3>Description</h3>
                <p>${h.description || "No description."}</p>
            </div>

            <!-- ABILITIES -->
            <div class="panel" style="margin-top:6px">
                <h3>Abilities</h3>
                <p><b>Passive:</b> ${h.passive || "-"}</p>
                <p><b>Active:</b> ${h.active?.base || "-"}</p>
            </div>

            <div style="margin-top:6px;">
                <button id="open-editor">Open in Editor</button>
            </div>

        </div>
    `;

            content.querySelector("#open-editor").onclick = () => {
                openApp("editor", h);
            };
        }

        loadFiles();
    }
    
    /* =========================
       MAIL / README
    ========================= */
    if (name === "mail") {

        el.innerHTML = `
        <div class="panel">

            <h3>Hunter Association - Internal Mail</h3>

            <div class="panel" style="margin-top:6px">
                <p><b>From:</b> Hunter Association</p>
                <p><b>Subject:</b> System Usage Protocol</p>
            </div>

            <div class="panel" style="margin-top:6px">
                <p>
                    Operator,<br><br>

                    You are accessing the Hunter Archive System.<br><br>

                    Standard workflow:<br>
                    - Generate new Hunters via Generator<br>
                    - Review and edit in Editor<br>
                    - Store in system archive<br><br>

                    Each Hunter must include:<br>
                    - Class designation<br>
                    - Behavioral profile (MBTI)<br>
                    - Conceptual origin markers<br>
                    - Ability framework<br><br>

                    Maintain structural integrity of all records.<br><br>

                    Unauthorized modifications will be logged.<br><br>

                    — Hunter Association
                </p>
            </div>

        </div>
    `;
    }
    
}