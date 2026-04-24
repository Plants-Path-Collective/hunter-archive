/* =========================
   WINDOW MANAGER
========================= */

const WM = (() => {

    const DEFAULT_W  = 860;
    const DEFAULT_H  = 650;
    const TASKBAR_H  = 44;
    const MARGIN     = 10;

    const wins   = {};    // wid → { el, title, state, x, y, w, h, savedGeom }
    let   zTop   = 200;
    let   cascade = 0;

    /* ── Open / create a new window ── */
    function open(name, data = null) {
        const wid = name + "-" + Date.now();

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const w = Math.min(DEFAULT_W, vw - MARGIN * 2);
        const h = Math.min(DEFAULT_H, vh - TASKBAR_H - MARGIN * 2);

        const baseX = Math.round((vw - w) / 2) + cascade * 28;
        const baseY = Math.round((vh - TASKBAR_H - h) / 2) + cascade * 28;
        const x = Math.max(MARGIN, Math.min(baseX, vw - w - MARGIN));
        const y = Math.max(MARGIN, Math.min(baseY, vh - TASKBAR_H - h - MARGIN));
        cascade = (cascade + 1) % 9;

        const title = _titleFor(name);

        const el = document.createElement("div");
        el.className = "window";
        el.dataset.wid = wid;
        el.style.left   = x + "px";
        el.style.top    = y + "px";
        el.style.width  = w + "px";
        el.style.height = h + "px";
        el.style.zIndex = ++zTop;

        el.innerHTML = `
        <div class="title-bar">
            <span class="title-text">${title}</span>
            <div class="window-controls">
                <button class="wm-btn wm-min"   title="Minimizar">—</button>
                <button class="wm-btn wm-max"   title="Maximizar">□</button>
                <button class="wm-btn wm-close" title="Cerrar">✕</button>
            </div>
        </div>
        <div class="content"></div>
        `;

        document.getElementById("windows").appendChild(el);

        wins[wid] = { el, title, state: "open", x, y, w, h, savedGeom: null };

        el.querySelector(".wm-close").addEventListener("click", e => { e.stopPropagation(); close(wid); });
        el.querySelector(".wm-min"  ).addEventListener("click", e => { e.stopPropagation(); minimize(wid); });
        el.querySelector(".wm-max"  ).addEventListener("click", e => { e.stopPropagation(); toggleMax(wid); });

        el.addEventListener("mousedown", () => focus(wid), true);

        _attachDrag(wid);
        focus(wid);
        _updateTaskbar();

        loadApp(name, el.querySelector(".content"), data);
        return el;
    }

    /* ── Close with fade-out ── */
    function close(wid) {
        const w = wins[wid];
        if (!w) return;

        w.el.style.transition = "opacity .13s, transform .13s";
        w.el.style.opacity    = "0";
        w.el.style.transform  = "scale(0.95)";

        setTimeout(() => {
            w.el.remove();
            delete wins[wid];
            _updateTaskbar();
        }, 140);
    }

    /* ── Minimize: shrink toward taskbar button ── */
    function minimize(wid) {
        const w = wins[wid];
        if (!w || w.state !== "open") return;

        const taskBtn = document.querySelector(`.wm-task-btn[data-wid="${wid}"]`);
        const winRect = w.el.getBoundingClientRect();
        const winCX = winRect.left + winRect.width  / 2;
        const winCY = winRect.top  + winRect.height / 2;

        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight - TASKBAR_H / 2;
        if (taskBtn) {
            const r = taskBtn.getBoundingClientRect();
            targetX = r.left + r.width  / 2;
            targetY = r.top  + r.height / 2;
        }

        const dx     = targetX - winCX;
        const dy     = targetY - winCY;
        const scaleX = taskBtn ? Math.min(taskBtn.offsetWidth  / winRect.width,  0.15) : 0.08;
        const scaleY = taskBtn ? Math.min(taskBtn.offsetHeight / winRect.height, 0.10) : 0.04;

        w.el.style.transformOrigin = "center center";
        w.el.style.transition = "opacity .22s ease-in, transform .22s cubic-bezier(0.4,0,1,1)";
        w.el.style.opacity    = "0";
        w.el.style.transform  = `translate(${dx}px,${dy}px) scale(${scaleX},${scaleY})`;

        setTimeout(() => {
            w.el.style.cssText = "display:none";
            // Restore z so it doesn't interfere
            w.el.style.zIndex = wins[wid]?.el?.style?.zIndex || zTop;
            w.state = "minimized";
            _updateTaskbar();
        }, 230);
    }

    /* ── Restore from minimized: fly up from taskbar button ── */
    function restore(wid) {
        const w = wins[wid];
        if (!w || w.state !== "minimized") return;

        // Reapply geometry before making visible
        _applyGeom(wid);
        w.el.style.display = "";
        w.state = "open";

        const taskBtn = document.querySelector(`.wm-task-btn[data-wid="${wid}"]`);
        const winRect = w.el.getBoundingClientRect();
        const winCX   = winRect.left + winRect.width  / 2;
        const winCY   = winRect.top  + winRect.height / 2;

        let btnCX = window.innerWidth  / 2;
        let btnCY = window.innerHeight - TASKBAR_H / 2;
        if (taskBtn) {
            const r = taskBtn.getBoundingClientRect();
            btnCX = r.left + r.width  / 2;
            btnCY = r.top  + r.height / 2;
        }

        const dx = btnCX - winCX;
        const dy = btnCY - winCY;
        const sx = taskBtn ? Math.max(taskBtn.offsetWidth  / winRect.width,  0.05) : 0.08;
        const sy = taskBtn ? Math.max(taskBtn.offsetHeight / winRect.height, 0.04) : 0.04;

        w.el.style.transformOrigin = "center center";
        w.el.style.transition = "none";
        w.el.style.transform  = `translate(${dx}px,${dy}px) scale(${sx},${sy})`;
        w.el.style.opacity    = "0";

        w.el.getBoundingClientRect(); // force reflow

        w.el.style.transition = "opacity .2s ease-out, transform .2s cubic-bezier(0,0,0.2,1)";
        w.el.style.transform  = "";
        w.el.style.opacity    = "";

        setTimeout(() => {
            w.el.style.transition      = "";
            w.el.style.transformOrigin = "";
        }, 220);

        focus(wid);
        _updateTaskbar();
    }

    /* ── Toggle maximize / restore ── */
    function toggleMax(wid) {
        const w = wins[wid];
        if (!w || w.state !== "open") return;

        if (w.el.classList.contains("wm-maximized")) {
            // Restore
            w.el.classList.remove("wm-maximized");
            w.el.querySelector(".wm-max").textContent = "□";
            if (w.savedGeom) {
                Object.assign(w, w.savedGeom);
                w.savedGeom = null;
                _applyGeom(wid);
            }
        } else {
            // Maximize
            w.savedGeom = { x: w.x, y: w.y, w: w.w, h: w.h };
            w.el.classList.add("wm-maximized");
            w.el.querySelector(".wm-max").textContent = "❐";
        }

        focus(wid);
    }

    /* ── Bring window to front ── */
    function focus(wid) {
        const w = wins[wid];
        if (!w) return;

        Object.values(wins).forEach(win => win.el.classList.remove("wm-focused"));
        w.el.classList.add("wm-focused");
        w.el.style.zIndex = ++zTop;

        _updateTaskbar();
    }

    /* ── Apply saved x/y/w/h to element ── */
    function _applyGeom(wid) {
        const w = wins[wid];
        if (!w || w.el.classList.contains("wm-maximized")) return;
        w.el.style.left   = w.x + "px";
        w.el.style.top    = w.y + "px";
        w.el.style.width  = w.w + "px";
        w.el.style.height = w.h + "px";
    }

    /* ── Drag: attach to title bar, respects maximized state ── */
    function _attachDrag(wid) {
        const w   = wins[wid];
        const bar = w.el.querySelector(".title-bar");
        if (!bar) return;

        let dragging = false;
        let ox, oy, startX, startY;

        bar.addEventListener("mousedown", e => {
            if (e.target.closest(".window-controls")) return;
            if (w.el.classList.contains("wm-maximized")) return;

            dragging = true;
            ox = e.clientX; oy = e.clientY;
            startX = w.x;   startY = w.y;

            focus(wid);
            e.preventDefault();
        });

        document.addEventListener("mousemove", e => {
            if (!dragging) return;
            _moveWindow(wid, e.clientX - ox, e.clientY - oy, startX, startY);
        });

        document.addEventListener("mouseup", () => { dragging = false; });

        // Double-click title bar to toggle maximize
        bar.addEventListener("dblclick", e => {
            if (e.target.closest(".window-controls")) return;
            toggleMax(wid);
        });
    }

    function _moveWindow(wid, dx, dy, startX, startY) {
        const w  = wins[wid];
        if (!w) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight - TASKBAR_H;

        w.x = Math.max(-(w.w - 80), Math.min(startX + dx, vw - 80));
        w.y = Math.max(0,           Math.min(startY + dy, vh - 30));

        w.el.style.left = w.x + "px";
        w.el.style.top  = w.y + "px";
    }

    /* ── Rebuild taskbar buttons ── */
    function _updateTaskbar() {
        const bar = document.getElementById("taskbar");
        if (!bar) return;
        bar.querySelectorAll(".wm-task-btn").forEach(b => b.remove());

        const clock = bar.querySelector("#clock");

        Object.entries(wins).forEach(([wid, w]) => {
            const btn = document.createElement("button");
            btn.className  = "wm-task-btn";
            btn.dataset.wid = wid;
            btn.textContent = w.title;
            btn.title       = w.title;

            if (w.state === "minimized")             btn.classList.add("wm-minimized");
            if (w.el.classList.contains("wm-focused")) btn.classList.add("wm-focused");

            btn.addEventListener("click", () => {
                if (w.state === "minimized") {
                    restore(wid);
                } else if (w.el.classList.contains("wm-focused")) {
                    minimize(wid);
                } else {
                    focus(wid);
                }
            });

            bar.insertBefore(btn, clock);
        });
    }

    function _titleFor(name) {
        switch (name) {
            case "generator": return "Buscador";
            case "files":     return "Archivos";
            case "mail":      return "Mail";
            case "editor":    return "Editor";
            default:          return name;
        }
    }

    return { open, close, minimize, restore, toggleMax, focus };

})();


/* =========================
   APP LAUNCHER (public)
========================= */

function openApp(name, data = null) {
    return WM.open(name, data);
}


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
        const pad  = 14;
        const rect = el.getBoundingClientRect();
        const vw   = window.innerWidth;
        const vh   = window.innerHeight;

        let left = x + pad;
        let top  = y + pad;

        if (left + rect.width  + 8 > vw) left = x - rect.width  - pad;
        if (top  + rect.height + 8 > vh) top  = y - rect.height - pad;

        el.style.left = Math.max(4, left) + "px";
        el.style.top  = Math.max(4, top)  + "px";
    }

    function hide() {
        if (el) el.style.display = "none";
    }

    function bind(element, text) {
        if (!element || !text) return;
        element.setAttribute("data-tooltip", "1");
        element.addEventListener("mouseenter", e => show(text, e.clientX, e.clientY));
        element.addEventListener("mousemove",  e => _position(e.clientX, e.clientY));
        element.addEventListener("mouseleave", hide);
    }

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
   CLOCK
========================= */

setInterval(() => {
    const clock = document.getElementById("clock");
    if (clock) clock.innerText = new Date().toLocaleTimeString();
}, 1000);