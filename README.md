# Hunter OS

## Overview

Hunter OS is a browser-based fictional operating system designed to create, edit, and manage "Hunter" character files for a narrative-driven DnD-style universe.

The system simulates a retro desktop environment inspired by Windows 95, presenting character data as structured dossiers within a stylized archive system.

It is intended as a tool for rapid ideation, character design, and worldbuilding workflows.

---

## Core Features

### Desktop Environment
- Draggable windows
- Layered window system
- Taskbar with system clock
- Desktop icons for launching applications
- Retro-inspired interface

---

## Applications

### Generator

Creates new Hunters using structured inputs.

Inputs:
- Gender
- Class
- MBTI

Outputs:
- 2–3 randomized concepts
- Passive ability
- Active ability (base)

Purpose:
- Provide creative direction
- Support visual and narrative ideation

---

### Editor

Full character sheet editor with real-time preview.

Features:
- Description editing
- Ability customization
- Multi-image support (Imgur URLs, one per line)
- Live preview of final character sheet
- JSON export
- Clipboard copy

---

### Files

Explorer-style interface for all stored Hunters.

Features:
- Sidebar navigation
- Tab system for opened Hunters
- Horizontal character sheet layout
- Integrated preview
- Direct access to Editor

---

### Inbox

Internal system mail.

Used as:
- User guide
- Narrative layer
- System protocol reference

---

## Workflow

Generator → Editor → Export → files.json → Files Viewer

Step-by-step:

1. Open Generator
2. Create a Hunter
3. Send to Editor
4. Refine description, abilities, and images
5. Copy or download JSON
6. Paste into `data/files.json`
7. Open in Files

---

## Data Structure

### `data/data.json`

Defines generator inputs:
- Classes
- Genders
- MBTI types
- Concept pools

Structure `data.json` (output):
```
{
  "id": "H-0001",
  "gender": "Androgynous",
  "class": "Archivist",
  "mbti": "ENTP",
  "concepts": [
    "illegal memory trader",
    "infinite fluorescent office",
    "time resets when blinking"
  ],
  "passive": "Perceives near-future events (perfect memory)",
  "active": {
    "base": "Rewind recent action"
  },
  "description": "Hunter specialized in temporal event manipulation.",
  "images": [
    "https://i.imgur.com/example.png"
  ]
}
```

### `data/files.json`

Stores all Hunters.

Structure `files.json`:
```
{
  "hunters": [
    {},
    {}
  ]
}
```
---
## Credits

© 2024 - 2026 Plants Path Collective