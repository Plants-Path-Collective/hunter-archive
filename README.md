# Hunter Association OS

## Resumen

Hunter Association OS es un sistema operativo ficticio basado en navegador, diseñado para crear, 
editar y gestionar archivos de personajes "Hunter" para un universo narrativo con multiples 
dimensiones con un combate JRPG por turnos.  El sistema simula un entorno de escritorio retrofuturista 
brutalista inspirado en sistemas operativos de los años 90, presentando los datos de los personajes 
como expedientes estructurados dentro de un sistema de archivo estilizado. 
Está pensado como una herramienta para la ideación rápida, diseño de personajes y flujos de trabajo 
de construcción de mundos.

**Versión actual:** v2.0.0

---

## Separación completa entre visor público y editor privado

El sistema ahora cuenta con **dos puntos de entrada independientes**:

- **`index.html`** – Editor completo para desarrolladores y artistas.  
  Incluye todas las aplicaciones: **Buscador**, **Editor**, **Archivos** y **Mail** (con documentación de uso).  
  Permite crear, modificar y exportar Hunters.

- **`viewer.html`** – Visor público para consulta.  
  Muestra únicamente las aplicaciones **Archivos** (exploración de Hunters, dimensiones y bestiario) y **Mail** (mensaje de bienvenida y advertencia de seguridad).  
  No tiene acceso al Buscador ni al Editor. Ideal para compartir con jugadores o para documentación.

Ambas versiones comparten los mismos archivos de datos (`data/*.json`) y el gestor de ventanas (`os.js`), pero usan CSS y JavaScript separados:

- `css/styles.css` + `js/apps.js`         → Editor
- `css/viewer.css` + `js/viewer-apps.js` → Visor

Esta separación garantiza que los datos públicos nunca se modifiquen accidentalmente y que el flujo de trabajo sea seguro.

---

## Características principales

### Entorno de escritorio
- Ventanas arrastrables
- Sistema de ventanas en capas (foco mediante clic)
- Barra de tareas con reloj del sistema
- Botones de ventana: minimizar (con animación), maximizar/restaurar, cerrar
- Iconos en el escritorio para lanzar aplicaciones
- Interfaz de estilo brutalista retrofuturista

### Sistema de Tooltips
- Casi todos los elementos (clases, MBTI, conceptos, habilidades, dimensiones) muestran tooltips con descripciones contextuales.
- Los tooltips se obtienen de `data.json` (`attribute_tooltips`) y de las descripciones propias de clases, MBTI y dimensiones.

### Persistencia de datos
- Los cambios realizados en el Editor (estadísticas, descripción, imágenes, habilidades) se guardan automáticamente en `localStorage`.
- Cada Hunter mantiene su estado entre sesiones sin necesidad de exportar/importar.

---

```
hunter-archive/
├── css/
│   ├── styles.css
│   └── viewer.css
├── data/
│   ├── classes.json
│   ├── concepts.json
│   ├── data.json
│   ├── dimensions.json
│   ├── elemental_types.json
│   └── files.json
├── js/
│   ├── apps.js
│   ├── os.js
│   └── viewer-apps.js
├── README.md
├── index.html
└── viewer.html
```

---

## Aplicaciones

### Buscador (Generator)

Crea nuevos Hunters usando entradas estructuradas.

Entradas:
- Género
- MBTI (con tooltip de descripción)

**Nota:** La clase del Hunter se genera automáticamente según la Dimensión de Origen (si tiene clases sugeridas, se elige una de ellas; en caso contrario, se selecciona una clase aleatoria de todas las disponibles). El usuario no puede elegir la clase en el Generador, sino que debe modificarla posteriormente en el Editor si lo desea.

Salidas:
- **Dimensión de Origen** (asignada aleatoriamente desde `dimensions.json` – **inmutable**)
- Dos conceptos: **Función** (FN) y **Anomalía** (AN), obtenidos desde `concepts.json` según la dimensión asignada
- Habilidad pasiva (aleatoria desde `passive_pool` de la clase generada)
- Habilidad activa (aleatoria desde `active_pool` de la clase generada), incluyendo **Base** y hasta dos **Rutas de evolución** (RUTA I, RUTA II)

El resultado se muestra en dos paneles: un resumen compacto y una vista previa completa con el árbol de habilidades. Un botón permite enviar el Hunter directamente al **Editor**, donde se podrá modificar la clase y seleccionar un arma.

