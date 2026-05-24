function updateTimers() {
    document.querySelectorAll('.timer-container').forEach(container => {
        const startAttr = container.getAttribute('data-start');
        if (!startAttr) return;

        const startTime = new Date(startAttr);
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);

        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');

        const display = container.querySelector('.timer-display');
            display.innerText = `${mins}:${secs}`;

        if (diff > 600) {
            container.classList.add('timer-urgent');
        } else {
            container.classList.remove('timer-urgent');
            }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateTimers, 1000);
    updateTimers();

    setTimeout(() => {
            console.log("Recargando monitor de cocina caliente...");
            location.reload();
        }, 45000);
});