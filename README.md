# Hunter Association OS

## Resumen

Hunter Association OS es un sistema operativo ficticio basado en navegador, diseñado para crear, editar y gestionar archivos de personajes "Hunter" para un universo narrativo estilo DnD.

El sistema simula un entorno de escritorio retro inspirado en Windows 95, presentando los datos de los personajes como expedientes estructurados dentro de un sistema de archivo estilizado.

Está pensado como una herramienta para la ideación rápida, diseño de personajes y flujos de trabajo de construcción de mundos.

**Versión actual:** v1.5.0 (incorpora Dimensiones de Origen y árbol de habilidades activas)

---

## Características principales

### Entorno de escritorio
- Ventanas arrastrables
- Sistema de ventanas en capas (foco mediante clic)
- Barra de tareas con reloj del sistema
- Botones de ventana: minimizar (con animación), maximizar/restaurar, cerrar
- Iconos en el escritorio para lanzar aplicaciones
- Interfaz de estilo retro

### Sistema de Tooltips
- Casi todos los elementos (clases, MBTI, conceptos, habilidades) muestran tooltips con descripciones contextuales.
- Los tooltips se obtienen de `data.json` (`attribute_tooltips`) y de las descripciones propias de clases, MBTI y dimensiones.

---

## Aplicaciones

### Buscador (Generator)

Crea nuevos Hunters usando entradas estructuradas.

Entradas:
- Género
- Clase (con tooltip de descripción)
- MBTI (con tooltip de descripción)

Salidas:
- **Dimensión de Origen** (asignada aleatoriamente desde `dimensions.json` – **inmutable**)
- Dos conceptos: **Función** (FN) y **Anomalía** (AN)
- Habilidad pasiva (aleatoria desde `passive_pool`)
- Habilidad activa (aleatoria desde `active_pool`), incluyendo **Base** y hasta dos **Rutas de evolución** (RUTA I, RUTA II)

El resultado se muestra en dos paneles: un resumen compacto y una vista previa completa con el árbol de habilidades. Un botón permite enviar el Hunter directamente al **Editor**.

### Editor

Editor completo de hoja de personaje con vista previa en tiempo real.

Características:
- Campos para **Función** y **Anomalía** (la Dimensión de Origen es **solo lectura**)
- Edición de descripción
- Habilidad pasiva
- Árbol de habilidad activa: Base + dos rutas de evolución
- Soporte para múltiples imágenes (URLs de Imgur, una por línea)
- Vista previa en vivo de la hoja final (incluye árbol de habilidades renderizado)
- Botones: **Actualizar** (refresca la vista previa), **Descargar JSON**, **Copiar JSON al portapapeles**

Además, si se abre el Editor sin pasarle un Hunter, muestra un selector de Hunters existentes (cargados desde `data/files.json`) y permite:
- Editar un Hunter seleccionado
- Crear uno nuevo (abre el Generador)
- Editar la configuración global (`data.json`)

### Archivos (File Explorer)

Explorador de archivos tipo árbol, con dos secciones:

- **Hunters**: lista de todos los Hunters registrados en `files.json`. Al hacer clic se muestra una vista detallada (con imagen, datos, habilidades, y un botón para abrir en el Editor).
- **Dimensiones**: lista de dimensiones cargadas desde `dimensions.json`. Cada dimensión muestra cuántos Hunters la tienen como origen. Al seleccionarla, se ven su descripción, lore (si existe) y la lista de Hunters asociados, con enlaces directos a cada uno.

Navegación bidireccional: desde un Hunter se puede ir a su Dimensión, y desde una Dimensión se puede ir a cualquiera de sus Hunters.

### Mail

Correo interno del sistema. Contiene la documentación de usuario actualizada, explicando:
- Flujo de trabajo (Buscador → Editor → Archivos)
- El concepto de **Dimensión de Origen** y su inmutabilidad
- El **Árbol de habilidad activa** (Base + Rutas)
- El explorador de archivos y la navegación cruzada
- Glosario de badges (FN, AN, BASE, RUTA I/II)

Sirve como guía de referencia dentro del propio sistema.

---

## Flujo de trabajo recomendado

1. **Buscador** → genera un Hunter con dimensión aleatoria, conceptos y habilidades.
2. **Editor** → refina descripción, habilidades, imágenes. La dimensión no se puede cambiar.
3. **Exportar** → copia o descarga el JSON.
4. **Añadir a `data/files.json`** (manualmente o sustituyendo el archivo).
5. **Archivos** → explora y visualiza todos los Hunters y Dimensiones.
6. (Opcional) **Editar configuración** → desde el selector del Editor se puede modificar `data.json`.

---

## Estructura de datos

### `data/data.json`

Define las entradas del generador y las descripciones.

```json
{
  "genders": ["Masculino", "Femenino", "No binario", "Agénero"],
  "mbti": ["Analista", "Diplomático", "Centinela", "Explorador"],
  "mbti_descriptions": { ... },
  "classes": [
    { "name": "Artista Marcial", "description": "..." },
    ...
  ],
  "attribute_tooltips": {
    "mbti": "Arquetipo psicológico...",
    "class": "Rol operativo...",
    "concepts": "Fragmentos de identidad...",
    "function": "Qué hace el Hunter...",
    "anomaly": "Rasgo inexplicable...",
    "passive": "Capacidad siempre activa...",
    "active": "Habilidad de uso deliberado..."
  },
  "concepts": {
    "function": [ { "text": "Archiva eventos que no ocurrieron" }, ... ],
    "anomaly": [ { "text": "Sus lágrimas son monedas antiguas" }, ... ]
  },
  "passive_pool": [ "Percepción extrasensorial...", ... ],
  "active_pool": [
    {
      "base": "Sobrecarga de energía (daño en área)",
      "paths": [ "Pulso continuo...", "Núcleo colapsado..." ]
    },
    ...
  ]
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

### `data/files.json`
Almacena todos los Hunters creados. Cada Hunter sigue el esquema:
``` json
[
  {
    "id": "H-1776239790089",
    "gender": "Andrógino",
    "class": "Archivista",
    "mbti": "ENTP",
    "dimension_id": "DIM-6084206892469",
    "concepts": [ "vende recuerdos ilegales", "el tiempo se repite al parpadear" ],
    "passive": "Percibe eventos futuros cercanos",
    "active": {
      "base": "Rebobinar acción reciente",
      "paths": [ "Rebobinar en área", "Retroceder dos turnos" ]
    },
    "description": "Cazador novato",
    "images": [ "https://i.imgur.com/IsyBjDJ.png" ]
  }
]
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
* Para registrar Hunters, añade sus JSON a `data/files.json` (puedes copiarlos desde el Editor).
* Los iconos del escritorio y la imagen de la ventana usan URLs de Imgur (se pueden cambiar en `index.html`).

---

## Notas técnicas
* Sistema desarrollado en HTML/CSS/JS puro, sin dependencias externas.
* Usa `fetch` para cargar los archivos JSON desde la carpeta `data/`.
* El gestor de ventanas (`os.js`) implementa arrastre, maximizado, minimizado con animación y persistencia de geometría.
* Los tooltips se generan dinámicamente y pueden mostrar texto variable (ej. descripción de la clase seleccionada).

---

## Créditos

© 2024 - 2026 Plants Path Collective