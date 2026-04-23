# Guía para la Creación de Dimensiones, Clases y Habilidades

Esta guía documenta el proceso creativo para el proyecto **Hunter Association OS**, orientado a un sistema de combate por turnos (estilo autobattler con barras de acción). Las habilidades deben ser **programables** (efectos claros, números o condiciones simples) y **útiles en batalla**.

---

## 1. Creación de Dimensiones

Cada dimensión es un mundo con su propia lógica, estética y conflicto. Se construyen mezclando **2 o 3 conceptos**.

### 1.1 Fórmula básica

`Dimensión = (Cultura / Época) + (Elemento científico / fantástico) + (Temática central opcional)`



### 1.2 Ejemplos de combinaciones

| Dimensión | Mezcla |
|-----------|--------|
| Aztlán de Cristal | Mexicas + Armonía con la naturaleza + Avatares divinos |
| Archipiélago de Cuerdas | Polinesia + Teoría de cuerdas + Música cuántica |
| Tallador de Nubes | Tibet + Aeronáutica de gas + Escultura cinética |
| Profundidades del Canto Fósil | Egipto + Paleontología + Resonancia ósea |
| Jardines de Sal Amarga | Vikingos + Cristalografía emocional + Navegación por mareas |
| Imperio de las Mareas Negras | Japón feudal + Petróleo vivo + Mecanismos de cuerda |
| Biblioteca de las Arenas | Persia + Hologramas de arena + Registro de secretos |
| Coral de Hielo Fractal | Seres de hielo + Fisión consciente + Tecnología criorgánica |

### 1.3 Estructura JSON de una dimensión

```json
{
  "id": "DIM-XXXXXXXXXXXXX",
  "name": "Nombre único",
  "tagline": "Frase ultra corta (máx 6 palabras)",
  "description": "Explicación detallada del mundo, su tecnología, habitantes y conflicto principal.",
  "lore": "Trasfondo narrativo opcional (1-2 párrafos).",
  "image": "URL opcional",
  "suggested_classes": [
    "Clase1 (rol)",
    "Clase2 (rol)",
    "Clase3 (rol)"
  ],
  "suggested_enemies": [
    { "name": "...", "type": ["..."], "stats": {...}, "abilities": [...] },
    ...
  ]
}
```

### 1.4 Nuevas directrices para tagline

* Máximo 6 palabras.
* Debe responder a: ¿qué hace única a esta dimensión?
* Ejemplos:
  * "Criaturas de hielo que se dividen"
  * "Vikingos que navegan sobre emociones cristalizadas"
  * "Monjes que esculpen nubes sólidas"
  
### 1.5 Consejos para nuevas dimensiones

* Evita solapamientos temáticos con las ya existentes.
* Asegúrate de que las clases sugeridas tengan sentido dentro del mundo.
* Define un conflicto central que pueda generar historias.
* Incluye un detalle único: un tipo de tecnología, un recurso especial, una regla física alterada.
* Si la dimensión tiene seres no humanos, describe su biología y sociedad.
* Sugiere al menos 5 enemigos típicos (ver sección 9).

---

## 2. Creación de Clases

Las clases son arquetipos de personajes basados en oficios, roles o castas que existen dentro de una dimensión. En el contexto JRPG, cada clase debe tener un rol claro en combate (daño, tanque, apoyo, control, etc.).
### 2.1 Estructura de una clase

```json
{
  "name": "Nombre de la Clase (Rol opcional)",
  "dimension_id": "ID de la dimensión a la que pertenece",
  "description": "Descripción narrativa del arquetipo (una o dos líneas).",
  "passive_pool": [
    "Habilidad pasiva 1",
    "Habilidad pasiva 2",
    "Habilidad pasiva 3"
  ],
  "active_pool": [
    {
      "base": "Descripción de la habilidad base",
      "paths": [
        "Evolución / variante 1 (RUTA I)",
        "Evolución / variante 2 (RUTA II)"
      ]
    },
    {
      "base": "Segunda habilidad base",
      "paths": [ "Path 1", "Path 2" ]
    },
    {
      "base": "Tercera habilidad base",
      "paths": [ "Path 1", "Path 2" ]
    }
  ],
  "weapons": [
    {
      "name": "Macana de obsidiana",
      "description": "Maza de piedra con incrustaciones de pirita que arde al impactar",
      "type": "cuerpo a cuerpo",
      "damage": 15,
      "effect": "10% de quemar"
    },
    ...
  ]
}
```

