/* =========================
   UTILIDADES GLOBALES
========================= */

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}

function renderSkillTreeHTML(active) {
    const base = active?.base || "—";
    const paths = Array.isArray(active?.paths) ? active.paths.slice(0, 2) : []; // máximo 2 rutas
    const pathLabels = ["RUTA I", "RUTA II"];

    let treeHTML = `<div class="skill-tree">`;
    treeHTML += `<div class="skill-node skill-base-node">[ BASE ] ${escapeHtml(base)}</div>`;

    if (paths.length === 0) {
        treeHTML += `<div class="skill-node skill-empty-path" style="color:var(--text-muted); font-style:italic;">Sin rutas de evolución definidas.</div>`;
    } else {
        paths.forEach((p, idx) => {
            const isLast = idx === paths.length - 1;
            const prefix = isLast ? "└─" : "├─";
            treeHTML += `<div class="skill-node skill-path-node">
                <span class="skill-prefix">${prefix}</span> [ ${pathLabels[idx]} ] ${escapeHtml(p)}
            </div>`;
        });
    }
    treeHTML += `</div>`;
    return treeHTML;
}

/* =========================
   MAIN LOADER (solo files y mail)
========================= */
async function loadApp(name, el, data) {

    /* ─────────────────────────────────────────────
       Load data.json
    ───────────────────────────────────────────── */
    let CONFIG = {
        genders: [],
        mbti: [],
        mbti_descriptions: {},
        mbti_subtypes: {},
        attribute_tooltips: {},
        classes: [],
        concepts: { function: [], anomaly: [] },
        passive_pool: [],
        active_pool: []
    };
    try {
        const res = await fetch("data/data.json");
        CONFIG = await res.json();
        if (!CONFIG.mbti_subtypes) CONFIG.mbti_subtypes = {};
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

    const DEFAULT_STATS = {
        hp: 20, mp: 10, speed: 10, strength: 10, magicpower: 10,
        defense: 10, magicdefense: 10, evasion: 5, accuracy: 5
    };

    /* =========================
       ARCHIVOS (FILE EXPLORER)
    ========================= */
    if (name === "files") {
        let hunterFiles = [];
        let expandHunters = true;
        let expandDims = true;
        let expandBestiary = true;
        let selectedItem = null;
        let gameGroupsOpen = {};

        el.innerHTML = `
        <div class="file-explorer-container">
            <div id="ftree" class="ftree-panel">
                <div class="ftree-header">
                    <span id="ftree-title-text">Explorador</span>
                    <button id="ftree-toggle" class="ftree-toggle-btn" title="Colapsar panel">◀</button>
                </div>
                <div id="ftree-body" class="ftree-body"></div>
            </div>
            <div id="fviewer" class="fviewer-panel">
                <p class="fviewer-empty">Selecciona un archivo del explorador.</p>
            </div>
        </div>
        `;

        const treeBody = el.querySelector("#ftree-body");
        const viewer = el.querySelector("#fviewer");

        const ftreeEl = el.querySelector("#ftree");
        const ftreeTitleText = el.querySelector("#ftree-title-text");
        const ftreeToggle = el.querySelector("#ftree-toggle");
        let treeCollapsed = false;

        ftreeToggle.addEventListener("click", () => {
            treeCollapsed = !treeCollapsed;
            if (treeCollapsed) {
                ftreeEl.style.width = "28px";
                ftreeEl.style.minWidth = "28px";
                ftreeEl.style.flexBasis = "28px";   // importante si usamos flex
                treeBody.style.visibility = "hidden";
                treeBody.style.overflow = "hidden";
                ftreeTitleText.style.display = "none";
                ftreeToggle.textContent = "▶";
                ftreeToggle.title = "Expandir panel";
                ftreeToggle.style.borderLeft = "none";
                ftreeToggle.style.margin = "";
                ftreeToggle.style.padding = "2px 4px";
            } else {
                ftreeEl.style.width = "260px";
                ftreeEl.style.minWidth = "260px";
                ftreeEl.style.flexBasis = "260px";
                treeBody.style.visibility = "";
                treeBody.style.overflow = "";
                ftreeTitleText.style.display = "";
                ftreeToggle.textContent = "◀";
                ftreeToggle.title = "Colapsar panel";
                ftreeToggle.style.borderLeft = "1px solid var(--border-light)";
                ftreeToggle.style.margin = "-9px -14px -9px 0";
                ftreeToggle.style.padding = "2px 8px";
            }
        });
        
        function renderTree() {
            treeBody.innerHTML = "";

            // Hunters section
            const hunterSec = document.createElement("div");
            const hunterHdr = document.createElement("div");
            hunterHdr.className = "explorer-section-header";
            hunterHdr.innerHTML = `<span>${expandHunters ? "▼" : "▶"}</span><span>Hunters</span><span class="counter">${hunterFiles.length}</span>`;
            hunterHdr.onclick = () => { expandHunters = !expandHunters; renderTree(); };
            hunterSec.appendChild(hunterHdr);

            if (expandHunters) {
                if (hunterFiles.length === 0) {
                    const empty = document.createElement("div");
                    empty.className = "explorer-empty";
                    empty.textContent = "Sin hunters registrados.";
                    hunterSec.appendChild(empty);
                } else {
                    const groups = new Map();
                    hunterFiles.forEach(h => {
                        const game = h.game || "Awakening";
                        if (!groups.has(game)) groups.set(game, []);
                        groups.get(game).push(h);
                    });
                    const groupOrder = ["Awakening", "Vega"];
                    const sortedGroups = Array.from(groups.keys()).sort((a,b) => {
                        const ia = groupOrder.indexOf(a);
                        const ib = groupOrder.indexOf(b);
                        if (ia !== -1 && ib !== -1) return ia - ib;
                        if (ia !== -1) return -1;
                        if (ib !== -1) return 1;
                        return a.localeCompare(b);
                    });

                    for (const game of sortedGroups) {
                        const hunters = groups.get(game);
                        const groupDetails = document.createElement("details");
                        groupDetails.className = "explorer-game-group";
                        if (gameGroupsOpen[game] === undefined) {
                            gameGroupsOpen[game] = (game === "Awakening");
                        }
                        groupDetails.open = gameGroupsOpen[game];

                        const groupSummary = document.createElement("summary");
                        groupSummary.className = "explorer-game-summary";
                        const arrowSpan = document.createElement("span");
                        arrowSpan.className = "arrow";
                        arrowSpan.textContent = groupDetails.open ? "▼" : "▶";
                        groupSummary.appendChild(arrowSpan);
                        groupSummary.appendChild(document.createTextNode(` Hunters: ${game} `));
                        const countSpan = document.createElement("span");
                        countSpan.style.color = "var(--text-muted)";
                        countSpan.textContent = `(${hunters.length})`;
                        groupSummary.appendChild(countSpan);
                        groupSummary.addEventListener("click", (e) => {
                            e.preventDefault();
                            groupDetails.open = !groupDetails.open;
                            gameGroupsOpen[game] = groupDetails.open;
                            const arrow = groupSummary.querySelector(".arrow");
                            arrow.textContent = groupDetails.open ? "▼" : "▶";
                        });
                        groupDetails.appendChild(groupSummary);

                        const container = document.createElement("div");
                        container.className = "explorer-game-container";
                        hunters.forEach(h => {
                            const isActive = selectedItem?.type === "hunter" && selectedItem?.data?.id === h.id;
                            const item = document.createElement("div");
                            item.className = `explorer-hunter-item ${isActive ? "active" : ""}`;
                            item.title = h.id;
                            const dimInfo = h.dimension_id ? getDim(h.dimension_id) : null;
                            const displayText = h.name ? `${h.name} (${h.id})` : h.id;
                            item.innerHTML = `<span class="marker">◆</span><span>${escapeHtml(displayText)}</span>`;
                            Tooltip.bind(item, dimInfo ? `${h.class} — ${dimInfo.name}` : (h.class || h.id));
                            item.onclick = () => {
                                let displayHunter = h;
                                const stored = localStorage.getItem(`hunter_${h.id}`);
                                if (stored) try { displayHunter = JSON.parse(stored); } catch(e) {}
                                selectedItem = { type: "hunter", data: displayHunter };
                                renderTree();
                                renderViewer();
                            };
                            container.appendChild(item);
                        });
                        groupDetails.appendChild(container);
                        hunterSec.appendChild(groupDetails);
                    }
                }
            }
            treeBody.appendChild(hunterSec);
            const divider1 = document.createElement("div");
            divider1.className = "explorer-divider";
            treeBody.appendChild(divider1);

            // Dimensions section
            const dimSec = document.createElement("div");
            const dimHdr = document.createElement("div");
            dimHdr.className = "explorer-section-header";
            dimHdr.innerHTML = `<span>${expandDims ? "▼" : "▶"}</span><span>Dimensiones</span><span class="counter">${dims.length}</span>`;
            dimHdr.onclick = () => { expandDims = !expandDims; renderTree(); };
            dimSec.appendChild(dimHdr);
            if (expandDims) {
                if (dims.length === 0) {
                    const empty = document.createElement("div");
                    empty.className = "explorer-empty";
                    empty.textContent = "dimensions.json no encontrado.";
                    dimSec.appendChild(empty);
                } else {
                    dims.forEach(d => {
                        const isActive = selectedItem?.type === "dimension" && selectedItem?.data?.id === d.id;
                        const count = hunterFiles.filter(h => h.dimension_id === d.id).length;
                        const item = document.createElement("div");
                        item.className = `explorer-dimension-item ${isActive ? "active" : ""}`;
                        item.title = d.name;
                        item.innerHTML = `<span style="color:var(--accent-primary); font-size:9px;">⬡</span><span style="overflow:hidden; text-overflow:ellipsis; flex:1;">${escapeHtml(d.name)}</span>${count > 0 ? `<span class="explorer-dimension-badge">${count}</span>` : ""}`;
                        Tooltip.bind(item, d.tagline || d.description || d.name);
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
            divider2.className = "explorer-divider";
            treeBody.appendChild(divider2);

            // Bestiary section
            const bestSec = document.createElement("div");
            const bestHdr = document.createElement("div");
            bestHdr.className = "explorer-section-header";
            bestHdr.innerHTML = `<span>${expandBestiary ? "▼" : "▶"}</span><span>Bestiario</span><span class="counter">[B]</span>`;
            bestHdr.onclick = () => { expandBestiary = !expandBestiary; renderTree(); };
            bestSec.appendChild(bestHdr);
            if (expandBestiary) {
                const bestItem = document.createElement("div");
                bestItem.className = `explorer-bestiary-item ${selectedItem?.type === "bestiary" ? "active" : ""}`;
                bestItem.innerHTML = `<span style="color:var(--accent-primary); font-size:9px;"></span><span>Tipos elementales y criaturas</span>`;
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
                viewer.innerHTML = `<p class="fviewer-empty">Selecciona un archivo del explorador.</p>`;
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
            const mbtiDisplay = h.mbti_subtype ? `${h.mbti} · ${h.mbti_subtype}` : h.mbti;

            let weaponHtml = "";
            if (h.weapon && h.weapon.name) {
                weaponHtml = `<div class="panel hunter-weapon"><h3>Arma seleccionada</h3><ul class="weapons-list">${renderWeaponItem(h.weapon)}</ul></div>`;
            } else {
                weaponHtml = `<div class="panel hunter-weapon"><h3>Arma seleccionada</h3><p style="color:var(--text-muted); font-style:italic;">Ninguna</p></div>`;
            }

            viewer.innerHTML = `
            <div class="panel">
                <div class="export-hunter">
                    <h3>${escapeHtml(h.name || h.id)}</h3>
                    <div class="hunter-id">ID: ${escapeHtml(h.id)}</div>
                    <div class="hunter-view-grid">
                        <div class="panel hunter-image-panel">
                            ${h.images?.[0] ? `<img src="${escapeHtml(h.images[0])}" style="width:100%; image-rendering:pixelated;">` : `<div class="editor-preview-no-image">SIN IMAGEN</div>`}
                        </div>
                        <div class="panel hunter-info-panel">
                            <p style="margin-bottom:4px;"><b id="fv-class">${escapeHtml(h.class)}</b> &nbsp;—&nbsp; <span id="fv-mbti">${escapeHtml(mbtiDisplay)}</span></p>
                            <p style="color:var(--text-muted); font-size:11px; margin-bottom:8px;">${escapeHtml(h.gender || "")}</p>
                            ${hunterDim ? `<div class="hunter-dimension-block"><div class="hunter-dimension-label">Dimensión de Origen</div><span id="fv-dim" class="hunter-dimension-name">${escapeHtml(hunterDim.name)}</span></div>` : ""}
                            <h3 id="fv-concepts-h" style="font-size:11px; margin-bottom:6px;">Conceptos</h3>
                            <div class="concept-row"><span class="concept-label" id="fv-fn">FN</span><span>${escapeHtml(fnText)}</span></div>
                            ${aeText !== null ? `<div class="concept-row"><span class="concept-label" id="fv-ae">AE</span><span>${escapeHtml(aeText)}</span></div>` : ""}
                            <div class="concept-row"><span class="concept-label" id="fv-an">AN</span><span>${escapeHtml(anText)}</span></div>
                        </div>
                    </div>
                    <div class="panel hunter-description"><h3>Descripción</h3><p>${escapeHtml(h.description || "Sin descripción.")}</p></div>
                    <div class="panel hunter-stats">
                        <h3>Estadísticas</h3>
                        <div class="stats-grid">
                            <div class="stat-item"><span class="stat-label">HP</span><span class="stat-value">${stats.hp}</span></div>
                            <div class="stat-item"><span class="stat-label">MP</span><span class="stat-value">${stats.mp}</span></div>
                            <div class="stat-item"><span class="stat-label">Speed</span><span class="stat-value">${stats.speed}</span></div>
                            <div class="stat-item"><span class="stat-label">Strength</span><span class="stat-value">${stats.strength}</span></div>
                            <div class="stat-item"><span class="stat-label">Magic Power</span><span class="stat-value">${stats.magicpower}</span></div>
                            <div class="stat-item"><span class="stat-label">Defense</span><span class="stat-value">${stats.defense}</span></div>
                            <div class="stat-item"><span class="stat-label">Magic Defense</span><span class="stat-value">${stats.magicdefense}</span></div>
                            <div class="stat-item"><span class="stat-label">Evasion</span><span class="stat-value">${stats.evasion}</span></div>
                            <div class="stat-item"><span class="stat-label">Accuracy</span><span class="stat-value">${stats.accuracy}</span></div>
                        </div>
                    </div>
                    <div class="panel hunter-abilities">
                        <h3>Habilidades</h3>
                        <p style="margin-bottom:8px;"><b id="fv-passive-lbl">Pasiva:</b> ${escapeHtml(h.passive || "—")}</p>
                        <p style="margin-bottom:6px;"><b id="fv-active-lbl">Activa — Árbol de habilidad</b></p>
                        ${renderSkillTreeHTML(h.active)}
                    </div>
                    ${weaponHtml}
                </div>
                <div class="hunter-actions">
                    ${hunterDim ? `<button id="fv-goto-dim">Ver dimensión: ${escapeHtml(hunterDim.name)}</button>` : ""}
                </div>
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
                <div class="export-dimension">
                    <div class="dimension-header">
                        <div><h3 class="dimension-title" style="margin-bottom:2px;">${escapeHtml(d.name)}</h3><span style="font-size:9px; color:var(--text-muted); letter-spacing:1px;">${escapeHtml(d.id)}</span></div>
                        <div class="dimension-hunter-count">${related.length} Hunter${related.length !== 1 ? "s" : ""}</div>
                    </div>
                    ${d.image ? `<div class="dimension-image-container"><img src="${escapeHtml(d.image)}"></div>` : ""}
                    <div class="panel dimension-description"><h3 style="font-size:11px;">Descripción</h3><p>${escapeHtml(d.description || "Sin descripción.")}</p></div>
                    ${d.lore ? `<div class="panel dimension-lore-container"><h3 style="font-size:11px; color:var(--accent-primary);">Lore</h3><p style="font-style:italic; line-height:1.75;">${escapeHtml(d.lore)}</p></div>` : ""}
                    ${suggestedClassObjs.length > 0 ? `<div class="panel dimension-classes-container"><h3 style="font-size:11px;">Clases sugeridas para esta dimensión</h3><div id="dim-class-list" class="dim-class-list"></div></div>` : ""}
                    ${d.suggested_enemies && d.suggested_enemies.length ? `<div class="panel dimension-enemies-container"><h3 style="font-size:11px;">Enemigos comunes</h3><div id="dim-enemies-list"></div></div>` : ""}
                    <div class="panel dimension-hunters-container"><h3 style="font-size:11px;">Hunters de esta dimensión</h3>${related.length === 0 ? `<p style="color:var(--text-muted); font-style:italic; font-size:11px;">Ningún hunter registrado en esta dimensión todavía.</p>` : `<div id="dim-hunter-list" style="display:flex; flex-direction:column; gap:4px; margin-top:4px;"></div>`}</div>
                </div>
                <div style="margin-top:10px;"></div>
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
                    row.className = "dimension-hunter-row";
                    const hunterDisplayName = h.name ? `${h.name} (${h.id})` : h.id;
                    const mbtiDisplay = h.mbti_subtype ? `${h.mbti} · ${h.mbti_subtype}` : h.mbti;
                    row.innerHTML = `<span class="concept-label dimension-hunter-class">${escapeHtml(h.class)}</span>
                         <span class="dimension-hunter-name">${escapeHtml(hunterDisplayName)}</span>
                         <span class="dimension-hunter-meta">${escapeHtml(mbtiDisplay)} · ${escapeHtml(h.gender || "")}</span>
                         <span class="dimension-hunter-arrow">→</span>`;
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
                <div class="export-bestiary">
                    <h3>Bestiario: Tipos Elementales y Criaturas</h3>
                    <div class="panel bestiary-table-container">
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
                    <div class="panel bestiary-creature-types">
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
                </div>
                <div style="margin-top:10px;"></div>
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
            <div class="mail-header">
                <h3 style="margin-bottom:4px;">Hunter Association — Terminal de Control</h3>
                <p class="text-muted" style="font-size:10px;">Sistema de mensajería interna · Nivel de seguridad: ALTO</p>
            </div>
            <div class="panel mail-from-panel">
                <p><b>De:</b> <span class="accent-warning">Hunter Association — División de Archivos</span></p>
                <p><b>Para:</b> <span class="accent-primary">Empleado autorizado</span></p>
                <p><b>Asunto:</b> <span class="accent-warning">Acceso al Visor de Archivos v2.0</span></p>
            </div>
            <div class="panel mail-body-panel">
                <p>Bienvenido al <b>Visor de Archivos de la Hunter Association</b>.</p>
                <p style="margin-top:8px;">Actualmente, <span class="accent-warning">solo un reducido número de empleados</span> tiene autorización para utilizar esta herramienta. Si <b>no estás autorizado</b>, apaga el equipo inmediatamente y olvida todo lo que has leído.</p>
                <p style="margin-top:12px;">Este sistema contiene información clasificada sobre Hunters, Dimensiones y Bestiario. El acceso no autorizado será registrado en los logs de la terminal y reportado a la Alta Dirección.</p>
                <p style="margin-top:12px; border-left:3px solid var(--accent-primary); padding-left:10px; font-style:italic;">— La Administración</p>
            </div>
        </div>`;
    }
}