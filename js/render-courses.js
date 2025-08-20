document.addEventListener("DOMContentLoaded", () => {
  const filtersEl = document.getElementById("course-filters");
  const gridEl = document.getElementById("course-grid");
  const data = Array.isArray(window.COURSES) ? window.COURSES : [];

  // Bygg filterknapper per semester (Høst 2024, Vår 2025, ...)
  const keys = data.map(s => `${s.term} ${s.year}`);
  let active = keys[0] || null;

  function renderFilters() {
    filtersEl.innerHTML = keys.map(k =>
      `<button class="chip ${k === active ? 'active' : ''}" data-k="${k}">${k}</button>`
    ).join("");
    filtersEl.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => { active = btn.dataset.k; renderAll(); });
    });
  }

  function renderGrid() {
    const sem = data.find(s => `${s.term} ${s.year}` === active);
    if (!sem) { gridEl.innerHTML = "<p>Ingen emner.</p>"; return; }

    gridEl.innerHTML = sem.courses.map(c => `
      <article class="course-card">
        <header>
          <span class="code">${c.code}</span>
          <span class="sp">${c.credits.toString()} sp</span>
        </header>
        <h3>${c.title}</h3>
        ${c.type ? `<p class="type">${c.type}</p>` : ""}
      </article>
    `).join("");
  }

  function renderAll() { renderFilters(); renderGrid(); }
  renderAll();
});