### Editor

Editor completo de hoja de personaje con vista previa en tiempo real.

Características:
- Campos para **Función** y **Anomalía** (la Dimensión de Origen es **solo lectura**)
- Edición de descripción
- Habilidad pasiva
- Árbol de habilidad activa: Base + dos rutas de evolución
- **Estadísticas**: HP, MP, Speed, Strength, Magic Power, Defense, Magic Defense, Evasion, Accuracy (valores numéricos)
- Soporte para múltiples imágenes (URLs de Imgur, una por línea)
- Vista previa en vivo de la hoja final (incluye árbol de habilidades renderizado y estadísticas)
- Botones: **Actualizar** (refresca la vista previa y guarda en localStorage), **Descargar JSON**, **Copiar JSON al portapapeles**

Además, si se abre el Editor sin pasarle un Hunter, muestra un selector de Hunters existentes (cargados desde `data/files.json`) y permite:
- Editar un Hunter seleccionado
- Crear uno nuevo (abre el Generador)
- Editar la configuración global (`data.json`)

### Archivos (File Explorer)

Explorador de archivos tipo árbol, con tres secciones:

- **Hunters**: lista de todos los Hunters registrados en `files.json`. Al hacer clic se muestra una vista detallada (con imagen, estadísticas, datos, habilidades, armas de su clase y un botón para abrir en el Editor). Si el Hunter tiene Dimensión de Origen, se puede navegar directamente a ella.
- **Dimensiones**: lista de dimensiones cargadas desde `dimensions.json`. Cada dimensión muestra cuántos Hunters la tienen como origen. Al seleccionarla, se ven su descripción, lore (si existe), **clases sugeridas** (con árbol de habilidades y armas asociadas), **enemigos sugeridos** (con estadísticas y habilidades) y la lista de Hunters asociados, con enlaces directos a cada uno.
- **Bestiario**: muestra una tabla de ventajas/desventajas entre tipos elementales (definidos en `elemental_types.json`) y una lista de tipos de criatura con sus descripciones.

Navegación bidireccional: desde un Hunter se puede ir a su Dimensión, y desde una Dimensión se puede ir a cualquiera de sus Hunters.

### Mail

Correo interno del sistema. Contiene la documentación de usuario actualizada, explicando:
- Flujo de trabajo (Buscador → Editor → Archivos)
- El concepto de **Dimensión de Origen** y su inmutabilidad
- El **Árbol de habilidad activa** (Base + Rutas)
- El explorador de archivos y la navegación cruzada
- Glosario de badges (FN, AN, BASE, RUTA I/II)
- Explicación de los archivos de datos (`data.json`, `classes.json`, `concepts.json`, `dimensions.json`, `elemental_types.json`, `files.json`)

Sirve como guía de referencia dentro del propio sistema.

---

## Flujo de trabajo recomendado

1. **Buscador** → genera un Hunter con dimensión aleatoria, conceptos temáticos y habilidades basadas en una clase generada automáticamente (según la dimensión o aleatoria). El usuario no elige la clase aquí.
2. **Editor** → refina descripción, estadísticas, habilidades, imágenes, y además puede **cambiar la clase** y **seleccionar un arma** de entre las disponibles para esa clase.
3. **Guardado automático** → los cambios se almacenan en `localStorage`; puedes cerrar la ventana y retomarlos después.
4. **Exportar** → copia o descarga el JSON final.
5. **Añadir a `data/files.json`** (manualmente o sustituyendo el archivo).
6. **Archivos** → explora y visualiza todos los Hunters, Dimensiones y el Bestiario.
7. (Opcional) **Editar configuración** → desde el selector del Editor se puede modificar `data.json`.

---

## Estructura de datos

### `data/data.json`

Define las entradas del generador, tooltips y algunos pools genéricos (usados solo si una clase no define los suyos propios).

```json
{
  "genders": ["Masculino", "Femenino", "No binario", "Agénero"],
  "mbti": ["Analista", "Diplomático", "Centinela", "Explorador"],
  "mbti_descriptions": { ... },
  "mbti_subtypes": {
    "Analista": ["INTJ", "INTP", "ENTJ", "ENTP"],
    "Diplomático": ["INFJ", "INFP", "ENFJ", "ENFP"],
    "Centinela": ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
    "Explorador": ["ISTP", "ISFP", "ESTP", "ESFP"]
  },
  "attribute_tooltips": { ... },
  "passive_pool": [ ... ],
  "active_pool": [ ... ]
}
```

