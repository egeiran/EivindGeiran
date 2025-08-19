document.addEventListener('DOMContentLoaded', initCarousel);

function getInlineImages() {
    const el = document.getElementById('images-data');
    if (!el) throw new Error('Fant ikke <script id="images-data"> i HTML');
    try {
        return JSON.parse(el.textContent);
    } catch (e) {
        throw new Error('Kunne ikke parse JSON i #images-data');
    }
}

async function initCarousel() {
    const carousel = document.getElementById('carousel');
    const indicators = document.getElementById('indicators');
    const prevBtn = document.querySelector('.nav-btn.prev');
    const nextBtn = document.querySelector('.nav-btn.next');

    if (!carousel) return console.error('Mangler #carousel');

    // 1) Hent bildefiler fra inline JSON (funksjonelt på file://)
    let files = [];
    try {
        files = getInlineImages();
    } catch (e) {
        console.error(e);
        carousel.innerHTML = `<p style="opacity:.7">Kunne ikke laste bilder.</p>`;
        return;
    }

    if (!Array.isArray(files) || files.length === 0) {
        carousel.innerHTML = `<p style="opacity:.7">Ingen bilder funnet.</p>`;
        return;
    }

    // 2) Bygg bildene i DOM
    const html = files.map((p) => {
        const clean = String(p).replace(/^\/+/, ''); // fjern evt. ledende /
        return `<img src="${clean}" class="carousel-img" alt="" loading="lazy">`;
    }).join('');
    carousel.innerHTML = html;

    // 3) Hent noder etter at HTML er satt
    let originalImages = [...carousel.querySelectorAll('.carousel-img')];
    if (originalImages.length === 0) return;

    // 4) Indikatorer
    indicators.innerHTML = '';
    for (let i = 0; i < originalImages.length; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        indicators.appendChild(dot);
    }


    // 5) Klon for uendelig loop
    const firstClone = originalImages[0].cloneNode(true);
    carousel.appendChild(firstClone);

    // 6) Bredder
    let images = carousel.querySelectorAll('.carousel-img'); // inkl. klone
    carousel.style.width = `${images.length * 100}%`;
    images.forEach(img => { img.style.width = `${100 / images.length}%`; });

    // 7) Navigasjon og auto-scroll
    let index = 0;
    let autoScroll;
    let restartTimeout;

    function updateIndicators(i) {
        const dots = indicators.querySelectorAll('.dot');
        dots.forEach(d => d.classList.remove('active'));
        dots[i % originalImages.length].classList.add('active');
    }

    function showImage(i, animate = true) {
        carousel.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
        carousel.style.transform = `translateX(-${i * (100 / images.length)}%)`;
        updateIndicators(i);
    }

    function nextImage(auto = false) {
        index++;
        showImage(index);
        if (index === images.length - 1) {
            carousel.addEventListener('transitionend', () => {
                carousel.style.transition = 'none';
                index = 0;
                showImage(index, false);
            }, { once: true });
        }
        if (!auto) restartPauseTimer();
    }

    function prevImage() {
        if (index === 0) {
            carousel.style.transition = 'none';
            index = images.length - 1;
            showImage(index, false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    index = images.length - 2;
                    showImage(index, true);
                });
            });
        } else {
            index--;
            showImage(index);
        }
        restartPauseTimer();
    }

    function startAutoScroll() {
        stopAutoScroll();
        autoScroll = setInterval(() => nextImage(true), 3000);
    }
    function stopAutoScroll() {
        if (autoScroll) clearInterval(autoScroll);
    }
    function restartPauseTimer() {
        stopAutoScroll();
        clearTimeout(restartTimeout);
        restartTimeout = setTimeout(startAutoScroll, 10000);
    }
    function goTo(i) {
        index = i;
        showImage(index);
        restartPauseTimer();
    }

    // Knapper + hover-pause
    if (prevBtn) {
        prevBtn.addEventListener('click', () => prevImage());
    }
    if (nextBtn) nextBtn.addEventListener('click', () => nextImage());
    const container = document.querySelector('.carousel-container');
    if (container) {
        container.addEventListener('mouseenter', stopAutoScroll);
        container.addEventListener('mouseleave', startAutoScroll);
    }

    // 8) Start
    showImage(0, false);
    startAutoScroll();
}
