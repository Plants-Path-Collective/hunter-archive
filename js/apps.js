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
       GENERADOR
    ========================= */
    if (name === "generator") {

        const res = await fetch("data/data.json");
        const DATA = await res.json();

        // Asegurar que existan listas de habilidades (si no están en data.json, usar defaults)
        const passivePool = DATA.passive_pool || [
            "Resistencia elemental (fuego, hielo, rayo)",
            "Regeneración rápida fuera de combate",
            "Percepción extrasensorial (ver invisibilidad)",
            "Adaptación a cualquier entorno extremo",
            "Memoria eidética (recuerdo perfecto)",
            "Suerte sobrenatural (reroll fallos)",
            "Aura intimidante (enemigos cercanos temen)",
            "Sintonía con máquinas antiguas",
            "Inmunidad a venenos y enfermedades",
            "Paso silencioso (no genera ruido)"
        ];
        const activePool = DATA.active_pool || [
            "Golpe dimensional (ignora armadura)",
            "Sobrecarga de energía (daño en área)",
            "Invocar aliado temporal (criatura de sombra)",
            "Manipular memoria de un objetivo",
            "Teletransportarse a un punto visto",
            "Crear ilusión realista (rango medio)",
            "Absorber el próximo ataque y devolverlo",
            "Curar a un aliado con sangre propia",
            "Leer mente superficial (1 turno)",
            "Congelar el tiempo por 3 segundos"
        ];

        el.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; height:100%;">

            <div class="panel">
                <h3>Generador</h3>

                <div class="panel" style="margin-top:6px">
                    <label>Género</label>
                    <select id="gender"></select>

                    <label>Clase</label>
                    <select id="class"></select>

                    <label>MBTI</label>
                    <select id="mbti"></select>
                </div>

                <button id="generate" style="margin-top:6px;">Generar</button>

                <div class="panel" id="result" style="margin-top:6px;">
                    <p>Sin generación aún.</p>
                </div>
            </div>

            <div class="panel" id="preview">
                <p>Esperando generación...</p>
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

        // Genera habilidades completamente al azar, sin depender de conceptos
        function generateRandomSkills() {
            const passive = rand(passivePool);
            const active = rand(activePool);
            return { passive, active };
        }

        el.querySelector("#generate").onclick = () => {

            // Conceptos aleatorios desde data.json (no influyen en habilidades)
            const concepts = [
                rand(DATA.concepts.function).text,
                rand(DATA.concepts.aesthetic).text,
                rand(DATA.concepts.anomaly).text
            ];

            const cls = el.querySelector("#class").value;
            const skills = generateRandomSkills();

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
                <button id="to-editor">Abrir en Editor</button>
            `;

            el.querySelector("#preview").innerHTML = `
                <div class="panel">
                    <h3>${hunter.id}</h3>
                    <p><b>${hunter.class}</b> — ${hunter.mbti}</p>

                    <div class="panel">
                        <ul>${concepts.map(c => `<li>${c}</li>`).join("")}</ul>
                    </div>

                    <div class="panel">
                        <p><b>Pasiva:</b> ${skills.passive}</p>
                        <p><b>Activa:</b> ${skills.active}</p>
                    </div>
                </div>
            `;

            el.querySelector("#to-editor").onclick = () => {
                openApp("editor", hunter);
            };
        };
    }

    /* =========================
        EDITOR
    ========================= */
    if (name === "editor") {

        // Si no se proporciona un Hunter (abierto desde escritorio)
        if (!data) {
            // Cargar lista de hunters desde files.json
            let huntersList = [];
            let selectedHunter = null;

            const renderSelector = async () => {
                try {
                    const res = await fetch("data/data.json");
                    const configData = await res.json();
                    // Opcional: guardar para mostrar info
                } catch (e) {
                    console.warn("No se pudo cargar data.json");
                }
                try {
                    const res = await fetch("data/files.json");
                    huntersList = await res.json();
                } catch (e) {
                    huntersList = [];
                }

                el.innerHTML = `
                    <div class="stack" style="height:100%;">
                        <div class="panel">
                            <h3>Seleccionar Hunter</h3>
                            <select id="hunterSelect" size="10" style="width:100%; margin-bottom:6px;">
                                <option value="">-- Cargando --</option>
                            </select>
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
                selectEl.innerHTML = "";
                if (huntersList.length === 0) {
                    selectEl.innerHTML = '<option value="">No hay Hunters disponibles</option>';
                } else {
                    huntersList.forEach(h => {
                        const opt = document.createElement("option");
                        opt.value = h.id;
                        opt.textContent = `${h.id} - ${h.class} (${h.mbti})`;
                        selectEl.appendChild(opt);
                    });
                }

                // Vista previa al cambiar selección
                selectEl.addEventListener("change", () => {
                    const id = selectEl.value;
                    const hunter = huntersList.find(h => h.id === id);
                    if (hunter) {
                        const previewDiv = el.querySelector("#selectorPreview");
                        previewDiv.innerHTML = `
                            <div class="panel">
                                <h3>${hunter.id}</h3>
                                <p><b>${hunter.class}</b> — ${hunter.mbti}</p>
                                <p>${hunter.gender || ""}</p>
                                <h3>Conceptos</h3>
                                <ul>${(hunter.concepts || []).map(c => `<li>${c}</li>`).join("")}</ul>
                                <h3>Descripción</h3>
                                <p>${hunter.description || "Sin descripción."}</p>
                                <h3>Habilidades</h3>
                                <p><b>Pasiva:</b> ${hunter.passive || "-"}</p>
                                <p><b>Activa:</b> ${hunter.active?.base || "-"}</p>
                            </div>
                        `;
                    } else {
                        el.querySelector("#selectorPreview").innerHTML = "<p>Selecciona un Hunter para ver vista previa.</p>";
                    }
                });

                // Botón editar hunter
                el.querySelector("#selectHunterBtn").onclick = () => {
                    const id = selectEl.value;
                    if (!id) {
                        alert("Selecciona un Hunter de la lista.");
                        return;
                    }
                    const hunter = huntersList.find(h => h.id === id);
                    if (hunter) {
                        openApp("editor", hunter);
                        el.closest(".window").remove();
                    }
                };

                // Botón nuevo Hunter: abre el generador
                el.querySelector("#newHunterBtn").onclick = () => {
                    openApp("generator");
                };

                // Botón recargar
                el.querySelector("#refreshListBtn").onclick = () => {
                    renderSelector();
                };

                // Botón editar data.json
                el.querySelector("#editConfigBtn").onclick = () => {
                    openApp("editor", { _type: "dataConfig" });
                };
            };

            renderSelector();
            return; // Salir para no seguir con el editor normal
        }

        // Si data es un objeto con _type === "dataConfig", editamos data.json
        if (data._type === "dataConfig") {
            let configJson = "";
            let parsedConfig = null;

            // Función para cargar data.json actual
            const loadConfig = async () => {
                try {
                    const res = await fetch("data/data.json");
                    parsedConfig = await res.json();
                    configJson = JSON.stringify(parsedConfig, null, 2);
                } catch (e) {
                    parsedConfig = null;
                    configJson = "{\n  \"error\": \"No se pudo cargar data.json\"\n}";
                }
                renderConfigEditor();
            };

            const renderConfigEditor = () => {
                el.innerHTML = `
                    <div class="split split-30-70" style="height:100%;">
                        <div class="stack">
                            <div class="panel">
                                <h3>Editar data.json</h3>
                                <textarea id="configJson" style="height:300px; font-family:monospace;">${escapeHtml(configJson)}</textarea>
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

                const textarea = el.querySelector("#configJson");
                const previewDiv = el.querySelector("#configPreview");

                // Vista previa
                el.querySelector("#previewConfigBtn").onclick = () => {
                    try {
                        const newConfig = JSON.parse(textarea.value);
                        previewDiv.innerHTML = `
                            <div class="panel">
                                <h3>Vista previa de data.json</h3>
                                <h4>Géneros</h4>
                                <ul>${newConfig.genders?.map(g => `<li>${escapeHtml(g)}</li>`).join("") || "<li>No definido</li>"}</ul>
                                <h4>MBTI</h4>
                                <ul>${newConfig.mbti?.map(m => `<li>${escapeHtml(m)}</li>`).join("") || "<li>No definido</li>"}</ul>
                                <h4>Clases</h4>
                                <ul>${newConfig.classes?.map(c => `<li>${escapeHtml(c.name || c)}</li>`).join("") || "<li>No definido</li>"}</ul>
                                <h4>Conceptos</h4>
                                <p><b>Función:</b> ${newConfig.concepts?.function?.map(f => f.text).join(", ") || "—"}</p>
                                <p><b>Estética:</b> ${newConfig.concepts?.aesthetic?.map(a => a.text).join(", ") || "—"}</p>
                                <p><b>Anomalía:</b> ${newConfig.concepts?.anomaly?.map(a => a.text).join(", ") || "—"}</p>
                                <h4>Habilidades pasivas (${newConfig.passive_pool?.length || 0})</h4>
                                <ul>${newConfig.passive_pool?.slice(0,5).map(p => `<li>${escapeHtml(p)}</li>`).join("") || "<li>No definido</li>"}${newConfig.passive_pool?.length > 5 ? "<li>...</li>" : ""}</ul>
                                <h4>Habilidades activas (${newConfig.active_pool?.length || 0})</h4>
                                <ul>${newConfig.active_pool?.slice(0,5).map(a => `<li>${escapeHtml(a)}</li>`).join("") || "<li>No definido</li>"}${newConfig.active_pool?.length > 5 ? "<li>...</li>" : ""}</ul>
                            </div>
                        `;
                    } catch (e) {
                        previewDiv.innerHTML = `<div class="panel" style="color:red;">Error en JSON: ${e.message}</div>`;
                    }
                };

                // Descargar
                el.querySelector("#downloadConfigBtn").onclick = () => {
                    try {
                        const newConfig = JSON.parse(textarea.value);
                        const blob = new Blob([JSON.stringify(newConfig, null, 2)], {type: "application/json"});
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

                // Recargar original
                el.querySelector("#resetConfigBtn").onclick = () => {
                    loadConfig();
                };
            };

            // Función auxiliar para escapar HTML
            function escapeHtml(str) {
                if (!str) return "";
                return str.replace(/[&<>]/g, function(m) {
                    if (m === '&') return '&amp;';
                    if (m === '<') return '&lt;';
                    if (m === '>') return '&gt;';
                    return m;
                }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
                    return c;
                });
            }

            loadConfig();
            return;
        }

        // Si llegamos aquí, es porque se pasó un hunter (data)
        const h = data;

        // ... resto del código del editor (igual que antes, pero con textos en español) ...
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
                <h3>Conceptos</h3>
                <ul>
                    ${h.concepts.map(c => `<li>${c}</li>`).join("")}
                </ul>
            </div>

            <!-- IMAGES -->
            <div class="panel" style="margin-top:6px; aspect-ratio: 4:3">
                <h3>Imágenes (URLs de Imgur)</h3>

                <textarea id="imgs" placeholder="una url por línea"></textarea>
            </div>

            <!-- DESCRIPTION -->
            <div class="panel" style="margin-top:6px">
                <h3>Descripción</h3>
                <textarea id="desc"></textarea>
            </div>

            <!-- ABILITIES -->
            <div class="panel" style="margin-top:6px">
                <h3>Habilidades</h3>

                <label>Pasiva</label>
                <input id="passive">

                <label>Activa</label>
                <input id="active">
            </div>

            <!-- ACTIONS -->
            <div style="margin-top:6px; display:flex; gap:6px;">
                <button id="update">Actualizar</button>
                <button id="download">Descargar JSON</button>
                <button id="copy">Copiar JSON</button>
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
                : `<div style="height:200px; display:flex; align-items:center; justify-content:center; aspect-ratio: 4:3">Sin Imagen</div>`
            }
                    </div>

                    <!-- INFO -->
                    <div class="panel">

                        <div class="panel">
                            <p><b>${data.class}</b> — ${data.mbti}</p>
                            <p>${data.gender}</p>
                        </div>

                        <div class="panel" style="margin-top:6px">
                            <h3>Conceptos</h3>
                            <ul>
                                ${data.concepts.map(c => `<li>${c}</li>`).join("")}
                            </ul>
                        </div>

                    </div>

                </div>

                <div class="panel" style="margin-top:6px">
                    <h3>Descripción</h3>
                    <p>${data.description || "Sin descripción."}</p>
                </div>

                <div class="panel" style="margin-top:6px">
                    <h3>Habilidades</h3>
                    <p><b>Pasiva:</b> ${data.passive}</p>
                    <p><b>Activa:</b> ${data.active.base}</p>
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
            alert("JSON copiado al portapapeles");
        };

        render();
    }

    /* =========================
       ARCHIVOS (DESDE JSON)
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
                tab.className = "tab";                 
                if (i === activeTab) tab.classList.add("active"); 
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
                content.innerHTML = "<p>Selecciona un archivo.</p>";
                return;
            }

            const h = openTabs[activeTab];

            content.innerHTML = `
        <div class="panel">

            <h3>${h.id}</h3>

            <div style="display:grid; grid-template-columns:220px 1fr; gap:6px; margin-top:6px;">

                <!-- IZQUIERDA: IMAGEN -->
                <div class="panel">
                    ${h.images?.[0]
                ? `<img src="${h.images[0]}" style="width:100%; image-rendering:pixelated;">`
                : `<div style="height:200px; display:flex; align-items:center; justify-content:center; aspect-ratio: 4:3">
                            Sin Imagen
                           </div>`
            }
                </div>

                <!-- DERECHA: INFO PRINCIPAL -->
                <div class="panel">

                    <div class="panel">
                        <p><b>${h.class}</b> — ${h.mbti}</p>
                        <p>${h.gender || ""}</p>
                    </div>

                    <div class="panel" style="margin-top:6px">
                        <h3>Conceptos</h3>
                        <ul>
                            ${(h.concepts || []).map(c => `<li>${c}</li>`).join("")}
                        </ul>
                    </div>

                </div>

            </div>

            <!-- DESCRIPCIÓN -->
            <div class="panel" style="margin-top:6px">
                <h3>Descripción</h3>
                <p>${h.description || "Sin descripción."}</p>
            </div>

            <!-- HABILIDADES -->
            <div class="panel" style="margin-top:6px">
                <h3>Habilidades</h3>
                <p><b>Pasiva:</b> ${h.passive || "-"}</p>
                <p><b>Activa:</b> ${h.active?.base || "-"}</p>
            </div>

            <div style="margin-top:6px;">
                <button id="open-editor">Abrir en Editor</button>
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
       CORREO / GUÍA (NARRATIVA ACTUALIZADA)
    ========================= */
    if (name === "mail") {

        el.innerHTML = `
        <div class="panel">

            <h3>Hunter Association - Correo Interno</h3>

            <div class="panel" style="margin-top:6px">
                <p><b>De:</b> Hunter Association - Terminal de Control</p>
                <p><b>Asunto:</b> Protocolo de gestión de Hunters (v2.0)</p>
            </div>

            <div class="panel" style="margin-top:6px">
                <p>
                    Operador,<br><br>

                    El flujo de trabajo es el siguiente:<br><br>

                    <b>1. BÚSQUEDA DE HUNTERS</b><br>
                    Utiliza el módulo <b>Buscador</b> para localizar Hunters en el archivo multidimensional.<br>
                    Parámetros de búsqueda: Género, Clase, MBTI.<br>
                    El sistema generará hasta tres conceptos de realidad (función, estética, anomalía) y asignará habilidades pasivas/activas aleatorias.<br><br>

                    <b>2. ARCHIVOS DE HUNTERS</b><br>
                    El módulo <b>Archivos</b> muestra todos los expedientes de Hunters encontrados.<br>
                    Cada expediente incluye: ID, clase, MBTI, conceptos, habilidades, descripción e imágenes.<br>
                    Puedes abrir cualquier expediente directamente en el Editor.<br><br>

                    <b>3. EDICIÓN Y CORRECCIÓN</b><br>
                    El <b>Editor</b> permite modificar cualquier dato incongruente:<br>
                    - Descripción errónea<br>
                    - Habilidades desajustadas<br>
                    - Imágenes incorrectas<br>
                    - Conceptos contradictorios<br><br>

                    También puedes editar el archivo de configuración global (<b>data.json</b>) para ajustar las listas de clases, conceptos o habilidades.<br><br>

                    <b>Nota:</b> Cualquier alteración no autorizada será registrada en los logs de la Hunter Association.<br><br>

                    — Hunter Association
                </p>
            </div>

        </div>
    `;
    }

}