### `data/classes.json`

Lista de clases. Cada clase contiene:

- `name`: nombre de la clase
- `description`: descripción narrativa
- `passive_pool`: array de posibles habilidades pasivas
- `active_pool`: array de objetos con base y paths (hasta 2 rutas)
- `weapons`: array de posibles armas/herramientas pertenecientes a la dimension (cada una puede contiene `name`, `type`, `description`, `damage`, `effect`)

```json
[
  {
    "name": "Artista Marcial",
    "description": "...",
    "passive_pool": [ "Percepción del ki" ],
    "active_pool": [ { "base": "Golpe resonante", "paths": [ "Onda expansiva", "Toque aturdidor" ] } ],
    "weapons": [
      { "name": "Guanteletes", "type": "arma", "damage": 6, "effect": "apuñalamiento" }
    ]
  }
]
```

### `data/concepts.json`

Organiza los conceptos (Función y Anomalía) por dimensión.

```json
{
  "dimensions": {
    "DIM-6084206892469": {
      "functions": [ "Teje realidades alternas", "Registra sueños proféticos" ],
      "anomalies": [ "Su sombra se mueve sola", "Las flores se marchitan al tocarlas" ]
    }
  }
}
```

### `data/dimensions.json`

Lista de dimensiones de origen. Cada dimensión tiene:

- `id`: identificador único
- `name`: nombre
- `tagline`: descripción corta
- `description`: descripción general
- `lore`: historia de la dimension
- `image`: URL de imagen representativa (opcional)
- `suggested_classes`: array de nombres de clases que encajan narrativamente
- `suggested_enemies`: array de enemigos de la raza principal de la dimension (objetos con `name`, `type`, `stats`, `abilities`)

```json
{
  "dimensions": [
    {
      "id": "DIM-6084206892469",
      "name": "Aztlán de Cristal",
      "tagline": "Donde los dioses caminan entre humanos...",
      "description": "...",
      "lore": "...",
      "image": "",
      "suggested_classes": ["Artista Marcial", "Sacerdote"],
      "suggested_enemies": [
        {
          "name": "Espectro de obsidiana",
          "type": ["Espectro", "Élite"],
          "stats": { "hp": 45, "mp": 20, "speed": 12, "strength": 15, "magicpower": 18, "defense": 8, "magicdefense": 12, "evasion": 5, "accuracy": 7 },
          "abilities": [ "Grito astral", "Manto de obsidiana" ]
        }
      ]
    }
  ]
}
```

### `data/elemental_types.json`
Define los tipos elementales (con ventajas y desventajas) y los tipos de criatura para el Bestiario.

``` json
{
  "elemental_types": [
    { "name": "Fuego", "advantage": ["Hielo","Planta"], "disadvantage": ["Agua","Tierra"] }
  ],
  "creature_types": [
    { "name": "Volador", "description": "Puede evadir ataques terrestres..." }
  ]
}
```

### `data/files.json`
Almacena todos los Hunters creados. Cada Hunter sigue el esquema:

- `id`: identificador único
- `game`: juego en el cuál aparece (Vega por defecto)
- `name`: nombre de cazador
- `gender`: género
- `class`: clase jrpg
- `mbti`: categoría personalidad
- `mbti_subtype`: mbti especifico basado en la categoría
- `dimension_id`: id de la dimension a la que pertenece
- `concepts`: conceptos que describen su función en su dimension y un rasgo de su personalidad
- `passive`: habilidad pasiva
- `active`: habilidad activa base y su skill tree
- `description`: descripción del hunter en general y un poco de su lore
- `images`: URL de imagen representativa (opcional)
- `stats`: estadisticas jrpg
- `weapon`: arma que porta el hunter

``` json
{
  "id": "H-1776239790089",
  "game": "Vega",
  "name": "Typlon",
  "gender": "No Binario",
  "class": "Archivista",
  "mbti": "Analista",
  "mbti_subtype": "INTJ",
  "dimension_id": "DIM-6084206892469",
  "concepts": [ "vende recuerdos ilegales", "el tiempo se repite al parpadear" ],
  "passive": "Percibe eventos futuros cercanos",
  "active": {
    "base": "Rebobinar acción reciente",
    "paths": [ "Rebobinar en área", "Retroceder dos turnos" ]
  },
  "description": "Cazador novato",
  "images": [ "https://i.imgur.com/IsyBjDJ.png" ],
  "stats": { ... },
  "weapon": { ... }   
}
```

