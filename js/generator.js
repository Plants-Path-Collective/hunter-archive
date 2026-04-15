let DATA = {};

async function loadData() {
    const res = await fetch("data/data.json");
    DATA = await res.json();

    fillSelect("gender", DATA.genders);
    fillSelect("class", DATA.classes.map(c => c.name));
    fillSelect("mbti", DATA.mbti);
}

function fillSelect(id, arr) {
    const el = document.getElementById(id);
    el.innerHTML = "";

    arr.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        el.appendChild(opt);
    });
}

function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------------------------
   GENERACIÓN DE HABILIDADES
---------------------------- */
function generateSkills(concepts, selectedClass) {
    const text = concepts.join(" ").toLowerCase();

    let passive = "Procesamiento pasivo";
    let active = "Acción estándar";

    // Reglas por keywords
    if (text.includes("tiempo")) {
        passive = "Puede repetir una acción fallida";
        active = "Rebobinar estado de objetivo";
    }

    if (text.includes("archivo") || text.includes("oficina")) {
        passive = "Organización perfecta";
        active = "Archivar entidad temporalmente";
    }

    if (text.includes("memoria") || text.includes("recuerdo")) {
        passive = "Retiene información crítica";
        active = "Extraer recuerdo del objetivo";
    }

    if (text.includes("insecto") || text.includes("orgánico")) {
        passive = "Adaptación biológica";
        active = "Mutación rápida";
    }

    // Ajuste por clase
    if (selectedClass === "Interfaz") {
        active += " (conecta sistemas incompatibles)";
    }

    if (selectedClass === "Archivista") {
        passive += " (no pierde información)";
    }

    return {
        passive,
        active,
        evolutions: [
            "Versión ampliada de la habilidad",
            "Efecto secundario inestable"
        ]
    };
}

/* ---------------------------
   GENERACIÓN DE PERSONAJE
---------------------------- */
function generateCharacter() {
    const gender = document.getElementById("gender").value;
    const cls = document.getElementById("class").value;
    const mbti = document.getElementById("mbti").value;

    const functionConcept = rand(DATA.concepts.function).text;
    const aestheticConcept = rand(DATA.concepts.aesthetic).text;
    const anomalyConcept = rand(DATA.concepts.anomaly).text;

    const concepts = [functionConcept, aestheticConcept, anomalyConcept];

    const skills = generateSkills(concepts, cls);

    const character = {
        id: "H-" + Date.now(),
        gender,
        class: cls,
        mbti,
        concepts,
        interpretation: "",
        description: "",
        weapon: "",
        passive: skills.passive,
        active: {
            base: skills.active,
            evolutions: skills.evolutions
        },
        images: []
    };

    localStorage.setItem("newHunter", JSON.stringify(character));
    window.location.href = "output.html";
}

/* ---------------------------
   INIT
---------------------------- */
document.getElementById("generate").addEventListener("click", generateCharacter);

loadData();