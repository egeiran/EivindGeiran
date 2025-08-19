function buildGrid() {
    const grid = document.querySelector('.background-grid');
    grid.innerHTML = "";
    const colCount = Math.floor(window.innerWidth / 94);
    const rowCount = Math.floor(window.innerHeight / 154);

    for (let row = 0; row < rowCount + 1; row++) {
        for (let col = 0; col < colCount; col++) {
            const cell = document.createElement('div');

            // Beregn en opacity mellom 0 og 0.12, mest synlig oppe til høyre
            const fadeFactor = (col) / (colCount - 1) * ((rowCount - row) / (rowCount - 1));
            const opacity = 0.12 * fadeFactor;

            cell.style.backgroundColor = `rgba(28, 62, 87, ${opacity})`;
            cell.classList.add('grid-cell');

            const delay = ((colCount - 1 - col) + row) * 20; // juster 20 for hastighet
            cell.style.opacity = 0;
            cell.style.transition = `opacity 0.3s ease ${delay}ms`;

            requestAnimationFrame(() => {
                cell.style.opacity = 1;
            });

            grid.appendChild(cell);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    buildGrid();
});

window.addEventListener("resize", () => {
    const grid = document.querySelector(".background-grid");
    grid.style.opacity = "0"; // midlertidig usynlig

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        buildGrid();
        grid.style.opacity = "1";
    }, 150); // debounce-tid
});

