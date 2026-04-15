function makeDraggable(win) {
    const bar = win.querySelector(".title-bar");

    let x = 0, y = 0, down = false;

    bar.onmousedown = e => {
        down = true;
        x = e.clientX - win.offsetLeft;
        y = e.clientY - win.offsetTop;
    };

    document.onmouseup = () => down = false;

    document.onmousemove = e => {
        if (!down) return;
        win.style.left = e.clientX - x + "px";
        win.style.top = e.clientY - y + "px";
    };
}

bar.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    document.querySelectorAll(".window").forEach(makeDraggable);
});

function goHome() {
    window.location.href = "index.html";
}

function minimizeWindow(el) {
    el.style.display = "none";
}

function openGenerator() {
    window.location.href = "input.html";
}
function openMail() {
    window.location.href = "readme.html";
}

function clock() {
    document.getElementById("clock").innerText =
        new Date().toLocaleTimeString();
}
setInterval(clock, 1000);
clock();