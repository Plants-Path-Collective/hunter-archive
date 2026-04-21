let z = 1;

/* =========================
   TOOLTIP SYSTEM
========================= */

const Tooltip = (() => {
    let el = null;

    function init() {
        el = document.createElement("div");
        el.id = "tooltip";
        document.body.appendChild(el);
    }

    function show(text, x, y) {
        if (!el || !text) return;
        el.textContent = text;
        el.style.display = "block";
        _position(x, y);
    }

    function _position(x, y) {
        const pad = 14;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let left = x + pad;
        let top  = y + pad;

        // Flip horizontal if overflowing right
        if (left + rect.width + 8 > vw) {
            left = x - rect.width - pad;
        }
        // Flip vertical if overflowing bottom
        if (top + rect.height + 8 > vh) {
            top = y - rect.height - pad;
        }

        el.style.left = Math.max(4, left) + "px";
        el.style.top  = Math.max(4, top)  + "px";
    }

    function hide() {
        if (el) el.style.display = "none";
    }

    /**
     * Bind a static tooltip to an element.
     * Adds data-tooltip attribute for CSS targeting (cursor, underline).
     */
    function bind(element, text) {
        if (!element || !text) return;
        element.setAttribute("data-tooltip", "1");
        element.addEventListener("mouseenter", e => show(text, e.clientX, e.clientY));
        element.addEventListener("mousemove",  e => _position(e.clientX, e.clientY));
        element.addEventListener("mouseleave", hide);
    }

    /**
     * Bind a dynamic tooltip to an element.
     * getTextFn is called on every mouseenter/mousemove to get the current text.
     */
    function bindDynamic(element, getTextFn) {
        if (!element || !getTextFn) return;
        element.setAttribute("data-tooltip", "1");
        element.addEventListener("mouseenter", e => {
            const t = getTextFn();
            if (t) show(t, e.clientX, e.clientY);
            else hide();
        });
        element.addEventListener("mousemove", e => {
            const t = getTextFn();
            if (t) _position(e.clientX, e.clientY);
        });
        element.addEventListener("mouseleave", hide);
    }

    return { init, show, hide, bind, bindDynamic };
})();

document.addEventListener("DOMContentLoaded", () => Tooltip.init());

/* =========================
   APP LAUNCHER
========================= */

function openApp(name, data = null) {
    const win = document.createElement("div");
    win.className = "window";
    win.style.top  = "80px";
    win.style.left = "80px";
    win.style.zIndex = z++;

    let title = "";
    switch (name) {
        case "generator": title = "Buscador";  break;
        case "files":     title = "Archivos";  break;
        case "mail":      title = "Mail";       break;
        case "editor":    title = "Editor";     break;
        default:          title = name;
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
    constrainWindow(win);

    loadApp(name, win.querySelector(".content"), data);
}

/* =========================
   CONSTRAIN WINDOW WITHIN VIEWPORT
========================= */

function constrainWindow(win) {
    const taskbar       = document.getElementById("taskbar");
    const taskbarHeight = taskbar ? taskbar.offsetHeight : 40;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top  = parseInt(win.style.top,  10);
    let left = parseInt(win.style.left, 10);
    const w  = win.offsetWidth;
    const h  = win.offsetHeight;

    const minTop  = 10;
    const maxTop  = vh - taskbarHeight - h - 10;
    const minLeft = 10;
    const maxLeft = vw - w - 10;

    if (isNaN(top))  top  = minTop;
    if (isNaN(left)) left = minLeft;

    top  = Math.min(maxTop,  Math.max(minTop,  top));
    left = Math.min(maxLeft, Math.max(minLeft, left));

    win.style.top  = top  + "px";
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
            let newTop  = e.clientY - offsetY;

            const taskbar       = document.getElementById("taskbar");
            const taskbarHeight = taskbar ? taskbar.offsetHeight : 40;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const w  = win.offsetWidth;
            const h  = win.offsetHeight;

            newTop  = Math.min(vh - taskbarHeight - h - 10, Math.max(10, newTop));
            newLeft = Math.min(vw - w - 10,                Math.max(10, newLeft));

            win.style.left = newLeft + "px";
            win.style.top  = newTop  + "px";
        }

        function stop() {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup",   stop);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup",   stop);
    });
}

/* =========================
   CLOCK
========================= */

setInterval(() => {
    const clock = document.getElementById("clock");
    if (clock) clock.innerText = new Date().toLocaleTimeString();
}, 1000);