---

## Árbol de habilidad activa
Cada Hunter posee una habilidad activa representada como un árbol de dos niveles:

* BASE: Habilidad nuclear, el poder principal. 
* RUTA I y RUTA II: Evoluciones o variantes de la habilidad base. Pueden estar vacías (sin evolución definida).

En las vistas previas (Generador, Editor, Archivos) se renderiza visualmente con un estilo jerárquico:
```
[ BASE ]  <texto base>
   ├─ [ RUTA I ]  <texto ruta I>
   └─ [ RUTA II ] <texto ruta II>
```

---

## Personalización y ampliación
* Para añadir nuevas clases, conceptos, habilidades o descripciones, edita `data/data.json`.
* Para añadir nuevas dimensiones, edita `data/dimensions.json`.
* Para añadir conceptos temáticos por dimensión, edita `data/concepts.json`.
* Para registrar Hunters, añade sus JSON a `data/files.json` (puedes copiarlos desde el Editor).
* Los iconos del escritorio y la imagen de la ventana usan URLs de Imgur (se pueden cambiar en `index.html`).

---

## Notas técnicas
* Sistema desarrollado en HTML/CSS/JS puro, sin dependencias externas.
* Usa `fetch` para cargar los archivos JSON desde la carpeta `data/`.
* El gestor de ventanas (`os.js`) implementa arrastre, maximizado, minimizado con animación y persistencia de geometría.
* Los tooltips se generan dinámicamente y pueden mostrar texto variable (ej. descripción de la clase seleccionada).

---

# Roadmap

A continuación se detalla el plan de evolución del sistema, organizado por versiones semánticas (X.Y.Z).  
Todas las mejoras se implementarán manteniendo la compatibilidad con el despliegue estático en GitHub Pages y la separación actual entre editor (`index.html`) y visor público (`viewer.html`).

---

## v2.1.0 – Bestiario avanzado y ficha de enemigos

**Objetivo:** Convertir el Bestiario en una herramienta completa para consultar tanto las reglas elementales como un catálogo de enemigos, integrando a los enemigos como parte del lore de las dimensiones.

### Tareas

1. **Reestructurar la sección Bestiario en dos subcategorías**
  - **Enciclopedia elemental**: tabla de ventajas/desventajas entre tipos elementales (actual), diagrama de relaciones tipo “piedra-papel-tijera”, listado de razas de criaturas con descripciones.
  - **Catálogo de enemigos**: lista completa de todos los enemigos (cargados desde `dimensions.json` o un nuevo `enemies.json`).

2. **Añadir ficha detallada de cada enemigo** (visible en el visor y el editor)
  - Campos:
    - `id` (identificador único)
    - `name`
    - `dimension_id` (enlace a la dimensión de origen)
    - `types`: `race` (raza), `element` (elemento), `rarity` (esbirro, miniboss, boss)
    - `description`
    - `stats` (HP, MP, Speed, Strength, Magic, Defense, Magic Defense, Evasion, Accuracy)
    - `abilities`: array de 1 a 2 habilidades (solo nombre y descripción, sin árbol de rutas)
  - La ficha se mostrará al hacer clic en un enemigo del catálogo.

3. **Actualizar `dimensions.json`** para que cada dimensión pueda incluir una lista de enemigos (ya existe `suggested_enemies` – se estandarizará y completará).

4. **Ampliar el explorador de Archivos** para mostrar el Bestiario con las dos subcategorías colapsables (similar a la agrupación de Hunters por juego).

5. **Adaptar el editor** (si se desea) para permitir crear/modificar enemigos. *Opcional para esta versión, prioridad solo en el visor.*

---

## v2.2.0 – Ficha de Hunter con pestañas y habilidades expandidas

**Objetivo:** Separar la información narrativa del Hunter de sus estadísticas y habilidades, además de permitir hasta 3 habilidades activas y visualizarlas como diagramas.

### Tareas

1. **Rediseñar la vista de Hunter (tanto en editor como en visor) usando pestañas**
  - **Pestaña “Info”**: muestra los conceptos (FN, AN), descripción, dimensión de origen, imagen y datos narrativos.
  - **Pestaña “Combate”**: muestra estadísticas (stats grid) y el nuevo diagrama de habilidades.

