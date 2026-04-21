/* =========================
   UTILIDADES GLOBALES
========================= */

function downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = data.id + ".json";
    a.click();
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}

/* =========================
   MAIN LOADER
========================= */

async function loadApp(name, el, data) {

    /* ─────────────────────────────────────────────
       Load data.json once — used for generator data
       AND tooltip/description lookups across all apps
    ───────────────────────────────────────────── */
    let CONFIG = {
        genders: [],
        mbti: [],
        mbti_descriptions: {},
        classes: [],
        concepts: { function: [], aesthetic: [], anomaly: [] },
        attribute_tooltips: {},
        passive_pool: [],
        active_pool: []
    };
    try {
        const res = await fetch("data/data.json");
        CONFIG = await res.json();
    } catch (e) {
        console.warn("No se pudo cargar data.json:", e);
    }

    // Helpers
    const tt        = key       => CONFIG.attribute_tooltips?.[key] || "";
    const classDesc = className => CONFIG.classes?.find(c => c.name === className)?.description || "";
    const mbtiDesc  = mbtiKey   => CONFIG.mbti_descriptions?.[mbtiKey] || "";

    /* =========================
       GENERADOR
    ========================= */

    if (name === "generator") {

        const passivePool = CONFIG.passive_pool?.length ? CONFIG.passive_pool : [
            "Resistencia elemental (fuego, hielo, rayo)",
            "Regeneración rápida fuera de combate",
            "Percepción extrasensorial (ver invisibilidad)"
        ];
        const activePool = CONFIG.active_pool?.length ? CONFIG.active_pool : [
            "Golpe dimensional (ignora armadura)",
            "Sobrecarga de energía (daño en área)",
            "Invocar aliado temporal (criatura de sombra)"
        ];

        el.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; height:100%;">

            <div class="panel">
                <h3>Generador</h3>

                <div class="panel" style="margin-top:6px">
                    <label>Género</label>
                    <select id="gender"></select>

                    <label id="lbl-class">Clase</label>
                    <select id="class"></select>
                    <div id="class-hint" class="field-hint"></div>

                    <label id="lbl-mbti">MBTI</label>
                    <select id="mbti"></select>
                    <div id="mbti-hint" class="field-hint"></div>
                </div>

                <button id="generate" style="margin-top:6px;">Generar</button>

                <div class="panel" id="result" style="margin-top:6px;">
                    <p>Sin generación aún.</p>
                </div>
            </div>

            <div class="panel scroll" id="preview">
                <p style="color:var(--text-muted);">Esperando generación...</p>
            </div>

        </div>
        `;

        // ── Populate selects ──────────────────────────
        const fillSelect = (id, arr) => {
            const sel = el.querySelector("#" + id);
            arr.forEach(v => {
                const o = document.createElement("option");
                o.value = v; o.textContent = v;
                sel.appendChild(o);
            });
        };

        fillSelect("gender", CONFIG.genders);
        fillSelect("class",  CONFIG.classes.map(c => c.name));
        fillSelect("mbti",   CONFIG.mbti);

        // ── Tooltip + inline hint: Clase ──────────────
        const classSelect = el.querySelector("#class");
        const classHint   = el.querySelector("#class-hint");

        const updateClassHint = () => {
            const d = classDesc(classSelect.value);
            classHint.textContent = d ? "↳ " + d : "";
        };
        classSelect.addEventListener("change", updateClassHint);
        Tooltip.bindDynamic(classSelect, () => classDesc(classSelect.value));
        if (tt("class")) Tooltip.bind(el.querySelector("#lbl-class"), tt("class"));
        updateClassHint();

        // ── Tooltip + inline hint: MBTI ───────────────
        const mbtiSelect = el.querySelector("#mbti");
        const mbtiHint   = el.querySelector("#mbti-hint");

        const updateMbtiHint = () => {
            const d = mbtiDesc(mbtiSelect.value);
            mbtiHint.textContent = d ? "↳ " + d : "";
        };
        mbtiSelect.addEventListener("change", updateMbtiHint);
        Tooltip.bindDynamic(mbtiSelect, () => mbtiDesc(mbtiSelect.value));
        if (tt("mbti")) Tooltip.bind(el.querySelector("#lbl-mbti"), tt("mbti"));
        updateMbtiHint();

        // ── Random helper ─────────────────────────────
        const rand = arr => arr[Math.floor(Math.random() * arr.length)];

        // ── Generate button ───────────────────────────
        el.querySelector("#generate").onclick = () => {

            const concepts = [
                rand(CONFIG.concepts.function).text,
                rand(CONFIG.concepts.aesthetic).text,
                rand(CONFIG.concepts.anomaly).text
            ];
            const passive = rand(passivePool);
            const active  = rand(activePool);

            const hunter = {
                id: "H-" + Date.now(),
                gender: el.querySelector("#gender").value,
                class:  classSelect.value,
                mbti:   mbtiSelect.value,
                concepts,
                passive,
                active: { base: active },
                description: "",
                images: []
            };

            // Result panel
            el.querySelector("#result").innerHTML = `
                <div class="concept-row">
                    <span class="concept-label" id="lbl-fn">FN</span>
                    <span>${escapeHtml(concepts[0])}</span>
                </div>
                <div class="concept-row">
                    <span class="concept-label" id="lbl-ae">AE</span>
                    <span>${escapeHtml(concepts[1])}</span>
                </div>
                <div class="concept-row">
                    <span class="concept-label" id="lbl-an">AN</span>
                    <span>${escapeHtml(concepts[2])}</span>
                </div>
                <button id="to-editor" style="margin-top:8px;">Abrir en Editor</button>
            `;

            const rEl = el.querySelector("#result");
            if (tt("function"))  Tooltip.bind(rEl.querySelector("#lbl-fn"), tt("function"));
            if (tt("aesthetic")) Tooltip.bind(rEl.querySelector("#lbl-ae"), tt("aesthetic"));
            if (tt("anomaly"))   Tooltip.bind(rEl.querySelector("#lbl-an"), tt("anomaly"));

            // Preview panel
            const cdesc = classDesc(hunter.class);
            const mdesc = mbtiDesc(hunter.mbti);

            el.querySelector("#preview").innerHTML = `
                <div class="panel">
                    <h3>${escapeHtml(hunter.id)}</h3>

                    <div class="panel" style="margin-top:6px;">
                        <p>
                            <b id="prev-class">${escapeHtml(hunter.class)}</b>
                            &nbsp;—&nbsp;
                            <span id="prev-mbti">${escapeHtml(hunter.mbti)}</span>
                        </p>
                        <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(hunter.gender)}</p>
                    </div>

                    <div class="panel" style="margin-top:6px;">
                        <h3 id="prev-concepts-h">Conceptos</h3>
                        <div class="concept-row">
                            <span class="concept-label" id="prev-fn">FN</span>
                            <span>${escapeHtml(concepts[0])}</span>
                        </div>
                        <div class="concept-row">
                            <span class="concept-label" id="prev-ae">AE</span>
                            <span>${escapeHtml(concepts[1])}</span>
                        </div>
                        <div class="concept-row">
                            <span class="concept-label" id="prev-an">AN</span>
                            <span>${escapeHtml(concepts[2])}</span>
                        </div>
                    </div>

                    <div class="panel" style="margin-top:6px;">
                        <p><b id="prev-passive-lbl">Pasiva:</b> ${escapeHtml(passive)}</p>
                        <p><b id="prev-active-lbl">Activa:</b> ${escapeHtml(active)}</p>
                    </div>
                </div>
            `;

            const pEl = el.querySelector("#preview");
            if (cdesc)           Tooltip.bind(pEl.querySelector("#prev-class"),       cdesc);
            if (mdesc)           Tooltip.bind(pEl.querySelector("#prev-mbti"),        mdesc);
            if (tt("concepts"))  Tooltip.bind(pEl.querySelector("#prev-concepts-h"),  tt("concepts"));
            if (tt("function"))  Tooltip.bind(pEl.querySelector("#prev-fn"),          tt("function"));
            if (tt("aesthetic")) Tooltip.bind(pEl.querySelector("#prev-ae"),          tt("aesthetic"));
            if (tt("anomaly"))   Tooltip.bind(pEl.querySelector("#prev-an"),          tt("anomaly"));
            if (tt("passive"))   Tooltip.bind(pEl.querySelector("#prev-passive-lbl"), tt("passive"));
            if (tt("active"))    Tooltip.bind(pEl.querySelector("#prev-active-lbl"),  tt("active"));

            el.querySelector("#to-editor").onclick = () => openApp("editor", hunter);
        };
    }

    /* =========================
       EDITOR
    ========================= */

    if (name === "editor") {

        // ── No hunter passed: show selector ───────────
        if (!data) {
            let huntersList = [];

            const renderSelector = async () => {
                try {
                    const res = await fetch("data/files.json");
                    huntersList = await res.json();
                } catch (e) { huntersList = []; }

                el.innerHTML = `
                    <div class="stack" style="height:100%;">
                        <div class="panel">
                            <h3>Seleccionar Hunter</h3>
                            <select id="hunterSelect" size="10" style="width:100%; margin-bottom:6px;"></select>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button id="selectHunterBtn">Editar seleccionado</button>
                                <button id="newHunterBtn">Crear nuevo Hunter</button>
                                <button id="refreshListBtn">Recargar lista</button>
                                <button id="editConfigBtn">Editar configuración (data.json)</button>
                            </div>
                        </div>
                        <div id="selectorPreview" class="panel scroll" style="flex:1;">
                            <p>Selecciona un Hunter para ver vista previa.</p>
                        </div>
                    </div>
                `;

                const selectEl = el.querySelector("#hunterSelect");
                if (huntersList.length === 0) {
                    selectEl.innerHTML = '<option value="">No hay Hunters disponibles</option>';
                } else {
                    huntersList.forEach(h => {
                        const opt = document.createElement("option");
                        opt.value = h.id;
                        opt.textContent = `${h.id} — ${h.class} (${h.mbti})`;
                        selectEl.appendChild(opt);
                    });
                }

                selectEl.addEventListener("change", () => {
                    const hunter = huntersList.find(h => h.id === selectEl.value);
                    if (!hunter) {
                        el.querySelector("#selectorPreview").innerHTML = "<p>Selecciona un Hunter para ver vista previa.</p>";
                        return;
                    }
                    const previewDiv = el.querySelector("#selectorPreview");
                    previewDiv.innerHTML = `
                        <div class="panel">
                            <h3>${escapeHtml(hunter.id)}</h3>
                            <p>
                                <b id="sel-class">${escapeHtml(hunter.class)}</b>
                                &nbsp;—&nbsp;
                                <span id="sel-mbti">${escapeHtml(hunter.mbti)}</span>
                            </p>
                            <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(hunter.gender || "")}</p>

                            <h3 id="sel-concepts-h" style="margin-top:8px;">Conceptos</h3>
                            <div class="concept-row">
                                <span class="concept-label" id="sel-fn">FN</span>
                                <span>${escapeHtml(hunter.concepts?.[0] || "—")}</span>
                            </div>
                            <div class="concept-row">
                                <span class="concept-label" id="sel-ae">AE</span>
                                <span>${escapeHtml(hunter.concepts?.[1] || "—")}</span>
                            </div>
                            <div class="concept-row">
                                <span class="concept-label" id="sel-an">AN</span>
                                <span>${escapeHtml(hunter.concepts?.[2] || "—")}</span>
                            </div>

                            <h3 style="margin-top:8px;">Descripción</h3>
                            <p>${escapeHtml(hunter.description || "Sin descripción.")}</p>

                            <h3 style="margin-top:8px;">Habilidades</h3>
                            <p><b id="sel-passive-lbl">Pasiva:</b> ${escapeHtml(hunter.passive || "—")}</p>
                            <p><b id="sel-active-lbl">Activa:</b> ${escapeHtml(hunter.active?.base || "—")}</p>
                        </div>
                    `;

                    const cdesc = classDesc(hunter.class);
                    const mdesc = mbtiDesc(hunter.mbti);
                    if (cdesc)           Tooltip.bind(previewDiv.querySelector("#sel-class"),       cdesc);
                    if (mdesc)           Tooltip.bind(previewDiv.querySelector("#sel-mbti"),        mdesc);
                    if (tt("concepts"))  Tooltip.bind(previewDiv.querySelector("#sel-concepts-h"),  tt("concepts"));
                    if (tt("function"))  Tooltip.bind(previewDiv.querySelector("#sel-fn"),          tt("function"));
                    if (tt("aesthetic")) Tooltip.bind(previewDiv.querySelector("#sel-ae"),          tt("aesthetic"));
                    if (tt("anomaly"))   Tooltip.bind(previewDiv.querySelector("#sel-an"),          tt("anomaly"));
                    if (tt("passive"))   Tooltip.bind(previewDiv.querySelector("#sel-passive-lbl"), tt("passive"));
                    if (tt("active"))    Tooltip.bind(previewDiv.querySelector("#sel-active-lbl"),  tt("active"));
                });

                el.querySelector("#selectHunterBtn").onclick = () => {
                    const id = selectEl.value;
                    if (!id) { alert("Selecciona un Hunter de la lista."); return; }
                    const hunter = huntersList.find(h => h.id === id);
                    if (hunter) { openApp("editor", hunter); el.closest(".window").remove(); }
                };
                el.querySelector("#newHunterBtn").onclick    = () => openApp("generator");
                el.querySelector("#refreshListBtn").onclick  = () => renderSelector();
                el.querySelector("#editConfigBtn").onclick   = () => openApp("editor", { _type: "dataConfig" });
            };

            renderSelector();
            return;
        }

        // ── data.json config editor ───────────────────
        if (data._type === "dataConfig") {
            let configJson = "";

            const loadConfig = async () => {
                try {
                    const res = await fetch("data/data.json");
                    const parsed = await res.json();
                    configJson = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    configJson = '{\n  "error": "No se pudo cargar data.json"\n}';
                }
                renderConfigEditor();
            };

            const renderConfigEditor = () => {
                el.innerHTML = `
                    <div class="split split-30-70" style="height:100%;">
                        <div class="stack">
                            <div class="panel">
                                <h3>Editar data.json</h3>
                                <textarea id="configJson" style="height:300px; font-family:monospace;"></textarea>
                                <div style="display:flex; gap:6px; margin-top:6px;">
                                    <button id="previewConfigBtn">Vista previa</button>
                                    <button id="downloadConfigBtn">Descargar JSON</button>
                                    <button id="resetConfigBtn">Recargar original</button>
                                </div>
                            </div>
                        </div>
                        <div class="panel scroll" id="configPreview">
                            <p>Haz clic en "Vista previa" para ver cómo queda la configuración.</p>
                        </div>
                    </div>
                `;

                el.querySelector("#configJson").value = configJson;
                const textarea   = el.querySelector("#configJson");
                const previewDiv = el.querySelector("#configPreview");

                el.querySelector("#previewConfigBtn").onclick = () => {
                    try {
                        const nc = JSON.parse(textarea.value);
                        previewDiv.innerHTML = `
                            <div class="panel">
                                <h3>Vista previa de data.json</h3>
                                <h4>Géneros</h4>
                                <ul>${nc.genders?.map(g => `<li>${escapeHtml(g)}</li>`).join("") || "<li>No definido</li>"}</ul>
                                <h4>MBTI</h4>
                                <ul>${nc.mbti?.map(m => `<li>${escapeHtml(m)}</li>`).join("") || "<li>No definido</li>"}</ul>
                                <h4>Clases (${nc.classes?.length || 0})</h4>
                                <ul>${nc.classes?.map(c => `<li>
                                    <b>${escapeHtml(c.name || c)}</b>
                                    ${c.description ? `<br><span style="color:var(--text-muted);font-size:10px;">↳ ${escapeHtml(c.description)}</span>` : ""}
                                </li>`).join("") || "<li>No definido</li>"}</ul>
                                <h4>Conceptos</h4>
                                <p><b>Función:</b> ${nc.concepts?.function?.map(f => escapeHtml(f.text)).join(", ") || "—"}</p>
                                <p><b>Estética:</b> ${nc.concepts?.aesthetic?.map(a => escapeHtml(a.text)).join(", ") || "—"}</p>
                                <p><b>Anomalía:</b> ${nc.concepts?.anomaly?.map(a => escapeHtml(a.text)).join(", ") || "—"}</p>
                                <h4>Habilidades pasivas (${nc.passive_pool?.length || 0})</h4>
                                <ul>${nc.passive_pool?.slice(0,5).map(p => `<li>${escapeHtml(p)}</li>`).join("") || "<li>No definido</li>"}${nc.passive_pool?.length > 5 ? "<li>...</li>" : ""}</ul>
                                <h4>Habilidades activas (${nc.active_pool?.length || 0})</h4>
                                <ul>${nc.active_pool?.slice(0,5).map(a => `<li>${escapeHtml(a)}</li>`).join("") || "<li>No definido</li>"}${nc.active_pool?.length > 5 ? "<li>...</li>" : ""}</ul>
                            </div>
                        `;
                    } catch (e) {
                        previewDiv.innerHTML = `<div class="panel" style="color:#ff6b6b;">Error en JSON: ${escapeHtml(e.message)}</div>`;
                    }
                };

                el.querySelector("#downloadConfigBtn").onclick = () => {
                    try {
                        const nc = JSON.parse(textarea.value);
                        const blob = new Blob([JSON.stringify(nc, null, 2)], { type: "application/json" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = "data.json";
                        a.click();
                        URL.revokeObjectURL(a.href);
                        alert("data.json descargado. Reemplaza el archivo original en la carpeta data/");
                    } catch (e) {
                        alert("JSON inválido: " + e.message);
                    }
                };

                el.querySelector("#resetConfigBtn").onclick = () => loadConfig();
            };

            loadConfig();
            return;
        }

        // ── Hunter editor ─────────────────────────────
        const h = data;

        el.innerHTML = `
        <div class="split split-30-70">

            <!-- LEFT: FORM -->
            <div class="stack">

                <h3>${escapeHtml(h.id)}</h3>

                <!-- BASIC INFO -->
                <div class="panel">
                    <p>
                        <b id="ed-class">${escapeHtml(h.class)}</b>
                        &nbsp;—&nbsp;
                        <span id="ed-mbti">${escapeHtml(h.mbti)}</span>
                    </p>
                    <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(h.gender)}</p>
                </div>

                <!-- CONCEPTS — EDITABLE -->
                <div class="panel">
                    <h3 id="ed-concepts-h">Conceptos</h3>
                    <label id="ed-fn-lbl">Función</label>
                    <input id="concept0" placeholder="qué hace el Hunter en el mundo...">
                    <label id="ed-ae-lbl">Estética</label>
                    <input id="concept1" placeholder="atmósfera visual o entorno...">
                    <label id="ed-an-lbl">Anomalía</label>
                    <input id="concept2" placeholder="rasgo inexplicable o contradicción...">
                </div>

                <!-- IMAGES -->
                <div class="panel">
                    <h3>Imágenes (URLs de Imgur)</h3>
                    <textarea id="imgs" placeholder="una url por línea"></textarea>
                </div>

                <!-- DESCRIPTION -->
                <div class="panel">
                    <h3>Descripción</h3>
                    <textarea id="desc"></textarea>
                </div>

                <!-- ABILITIES -->
                <div class="panel">
                    <h3>Habilidades</h3>
                    <label id="ed-passive-lbl">Pasiva</label>
                    <input id="passive">
                    <label id="ed-active-lbl">Activa</label>
                    <input id="active">
                </div>

                <!-- ACTIONS -->
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button id="update">Actualizar</button>
                    <button id="download">Descargar JSON</button>
                    <button id="copy">Copiar JSON</button>
                </div>

            </div>

            <!-- RIGHT: PREVIEW -->
            <div class="panel scroll" id="preview"></div>

        </div>
        `;

        // Set field values safely (no innerHTML attribute injection)
        el.querySelector("#concept0").value = h.concepts?.[0] || "";
        el.querySelector("#concept1").value = h.concepts?.[1] || "";
        el.querySelector("#concept2").value = h.concepts?.[2] || "";
        el.querySelector("#imgs").value     = (h.images || []).join("\n");
        el.querySelector("#desc").value     = h.description || "";
        el.querySelector("#passive").value  = h.passive || "";
        el.querySelector("#active").value   = h.active?.base || "";

        // Bind tooltips to form labels/elements
        const cdesc = classDesc(h.class);
        const mdesc = mbtiDesc(h.mbti);
        if (cdesc)           Tooltip.bind(el.querySelector("#ed-class"),       cdesc);
        if (mdesc)           Tooltip.bind(el.querySelector("#ed-mbti"),        mdesc);
        if (tt("concepts"))  Tooltip.bind(el.querySelector("#ed-concepts-h"),  tt("concepts"));
        if (tt("function"))  Tooltip.bind(el.querySelector("#ed-fn-lbl"),      tt("function"));
        if (tt("aesthetic")) Tooltip.bind(el.querySelector("#ed-ae-lbl"),      tt("aesthetic"));
        if (tt("anomaly"))   Tooltip.bind(el.querySelector("#ed-an-lbl"),      tt("anomaly"));
        if (tt("passive"))   Tooltip.bind(el.querySelector("#ed-passive-lbl"), tt("passive"));
        if (tt("active"))    Tooltip.bind(el.querySelector("#ed-active-lbl"),  tt("active"));

        // Build final object from form
        function build() {
            return {
                ...h,
                concepts: [
                    el.querySelector("#concept0").value.trim(),
                    el.querySelector("#concept1").value.trim(),
                    el.querySelector("#concept2").value.trim()
                ],
                description: el.querySelector("#desc").value,
                images: el.querySelector("#imgs").value
                    .split("\n").map(v => v.trim()).filter(Boolean),
                passive: el.querySelector("#passive").value,
                active: { base: el.querySelector("#active").value }
            };
        }

        // Render live preview
        function render() {
            const d = build();

            el.querySelector("#preview").innerHTML = `
            <div class="panel">
                <h3>${escapeHtml(d.id)}</h3>

                <div style="display:grid; grid-template-columns:220px 1fr; gap:6px; margin-top:6px;">

                    <!-- IMAGE -->
                    <div class="panel">
                        ${d.images[0]
                ? `<img src="${escapeHtml(d.images[0])}" style="width:100%; image-rendering:pixelated;">`
                : `<div style="height:200px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">Sin Imagen</div>`
            }
                    </div>

                    <!-- INFO -->
                    <div class="panel">
                        <div class="panel">
                            <p>
                                <b id="prev-class">${escapeHtml(d.class)}</b>
                                &nbsp;—&nbsp;
                                <span id="prev-mbti">${escapeHtml(d.mbti)}</span>
                            </p>
                            <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(d.gender)}</p>
                        </div>

                        <div class="panel" style="margin-top:6px;">
                            <h3 id="prev-concepts-h">Conceptos</h3>
                            <div class="concept-row">
                                <span class="concept-label" id="prev-fn">FN</span>
                                <span>${escapeHtml(d.concepts[0] || "—")}</span>
                            </div>
                            <div class="concept-row">
                                <span class="concept-label" id="prev-ae">AE</span>
                                <span>${escapeHtml(d.concepts[1] || "—")}</span>
                            </div>
                            <div class="concept-row">
                                <span class="concept-label" id="prev-an">AN</span>
                                <span>${escapeHtml(d.concepts[2] || "—")}</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="panel" style="margin-top:6px;">
                    <h3>Descripción</h3>
                    <p>${escapeHtml(d.description || "Sin descripción.")}</p>
                </div>

                <div class="panel" style="margin-top:6px;">
                    <h3>Habilidades</h3>
                    <p><b id="prev-passive-lbl">Pasiva:</b> ${escapeHtml(d.passive || "—")}</p>
                    <p><b id="prev-active-lbl">Activa:</b> ${escapeHtml(d.active.base || "—")}</p>
                </div>
            </div>
            `;

            // Re-bind tooltips after each render (innerHTML replaces nodes)
            const pEl     = el.querySelector("#preview");
            const pcdesc  = classDesc(d.class);
            const pmdesc  = mbtiDesc(d.mbti);
            if (pcdesc)          Tooltip.bind(pEl.querySelector("#prev-class"),       pcdesc);
            if (pmdesc)          Tooltip.bind(pEl.querySelector("#prev-mbti"),        pmdesc);
            if (tt("concepts"))  Tooltip.bind(pEl.querySelector("#prev-concepts-h"),  tt("concepts"));
            if (tt("function"))  Tooltip.bind(pEl.querySelector("#prev-fn"),          tt("function"));
            if (tt("aesthetic")) Tooltip.bind(pEl.querySelector("#prev-ae"),          tt("aesthetic"));
            if (tt("anomaly"))   Tooltip.bind(pEl.querySelector("#prev-an"),          tt("anomaly"));
            if (tt("passive"))   Tooltip.bind(pEl.querySelector("#prev-passive-lbl"), tt("passive"));
            if (tt("active"))    Tooltip.bind(pEl.querySelector("#prev-active-lbl"),  tt("active"));
        }

        el.querySelector("#update").onclick   = render;
        el.querySelector("#download").onclick = () => downloadJSON(build());
        el.querySelector("#copy").onclick     = () => {
            navigator.clipboard.writeText(JSON.stringify(build(), null, 2));
            alert("JSON copiado al portapapeles");
        };

        render(); // Initial render
    }

    /* =========================
       ARCHIVOS
    ========================= */

    if (name === "files") {

        let files     = [];
        let openTabs  = [];
        let activeTab = 0;

        el.innerHTML = `
        <div id="file-tabs" style="display:flex; gap:2px; margin-bottom:4px;"></div>
        <div class="split split-30-70">
            <div class="stack" id="file-sidebar"></div>
            <div class="panel scroll" id="file-content"></div>
        </div>
        `;

        const sidebar  = el.querySelector("#file-sidebar");
        const content  = el.querySelector("#file-content");
        const tabsEl   = el.querySelector("#file-tabs");

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

                // Tooltip shows class + description on sidebar item hover
                const cdesc = classDesc(h.class);
                if (cdesc) Tooltip.bind(item, `${h.class}: ${cdesc}`);
                else if (h.class) Tooltip.bind(item, h.class);

                let clickTimer = null;
                item.onclick = () => {
                    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; openFile(h); }
                    else { clickTimer = setTimeout(() => clickTimer = null, 250); }
                };

                sidebar.appendChild(item);
            });
        }

        function openFile(h) {
            if (!openTabs.find(t => t.id === h.id)) openTabs.push(h);
            activeTab = openTabs.findIndex(t => t.id === h.id);
            renderTabs();
            renderContent();
        }

        function renderTabs() {
            tabsEl.innerHTML = "";
            openTabs.forEach((h, i) => {
                const tab = document.createElement("div");
                tab.textContent = h.id;
                tab.className = "tab";
                if (i === activeTab) tab.classList.add("active");
                tab.onclick = () => { activeTab = i; renderTabs(); renderContent(); };
                tabsEl.appendChild(tab);
            });
        }

        function renderContent() {
            if (!openTabs.length) {
                content.innerHTML = "<p style='color:var(--text-muted);'>Selecciona un archivo.</p>";
                return;
            }

            const h = openTabs[activeTab];

            content.innerHTML = `
            <div class="panel">

                <h3>${escapeHtml(h.id)}</h3>

                <div style="display:grid; grid-template-columns:220px 1fr; gap:6px; margin-top:6px;">

                    <!-- IMAGEN -->
                    <div class="panel">
                        ${h.images?.[0]
                ? `<img src="${escapeHtml(h.images[0])}" style="width:100%; image-rendering:pixelated;">`
                : `<div style="height:200px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">Sin Imagen</div>`
            }
                    </div>

                    <!-- INFO PRINCIPAL -->
                    <div class="panel">
                        <div class="panel">
                            <p>
                                <b id="fc-class">${escapeHtml(h.class)}</b>
                                &nbsp;—&nbsp;
                                <span id="fc-mbti">${escapeHtml(h.mbti)}</span>
                            </p>
                            <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(h.gender || "")}</p>
                        </div>

                        <div class="panel" style="margin-top:6px;">
                            <h3 id="fc-concepts-h">Conceptos</h3>
                            <div class="concept-row">
                                <span class="concept-label" id="fc-fn">FN</span>
                                <span>${escapeHtml(h.concepts?.[0] || "—")}</span>
                            </div>
                            <div class="concept-row">
                                <span class="concept-label" id="fc-ae">AE</span>
                                <span>${escapeHtml(h.concepts?.[1] || "—")}</span>
                            </div>
                            <div class="concept-row">
                                <span class="concept-label" id="fc-an">AN</span>
                                <span>${escapeHtml(h.concepts?.[2] || "—")}</span>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- DESCRIPCIÓN -->
                <div class="panel" style="margin-top:6px;">
                    <h3>Descripción</h3>
                    <p>${escapeHtml(h.description || "Sin descripción.")}</p>
                </div>

                <!-- HABILIDADES -->
                <div class="panel" style="margin-top:6px;">
                    <h3>Habilidades</h3>
                    <p><b id="fc-passive-lbl">Pasiva:</b> ${escapeHtml(h.passive || "—")}</p>
                    <p><b id="fc-active-lbl">Activa:</b> ${escapeHtml(h.active?.base || "—")}</p>
                </div>

                <div style="margin-top:6px;">
                    <button id="open-editor">Abrir en Editor</button>
                </div>

            </div>
            `;

            // Bind tooltips
            const cdesc = classDesc(h.class);
            const mdesc = mbtiDesc(h.mbti);
            if (cdesc)           Tooltip.bind(content.querySelector("#fc-class"),       cdesc);
            if (mdesc)           Tooltip.bind(content.querySelector("#fc-mbti"),        mdesc);
            if (tt("concepts"))  Tooltip.bind(content.querySelector("#fc-concepts-h"),  tt("concepts"));
            if (tt("function"))  Tooltip.bind(content.querySelector("#fc-fn"),          tt("function"));
            if (tt("aesthetic")) Tooltip.bind(content.querySelector("#fc-ae"),          tt("aesthetic"));
            if (tt("anomaly"))   Tooltip.bind(content.querySelector("#fc-an"),          tt("anomaly"));
            if (tt("passive"))   Tooltip.bind(content.querySelector("#fc-passive-lbl"), tt("passive"));
            if (tt("active"))    Tooltip.bind(content.querySelector("#fc-active-lbl"),  tt("active"));

            content.querySelector("#open-editor").onclick = () => openApp("editor", h);
        }

        loadFiles();
    }

    /* =========================
       MAIL
    ========================= */

    if (name === "mail") {
        el.innerHTML = `
        <div class="panel">
            <h3>Hunter Association — Correo Interno</h3>

            <div class="panel" style="margin-top:6px;">
                <p><b>De:</b> Hunter Association — Terminal de Control</p>
                <p><b>Asunto:</b> Protocolo de gestión de Hunters (v2.1)</p>
            </div>

            <div class="panel" style="margin-top:6px;">
                <p>
                    Operador,<br><br>

                    El flujo de trabajo es el siguiente:<br><br>

                    <b>1. BÚSQUEDA DE HUNTERS</b><br>
                    Utiliza el módulo <b>Buscador</b> para localizar Hunters en el archivo multidimensional.<br>
                    Parámetros de búsqueda: Género, Clase, MBTI.<br>
                    Pasa el cursor sobre cada campo para consultar su definición operativa.<br>
                    El sistema generará tres conceptos de realidad (FN / AE / AN) y asignará habilidades aleatorias.<br><br>

                    <b>2. ARCHIVOS DE HUNTERS</b><br>
                    El módulo <b>Archivos</b> muestra todos los expedientes almacenados.<br>
                    Cada expediente incluye: ID, clase, MBTI, conceptos, habilidades, descripción e imágenes.<br>
                    Pasa el cursor sobre la clase o los atributos para ver su descripción.<br><br>

                    <b>3. EDICIÓN Y CORRECCIÓN</b><br>
                    El <b>Editor</b> permite modificar cualquier dato del Hunter:<br>
                    — Descripción · Habilidades · Imágenes<br>
                    — Conceptos (FN / AE / AN) ahora son directamente editables<br>
                    Los cambios se reflejan en tiempo real en la vista previa.<br><br>

                    <b>Glosario de badges de concepto:</b><br>
                    &nbsp;&nbsp;FN = Función &nbsp;|&nbsp; AE = Estética &nbsp;|&nbsp; AN = Anomalía<br><br>

                    <b>Nota:</b> Cualquier alteración no autorizada será registrada en los logs de la Hunter Association.<br><br>

                    — Hunter Association
                </p>
            </div>
        </div>
        `;
    }

}