### 2.2 Reglas de diseño

* **Tres habilidades pasivas**: deben ser activas todo el tiempo y tener un efecto claro que afecte la batalla (ej. "Aumenta defensa un 20% cuando la vida es baja").
* **Tres habilidades activas**:  cada una con BASE (efecto principal) y dos rutas (variantes excluyentes). Coste implícito (MP, turno, etc.).
* **De 3 a 5 armas o herramientas**: objetos característicos que la clase usa en combate o en su oficio. Deben tener nombres evocadores y una breve descripción entre paréntesis si es necesario para imaginar su forma física, además de tener un efecto básico.

### 2.3 Balance y coherencia

* Las habilidades deben ser útiles pero no rotas. 
* Las rutas deben ofrecer decisiones interesantes (área vs. objetivo único, daño vs. control, etc.).
* Las armas deben estar alineadas con la tecnología y estética de la dimensión.

### 2.4 Ejemplo de clase bien construida
```json
{
  "name": "Avatar Solar (Tonatiuh)",
  "dimension_id": "DIM-6084206892469",
  "description": "Portador de la chispa del dios sol. Irradia calor purificador, quema la maleza y protege los cultivos.",
  "passive_pool": [
    "Su cuerpo emite un calor constante que purifica el agua a su alrededor en un radio de tres metros",
    "Las plantas que toca crecen más sanas y resistentes a plagas",
    "Puede resistir temperaturas extremas sin daño (desde el hielo hasta lava)"
  ],
  "active_pool": [
    {
      "base": "Lanzar una llamarada solar que quema a los enemigos sin dañar la vegetación ni las estructuras aliadas",
      "paths": [
        "Llamarada selectiva — solo daña a quienes el avatar considera hostiles",
        "Llamarada envolvente — quema todo en un radio de veinte metros, pero el avatar puede excluir aliados con concentración"
      ]
    },
    {
      "base": "Aumentar su calor corporal hasta volverse incandescente, fundiendo metales y armas que se le acerquen",
      "paths": [
        "Incandescencia controlada — puede tocar aliados sin dañarlos, solo afecta a objetos inanimados y enemigos",
        "Incandescencia salvaje — quema todo a su paso, pero también se daña a sí mismo"
      ]
    },
    {
      "base": "Invocar un escudo de luz solar que repele proyectiles y ataques mágicos durante varios minutos",
      "paths": [
        "Escudo reflectante — devuelve los proyectiles al atacante con la misma fuerza",
        "Escudo absorbente — convierte la energía de los ataques en calor que puede liberar después"
      ]
    }
  ],
  "weapons": [
    "Macana de obsidiana con incrustaciones de pirita (arde al impactar) (cuerpo a cuerpo, daño 15, 10% de quemar)",
    "Chimalli (escudo circular) que refleja luz cegadora (escudo, reduce daño físico 20%)",
    "Atlatl (propulsor de dardos) que lanza proyectiles ígneos (distancia, daño 12, ignora escudos)"
  ]
}
```

---

## 3. Habilidades Pasivas

Las pasivas deben ser siempre activas y no requieren decisión del jugador. Son rasgos constantes del personaje. Deben ser programables y útiles en combate, a pesar de ello, centrate también en el apartado narrativo, la idea es que tenga sentido con la narrativa de la dimensión (clase, personaje, etc.)

### 3.1 Directrices

* Usa números o porcentajes.
* Condiciones claras (ej. `"Al inicio del turno, si el personaje tiene menos del 30% de vida, recupera 10% de PS"`).
* Efectos de estado.
* Sin ambigüedades.

### 3.2 Ejemplos de pasivas bien diseñadas