2. **Modificar el esquema de habilidades activas**
  - Cambiar de `active.base` + `active.paths[]` (máximo 2 rutas) a un array `active_skills` de 1 a 3 habilidades independientes.
  - Cada habilidad tendrá: `name`, `description`, `type` (activa/pasiva), `cost` (opcional).
  - Mantener compatibilidad con datos antiguos (migración automática en el cargador).

3. **Implementar diagrama visual de habilidades** (en lugar del árbol jerárquico actual)
  - Usar representación gráfica simple (cajas o nodos conectados) mediante CSS Grid/Flex o SVG básico.
  - Mostrar el nombre de cada habilidad y su descripción en tooltip o al hacer clic.

4. **Refactorizar `renderHunterView`** para usar las pestañas y el nuevo modelo de habilidades.

5. **Actualizar el Editor** para que permita añadir/eliminar habilidades activas (mínimo 1, máximo 3) y editar sus campos.

---

## v2.3.0 – Mejoras visuales y de usabilidad

**Objetivo:** Pulir la interfaz, optimizar el rendimiento y preparar el terreno para futuras expansiones.

### Tareas

1. **Diagrama de relaciones elementales** en el Bestiario (enciclopedia) usando gráficos vectoriales o una cuadrícula interactiva.

2. **Ordenación y filtros** en el catálogo de enemigos (por dimensión, rareza, elemento).

3. **Tooltips mejorados** para las habilidades de los enemigos.

4. **Optimización de carga** de los archivos JSON (caché local, lazy loading si es necesario).

5. **Añadir un indicador de “en construcción”** en el editor para las secciones no implementadas (por si se decide no incluir la edición de enemigos en v2.1.0).

---

## v3.0.0 – Integración con base de datos externa (futuro)

*Nota: Esta versión requeriría un backend y no está prevista para el corto plazo, ya que el sitio debe seguir siendo estático.*

- Posibilidad de sincronizar Hunters y enemigos con una API REST.
- Exportación/importación directa desde la nube.
- Control de versiones de los personajes.

---

## Notas sobre el despliegue

- Todos los cambios deben ser **compatibles con GitHub Pages** (solo HTML/CSS/JS estático).
- La separación entre `index.html` (editor) y `viewer.html` (visor) se mantendrá.
- Las nuevas funcionalidades se implementarán primero en el visor público y luego, si es pertinente, se replicarán en el editor.

---

# Guía de implementación – Roadmap v2.1.0, v2.2.0 y v2.3.0

Esta guía detalla los archivos a modificar (y los que se podrían crear) para implementar las futuras versiones del sistema, respetando la separación actual entre editor (`index.html` + `apps.js` + `styles.css`) y visor público (`viewer.html` + `viewer-apps.js` + `viewer.css`).

---

## v2.1.0 – Bestiario avanzado y ficha de enemigos

**Objetivo:** Convertir el Bestiario en una herramienta completa con dos subcategorías: enciclopedia elemental y catálogo de enemigos.

### Archivos a modificar

| Archivo | Cambios necesarios |
|---------|---------------------|
| `data/dimensions.json` | Asegurar que cada dimensión tenga un array `enemies` (o `suggested_enemies`) correctamente estructurado con `id`, `name`, `type` (raza, elemento, rareza), `stats`, `abilities`. Si ya existe, solo completar campos. |
| `data/elemental_types.json` | Puede ampliarse para incluir diagramas de relación (por ejemplo, un objeto `diagram` con ventajas/desventajas en formato matriz). |
| `js/apps.js` y `js/viewer-apps.js` | Dentro del bloque `if (name === "files")`:<br> - Modificar `renderTree()` para mostrar el Bestiario como dos `<details>`:<br>   * `Enciclopedia elemental` (contenido actual: tabla de ventajas/desventajas y lista de tipos de criatura).<br>   * `Catálogo de enemigos` (lista de enemigos cargados desde `dimensions.json` o desde un nuevo archivo).<br> - Crear nueva función `renderEnemyView(enemy)` para mostrar la ficha detallada del enemigo (similar a `renderHunterView` pero sin árbol de habilidades).<br> - Modificar `renderDimensionView()` para que los enemigos sugeridos enlace a la ficha del enemigo en lugar de mostrarse solo como texto. |
| `css/styles.css` y `css/viewer.css` | Añadir clases para la ficha de enemigo (`.enemy-id`, `.enemy-types`, `.enemy-stats-grid`, etc.) y para el diagrama de relaciones elementales (por ahora, una cuadrícula simple con CSS Grid). |

