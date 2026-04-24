# Hunter Association OS

## Resumen

Hunter Association OS es un sistema operativo ficticio basado en navegador, diseñado para crear, 
editar y gestionar archivos de personajes "Hunter" para un universo narrativo con multiples 
dimensiones con un combate JRPG por turnos.  El sistema simula un entorno de escritorio retrofuturista 
brutalista inspirado en sistemas operativos de los años 90, presentando los datos de los personajes 
como expedientes estructurados dentro de un sistema de archivo estilizado. 
Está pensado como una herramienta para la ideación rápida, diseño de personajes y flujos de trabajo 
de construcción de mundos.

**Versión actual:** v1.5.3 (posibilidad de escoger el arma del Hunter en el editor)

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
│   └── styles.css
├── data/
│   ├── classes.json
│   ├── concepts.json
│   ├── data.json
│   ├── dimensions.json
│   ├── elemental_types.json
│   └── files.json
├── js/
│   ├── apps.js
│   └── os.js
├── Guía para la Creación de Dimensiones, Clases y Habilidades.md
├── README.md
└── index.html
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
- Dos conceptos: **Función** (FN) y **Anomalía** (AN), obtenidos desde `concepts.json` según la dimensión asignada (o fallback global)
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
  "attribute_tooltips": { ... },
  "concepts": { ... },  // obsoleto si usas concepts.json por dimensión
  "passive_pool": [ ... ],
  "active_pool": [ ... ]
}
```

### `data/dimensions.json`
Lista de dimensiones de origen. Cada dimensión tiene:
- `id`: identificador único de 13 digitos
- `name`: nombre de la dimension
- `tagline`: descripcion corta ed la dimension
- `description`: descripción general 
- `lore`: texto narrativo extendido (opcional)
- `image`: URL de una imagen representativa (opcional)
- 
``` json
{
  "dimensions": [
    {
      "id": "DIM-6084206892469",
      "name": "Aztlán de Cristal",
      "tagline": "Donde los dioses caminan entre humanos...",
      "description": "Los mexicas nunca fueron conquistados...",
      "lore": "Tras repeler la invasión española...",
      "image": ""
    },
    ...
  ]
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

``` json
{
  "id": "H-1776239790089",
  "gender": "No Binario",
  "class": "Archivista",
  "mbti": "Analista",
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

## Próximas mejoras (tareas pendientes)

1. UX/UI Improvements

* Reduce information density: collapsible cards, improved spacing, cleaner typography.
* Ensure responsiveness (desktop).
* Optimize navigation between tabs/sections within Files, Editor, and Generator.
* If not already in use, implement a component library (shadcn/ui, MUI) or refine the CSS with Tailwind.
* Remember to maintain the essence of the website (a fictional OS based on Windows 95)

2. Rendering Feature for Documentation

* In Files, add buttons that allow you to generate a downloadable image (PNG) of:
* A Hunter’s full profile (stats, abilities, weapons).
* A Dimension’s summary profile (suggested classes, enemies).
* Table of elemental types + creature types.
* Use `html2canvas` and an “Export to Image” button that captures a specific container.

You can break the tasks down, so let's start with the first three. If you need more information or a specific file, let me know. I attached the readme file of theproject with the current state of the project and the current file tree, ask for the files u need.
Una vez implementados estos puntos, será necesario **actualizar este README** con la documentación correspondiente (estructura de datos, nuevas funcionalidades, flujo de trabajo ampliado).

---

## Créditos

© 2024 - 2026 Plants Path Collective