* "Cada vez que esquivas, ganas un punto de acción adicional (máx 1 por turno)"
* "Los ataques de fuego curan un 10% del daño infligido"
* "Al iniciar el combate, obtienes escudo mágico que absorbe 50 de daño"

---

## 4. Habilidades Activas y Rutas

Cada clase tiene **3** habilidades activas. Cada habilidad tiene una BASE y dos rutas (evoluciones o variantes). En el sistema, el personaje solo puede usar una ruta a la vez (la que elija al adquirir la habilidad). Cada habilidad activa debe tener un coste (MP, turno, etc.) y un efecto determinista.

### 4.1 Estructura de una habilidad activa

```json
{
  "base": "Efecto principal, claro y conciso",
  "paths": [
    "Primera variante (RUTA I)",
    "Segunda variante (RUTA II)"
  ]
}
```

### 4.2 Principios de diseño

* La BASE debe ser útil por sí misma, incluso sin rutas.
* Las rutas deben ser mutuamente excluyentes, balanceadas y ofrecer estilos de juego diferentes.
* Evita que una ruta sea claramente superior a la otra; deben ser situacionales o preferencias de estilo.
* Usa descripciones breves pero evocadoras. Ej: "Ráfaga múltiple — lanza tres cortes en abanico".
* Plantea que cambios haría esa ruta a la habilidad original.

### 4.3 Tipos comunes de rutas

- **Área vs. Objetivo único**: una ruta afecta a varios enemigos, la otra a uno solo con más daño.
- **Control vs. Daño**: una ruta aturde o mueve al enemigo, la otra hiere.
- **Rápido vs. Sostenido**: una ruta es instantánea pero agota recursos, la otra es más lenta pero duradera.
- **Defensivo vs. Ofensivo**: una ruta protege al aliado, la otra daña al enemigo.

### 4.4 Ejemplo de habilidad activa bien construida

```json
{
  "base": "Lanza una llamarada que causa 40 de daño de fuego a un enemigo.",
  "paths": [
    "Llamarada envolvente: causa 25 de daño a todos los enemigos.",
    "Llamarada penetrante: causa 60 de daño a un enemigo, pero el personaje pierde 10 PS."
  ]
}
```

---

## 5. Armas y Herramientas

Cada clase tiene una lista de **3 a 5 objetos** que la caracterizan. No son solo armas de combate, sino también herramientas de su oficio. Cada arma debe tener un efecto base (ej. puede ser que mejora con uan stat del personaje o que aplica un cambio de estado).

### 5.1 Formato

- Cada arma lleva un **nombre**, una **descripción física** y un **efecto**.
- Ejemplos:  

```json
{
  "name": "Katana de Kuroyū",
  "description": "Hoja con un canal que almacena una dosis de petróleo vivo",
  "type": "cuerpo a cuerpo",
  "damage": 18,
  "effect": "puede volver gaseosa para atravesar defensas enemigaas"
}
```

### 5.2 Directrices

- Deben ser **coherentes con la tecnología de la dimensión** (ej. `un arma de hielo no debería causar daño de fuego`).
- Pueden tener efectos mecánicos simples (se sobreentiende que el personaje sabe usarlas).

---

## 6. Balance y Revisión

### 6.1 Qué revisar

- **Sinergias internas**: las pasivas y activas de una clase no deben anularse entre sí.
- **Economía de turnos**: ¿La habilidad vale el coste (MP, tiempo, riesgo)?
- **Comparación entre clases**: ninguna clase debe ser obviamente más poderosa que otra en todas las situaciones.
- **Claridad del texto**: evita ambigüedades. Un jugador debe entender qué hace la habilidad sin necesidad de preguntar.
- **Sin efectos infinitos**: todas las habilidades deben tener un límite (por turno, por combate, etc.).

### 6.2 Prueba de concepto

Simula un combate de 3 turnos. ¿La clase puede hacer algo interesante en cada turno? ¿Tiene opciones para atacar, defender, apoyar o curar? Si solo puede atacar, está mal diseñada.

### 6.3 Expansión futura

