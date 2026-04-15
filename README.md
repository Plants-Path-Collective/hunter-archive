# Hunter Association OS

## Resumen

Hunter Association OS es un sistema operativo ficticio basado en navegador, diseñado para crear, editar y gestionar archivos de personajes "Hunter" para un universo narrativo estilo DnD.

El sistema simula un entorno de escritorio retro inspirado en Windows 95, presentando los datos de los personajes como expedientes estructurados dentro de un sistema de archivo estilizado.

Está pensado como una herramienta para la ideación rápida, diseño de personajes y flujos de trabajo de construcción de mundos.

---

## Características principales

### Entorno de escritorio
- Ventanas arrastrables
- Sistema de ventanas en capas
- Barra de tareas con reloj del sistema
- Iconos en el escritorio para lanzar aplicaciones
- Interfaz de estilo retro

---

## Aplicaciones

### Buscador

Crea nuevos Hunters usando entradas estructuradas.

Entradas:
- Género
- Clase
- MBTI

Salidas:
- 2–3 conceptos aleatorios (función, estética, anomalía)
- Habilidad pasiva (aleatoria, independiente)
- Habilidad activa (aleatoria, independiente)

Propósito:
- Proporcionar dirección creativa
- Apoyar la ideación visual y narrativa

---

### Editor

Editor completo de hoja de personaje con vista previa en tiempo real.

Características:
- Edición de descripción
- Personalización de habilidades
- Soporte para múltiples imágenes (URLs de Imgur, una por línea)
- Vista previa en vivo de la hoja final
- Exportación a JSON
- Copiar al portapapeles

---

### Archivos

Interfaz tipo explorador para todos los Hunters almacenados.

Características:
- Navegación lateral
- Sistema de pestañas para Hunters abiertos
- Diseño horizontal de hoja de personaje
- Vista previa integrada
- Acceso directo al Editor

---

### Mail

Correo interno del sistema.

Usado como:
- Guía de usuario
- Capa narrativa
- Referencia de protocolo del sistema

---

## Flujo de trabajo

Generador → Editor → Exportar → files.json → Visor de Archivos

Paso a paso:

1. Abrir Generador
2. Crear un Hunter
3. Enviar al Editor
4. Refinar descripción, habilidades e imágenes
5. Copiar o descargar JSON
6. Pegar en `data/files.json`
7. Abrir en Archivos

---

## Estructura de datos

### `data/data.json`

Define las entradas del generador:
- Clases
- Géneros
- Tipos MBTI
- Pool de conceptos (función, estética, anomalía)
- Pool de habilidades pasivas (`passive_pool`)
- Pool de habilidades activas (`active_pool`)

Estructura de `data.json`:

```
{
  "genders": ["Masculino", "Femenino", "Andrógino"],
  "mbti": ["INTJ", "INTP", "ENTP", "INFJ"],
  "classes": [
    { "name": "Interfaz" },
    { "name": "Archivista" },
    { "name": "Fragmento" }
  ],
  "concepts": {
    "function": [
      { "text": "archiva eventos que no ocurrieron" },
      { "text": "vende recuerdos ilegales" }
    ],
    "aesthetic": [
      { "text": "oficina infinita fluorescente" },
      { "text": "ciudad dentro de un insecto" }
    ],
    "anomaly": [
      { "text": "su sombra actúa antes que él" },
      { "text": "el tiempo se repite al parpadear" }
    ]
  },
  "passive_pool": [
    "Resistencia elemental (fuego, hielo, rayo)",
    "Regeneración rápida fuera de combate",
    "Percepción extrasensorial (ver invisibilidad)"
  ],
  "active_pool": [
    "Golpe dimensional (ignora armadura)",
    "Sobrecarga de energía (daño en área)",
    "Invocar aliado temporal (criatura de sombra)"
  ]
}
```

### `data/files.json`
Almacena todos los Hunters. Ejemplo:
```
[
  {
    "id": "H-1776239790089",
    "gender": "Andrógino",
    "class": "Archivista",
    "mbti": "ENTP",
    "concepts": [
      "vende recuerdos ilegales",
      "oficina infinita fluorescente",
      "el tiempo se repite al parpadear"
    ],
    "passive": "Percibe eventos futuros cercanos",
    "active": {
      "base": "Rebobinar acción reciente"
    },
    "description": "Cazador novato",
    "images": [
      "https://i.imgur.com/IsyBjDJ.png"
    ]
  },
  {
    "id": "H-0000000000001",
    "gender": "Femenino",
    "class": "Cazador de Reliquias",
    "mbti": "ISTP",
    "concepts": [
      "explora ruinas prohibidas",
      "desierto eterno de huesos",
      "objetos que susurran secretos"
    ],
    "passive": "Resistencia a efectos desconocidos",
    "active": {
      "base": "Activar artefacto antiguo"
    },
    "description": "Especialista en recuperación de objetos anómalos.",
    "images": [
      "https://i.imgur.com/placeholder1.png"
    ]
  }
]
```
---
## Créditos

© 2024 - 2026 Plants Path Collective