let z = 1;

function openApp(name, data = null) {
    const win = document.createElement("div");
    win.className = "window";
    // Posición inicial centrada aproximadamente
    win.style.top = "80px";
    win.style.left = "80px";
    win.style.zIndex = z++;

    let title = "";
    switch (name) {
        case "generator":
            title = "Generador";
            break;
        case "files":
            title = "Archivos";
            break;
        case "mail":
            title = "Mail";
            break;
        case "editor":
            title = "Editor";
            break;
        default:
            title = name;
    }

    win.innerHTML = `
    <div class="title-bar">
      <span class="title-text">${title}</span>
      <div class="window-controls">
        <button onclick="this.closest('.window').remove()">X</button>
      </div>
    </div>
    <div class="content"></div>
  `;

    document.getElementById("windows").appendChild(win);

    makeDraggable(win);
    constrainWindow(win); // Ajustar posición inicial dentro de límites

    loadApp(name, win.querySelector(".content"), data);
}

/* =========================
   CONSTRAIN WINDOW WITHIN VIEWPORT
========================= */
function constrainWindow(win) {
    const taskbar = document.getElementById("taskbar");
    const taskbarHeight = taskbar ? taskbar.offsetHeight : 40;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = parseInt(win.style.top, 10);
    let left = parseInt(win.style.left, 10);
    const width = win.offsetWidth;
    const height = win.offsetHeight;

    // Límites
    const minTop = 10;
    const maxTop = viewportHeight - taskbarHeight - height - 10;
    const minLeft = 10;
    const maxLeft = viewportWidth - width - 10;

    if (isNaN(top)) top = minTop;
    if (isNaN(left)) left = minLeft;

    top = Math.min(maxTop, Math.max(minTop, top));
    left = Math.min(maxLeft, Math.max(minLeft, left));

    win.style.top = top + "px";
    win.style.left = left + "px";
}

/* =========================
   DRAG SYSTEM WITH CONSTRAINTS
========================= */
function makeDraggable(win) {
    const bar = win.querySelector(".title-bar");

    bar.addEventListener("mousedown", e => {
        if (e.target.tagName === "BUTTON") return;

        let offsetX = e.clientX - win.offsetLeft;
        let offsetY = e.clientY - win.offsetTop;

        function move(e) {
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Aplicar límites
            const taskbar = document.getElementById("taskbar");
            const taskbarHeight = taskbar ? taskbar.offsetHeight : 40;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const width = win.offsetWidth;
            const height = win.offsetHeight;

            const minTop = 10;
            const maxTop = viewportHeight - taskbarHeight - height - 10;
            const minLeft = 10;
            const maxLeft = viewportWidth - width - 10;

            newTop = Math.min(maxTop, Math.max(minTop, newTop));
            newLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));

            win.style.left = newLeft + "px";
            win.style.top = newTop + "px";
        }

        function stop() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", stop);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", stop);
    });
}

/* =========================
   CLOCK SAFE
========================= */
setInterval(() => {
    const clock = document.getElementById("clock");
    if (clock) {
        clock.innerText = new Date().toLocaleTimeString();
    }
}, 1000);