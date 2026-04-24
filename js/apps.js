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

function renderSkillTreeHTML(active) {
    const base  = active?.base  || "—";
    const paths = Array.isArray(active?.paths) ? active.paths : [];
    const pathLabels = ["RUTA I", "RUTA II", "RUTA III"];
    const pathsHTML = paths.length
        ? `<div class="skill-paths">
            ${paths.map((p, i) => `
            <div class="skill-node skill-path-node">
                <span class="skill-badge skill-badge-path">${pathLabels[i] || "RUTA"}</span>
                <span>${escapeHtml(p)}</span>
            </div>`).join("")}
           </div>`
        : `<div class="skill-paths">
            <div class="skill-node" style="color:var(--text-muted); font-style:italic;">
                Sin rutas de evolución definidas.
            </div>
           </div>`;
    return `
<div class="skill-tree">
    <div class="skill-node">
        <span class="skill-badge skill-badge-base">BASE</span>
        <span>${escapeHtml(base)}</span>
    </div>
    ${pathsHTML}
</div>`;
}

/* =========================
   MAIN LOADER
========================= */

async function loadApp(name, el, data) {

    /* ─────────────────────────────────────────────
       Load data.json
    ───────────────────────────────────────────── */
    let CONFIG = {
        genders: [],
        mbti: [],
        mbti_descriptions: {},
        attribute_tooltips: {},
        classes: [],
        concepts: { function: [], anomaly: [] },
        passive_pool: [],
        active_pool: []
    };
    try {
        const res = await fetch("data/data.json");
        CONFIG = await res.json();
    } catch (e) {
        console.warn("No se pudo cargar data.json:", e);
    }

    /* ─────────────────────────────────────────────
       Load dimensions.json
    ───────────────────────────────────────────── */
    let DIMENSIONS = { dimensions: [] };
    try {
        const res = await fetch("data/dimensions.json");
        DIMENSIONS = await res.json();
    } catch (e) {
        console.warn("No se pudo cargar dimensions.json:", e);
    }
    const dims = DIMENSIONS.dimensions || [];

    /* ─────────────────────────────────────────────
       Load classes.json
    ───────────────────────────────────────────── */
    let CLASSES = [];
    try {
        const res = await fetch("data/classes.json");
        CLASSES = await res.json();
    } catch (e) {
        console.warn("No se pudo cargar classes.json — usando CONFIG.classes como fallback:", e);
        CLASSES = (CONFIG.classes || []).map(c => ({
            name: c.name || c,
            description: c.description || "",
            passive_pool: [],
            active_pool: []
        }));
    }

    /* ─────────────────────────────────────────────
       Load concepts.json (per-dimension)
    ───────────────────────────────────────────── */
    let CONCEPTS_BY_DIM = {};
    let FALLBACK_CONCEPTS = { function: [], anomaly: [] };
    try {
        const res = await fetch("data/concepts.json");
        const conceptsData = await res.json();
        if (conceptsData.dimensions) {
            CONCEPTS_BY_DIM = conceptsData.dimensions;
            FALLBACK_CONCEPTS = conceptsData.fallback || { function: [], anomaly: [] };
        } else {
            FALLBACK_CONCEPTS = {
                function: conceptsData.function || [],
                anomaly: conceptsData.anomaly || []
            };
        }
    } catch (e) {
        console.warn("No se pudo cargar concepts.json:", e);
    }

    /* ─────────────────────────────────────────────
       Load elemental_types.json
    ───────────────────────────────────────────── */
    let ELEMENTAL_DATA = { elemental_types: [], creature_types: [] };
    try {
        const res = await fetch("data/elemental_types.json");
        ELEMENTAL_DATA = await res.json();
    } catch (e) {
        console.warn("No se pudo cargar elemental_types.json, usando datos por defecto", e);
        ELEMENTAL_DATA = {
            elemental_types: [
                { name: "Fuego", advantage: ["Hielo", "Planta"], disadvantage: ["Agua", "Tierra"] },
                { name: "Agua", advantage: ["Fuego", "Tierra"], disadvantage: ["Rayo", "Planta"] },
                { name: "Tierra", advantage: ["Rayo", "Fuego"], disadvantage: ["Agua", "Hielo"] },
                { name: "Aire", advantage: ["Tierra", "Planta"], disadvantage: ["Rayo", "Hielo"] },
                { name: "Rayo", advantage: ["Agua", "Aire"], disadvantage: ["Tierra", "Metal"] },
                { name: "Hielo", advantage: ["Agua", "Tierra"], disadvantage: ["Fuego", "Aire"] },
                { name: "Planta", advantage: ["Agua", "Tierra"], disadvantage: ["Fuego", "Hielo"] },
                { name: "Metal", advantage: ["Hielo", "Tierra"], disadvantage: ["Rayo", "Fuego"] }
            ],
            creature_types: [
                { name: "Volador", description: "Puede evadir ataques terrestres, vulnerable a rayos y redes." },
                { name: "Coloso", description: "Alta resistencia y daño, pero lento y fácil de golpear." },
                { name: "Élite", description: "Estadísticas mejoradas, aparece en grupos reducidos." },
                { name: "Bestia", description: "Ataques físicos fuertes, poca defensa mágica." },
                { name: "Espectro", description: "Inmune a ataques físicos normales, vulnerable a magia sagrada." },
                { name: "Dragón", description: "Alta resistencia a magia, aliento elemental poderoso." }
            ]
        };
    }

    /* ─────────────────────────────────────────────
       Helpers
    ───────────────────────────────────────────── */
    const tt       = key => CONFIG.attribute_tooltips?.[key] || "";
    const mbtiDesc = key => CONFIG.mbti_descriptions?.[key] || "";
    const getDim   = id  => dims.find(d => d.id === id) || null;
    const getClass = name => CLASSES.find(c => c.name === name) || CONFIG.classes?.find(c => c.name === name) || null;
    const classDesc = name => getClass(name)?.description || "";

    function getClassSkills(className) {
        const cls = getClass(className);
        const passivePool = cls?.passive_pool?.length > 0
            ? cls.passive_pool
            : (CONFIG.passive_pool?.length > 0 ? CONFIG.passive_pool : ["Detecta cambios en el ambiente"]);
        const rawActivePool = cls?.active_pool?.length > 0
            ? cls.active_pool
            : (CONFIG.active_pool?.length > 0 ? CONFIG.active_pool : [{ base: "Acción reflexiva", paths: [] }]);
        const activePool = rawActivePool.map(entry => typeof entry === "string" ? { base: entry, paths: [] } : entry);
        return { passivePool, activePool };
    }

    function refreshClassSelect(selectEl, hintEl, dimEntry) {
        selectEl.innerHTML = "";
        const suggested = dimEntry?.suggested_classes || [];
        if (suggested.length > 0) {
            const grpSuggested = document.createElement("optgroup");
            grpSuggested.label = "▸ Sugeridas por esta dimensión";
            CLASSES.filter(c => suggested.includes(c.name)).forEach(c => {
                const o = document.createElement("option");
                o.value = c.name;
                o.textContent = c.name;
                grpSuggested.appendChild(o);
            });
            selectEl.appendChild(grpSuggested);
            const grpOther = document.createElement("optgroup");
            grpOther.label = "◦ Otras clases";
            CLASSES.filter(c => !suggested.includes(c.name)).forEach(c => {
                const o = document.createElement("option");
                o.value = c.name;
                o.textContent = c.name;
                grpOther.appendChild(o);
            });
            selectEl.appendChild(grpOther);
        } else {
            CLASSES.forEach(c => {
                const o = document.createElement("option");
                o.value = c.name;
                o.textContent = c.name;
                selectEl.appendChild(o);
            });
        }
        if (hintEl) {
            const d = classDesc(selectEl.value);
            hintEl.textContent = d ? "↳ " + d : "";
        }
    }

    function getDimensionConcepts(dimEntry) {
        if (!dimEntry) return null;
        const dimId = dimEntry.id;
        const dimConcepts = CONCEPTS_BY_DIM[dimId];
        if (dimConcepts && dimConcepts.functions && dimConcepts.anomalies) {
            const functions = dimConcepts.functions;
            const anomalies = dimConcepts.anomalies;
            if (functions.length && anomalies.length) {
                const rand = arr => arr[Math.floor(Math.random() * arr.length)];
                return [rand(functions), rand(anomalies)];
            }
        }
        if (FALLBACK_CONCEPTS.function.length && FALLBACK_CONCEPTS.anomaly.length) {
            const rand = arr => arr[Math.floor(Math.random() * arr.length)];
            return [rand(FALLBACK_CONCEPTS.function), rand(FALLBACK_CONCEPTS.anomaly)];
        }
        return null;
    }

    function renderWeaponItem(weapon) {
        if (typeof weapon === 'string') return `<li>${escapeHtml(weapon)}</li>`;
        const name = weapon.name || '?';
        const type = weapon.type || 'herramienta';
        const desc = weapon.description || '';
        const damage = weapon.damage || 0;
        const effect = weapon.effect || '';
        return `<li>
            <strong>${escapeHtml(name)}</strong> <span class="weapon-type">(${escapeHtml(type)})</span><br>
            ${desc ? `<span class="weapon-desc">${escapeHtml(desc)}</span><br>` : ''}
            <span class="weapon-stats">Daño: ${damage} | Efecto: ${escapeHtml(effect)}</span>
        </li>`;
    }

    // Default stats for new Hunters
    const DEFAULT_STATS = {
        hp: 20, mp: 10, speed: 10, strength: 10, magicpower: 10,
        defense: 10, magicdefense: 10, evasion: 5, accuracy: 5
    };

    function getHunterStats(hunter) {
        if (hunter.stats) return hunter.stats;
        // Try localStorage
        const stored = localStorage.getItem(`hunter_${hunter.id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.stats) return parsed.stats;
            } catch(e) {}
        }
        return { ...DEFAULT_STATS };
    }

    function saveHunterToLocalStorage(hunter) {
        localStorage.setItem(`hunter_${hunter.id}`, JSON.stringify(hunter));
    }

    /* =========================
       GENERADOR
    ========================= */
    if (name === "generator") {
        el.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; height:100%;">
            <div class="panel">
                <h3>Generador</h3>
                <div class="panel" style="margin-top:6px">
                    <label>Género</label>
                    <select id="gender"></select>
                    <label id="lbl-mbti">MBTI</label>
                    <select id="mbti"></select>
                    <div id="mbti-hint" class="field-hint"></div>
                </div>
                <button id="generate" style="margin-top:6px;">Generar</button>
                <div class="panel" id="result" style="margin-top:6px;">
                    <p style="color:var(--text-muted);">Sin generación aún.</p>
                </div>
            </div>
            <div class="panel scroll" id="preview">
                <p style="color:var(--text-muted);">Esperando generación...</p>
            </div>
        </div>
        `;
        const fillSelect = (id, arr) => {
            const sel = el.querySelector("#" + id);
            arr.forEach(v => {
                const o = document.createElement("option");
                o.value = v; o.textContent = v;
                sel.appendChild(o);
            });
        };
        fillSelect("gender", CONFIG.genders);
        fillSelect("mbti",   CONFIG.mbti);

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
        const rand = arr => arr[Math.floor(Math.random() * arr.length)];
        el.querySelector("#generate").onclick = () => {
            const dimEntry = dims.length ? rand(dims) : null;
            const suggested = dimEntry?.suggested_classes || [];
            let chosenClass;
            if (suggested.length > 0) {
                const validClasses = CLASSES.filter(c => suggested.includes(c.name));
                chosenClass = validClasses.length > 0 ? rand(validClasses).name : (CLASSES.length ? rand(CLASSES).name : "Clase por defecto");
            } else {
                chosenClass = CLASSES.length ? rand(CLASSES).name : "Clase por defecto";
            }

            const { passivePool, activePool } = getClassSkills(chosenClass);
            const passive = rand(passivePool);
            const activeEntry = rand(activePool);
            const activePaths = activeEntry.paths?.length >= 2 ? [activeEntry.paths[0], activeEntry.paths[1]] : (activeEntry.paths || []);
            let concepts = getDimensionConcepts(dimEntry);
            if (!concepts) concepts = ["Trabaja en algo sin nombre", "Su presencia altera levemente el ambiente"];
            const hunter = {
                id:           "H-" + Date.now(),
                gender:       el.querySelector("#gender").value,
                class:        chosenClass,
                mbti:         mbtiSelect.value,
                dimension_id: dimEntry?.id || null,
                concepts,
                passive,
                active: { base: activeEntry.base, paths: activePaths },
                description: "",
                images: [],
                stats: { ...DEFAULT_STATS },
                weapon: null
            };

            // Result panel
            el.querySelector("#result").innerHTML = `
                <div class="concept-row">
                    <span class="concept-label" id="lbl-fn">FN</span>
                    <span>${escapeHtml(concepts[0])}</span>
                </div>
                <div class="concept-row">
                    <span class="concept-label" id="lbl-an">AN</span>
                    <span>${escapeHtml(concepts[1])}</span>
                </div>
                ${dimEntry ? `<div style="margin-top:8px; padding:7px 10px; background:#0a0c10; border:1px solid var(--accent-primary); border-left:3px solid var(--accent-primary);">
                        <div style="font-size:9px; letter-spacing:1px; color:var(--text-muted); margin-bottom:3px;">DIMENSIÓN DE ORIGEN</div>
                        <div id="res-dim-name" style="color:var(--accent-warning); font-weight:bold; font-size:12px;">${escapeHtml(dimEntry.name)}</div>
                        <div style="font-size:9px; color:var(--text-muted); margin-top:2px; font-style:italic;">[asignación inmutable]</div>
                       </div>` : `<div style="margin-top:8px; color:var(--text-muted); font-size:10px; font-style:italic;">No hay dimensiones cargadas.<br>Añade dimensions.json al directorio data/.</div>`}
                <button id="to-editor" style="margin-top:10px;">Abrir en Editor</button>
            `;
            const rEl = el.querySelector("#result");
            if (tt("function")) Tooltip.bind(rEl.querySelector("#lbl-fn"), tt("function"));
            if (tt("anomaly")) Tooltip.bind(rEl.querySelector("#lbl-an"), tt("anomaly"));
            if (dimEntry && rEl.querySelector("#res-dim-name")) Tooltip.bind(rEl.querySelector("#res-dim-name"), dimEntry.tagline || dimEntry.description || "");

            // Preview panel (sin armas)
            const cdesc = classDesc(hunter.class);
            const mdesc = mbtiDesc(hunter.mbti);
            el.querySelector("#preview").innerHTML = `
                <div class="panel">
                    <h3>${escapeHtml(hunter.id)}</h3>
                    <div class="panel" style="margin-top:6px;">
                        <p><b id="prev-class">${escapeHtml(hunter.class)}</b> &nbsp;—&nbsp; <span id="prev-mbti">${escapeHtml(hunter.mbti)}</span></p>
                        <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(hunter.gender)}</p>
                    </div>
                    ${dimEntry ? `<div class="panel" style="margin-top:6px; border-left:3px solid var(--accent-primary);"><div style="font-size:9px; letter-spacing:1px; color:var(--text-muted); margin-bottom:3px; text-transform:uppercase;">Dimensión de Origen</div><span id="prev-dim" style="color:var(--accent-warning); font-weight:bold;">${escapeHtml(dimEntry.name)}</span>${dimEntry.description ? `<p style="font-size:10px; color:var(--text-muted); margin-top:4px; font-style:italic;">${escapeHtml(dimEntry.description)}</p>` : ""}</div>` : ""}
                    <div class="panel" style="margin-top:6px;"><h3 id="prev-concepts-h">Conceptos</h3><div class="concept-row"><span class="concept-label" id="prev-fn">FN</span><span>${escapeHtml(concepts[0])}</span></div><div class="concept-row"><span class="concept-label" id="prev-an">AN</span><span>${escapeHtml(concepts[1])}</span></div></div>
                    <div class="panel" style="margin-top:6px;"><p><b id="prev-passive-lbl">Pasiva:</b> ${escapeHtml(passive)}</p></div>
                    <div class="panel" style="margin-top:6px;"><h3 id="prev-active-lbl">Habilidad Activa</h3>${renderSkillTreeHTML(hunter.active)}</div>
                </div>
            `;
            const pEl = el.querySelector("#preview");
            if (cdesc) Tooltip.bind(pEl.querySelector("#prev-class"), cdesc);
            if (mdesc) Tooltip.bind(pEl.querySelector("#prev-mbti"), mdesc);
            if (dimEntry && pEl.querySelector("#prev-dim")) Tooltip.bind(pEl.querySelector("#prev-dim"), dimEntry.tagline || dimEntry.description || "");
            if (tt("concepts")) Tooltip.bind(pEl.querySelector("#prev-concepts-h"), tt("concepts"));
            if (tt("function")) Tooltip.bind(pEl.querySelector("#prev-fn"), tt("function"));
            if (tt("anomaly")) Tooltip.bind(pEl.querySelector("#prev-an"), tt("anomaly"));
            if (tt("passive")) Tooltip.bind(pEl.querySelector("#prev-passive-lbl"), tt("passive"));
            if (tt("active")) Tooltip.bind(pEl.querySelector("#prev-active-lbl"), tt("active"));

            el.querySelector("#to-editor").onclick = () => openApp("editor", hunter);
        };
    }

    /* =========================
       EDITOR
    ========================= */
    if (name === "editor") {
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
                            <select id="hunterSelect" size="10" style="width:100%; margin-bottom:8px;"></select>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button id="selectHunterBtn">Editar seleccionado</button>
                                <button id="newHunterBtn">Crear nuevo Hunter</button>
                                <button id="refreshListBtn">Recargar lista</button>
                                <button id="editConfigBtn">Editar data.json</button>
                            </div>
                        </div>
                        <div id="selectorPreview" class="panel scroll" style="flex:1;">
                            <p style="color:var(--text-muted);">Selecciona un Hunter para ver vista previa.</p>
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
                    const stored = localStorage.getItem(`hunter_${hunter.id}`);
                    let displayHunter = hunter;
                    if (stored) {
                        try { displayHunter = JSON.parse(stored); } catch(e) {}
                    }
                    const isNewSchema = displayHunter.dimension_id !== undefined && displayHunter.dimension_id !== null;
                    const dimEntry = isNewSchema ? getDim(displayHunter.dimension_id) : null;
                    const fnText = displayHunter.concepts?.[0] || "—";
                    const aeText = isNewSchema ? null : (displayHunter.concepts?.[1] || "—");
                    const anText = isNewSchema ? (displayHunter.concepts?.[1] || "—") : (displayHunter.concepts?.[2] || "—");
                    const previewDiv = el.querySelector("#selectorPreview");
                    previewDiv.innerHTML = `
                        <div class="panel">
                            <h3>${escapeHtml(displayHunter.id)}</h3>
                            <p><b id="sel-class">${escapeHtml(displayHunter.class)}</b> &nbsp;—&nbsp; <span id="sel-mbti">${escapeHtml(displayHunter.mbti)}</span></p>
                            <p style="color:var(--text-muted); font-size:11px;">${escapeHtml(displayHunter.gender || "")}</p>
                            ${dimEntry ? `<div style="margin:8px 0; padding:6px 10px; background:#0a0c10; border-left:3px solid var(--accent-primary);"><div style="font-size:9px; color:var(--text-muted); margin-bottom:2px;">DIMENSIÓN DE ORIGEN</div><span id="sel-dim" style="color:var(--accent-warning); font-weight:bold;">${escapeHtml(dimEntry.name)}</span></div>` : ""}
                            <h3 id="sel-concepts-h" style="margin-top:10px;">Conceptos</h3>
                            <div class="concept-row"><span class="concept-label" id="sel-fn">FN</span><span>${escapeHtml(fnText)}</span></div>
                            ${aeText !== null ? `<div class="concept-row"><span class="concept-label" id="sel-ae">AE</span><span>${escapeHtml(aeText)}</span></div>` : ""}
                            <div class="concept-row"><span class="concept-label" id="sel-an">AN</span><span>${escapeHtml(anText)}</span></div>
                            <h3 style="margin-top:10px;">Descripción</h3><p>${escapeHtml(displayHunter.description || "Sin descripción.")}</p>
                            <h3 style="margin-top:10px;">Habilidades</h3><p><b id="sel-passive-lbl">Pasiva:</b> ${escapeHtml(displayHunter.passive || "—")}</p>
                            <div style="margin-top:6px;"><p style="margin-bottom:4px;"><b id="sel-active-lbl">Activa</b></p>${renderSkillTreeHTML(displayHunter.active)}</div>
                        </div>
                    `;
                });
                el.querySelector("#selectHunterBtn").onclick = () => {
                    const id = selectEl.value;
                    if (!id) { alert("Selecciona un Hunter de la lista."); return; }
                    let hunter = huntersList.find(h => h.id === id);
                    if (hunter) {
                        const stored = localStorage.getItem(`hunter_${hunter.id}`);
                        if (stored) try { hunter = JSON.parse(stored); } catch(e) {}
                        openApp("editor", hunter);
                        el.closest(".window").remove();
                    }
                };
                el.querySelector("#newHunterBtn").onclick   = () => openApp("generator");
                el.querySelector("#refreshListBtn").onclick = () => renderSelector();
                el.querySelector("#editConfigBtn").onclick  = () => openApp("editor", { _type: "dataConfig" });
            };
            renderSelector();
            return;
        }
        if (data._type === "dataConfig") {
            let configJson = "";
            const loadConfig = async () => {
                try {
                    const res = await fetch("data/data.json");
                    const parsed = await res.json();
                    configJson = JSON.stringify(parsed, null, 2);
                } catch (e) { configJson = '{\n  "error": "No se pudo cargar data.json"\n}'; }
                renderConfigEditor();
            };
            const renderConfigEditor = () => {
                el.innerHTML = `
                    <div class="split split-50" style="height:100%;">
                        <div class="stack"><div class="panel"><h3>Editar data.json</h3><div style="font-size:10px; color:var(--text-muted); margin-bottom:8px; line-height:1.6;">Contiene: géneros, MBTI y tooltips.<br>Clases → <code>classes.json</code> &nbsp;|&nbsp; Conceptos → <code>concepts.json</code></div><textarea id="configJson" style="height:280px; font-family:monospace; font-size:12px;"></textarea><div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;"><button id="previewConfigBtn">Vista previa</button><button id="downloadConfigBtn">Descargar JSON</button><button id="resetConfigBtn">Recargar original</button></div></div></div>
                        <div class="panel scroll" id="configPreview"><p style="color:var(--text-muted);">Haz clic en "Vista previa" para ver cómo queda la configuración.</p></div>
                    </div>
                `;
                el.querySelector("#configJson").value = configJson;
                const textarea = el.querySelector("#configJson");
                const previewDiv = el.querySelector("#configPreview");
                el.querySelector("#previewConfigBtn").onclick = () => {
                    try {
                        const nc = JSON.parse(textarea.value);
                        previewDiv.innerHTML = `<div class="panel"><h3>Vista previa de data.json</h3><h4>Géneros (${nc.genders?.length || 0})</h4><ul>${nc.genders?.map(g => `<li>${escapeHtml(g)}</li>`).join("") || "<li>No definido</li>"}</ul><h4>MBTI (${nc.mbti?.length || 0})</h4><ul>${nc.mbti?.map(m => `<li><b>${escapeHtml(m)}</b>: ${escapeHtml(nc.mbti_descriptions?.[m] || "—")}</li>`).join("") || "<li>No definido</li>"}</ul><h4>Tooltips de atributos</h4><ul>${Object.entries(nc.attribute_tooltips || {}).map(([k, v]) => `<li><b>${escapeHtml(k)}:</b> <span style="color:var(--text-muted);">${escapeHtml(v)}</span></li>`).join("") || "<li>No definido</li>"}</ul><div style="margin-top:10px; padding:8px; background:#0a0c10; border:1px solid var(--border-light); font-size:10px; color:var(--text-muted);">Clases cargadas desde <code>classes.json</code>: <b>${CLASSES.length}</b><br>Funciones en <code>concepts.json</code>: según dimensión.</div></div>`;
                    } catch (e) { previewDiv.innerHTML = `<div class="panel" style="color:#ff6b6b;">Error en JSON: ${escapeHtml(e.message)}</div>`; }
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
                        alert("data.json descargado. Reemplaza el archivo en la carpeta data/");
                    } catch (e) { alert("JSON inválido: " + e.message); }
                };
                el.querySelector("#resetConfigBtn").onclick = () => loadConfig();
            };
            loadConfig();
            return;
        }
        // Hunter editor
        let h = data;
        // Load from localStorage if exists
        const storedHunter = localStorage.getItem(`hunter_${h.id}`);
        if (storedHunter) {
            try { h = JSON.parse(storedHunter); } catch(e) {}
        }
        if (typeof h.active === "string") h.active = { base: h.active, paths: [] };
        else if (!h.active) h.active = { base: "", paths: [] };
        if (!Array.isArray(h.active.paths)) h.active.paths = [];
        if (!h.stats) h.stats = { ...DEFAULT_STATS };
        if (h.weapon === undefined) h.weapon = null;
        const isNewSchema = h.dimension_id !== undefined && h.dimension_id !== null;
        const dimEntry = isNewSchema ? getDim(h.dimension_id) : null;
        const conceptsFormHTML = isNewSchema ? `
            <div class="panel">
                <h3 id="ed-concepts-h">Conceptos</h3>
                <label id="ed-fn-lbl">Función</label><input id="concept0" placeholder="qué hace el Hunter en el mundo...">
                <label id="ed-an-lbl">Anomalía</label><input id="concept1" placeholder="rasgo inexplicable o contradicción...">
                <div style="margin-top:10px; padding:8px 10px; background:#0a0c10; border:1px solid var(--accent-primary); border-left:3px solid var(--accent-primary);">
                    <div style="font-size:9px; letter-spacing:1px; color:var(--text-muted); margin-bottom:3px; text-transform:uppercase;">Dimensión de Origen — Inmutable</div>
                    <div id="ed-dim-name" style="color:var(--accent-warning); font-weight:bold; font-size:13px;">${escapeHtml(dimEntry?.name || h.dimension_id)}</div>
                    ${dimEntry?.description ? `<div style="font-size:10px; color:var(--text-muted); margin-top:3px; font-style:italic;">${escapeHtml(dimEntry.description)}</div>` : ""}
                </div>
            </div>
        ` : `
            <div class="panel">
                <h3 id="ed-concepts-h">Conceptos</h3>
                <label id="ed-fn-lbl">Función</label><input id="concept0" placeholder="qué hace el Hunter en el mundo...">
                <label id="ed-ae-lbl">Estética</label><input id="concept1" placeholder="atmósfera visual o entorno...">
                <label id="ed-an-lbl">Anomalía</label><input id="concept2" placeholder="rasgo inexplicable o contradicción...">
            </div>
        `;
        el.innerHTML = `
        <div class="split split-30-70">
            <div class="stack">
                <h3>${escapeHtml(h.id)}</h3>
                <div class="panel">
                    <label>Clase</label>
                    <select id="classSelect"></select>
                    <div id="classHint" class="field-hint"></div>
                    <label style="margin-top:8px;">Arma seleccionada</label>
                    <select id="weaponSelect"></select>
                </div>
                <div class="panel"><p><span id="ed-mbti">${escapeHtml(h.mbti)}</span> &nbsp;|&nbsp; ${escapeHtml(h.gender)}</p></div>
                ${conceptsFormHTML}
                <div class="panel">
                    <h3>Estadísticas</h3>
                    <div class="stats-grid">
                        <div class="stat-item"><span class="stat-label">HP</span><input type="number" id="stat_hp" value="${h.stats.hp}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">MP</span><input type="number" id="stat_mp" value="${h.stats.mp}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Speed</span><input type="number" id="stat_speed" value="${h.stats.speed}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Strength</span><input type="number" id="stat_strength" value="${h.stats.strength}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Magic Power</span><input type="number" id="stat_magicpower" value="${h.stats.magicpower}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Defense</span><input type="number" id="stat_defense" value="${h.stats.defense}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Magic Defense</span><input type="number" id="stat_magicdefense" value="${h.stats.magicdefense}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Evasion</span><input type="number" id="stat_evasion" value="${h.stats.evasion}" style="width:60px;"></div>
                        <div class="stat-item"><span class="stat-label">Accuracy</span><input type="number" id="stat_accuracy" value="${h.stats.accuracy}" style="width:60px;"></div>
                    </div>
                </div>
                <div class="panel"><h3>Imágenes (URLs de Imgur)</h3><textarea id="imgs" placeholder="una url por línea" style="min-height:60px;"></textarea></div>
                <div class="panel"><h3>Descripción</h3><textarea id="desc" style="min-height:70px;"></textarea></div>
                <div class="panel">
                    <h3>Habilidades</h3>
                    <label id="ed-passive-lbl">Pasiva</label><input id="passive">
                    <div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border-light);">
                        <label id="ed-active-lbl" style="margin-bottom:6px;">Activa — Árbol de habilidad</label>
                        <div class="active-fields">
                            <label style="margin-top:0; font-size:9px;"><span class="skill-badge skill-badge-base" style="font-size:9px;">BASE</span></label>
                            <input id="active-base" placeholder="habilidad principal...">
                            <div style="border-left:2px solid var(--accent-primary); margin-left:14px; padding-left:10px; margin-top:4px; display:flex; flex-direction:column; gap:4px;">
                                <label style="margin-top:0; font-size:9px;"><span class="skill-badge skill-badge-path" style="font-size:9px;">RUTA I</span></label>
                                <input id="active-path0" placeholder="primera evolución...">
                                <label style="margin-top:4px; font-size:9px;"><span class="skill-badge skill-badge-path" style="font-size:9px;">RUTA II</span></label>
                                <input id="active-path1" placeholder="segunda evolución...">
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;"><button id="update">Actualizar</button><button id="download">Descargar JSON</button><button id="copy">Copiar JSON</button></div>
            </div>
            <div class="panel scroll" id="preview"></div>
        </div>
        `;

        // Poblar selector de clases
        const classSelect = el.querySelector("#classSelect");
        const classHint = el.querySelector("#classHint");
        refreshClassSelect(classSelect, classHint, dimEntry);
        classSelect.value = h.class;
        classHint.textContent = classDesc(h.class) ? "↳ " + classDesc(h.class) : "";

        // Función para actualizar el selector de armas según la clase seleccionada
        function updateWeaponSelect(className) {
            const classObj = getClass(className);
            const weapons = classObj?.weapons || [];
            const weaponSelect = el.querySelector("#weaponSelect");
            weaponSelect.innerHTML = '<option value="">— Ninguna —</option>';
            weapons.forEach(w => {
                const opt = document.createElement("option");
                opt.value = JSON.stringify(w);
                opt.textContent = `${w.name} (${w.type}) - Daño: ${w.damage}`;
                weaponSelect.appendChild(opt);
            });
            // Seleccionar el arma actual si existe
            if (h.weapon && h.weapon.name) {
                const found = weapons.some(w => w.name === h.weapon.name);
                if (found) {
                    weaponSelect.value = JSON.stringify(h.weapon);
                } else {
                    weaponSelect.value = "";
                }
            } else {
                weaponSelect.value = "";
            }
        }
        updateWeaponSelect(h.class);

        classSelect.addEventListener("change", () => {
            const newClass = classSelect.value;
            classHint.textContent = classDesc(newClass) ? "↳ " + classDesc(newClass) : "";
            updateWeaponSelect(newClass);
            // Actualizar también la vista previa al cambiar clase (opcional, pero se hará en el render)
        });

        // Resto de campos
        el.querySelector("#concept0").value = h.concepts?.[0] || "";
        el.querySelector("#concept1").value = h.concepts?.[1] || "";
        if (!isNewSchema && el.querySelector("#concept2")) el.querySelector("#concept2").value = h.concepts?.[2] || "";
        el.querySelector("#imgs").value = (h.images || []).join("\n");
        el.querySelector("#desc").value = h.description || "";
        el.querySelector("#passive").value = h.passive || "";
        el.querySelector("#active-base").value = h.active?.base || "";
        el.querySelector("#active-path0").value = h.active?.paths?.[0] || "";
        el.querySelector("#active-path1").value = h.active?.paths?.[1] || "";

        const mdesc = mbtiDesc(h.mbti);
        if (mdesc) Tooltip.bind(el.querySelector("#ed-mbti"), mdesc);
        if (tt("concepts")) Tooltip.bind(el.querySelector("#ed-concepts-h"), tt("concepts"));
        if (tt("function") && el.querySelector("#ed-fn-lbl")) Tooltip.bind(el.querySelector("#ed-fn-lbl"), tt("function"));
        if (!isNewSchema && tt("aesthetic") && el.querySelector("#ed-ae-lbl")) Tooltip.bind(el.querySelector("#ed-ae-lbl"), tt("aesthetic"));
        if (tt("anomaly") && el.querySelector("#ed-an-lbl")) Tooltip.bind(el.querySelector("#ed-an-lbl"), tt("anomaly"));
        if (tt("passive")) Tooltip.bind(el.querySelector("#ed-passive-lbl"), tt("passive"));
        if (tt("active")) Tooltip.bind(el.querySelector("#ed-active-lbl"), tt("active"));
        if (isNewSchema && dimEntry && el.querySelector("#ed-dim-name")) Tooltip.bind(el.querySelector("#ed-dim-name"), dimEntry.description || "");

        function build() {
            const paths = [el.querySelector("#active-path0").value.trim(), el.querySelector("#active-path1").value.trim()].filter(Boolean);
            let weapon = null;
            const weaponVal = el.querySelector("#weaponSelect").value;
            if (weaponVal) {
                try {
                    weapon = JSON.parse(weaponVal);
                } catch(e) { weapon = null; }
            }
            const built = {
                ...h,
                class: classSelect.value,
                description: el.querySelector("#desc").value,
                images: el.querySelector("#imgs").value.split("\n").map(v => v.trim()).filter(Boolean),
                passive: el.querySelector("#passive").value.trim(),
                active: { base: el.querySelector("#active-base").value.trim(), paths },
                stats: {
                    hp: parseInt(el.querySelector("#stat_hp").value) || 0,
                    mp: parseInt(el.querySelector("#stat_mp").value) || 0,
                    speed: parseInt(el.querySelector("#stat_speed").value) || 0,
                    strength: parseInt(el.querySelector("#stat_strength").value) || 0,
                    magicpower: parseInt(el.querySelector("#stat_magicpower").value) || 0,
                    defense: parseInt(el.querySelector("#stat_defense").value) || 0,
                    magicdefense: parseInt(el.querySelector("#stat_magicdefense").value) || 0,
                    evasion: parseInt(el.querySelector("#stat_evasion").value) || 0,
                    accuracy: parseInt(el.querySelector("#stat_accuracy").value) || 0
                },
                weapon: weapon
            };
            if (isNewSchema) {
                built.concepts = [el.querySelector("#concept0").value.trim(), el.querySelector("#concept1").value.trim()];
                built.dimension_id = h.dimension_id;
            } else {
                built.concepts = [el.querySelector("#concept0").value.trim(), el.querySelector("#concept1").value.trim(), el.querySelector("#concept2")?.value.trim() || ""];
            }
            return built;
        }

        function render() {
            const d = build();
            const fnText = d.concepts?.[0] || "—";
            let aeText = null, anText;
            if (isNewSchema) { anText = d.concepts?.[1] || "—"; } else { aeText = d.concepts?.[1] || "—"; anText = d.concepts?.[2] || "—"; }
            const currentClassObj = getClass(d.class);
            const weaponsForDisplay = currentClassObj?.weapons || [];
            // Mostrar el arma seleccionada en la vista previa
            const selectedWeapon = d.weapon;
            let weaponDisplayHtml = "";
            if (selectedWeapon && selectedWeapon.name) {
                weaponDisplayHtml = `<div class="panel" style="margin-top:6px;"><h3>Arma seleccionada</h3><ul class="weapons-list">${renderWeaponItem(selectedWeapon)}</ul></div>`;
            } else {
                weaponDisplayHtml = `<div class="panel" style="margin-top:6px;"><h3>Arma seleccionada</h3><p style="color:var(--text-muted); font-style:italic;">Ninguna</p></div>`;
            }
            const stats = d.stats || DEFAULT_STATS;
            el.querySelector("#preview").innerHTML = `
            <div class="panel">
                <h3>${escapeHtml(d.id)}</h3>
                <div style="display:grid; grid-template-columns:220px 1fr; gap:6px; margin-top:6px;">
                    <div class="panel">${d.images[0] ? `<img src="${escapeHtml(d.images[0])}" style="width:100%; image-rendering:pixelated;">` : `<div style="height:200px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:10px;">SIN IMAGEN</div>`}</div>
                    <div class="panel">
                        <div class="panel"><p><b id="prev-class">${escapeHtml(d.class)}</b> &nbsp;—&nbsp; <span id="prev-mbti">${escapeHtml(d.mbti)}</span></p><p style="color:var(--text-muted); font-size:11px;">${escapeHtml(d.gender)}</p></div>
                        ${dimEntry ? `<div style="margin-top:6px; padding:6px 10px; background:#0a0c10; border-left:3px solid var(--accent-primary);"><div style="font-size:9px; color:var(--text-muted); margin-bottom:2px;">DIMENSIÓN DE ORIGEN</div><span id="prev-dim" style="color:var(--accent-warning); font-weight:bold;">${escapeHtml(dimEntry.name)}</span></div>` : ""}
                        <div class="panel" style="margin-top:6px;"><h3 id="prev-concepts-h">Conceptos</h3><div class="concept-row"><span class="concept-label" id="prev-fn">FN</span><span>${escapeHtml(fnText)}</span></div>${aeText !== null ? `<div class="concept-row"><span class="concept-label" id="prev-ae">AE</span><span>${escapeHtml(aeText)}</span></div>` : ""}<div class="concept-row"><span class="concept-label" id="prev-an">AN</span><span>${escapeHtml(anText)}</span></div></div>
                    </div>
                </div>
                <div class="panel" style="margin-top:6px;"><h3>Estadísticas</h3><div class="stats-grid"><div class="stat-item"><span class="stat-label">HP</span><span class="stat-value">${stats.hp}</span></div><div class="stat-item"><span class="stat-label">MP</span><span class="stat-value">${stats.mp}</span></div><div class="stat-item"><span class="stat-label">Speed</span><span class="stat-value">${stats.speed}</span></div><div class="stat-item"><span class="stat-label">Strength</span><span class="stat-value">${stats.strength}</span></div><div class="stat-item"><span class="stat-label">Magic Power</span><span class="stat-value">${stats.magicpower}</span></div><div class="stat-item"><span class="stat-label">Defense</span><span class="stat-value">${stats.defense}</span></div><div class="stat-item"><span class="stat-label">Magic Defense</span><span class="stat-value">${stats.magicdefense}</span></div><div class="stat-item"><span class="stat-label">Evasion</span><span class="stat-value">${stats.evasion}</span></div><div class="stat-item"><span class="stat-label">Accuracy</span><span class="stat-value">${stats.accuracy}</span></div></div></div>
                <div class="panel" style="margin-top:6px;"><h3>Descripción</h3><p>${escapeHtml(d.description || "Sin descripción.")}</p></div>
                <div class="panel" style="margin-top:6px;"><h3>Habilidades</h3><p style="margin-bottom:8px;"><b id="prev-passive-lbl">Pasiva:</b> ${escapeHtml(d.passive || "—")}</p><p style="margin-bottom:6px;"><b id="prev-active-lbl">Activa</b></p>${renderSkillTreeHTML(d.active)}</div>
                ${weaponDisplayHtml}
            </div>
            `;
            const pEl = el.querySelector("#preview");
            const pcdesc = classDesc(d.class);
            const pmdesc = mbtiDesc(d.mbti);
            if (pcdesc) Tooltip.bind(pEl.querySelector("#prev-class"), pcdesc);
            if (pmdesc) Tooltip.bind(pEl.querySelector("#prev-mbti"), pmdesc);
            if (dimEntry && pEl.querySelector("#prev-dim")) Tooltip.bind(pEl.querySelector("#prev-dim"), dimEntry.description || "");
            if (tt("concepts")) Tooltip.bind(pEl.querySelector("#prev-concepts-h"), tt("concepts"));
            if (tt("function") && pEl.querySelector("#prev-fn")) Tooltip.bind(pEl.querySelector("#prev-fn"), tt("function"));
            if (aeText !== null && tt("aesthetic") && pEl.querySelector("#prev-ae")) Tooltip.bind(pEl.querySelector("#prev-ae"), tt("aesthetic"));
            if (tt("anomaly") && pEl.querySelector("#prev-an")) Tooltip.bind(pEl.querySelector("#prev-an"), tt("anomaly"));
            if (tt("passive")) Tooltip.bind(pEl.querySelector("#prev-passive-lbl"), tt("passive"));
            if (tt("active")) Tooltip.bind(pEl.querySelector("#prev-active-lbl"), tt("active"));
        }

        el.querySelector("#update").onclick = () => {
            const updated = build();
            saveHunterToLocalStorage(updated);
            render();
        };
        el.querySelector("#download").onclick = () => downloadJSON(build());
        el.querySelector("#copy").onclick = () => { navigator.clipboard.writeText(JSON.stringify(build(), null, 2)); alert("JSON copiado al portapapeles"); };
        render();
    }

    /* =========================
       ARCHIVOS (FILE EXPLORER)
    ========================= */
    if (name === "files") {
        let hunterFiles = [];
        let expandHunters = true;
        let expandDims = true;
        let expandBestiary = true;
        let selectedItem = null;
        el.innerHTML = `
        <div style="display:flex; height:100%; overflow:hidden; gap:0;">
            <div id="ftree" style="width:260px; min-width:260px; flex-shrink:0; background:#0b0d12; border-right:1px solid var(--border-light); display:flex; flex-direction:column; overflow:hidden;">
                <div style="padding:9px 14px; border-bottom:1px solid var(--border-light); font-size:10px; letter-spacing:2.5px; color:var(--accent-warning); font-weight:bold; text-transform:uppercase; flex-shrink:0; background:#08090d;">Explorador</div>
                <div id="ftree-body" style="flex:1; overflow-y:auto; padding:8px 0;"></div>
            </div>
            <div id="fviewer" style="flex:1; overflow-y:auto; padding:14px; background:#111318; min-width:0;">
                <p style="color:var(--text-muted); margin-top:40px; text-align:center; font-size:11px;">Selecciona un archivo del explorador.</p>
            </div>
        </div>
        `;
        const treeBody = el.querySelector("#ftree-body");
        const viewer = el.querySelector("#fviewer");
        function renderTree() {
            treeBody.innerHTML = "";
            // Hunters section
            const hunterSec = document.createElement("div");
            const hunterHdr = document.createElement("div");
            hunterHdr.style.cssText = `padding:6px 14px; cursor:pointer; font-size:12px; letter-spacing:1.5px; color:var(--text-secondary); text-transform:uppercase; display:flex; align-items:center; gap:7px; user-select:none; border-bottom:1px solid #1a1d24;`;
            hunterHdr.innerHTML = `<span style="color:var(--accent-primary); font-size:10px; width:8px;">${expandHunters ? "▼" : "▶"}</span><span>Hunters</span><span style="color:var(--text-muted); font-size:9px; margin-left:auto;">${hunterFiles.length}</span>`;
            hunterHdr.onclick = () => { expandHunters = !expandHunters; renderTree(); };
            hunterSec.appendChild(hunterHdr);
            if (expandHunters) {
                if (hunterFiles.length === 0) {
                    const empty = document.createElement("div");
                    empty.style.cssText = "padding:6px 14px 6px 28px; font-size:10px; color:var(--text-muted); font-style:italic;";
                    empty.textContent = "Sin hunters registrados.";
                    hunterSec.appendChild(empty);
                } else {
                    hunterFiles.forEach(h => {
                        const isActive = selectedItem?.type === "hunter" && selectedItem?.data?.id === h.id;
                        const item = document.createElement("div");
                        item.style.cssText = `padding:5px 14px 5px 28px; cursor:pointer; font-size:10px; font-family:monospace; letter-spacing:0.3px; color:${isActive ? "var(--accent-warning)" : "var(--text-muted)"}; background:${isActive ? "#1a1d26" : "transparent"}; border-left:2px solid ${isActive ? "var(--accent-warning)" : "transparent"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:6px;`;
                        item.title = h.id;
                        const dimInfo = h.dimension_id ? getDim(h.dimension_id) : null;
                        item.innerHTML = `<span style="color:var(--accent-primary); font-size:9px;">◆</span><span style="overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.id)}</span>`;
                        Tooltip.bind(item, dimInfo ? `${h.class} — ${dimInfo.name}` : (h.class || h.id));
                        item.addEventListener("mouseenter", () => { if (!isActive) item.style.background = "#14161e"; });
                        item.addEventListener("mouseleave", () => { if (!isActive) item.style.background = "transparent"; });
                        item.onclick = () => {
                            let displayHunter = h;
                            const stored = localStorage.getItem(`hunter_${h.id}`);
                            if (stored) try { displayHunter = JSON.parse(stored); } catch(e) {}
                            selectedItem = { type: "hunter", data: displayHunter };
                            renderTree();
                            renderViewer();
                        };
                        hunterSec.appendChild(item);
                    });
                }
            }
            treeBody.appendChild(hunterSec);
            const divider1 = document.createElement("div");
            divider1.style.cssText = "border-top:1px solid #1a1d24; margin:6px 0;";
            treeBody.appendChild(divider1);
            // Dimensions section
            const dimSec = document.createElement("div");
            const dimHdr = document.createElement("div");
            dimHdr.style.cssText = `padding:6px 14px; cursor:pointer; font-size:10px; letter-spacing:1.5px; color:var(--text-secondary); text-transform:uppercase; display:flex; align-items:center; gap:7px; user-select:none; border-bottom:1px solid #1a1d24;`;
            dimHdr.innerHTML = `<span style="color:var(--accent-primary); font-size:10px; width:8px;">${expandDims ? "▼" : "▶"}</span><span>Dimensiones</span><span style="color:var(--text-muted); font-size:9px; margin-left:auto;">${dims.length}</span>`;
            dimHdr.onclick = () => { expandDims = !expandDims; renderTree(); };
            dimSec.appendChild(dimHdr);
            if (expandDims) {
                if (dims.length === 0) {
                    const empty = document.createElement("div");
                    empty.style.cssText = "padding:6px 14px 6px 28px; font-size:10px; color:var(--text-muted); font-style:italic;";
                    empty.textContent = "dimensions.json no encontrado.";
                    dimSec.appendChild(empty);
                } else {
                    dims.forEach(d => {
                        const isActive = selectedItem?.type === "dimension" && selectedItem?.data?.id === d.id;
                        const count = hunterFiles.filter(h => h.dimension_id === d.id).length;
                        const item = document.createElement("div");
                        item.style.cssText = `padding:5px 14px 5px 28px; cursor:pointer; font-size:10px; font-family:monospace; letter-spacing:0.3px; color:${isActive ? "var(--accent-warning)" : "var(--text-muted)"}; background:${isActive ? "#1a1d26" : "transparent"}; border-left:2px solid ${isActive ? "var(--accent-warning)" : "transparent"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:6px;`;
                        item.title = d.name;
                        item.innerHTML = `<span style="color:var(--accent-primary); font-size:9px;">⬡</span><span style="overflow:hidden; text-overflow:ellipsis; flex:1;">${escapeHtml(d.name)}</span>${count > 0 ? `<span style="color:var(--accent-primary); font-size:9px; background:#0a0c10; padding:1px 5px; border:1px solid var(--border-light); flex-shrink:0;">${count}</span>` : ""}`;
                        Tooltip.bind(item, d.tagline || d.description || d.name);
                        item.addEventListener("mouseenter", () => { if (!isActive) item.style.background = "#14161e"; });
                        item.addEventListener("mouseleave", () => { if (!isActive) item.style.background = "transparent"; });
                        item.onclick = () => {
                            selectedItem = { type: "dimension", data: d };
                            renderTree();
                            renderViewer();
                        };
                        dimSec.appendChild(item);
                    });
                }
            }
            treeBody.appendChild(dimSec);
            const divider2 = document.createElement("div");
            divider2.style.cssText = "border-top:1px solid #1a1d24; margin:6px 0;";
            treeBody.appendChild(divider2);
            // Bestiary section
            const bestSec = document.createElement("div");
            const bestHdr = document.createElement("div");
            bestHdr.style.cssText = `padding:6px 14px; cursor:pointer; font-size:10px; letter-spacing:1.5px; color:var(--text-secondary); text-transform:uppercase; display:flex; align-items:center; gap:7px; user-select:none; border-bottom:1px solid #1a1d24;`;
            bestHdr.innerHTML = `<span style="color:var(--accent-primary); font-size:10px; width:8px;">${expandBestiary ? "▼" : "▶"}</span><span>Bestiario</span><span style="color:var(--text-muted); font-size:9px; margin-left:auto;">⚔️</span>`;
            bestHdr.onclick = () => { expandBestiary = !expandBestiary; renderTree(); };
            bestSec.appendChild(bestHdr);
            if (expandBestiary) {
                const bestItem = document.createElement("div");
                bestItem.style.cssText = `padding:5px 14px 5px 28px; cursor:pointer; font-size:10px; font-family:monospace; letter-spacing:0.3px; color:${selectedItem?.type === "bestiary" ? "var(--accent-warning)" : "var(--text-muted)"}; background:${selectedItem?.type === "bestiary" ? "#1a1d26" : "transparent"}; border-left:2px solid ${selectedItem?.type === "bestiary" ? "var(--accent-warning)" : "transparent"}; display:flex; align-items:center; gap:6px;`;
                bestItem.innerHTML = `<span style="color:var(--accent-primary); font-size:9px;">📖</span><span>Tipos elementales y criaturas</span>`;
                bestItem.onclick = () => {
                    selectedItem = { type: "bestiary", data: null };
                    renderTree();
                    renderViewer();
                };
                bestSec.appendChild(bestItem);
            }
            treeBody.appendChild(bestSec);
        }
        function renderViewer() {
            if (!selectedItem) {
                viewer.innerHTML = `<p style="color:var(--text-muted); margin-top:40px; text-align:center; font-size:11px;">Selecciona un archivo del explorador.</p>`;
                return;
            }
            if (selectedItem.type === "hunter") renderHunterView(selectedItem.data);
            else if (selectedItem.type === "dimension") renderDimensionView(selectedItem.data);
            else if (selectedItem.type === "bestiary") renderBestiaryView();
        }
        function renderHunterView(h) {
            if (typeof h.active === "string") h.active = { base: h.active, paths: [] };
            else if (!h.active) h.active = { base: "", paths: [] };
            if (!Array.isArray(h.active.paths)) h.active.paths = [];
            const stats = h.stats || DEFAULT_STATS;
            const hunterIsNew = h.dimension_id !== undefined && h.dimension_id !== null;
            const hunterDim = hunterIsNew ? getDim(h.dimension_id) : null;
            const fnText = h.concepts?.[0] || "—";
            const aeText = hunterIsNew ? null : (h.concepts?.[1] || "—");
            const anText = hunterIsNew ? (h.concepts?.[1] || "—") : (h.concepts?.[2] || "—");
            const classObj = getClass(h.class);
            // Mostrar arma seleccionada si existe
            let weaponHtml = "";
            if (h.weapon && h.weapon.name) {
                weaponHtml = `<div class="panel" style="margin-top:8px;"><h3>Arma seleccionada</h3><ul class="weapons-list">${renderWeaponItem(h.weapon)}</ul></div>`;
            } else {
                weaponHtml = `<div class="panel" style="margin-top:8px;"><h3>Arma seleccionada</h3><p style="color:var(--text-muted); font-style:italic;">Ninguna</p></div>`;
            }
            viewer.innerHTML = `
            <div class="panel">
                <h3>${escapeHtml(h.id)}</h3>
                <div style="display:grid; grid-template-columns:200px 1fr; gap:10px; margin-top:8px;">
                    <div class="panel" style="padding:8px;">${h.images?.[0] ? `<img src="${escapeHtml(h.images[0])}" style="width:100%; image-rendering:pixelated;">` : `<div style="height:180px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:10px;">SIN IMAGEN</div>`}</div>
                    <div class="panel">
                        <p style="margin-bottom:4px;"><b id="fv-class">${escapeHtml(h.class)}</b> &nbsp;—&nbsp; <span id="fv-mbti">${escapeHtml(h.mbti)}</span></p>
                        <p style="color:var(--text-muted); font-size:11px; margin-bottom:8px;">${escapeHtml(h.gender || "")}</p>
                        ${hunterDim ? `<div style="margin-bottom:10px; padding:6px 10px; background:#0a0c10; border:1px solid var(--accent-primary); border-left:3px solid var(--accent-primary);"><div style="font-size:9px; letter-spacing:1px; color:var(--text-muted); margin-bottom:3px; text-transform:uppercase;">Dimensión de Origen</div><span id="fv-dim" style="color:var(--accent-warning); font-weight:bold; font-size:12px; cursor:pointer; text-decoration:underline dotted var(--accent-primary);">${escapeHtml(hunterDim.name)}</span></div>` : ""}
                        <h3 id="fv-concepts-h" style="font-size:11px; margin-bottom:6px;">Conceptos</h3>
                        <div class="concept-row"><span class="concept-label" id="fv-fn">FN</span><span>${escapeHtml(fnText)}</span></div>
                        ${aeText !== null ? `<div class="concept-row"><span class="concept-label" id="fv-ae">AE</span><span>${escapeHtml(aeText)}</span></div>` : ""}
                        <div class="concept-row"><span class="concept-label" id="fv-an">AN</span><span>${escapeHtml(anText)}</span></div>
                    </div>
                </div>
                <div class="panel" style="margin-top:8px;"><h3>Estadísticas</h3><div class="stats-grid"><div class="stat-item"><span class="stat-label">HP</span><span class="stat-value">${stats.hp}</span></div><div class="stat-item"><span class="stat-label">MP</span><span class="stat-value">${stats.mp}</span></div><div class="stat-item"><span class="stat-label">Speed</span><span class="stat-value">${stats.speed}</span></div><div class="stat-item"><span class="stat-label">Strength</span><span class="stat-value">${stats.strength}</span></div><div class="stat-item"><span class="stat-label">Magic Power</span><span class="stat-value">${stats.magicpower}</span></div><div class="stat-item"><span class="stat-label">Defense</span><span class="stat-value">${stats.defense}</span></div><div class="stat-item"><span class="stat-label">Magic Defense</span><span class="stat-value">${stats.magicdefense}</span></div><div class="stat-item"><span class="stat-label">Evasion</span><span class="stat-value">${stats.evasion}</span></div><div class="stat-item"><span class="stat-label">Accuracy</span><span class="stat-value">${stats.accuracy}</span></div></div></div>
                <div class="panel" style="margin-top:8px;"><h3>Descripción</h3><p>${escapeHtml(h.description || "Sin descripción.")}</p></div>
                <div class="panel" style="margin-top:8px;"><h3>Habilidades</h3><p style="margin-bottom:8px;"><b id="fv-passive-lbl">Pasiva:</b> ${escapeHtml(h.passive || "—")}</p><p style="margin-bottom:6px;"><b id="fv-active-lbl">Activa — Árbol de habilidad</b></p>${renderSkillTreeHTML(h.active)}</div>
                ${weaponHtml}
                <div style="margin-top:10px; display:flex; gap:6px;"><button id="fv-edit-btn">Abrir en Editor</button>${hunterDim ? `<button id="fv-goto-dim">Ver dimensión: ${escapeHtml(hunterDim.name)}</button>` : ""}</div>
            </div>`;
            const cdesc = classDesc(h.class);
            const mdesc = mbtiDesc(h.mbti);
            if (cdesc) Tooltip.bind(viewer.querySelector("#fv-class"), cdesc);
            if (mdesc) Tooltip.bind(viewer.querySelector("#fv-mbti"), mdesc);
            if (hunterDim && viewer.querySelector("#fv-dim")) Tooltip.bind(viewer.querySelector("#fv-dim"), hunterDim.tagline || hunterDim.description || "");
            if (tt("concepts") && viewer.querySelector("#fv-concepts-h")) Tooltip.bind(viewer.querySelector("#fv-concepts-h"), tt("concepts"));
            if (tt("function") && viewer.querySelector("#fv-fn")) Tooltip.bind(viewer.querySelector("#fv-fn"), tt("function"));
            if (aeText !== null && tt("aesthetic") && viewer.querySelector("#fv-ae")) Tooltip.bind(viewer.querySelector("#fv-ae"), tt("aesthetic"));
            if (tt("anomaly") && viewer.querySelector("#fv-an")) Tooltip.bind(viewer.querySelector("#fv-an"), tt("anomaly"));
            if (tt("passive")) Tooltip.bind(viewer.querySelector("#fv-passive-lbl"), tt("passive"));
            if (tt("active")) Tooltip.bind(viewer.querySelector("#fv-active-lbl"), tt("active"));
            viewer.querySelector("#fv-edit-btn").onclick = () => openApp("editor", h);
            if (hunterDim) {
                viewer.querySelector("#fv-goto-dim").onclick = () => {
                    selectedItem = { type: "dimension", data: hunterDim };
                    renderTree();
                    renderViewer();
                };
            }
        }
        function renderDimensionView(d) {
            const related = hunterFiles.filter(h => h.dimension_id === d.id);
            const suggestedClassObjs = (d.suggested_classes || []).map(name => getClass(name)).filter(Boolean);
            viewer.innerHTML = `
            <div class="panel">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
                    <div><h3 class="dimension-title" style="margin-bottom:2px;">${escapeHtml(d.name)}</h3><span style="font-size:9px; color:var(--text-muted); letter-spacing:1px;">${escapeHtml(d.id)}</span></div>
                    <div style="padding:4px 10px; background:#0a0c10; border:1px solid var(--accent-primary); font-size:10px; color:var(--accent-primary); letter-spacing:1px; text-transform:uppercase;">${related.length} Hunter${related.length !== 1 ? "s" : ""}</div>
                </div>
                ${d.image ? `<div class="panel" style="margin-bottom:10px; padding:8px; text-align:center;"><img src="${escapeHtml(d.image)}" style="max-width:100%; max-height:220px; image-rendering:pixelated;"></div>` : ""}
                <div class="panel" style="margin-bottom:8px;"><h3 style="font-size:11px;">Descripción</h3><p>${escapeHtml(d.description || "Sin descripción.")}</p></div>
                ${d.lore ? `<div class="panel" style="margin-bottom:8px; border-left:3px solid var(--accent-warning);"><h3 style="font-size:11px; color:var(--accent-primary);">Lore</h3><p style="font-style:italic; line-height:1.75;">${escapeHtml(d.lore)}</p></div>` : ""}
                ${suggestedClassObjs.length > 0 ? `<div class="panel" style="margin-bottom:8px;"><h3 style="font-size:11px;">Clases sugeridas para esta dimensión</h3><div id="dim-class-list" style="display:flex; flex-direction:column; gap:4px; margin-top:4px;"></div></div>` : ""}
                ${d.suggested_enemies && d.suggested_enemies.length ? `<div class="panel" style="margin-bottom:8px;"><h3 style="font-size:11px;">Enemigos comunes</h3><div id="dim-enemies-list" style="display:flex; flex-direction:column; gap:6px; margin-top:4px;"></div></div>` : ""}
                <div class="panel" style="margin-top:8px;"><h3 style="font-size:11px;">Hunters de esta dimensión</h3>${related.length === 0 ? `<p style="color:var(--text-muted); font-style:italic; font-size:11px;">Ningún hunter registrado en esta dimensión todavía.</p>` : `<div id="dim-hunter-list" style="display:flex; flex-direction:column; gap:4px; margin-top:4px;"></div>`}</div>
            </div>`;
            const dimTitle = viewer.querySelector(".dimension-title");
            if (dimTitle && d.tagline) Tooltip.bind(dimTitle, d.tagline);
            if (suggestedClassObjs.length > 0) {
                const classList = viewer.querySelector("#dim-class-list");
                classList.className = "dim-class-list";
                suggestedClassObjs.forEach(cls => {
                    const activeTreeHtml = (cls.active_pool && cls.active_pool.length > 0) ? renderSkillTreeHTML(cls.active_pool[0]) : `<div class="skill-node" style="color:var(--text-muted); font-style:italic;">Sin habilidad activa definida.</div>`;
                    const weapons = cls.weapons || [];
                    const weaponsHtml = weapons.length ? `<div><h4 class="class-section-title">Armas / Herramientas</h4><ul class="weapons-list">${weapons.map(w => renderWeaponItem(w)).join("")}</ul></div>` : "";
                    const passives = cls.passive_pool || [];
                    const passivesHtml = passives.length ? `<div><h4 class="class-section-title">Pasivas</h4><ul class="class-passives-list">${passives.map(p => `<li>${escapeHtml(p)}</li>`).join("")}</ul></div>` : "";
                    const details = document.createElement("details");
                    details.className = "class-card";
                    const summary = document.createElement("summary");
                    summary.innerHTML = `<span class="arrow">▶</span><span>${escapeHtml(cls.name)}</span>`;
                    const content = document.createElement("div");
                    content.className = "class-content";
                    content.innerHTML = `<div class="class-description">${escapeHtml(cls.description)}</div>${passivesHtml}<div style="margin-top:10px;"><h4 class="class-section-title">Habilidad Activa</h4>${activeTreeHtml}</div>${weaponsHtml}`;
                    details.addEventListener("toggle", () => { const arrow = summary.querySelector(".arrow"); if (details.open) arrow.textContent = "▼"; else arrow.textContent = "▶"; });
                    details.appendChild(summary);
                    details.appendChild(content);
                    classList.appendChild(details);
                });
            }
            if (d.suggested_enemies && d.suggested_enemies.length) {
                const enemiesList = viewer.querySelector("#dim-enemies-list");
                d.suggested_enemies.forEach(enemy => {
                    const details = document.createElement("details");
                    details.className = "enemy-card";
                    const summary = document.createElement("summary");
                    summary.innerHTML = `<span class="arrow">▶</span><strong>${escapeHtml(enemy.name)}</strong><span class="enemy-types">[${enemy.type.map(escapeHtml).join(', ')}]</span>`;
                    const content = document.createElement("div");
                    content.className = "enemy-content";
                    const stats = enemy.stats || {};
                    content.innerHTML = `<div class="enemy-stats-grid"><div>HP: ${stats.hp ?? '?'}</div><div>MP: ${stats.mp ?? '?'}</div><div>Speed: ${stats.speed ?? '?'}</div><div>Strength: ${stats.strength ?? '?'}</div><div>Magic: ${stats.magicpower ?? '?'}</div><div>Defense: ${stats.defense ?? '?'}</div><div>M.Def: ${stats.magicdefense ?? '?'}</div></div><div class="enemy-abilities-list"><h4>Habilidades</h4><ul>${(enemy.abilities || []).map(ab => `<li>${escapeHtml(ab)}</li>`).join('')}</ul></div>`;
                    details.addEventListener("toggle", () => { const arrow = summary.querySelector(".arrow"); if (details.open) arrow.textContent = "▼"; else arrow.textContent = "▶"; });
                    details.appendChild(summary);
                    details.appendChild(content);
                    enemiesList.appendChild(details);
                });
            }
            if (related.length > 0) {
                const list = viewer.querySelector("#dim-hunter-list");
                related.forEach(h => {
                    const row = document.createElement("div");
                    row.style.cssText = `display:flex; align-items:center; gap:8px; padding:6px 10px; background:#0d0f14; border:1px solid var(--border-light); cursor:pointer; transition:background 0.05s;`;
                    row.innerHTML = `<span class="concept-label" style="flex-shrink:0;">${escapeHtml(h.class)}</span><span style="font-family:monospace; font-size:11px; color:var(--text-secondary);">${escapeHtml(h.id)}</span><span style="font-size:10px; color:var(--text-muted); margin-left:auto;">${escapeHtml(h.mbti)} · ${escapeHtml(h.gender || "")}</span><span style="font-size:10px; color:var(--accent-primary);">→</span>`;
                    row.addEventListener("mouseenter", () => row.style.background = "#1a1d26");
                    row.addEventListener("mouseleave", () => row.style.background = "#0d0f14");
                    row.onclick = () => {
                        let displayHunter = h;
                        const stored = localStorage.getItem(`hunter_${h.id}`);
                        if (stored) try { displayHunter = JSON.parse(stored); } catch(e) {}
                        selectedItem = { type: "hunter", data: displayHunter };
                        renderTree();
                        renderViewer();
                    };
                    list.appendChild(row);
                });
            }
        }
        function renderBestiaryView() {
            viewer.innerHTML = `
            <div class="panel">
                <h3>Bestiario: Tipos Elementales y Criaturas</h3>
                <div class="panel" style="margin-bottom:12px;">
                    <h3 style="font-size:11px;">Tabla de Ventajas/Desventajas Elementales</h3>
                    <table class="elemental-table">
                        <thead><tr><th>Tipo</th><th>Ventaja contra</th><th>Desventaja contra</th></tr></thead>
                        <tbody>
                            ${ELEMENTAL_DATA.elemental_types.map(t => `
                                <tr>
                                    <td><strong>${escapeHtml(t.name)}</strong></td>
                                    <td class="advantage">${t.advantage.map(a => escapeHtml(a)).join(', ') || '—'}</td>
                                    <td class="disadvantage">${t.disadvantage.map(d => escapeHtml(d)).join(', ') || '—'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="panel">
                    <h3 style="font-size:11px;">Tipos de Criatura</h3>
                    <div class="creature-types-list">
                        ${ELEMENTAL_DATA.creature_types.map(ct => `
                            <div class="creature-type-item">
                                <div class="creature-type-name">${escapeHtml(ct.name)}</div>
                                <div class="creature-type-desc">${escapeHtml(ct.description)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
        }
        async function loadData() {
            try {
                const res = await fetch("data/files.json");
                hunterFiles = await res.json();
                hunterFiles.forEach(h => {
                    if (typeof h.active === "string") h.active = { base: h.active, paths: [] };
                    else if (!h.active) h.active = { base: "", paths: [] };
                    if (!Array.isArray(h.active.paths)) h.active.paths = [];
                });
            } catch (e) { hunterFiles = []; }
            renderTree();
            renderViewer();
        }
        loadData();
    }

    /* =========================
       MAIL
    ========================= */
    if (name === "mail") {
        el.innerHTML = `
        <div class="panel">
            <h3>Hunter Association — Correo Interno</h3>
            <div class="panel" style="margin-top:8px;"><p><b>De:</b> Hunter Association — Terminal de Control</p><p><b>Asunto:</b> Protocolo de gestión de Hunters (v2.0)</p></div>
            <div class="panel" style="margin-top:8px; line-height:1.75;"><p>Operador,<br><br>El flujo de trabajo es el siguiente:<br><br><b>1. BUSCADOR</b><br>Selecciona Género y MBTI. La Clase se genera automáticamente según la Dimensión de Origen (o aleatoria si no hay sugerencias).<br>Al generar se asignan: <b>Dimensión de Origen</b> (inmutable), dos conceptos (FN / AN), una habilidad pasiva y un árbol de habilidad activa — todos derivados de la clase generada.<br><br><b>2. DIMENSIONES DE ORIGEN</b><br>Cada Hunter nace en una dimensión del multiverso, asignada aleatoriamente e inmutable.<br>Las dimensiones tienen <b>clases sugeridas</b>: oficios que encajan narrativamente con ese mundo.<br>Puedes verlas en el Explorador de Archivos al seleccionar una dimensión.<br>Gestión: <code>data/dimensions.json</code> — campo <code>suggested_classes[]</code>.<br><br><b>3. CLASES</b><br>Las clases no son roles de combate: son oficios cotidianos.<br>Cada clase tiene su propio pool de habilidades pasivas y activas en <code>data/classes.json</code>.<br>El Buscador solo usa las habilidades de la clase generada, nunca un pool genérico.<br><br><b>4. ÁRBOL DE HABILIDAD ACTIVA</b><br>Cada Hunter tiene una habilidad <b>BASE</b> y hasta dos <b>RUTAS DE EVOLUCIÓN</b>.<br>Las rutas son expansiones o variaciones de la base, definidas por clase.<br>Estructura en JSON: <code>active.base</code> + <code>active.paths[]</code>.<br><br><b>5. EDITOR</b><br>Modifica descripción, conceptos (FN + AN), habilidades, imágenes, estadísticas, y además puede <b>cambiar la clase</b> y <b>seleccionar un arma</b> de las disponibles para esa clase.<br>La Dimensión de Origen es de solo lectura.<br>Descarga o copia el JSON resultante para añadirlo a <code>files.json</code>. Las estadísticas se guardan automáticamente en localStorage.<br><br><b>6. ARCHIVOS DE DATOS</b><br><code>data/data.json</code> — Géneros, MBTI y tooltips de atributos.<br><code>data/classes.json</code> — Clases con sus pools de habilidades y armas.<br><code>data/concepts.json</code> — Organizado por dimensión (funciones y anomalías temáticas).<br><code>data/dimensions.json</code> — Dimensiones con <code>suggested_classes</code> y <code>suggested_enemies</code>.<br><code>data/files.json</code> — Hunters registrados.<br><code>data/elemental_types.json</code> — Tipos elementales y criaturas.<br><br><b>Glosario de badges:</b><br>&nbsp;&nbsp;FN = Función &nbsp;|&nbsp; AN = Anomalía<br>&nbsp;&nbsp;BASE = Habilidad nuclear &nbsp;|&nbsp; RUTA I / II = Evoluciones<br><br><b>Nota:</b> Cualquier alteración no autorizada será registrada en los logs de la Hunter Association.<br><br>— Hunter Association</p></div>
        </div>`;
    }
}