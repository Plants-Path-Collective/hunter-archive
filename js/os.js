let z = 1;

function openApp(name, data = null) {
    const win = document.createElement("div");
    win.className = "window";
    win.style.top = "100px";
    win.style.left = "100px";
    win.style.zIndex = z++;

    win.innerHTML = `
    <div class="title-bar">
      <span class="title-text">${name}</span>
      <div class="window-controls">
        <button onclick="this.closest('.window').remove()">X</button>
      </div>
    </div>
    <div class="content"></div>
  `;

    document.getElementById("windows").appendChild(win);

    makeDraggable(win);

    loadApp(name, win.querySelector(".content"), data);
}

/* =========================
   DRAG SYSTEM (FIXED)
========================= */
function makeDraggable(win) {
    const bar = win.querySelector(".title-bar");

    bar.addEventListener("mousedown", e => {
        if (e.target.tagName === "BUTTON") return;

        let offsetX = e.clientX - win.offsetLeft;
        let offsetY = e.clientY - win.offsetTop;

        function move(e) {
            win.style.left = e.clientX - offsetX + "px";
            win.style.top = e.clientY - offsetY + "px";
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