- Puedes crear **nuevas dimensiones** siguiendo la fórmula de mezcla de conceptos.
- Las clases pueden compartir armas o habilidades similares si pertenecen a dimensiones afines, pero evita el copiar-pegar sin contexto.

---

## 7. Checklist para crear una nueva dimensión

- [ ] Elegir **cultura base** (ej. celtas, japoneses, egipcios, tibetanos…).
- [ ] Elegir **elemento fantástico/científico** (ej. petróleo vivo, arena holográfica, música cuántica…).
- [ ] Elegir **segundo elemento** o temática (ej. fisión celular, emociones cristalizadas, transformación en dinosaurios…).
- [ ] Escribir **tagline** (una frase que describa el universo brevemente).
- [ ] Redactar **descripción** (describe a grandes rasgos como funciona la dimension).
- [ ] Redactar **lore** (describe la narrativa de la dimension, contando la historia de sus habitantes y sucesos importantes).
- [ ] Definir **suggested_classes** (clases sugeridas para dicha dimension).
- [ ] Definir **suggested_enemies** (al menos 5 enemigos típicos de la dimensión).
- [ ] Crear las tres clases siguiendo la estructura.
- [ ] Verificar que las habilidades sean coherentes con la dimensión.
- [ ] Verificar que todo sea programable y útil en combate por turnos.
- [ ] Añadir la dimensión a `dimensions.json` y las clases a `classes.json`.

---

## 8. Sistema de Combate y Diseño de Enemigos

### 8.1 Resumen del sistema de combate (autobattler por turnos)

- El jugador forma una **party de 4 hunters** (puede intercambiar con reserva antes del combate).
- El combate comienza cuando un enemigo alcanza al grupo.
- **Turnos no tradicionales**: cada unidad (aliada o enemiga) tiene una **barra de acción** que se llena según su estadística `speed`. Cuando la barra se llena, la unidad puede actuar.
- **Prioridad de acción**:
  - Si dos aliados llenan su barra al mismo tiempo → pueden hacer un **ataque combinado**.
  - Si un aliado y un enemigo llenan su barra al mismo tiempo → se activa un **minijuego** (ej. pulsar botón, hacer clic rápido). El ganador actúa primero; el perdedor se retrasa y debe recargar su barra.
- **Acciones disponibles** (por cada unidad en su turno):
  - **Atacar**: ataque físico/mágico básico con el arma equipada.
  - **Skills**: abre panel con las habilidades activas de la clase (máx 4).
  - **Swap**: cambia al hunter actual por otro de la reserva (no disponible si el hunter murió).
  - **Bag**: usa objetos consumibles.
  - **Run**: intenta huir del combate.
  - **Use**: activa un objeto mágico equipado (cooldown global, independiente del personaje).

### 8.2 Estadísticas de las unidades (aliados y enemigos)

| Stat | Descripción |
|------|-------------|
| `hp` | Puntos de vida. Al llegar a 0, la unidad muere. |
| `mp` | Puntos de magia. Se consumen al usar habilidades activas. |
| `speed` | Velocidad. Determina la frecuencia de llenado de la barra de acción. |
| `strength` | Fuerza física. Afecta al daño del comando **Atacar** y habilidades físicas. |
| `magicpower` | Poder mágico. Afecta al daño o curación de las **Skills**. |
| `defense` | Defensa física. Reduce el daño de ataques físicos. |
| `magicdefense` | Defensa mágica. Reduce el daño de habilidades mágicas enemigas. |

### 8.3 Diseño de enemigos por dimensión

Cada dimensión debe tener una **lista de al menos 5 enemigos típicos** que reflejen su ecosistema, conflicto o especie dominante. Los enemigos se definen con:

- Nombre
- Tipo(s) (ej. fuego, hielo, tierra, volador, etc.)
- Stats base (hp, mp, speed, strength, magicpower, defense, magicdefense)
- Habilidades (activas y pasivas, igual que los hunters pero más simples)
- Posible botín o experiencia

