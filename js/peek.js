// js/peek.js
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hero-peek');
    const track = document.getElementById('peek-track');
    const cards = [...document.querySelectorAll('#experience-container .experience-card')];
    if (!container || !track || cards.length === 0) return;

    // Plukk ut data fra kortene
    const items = cards.filter(c => {
        const type = c.dataset.type || ''
        return type !== 'Utdanning'
    }).map((card, idx) => {
        const title = card.querySelector('h3')?.textContent.trim() || '';
        const org = card.querySelector('h4')?.textContent.trim() || '';
        const type = card.dataset.type || ''; // "Betalt" | "Frivillig" | "Utdanning"
        const period = card.querySelector('.period')?.textContent.trim() || '';
        // grov "score" for å finne de ferskeste: 'Nå' først, ellers høyeste årstall
        const years = [...period.matchAll(/\d{4}/g)].map(m => parseInt(m[0], 10));
        const freshest = period.includes('Nå') ? 9999 : (years.length ? Math.max(...years) : 0);
        return { idx, title, org, type, period, freshest };
    });

    // Sorter etter "ferskest" og ta de 6 siste (eller færre)
    const pick = items.sort((a, b) => b.freshest - a.freshest).slice(0, Math.min(6, items.length));

    // Emoji pr type
    const icon = t => t === 'Betalt' ? '💼' : (t === 'Frivillig' ? '❤️' : (t === 'Utdanning' ? '🎓' : '📌'));

    // Bygg piller
    const pills = pick.map(it => {
        const el = document.createElement('button');
        el.className = 'peek-pill';
        el.setAttribute('type', 'button');
        el.innerHTML = `
      <span class="tag">${icon(it.type)} ${it.type || 'Erfaring'}</span>
      <strong>${it.title}</strong>
      <span>· ${it.org}</span>
    `;
        el.addEventListener('click', () => {
            const target = cards[it.idx];
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.remove('flash');
            // force reflow for replay
            void target.offsetWidth;
            target.classList.add('flash');
        });
        return el;
    });

    // For sømløs marquee: legg innholdet to ganger (50% + 50%)
    for (const p of pills) track.appendChild(p.cloneNode(true));
    for (const p of pills) track.appendChild(p);

    container.hidden = false;
});