### Nuevos archivos sugeridos

- **`data/enemies.json`** – Centraliza todos los enemigos en un único archivo, facilitando el catálogo. Cada enemigo tendrá un `dimension_id` para mantener la relación con las dimensiones. Ejemplo:
```json
[
  {
    "id": "E-12345",
    "name": "Espectro de obsidiana",
    "dimension_id": "DIM-6084206892469",
    "types": {
      "race": "Espectro",
      "element": "Oscuridad",
      "rarity": "esbirro"
    },
    "description": "Un ser etéreo...",
    "stats": { "hp": 45, "mp": 20, "speed": 12, ... },
    "abilities": [ "Grito astral", "Manto de obsidiana" ]
  }
]
```

-`js/enemies.js` – Si se decide separar la lógica de gestión de enemigos, se podría crear un módulo auxiliar. No es imprescindible.

### Orden de implementación sugerido
1. Crear `data/enemies.json` y migrar los enemigos existentes desde `dimensions.json`.
2. Modificar `loadApp()` para que cargue también `enemies.json`.
3. Actualizar `renderTree()` para la nueva estructura del Bestiario.
4. Implementar `renderEnemyView()`.
5. Ajustar `renderDimensionView()` para enlazar a las fichas de enemigos.
6. Probar en ambos entornos (editor y visor).

---

## v2.2.0 – Ficha de Hunter con pestañas y habilidades expandidas

### Archivos a modificar

| Archivo | Cambios necesarios |
|---------|---------------------|
| `data/files.json` | Cada hunter debe cambiar de `active.base` + `active.paths` a un array `active_skills` de 1 a 3 habilidades. Para no romper datos antiguos, se hará una migración automática en el cargador de datos. |
| `js/apps.js` y `js/viewer-apps.js` | - Crear función `migrateHunterToNewFormat(hunter)` para convertir el formato antiguo al nuevo al cargar.<br> - Reemplazar `renderHunterView()` para que use pestañas (`.tabs`). Dividir el contenido en:<br>   * `Pestaña Info`: conceptos, descripción, dimensión, imagen.<br>   * `Pestaña Combate`: estadísticas, diagrama de habilidades.<br> - Crear `renderSkillsDiagram(skills)` que genere una visualización con tarjetas o nodos (usando CSS Grid/flex).<br> - Modificar el Editor para manejar `active_skills` (inputs dinámicos, botones para añadir/eliminar, limitando a 3). |
| `css/styles.css` y `css/viewer.css` | Añadir estilos para las pestañas (`.tab-bar`, `.tab-button`, `.tab-pane`, `.tab-active`) y para el diagrama de habilidades (`.skill-diagram`, `.skill-card`, `.skill-name`, `.skill-desc`). |
| `js/utils.js` (nuevo) | Centralizar funciones comunes de migración y validación, para no duplicar código entre `apps.js` y `viewer-apps.js`. Ejemplo: `migrateHunterToNewFormat()`. |

### Nuevos archivos sugeridos

- `js/utils.js` – Centraliza funciones comunes de migración y validación, para no duplicar código entre `apps.js` y `viewer-apps.js`

```json
function migrateHunterToNewFormat(hunter) {
  if (hunter.active_skills) return hunter;
  const newSkills = [];
  if (hunter.active?.base) newSkills.push({ name: hunter.active.base, description: "", type: "activa", cost: 0 });
  if (hunter.active?.paths) {
    hunter.active.paths.forEach(p => newSkills.push({ name: p, description: "", type: "activa", cost: 0 }));
  }
  return { ...hunter, active_skills: newSkills };
}
```

### Orden de implementación
1. Implementar la migración automática en el cargador de datos.
2. Cambiar la vista de Hunter para usar pestañas (primero la estructura, luego el diseño).
3. Implementar el diagrama de habilidades (inicialmente una lista simple, luego mejorar visualmente).
4. Actualizar el Editor para que soporte la edición del array `active_skills` (inputs dinámicos).
5. Probar ambas aplicaciones.

---

© 2024 - 2026 Plants Path Collective