```json
"suggested_enemies": [
  {
    "name": "Golem de Hielo",
    "type": ["hielo"],
    "stats": { "hp": 120, "mp": 20, "speed": 30, "strength": 25, "magicpower": 5, "defense": 30, "magicdefense": 15 },
    "abilities": ["Golpe glacial (daño físico + 10% congelar)", "Fusión parcial (recupera 10 hp por turno)"]
  },
  {
    "name": "Fragmento Fractal",
    "type": ["hielo", "fisión"],
    "stats": { "hp": 60, "mp": 40, "speed": 60, "strength": 10, "magicpower": 20, "defense": 10, "magicdefense": 10 },
    "abilities": ["División: al recibir daño, se divide en dos fragmentos más débiles", "Ráfaga de escarcha (daño mágico a todos)"]
  },
  {
    "name": "Cristal Resonante",
    "type": ["hielo", "sonido"],
    "stats": { "hp": 80, "mp": 50, "speed": 45, "strength": 8, "magicpower": 25, "defense": 12, "magicdefense": 20 },
    "abilities": ["Vibración aturdidora (reduce speed de un aliado)", "Eco helado (daño mágico y silencia)"]
  },
  {
    "name": "Gigante de Hielo Vivo",
    "type": ["hielo", "coloso"],
    "stats": { "hp": 200, "mp": 10, "speed": 20, "strength": 40, "magicpower": 0, "defense": 40, "magicdefense": 25 },
    "abilities": ["Aplastar (daño físico alto, baja precisión)", "Grito de glaciar (reduce defensa de todos los aliados)"]
  },
  {
    "name": "Núcleo Congelado",
    "type": ["hielo", "élite"],
    "stats": { "hp": 150, "mp": 60, "speed": 50, "strength": 15, "magicpower": 35, "defense": 20, "magicdefense": 30 },
    "abilities": ["Absorción térmica (roba mp)", "Tormenta de hielo (daño masivo, requiere 2 turnos de carga)"]
  }
]
```

#### 8.3.2 Directrices para diseñar enemigos

- **Variedad de roles**: tanques, dañadores, apoyos, controladores.
- **Sinergia con la dimensión**: los enemigos deben sentirse parte del mundo (ej. en un mundo de fuego, enemigos de lava o ceniza).
- **Curva de dificultad**: enemigos comunes (débiles), élite (fuertes), quizás un jefe por dimensión.
- **Habilidades claras y programables**, igual que los hunters.
- **Stats coherentes**: un enemigo rápido debe tener `speed` alta pero poca defensa, etc.
- **Botín sugerido**: opcional, pero ayuda a dar recompensas.

### 8.4 Minijuego de prioridad (sugerencia de diseño)

Cuando un aliado y un enemigo llenan su barra al mismo tiempo:

- Se muestra un **indicador visual** (ej. una barra que sube y baja o un círculo que se encoge).
- El jugador debe **pulsar un botón (o hacer clic) en el momento justo** para ganar prioridad.
- Si gana el jugador, su unidad actúa primero; si pierde, el enemigo actúa y la barra del aliado se resetea parcialmente (o se retrasa un 50%).
- Puede haber variantes según el tipo de enemigo (más difícil contra jefes).

### 8.5 Ataque combinado (dos aliados simultáneos)

Si dos aliados llenan su barra al mismo tiempo:

- Se activa un **ataque especial combinado** que puede ser:
  - La suma de ambos ataques básicos con un bonus (ej. 1.5x daño).
  - Una habilidad única de la pareja (si la programamos).
  - Un efecto adicional (ej. curación mutua, aumento de stats).
- El jugador puede elegir si realizar el combinado o actuar por separado (para mayor control).

### 8.6 Integración con la guía de creación

Al crear una nueva dimensión, además de las clases, deberás **diseñar al menos 5 enemigos** siguiendo el formato anterior. Añade el campo `suggested_enemies` en el JSON de la dimensión (ver apartado 1.3). Esto permitirá al sistema generar encuentros coherentes con el mundo.

---

## 9. Próximos pasos (ampliado)

1. **Revisar y balancear** las habilidades existentes (ajustar textos, cambiar rutas poco interesantes, añadir nuevas armas).
2. **Añadir costes** (MP, turnos, etc.) a las habilidades activas.
3. **Crear un sistema de tipos** (fuego, hielo, tierra, etc.) para interacciones.
4. **Documentar** las reglas de combate (turnos, estados, cálculos de daño).
5. **Implementar el minijuego de prioridad** y el sistema de ataques combinados.
6. **Diseñar enemigos** para cada dimensión siguiendo la estructura propuesta.
7. **Probar el balance** con simulaciones de combate (ej. party de 4 hunters vs 4 enemigos).
8. **Expandir el multiverso** creando dimensiones adicionales.

---

## Apéndice: Tipos Elementales y de Criatura

### Tipos Elementales

| Tipo | Descripción | Ejemplo de enemigo | Ventaja | Desventaja |
|------|-------------|--------------------|---------|-------------|
| Fuego | Daño por calor, puede quemar | Ave Solar | hielo, planta | agua, tierra |
| Hielo | Daño por congelación, ralentiza | Golem de Hielo | planta, tierra | fuego, roca |
| Tierra | Daño físico contundente, puede aturdir | Golem de Arena | fuego, eléctrico | hielo, volador |
| Viento | Daño por corte, aumenta evasión | Arpía de la Tormenta | eléctrico, agua | roca, hielo |
| Agua | Daño por presión, puede curar | Tritón del Abismo | fuego, tierra | eléctrico, planta |
| Eléctrico | Daño por descarga, paraliza | Pez Globo de Frecuencias | agua, volador | tierra, viento |
| Luz | Daño sagrado, cura | Jaguar de Cristal | oscuro, fantasma | ninguno |
| Oscuro | Daño corruptor, roba vida | Espectro de la Luna | luz, psíquico | ninguno |
| Veneno | Daño por toxicidad, deterioro | Cobra de Hueso | planta, tierra | fuego, luz |
| Psíquico | Daño mental, confunde | Esfinge de Arena | lucha, veneno | oscuro, bicho |
| Roca | Daño por impacto, alta defensa | Golem de Sal | fuego, volador | agua, planta |
| Planta | Daño por crecimiento, absorbe vida | Jaguar de Cristal (?) | agua, tierra | fuego, hielo |

### Tipos de Criatura

| Tipo | Descripción | Ejemplo | Características |
|------|-------------|---------|------------------|
| Humanoide | Seres con forma humanoide | Guerrero de Obsidiana | Pueden usar armas y armaduras |
| Bestia | Animales o criaturas salvajes | Jaguar de Cristal | Alta velocidad y fuerza |
| Volador | Criaturas que vuelan | Ave Solar | Inmunes a ataques de tierra, +evasión |
| Coloso | Seres gigantes de gran tamaño | Gigante de Hielo Vivo | Mucho HP, baja speed, alto daño |
| Elemental | Seres compuestos de un elemento puro | Golem de Gas | Inmunes a críticos, fuertes vs su opuesto |
| Fantasma | Seres intangibles o espirituales | Espectro de la Luna | Inmunes a daño físico normal, débiles a luz |
| Máquina | Constructos mecánicos | Taladro de Montaña | Alta defensa, inmunes a veneno y sueño |
| Arena | Seres compuestos de arena o polvo | Esfinge de Arena | Absorben daño de agua? (depende del diseño) |
| Fisión | Seres que se dividen al recibir daño | Fragmento Fractal | Se multiplican, débiles a área |
| Élite | Versiones mejoradas de enemigos comunes | Núcleo Congelado | Stats elevadas, habilidades especiales |
| Líquido | Seres fluidos o amorfos | Kuroyū Salvaje | Resistentes a daño físico, débiles a frío |
| Sigilo | Enemigos rápidos y evasivos | Shinobi de la Sombra | Alta evasion, baja defensa |

**Nota**: Los tipos pueden combinarse (ej. `["fuego", "volador"]`). Las ventajas/desventajas son orientativas y pueden ajustarse por balance.

---

*Documento generado para el proyecto Hunter Association OS – Plants Path Collective*