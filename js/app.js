const GALLERY_ITEMS = [
  {
    src: "img/karusell/Sigrid.jpg",
    title: "Studentliv",
    width: 1008,
    height: 1426
  },
  {
    src: "img/karusell/VentureCup.jpg",
    title: "Venture Cup",
    width: 2000,
    height: 1126
  },
  {
    src: "img/karusell/Oscmas.jpg",
    title: "Miljø",
    width: 2048,
    height: 1536
  },
  {
    src: "img/karusell/Newbies.jpg",
    title: "Faddertid",
    width: 1050,
    height: 700
  },
  {
    src: "img/karusell/Lookout.jpg",
    title: "På tur",
    width: 810,
    height: 1080
  },
  {
    src: "img/karusell/Kragaluf.jpg",
    title: "Krågaluf",
    width: 1536,
    height: 2048
  }
];

const TYPE_META = {
  Alle: { emoji: "✦", tone: "highlight" },
  Betalt: { emoji: "💼", tone: "blue" },
  Frivillig: { emoji: "❤", tone: "warm" },
  Utdanning: { emoji: "🎓", tone: "highlight" }
};

const PROJECT_ITEMS = [
  {
    name: "NHL-ML-Prediction-Model",
    url: "https://github.com/egeiran/NHL-ML-Prediction-Model",
    description: "ML-prosjekt med FastAPI-backend og Next.js-frontend for NHL-prediksjoner.",
    stack: ["Python", "FastAPI", "Next.js", "ML"]
  },
  {
    name: "TowerDefense",
    url: "https://github.com/egeiran/TowerDefense",
    description: "Et spillprosjekt med fokus på logikk og struktur.",
    stack: ["Spill", "Programmering", "Logikk"]
  },
  {
    name: "Sorting-Visualizer",
    url: "https://github.com/egeiran/Sorting-Visualizer",
    description: "Et lite prosjekt for å visualisere og sammenligne sorteringsalgoritmer.",
    stack: ["TypeScript", "Frontend", "Algoritmer"]
  }
];

document.addEventListener("DOMContentLoaded", async () => {
  const courses = Array.isArray(window.COURSES) ? window.COURSES : [];
  const experiences = await loadExperiences();

  renderHeroMetrics(experiences, courses);
  renderCurrentFocus(experiences);
  renderTicker(experiences);
  renderInsights(experiences);
  renderExperienceSection(experiences);
  renderGallery();
  renderProjects();
  renderCourses(courses);
  initRevealAnimations();
});

async function loadExperiences() {
  try {
    const response = await fetch("experiences.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Kunne ikke laste experiences.json (${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.sort(sortExperiences) : [];
  } catch (error) {
    console.error(error);
    renderExperienceFallback();
    return [];
  }
}

function renderExperienceFallback() {
  const grid = document.getElementById("experience-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = `
    <article class="experience-card" data-reveal>
      <div class="experience-body">
        <div class="experience-topline">
          <span class="pill" data-tone="warm">Innhold utilgjengelig</span>
        </div>
        <h3 class="experience-title">Erfaringene kunne ikke lastes.</h3>
        <p class="experience-description">Siden fungerer på GitHub Pages, men dersom du åpner HTML-filen direkte lokalt må data lastes via en enkel lokal server.</p>
      </div>
    </article>
  `;
}

function renderHeroMetrics(experiences, courses) {
  const target = document.getElementById("hero-metrics");
  if (!target) {
    return;
  }

  const totalCredits = courses
    .flatMap((semester) => semester.courses || [])
    .reduce((sum, course) => sum + Number(course.credits || 0), 0);

  const metrics = [
    {
      value: countCurrentRoles(experiences),
      label: "pågående roller"
    },
    {
      value: experiences.length,
      label: "erfaringer samlet"
    },
    {
      value: formatNumber(totalCredits),
      label: "studiepoeng så langt"
    }
  ];

  target.innerHTML = metrics
    .map(
      (metric) => `
        <div class="metric-card">
          <span class="metric-value">${escapeHtml(String(metric.value))}</span>
          <span class="metric-label">${escapeHtml(metric.label)}</span>
        </div>
      `
    )
    .join("");
}

function renderCurrentFocus(experiences) {
  const target = document.getElementById("current-focus");
  if (!target) {
    return;
  }

  const current = experiences
    .filter((item) => isCurrentExperience(item))
    .slice(0, 4);

  target.innerHTML = current
    .map((item) => {
      const meta = TYPE_META[item.type] || TYPE_META.Alle;
      return `
        <article class="focus-item">
          <div class="focus-meta">
            <span class="pill" data-tone="${meta.tone}">${meta.emoji} ${escapeHtml(item.type)}</span>
            <span>${escapeHtml(formatPeriod(item.start, item.end))}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.organization)}</p>
        </article>
      `;
    })
    .join("");
}

function renderTicker(experiences) {
  const track = document.getElementById("ticker-track");
  if (!track || experiences.length === 0) {
    return;
  }

  const items = experiences.map((item) => {
    const meta = TYPE_META[item.type] || TYPE_META.Alle;
    return `
      <span class="ticker-item">
        <span>${meta.emoji}</span>
        <span>${escapeHtml(item.title)}</span>
        <em>${escapeHtml(item.organization)}</em>
      </span>
    `;
  });

  track.innerHTML = [...items, ...items].join("");
}

function renderInsights(experiences) {
  const currentPaid = experiences.filter((item) => item.type === "Betalt" && isCurrentExperience(item)).length;
  const currentVolunteer = experiences.filter((item) => item.type === "Frivillig" && isCurrentExperience(item)).length;

  const cards = document.querySelectorAll(".insight-card:not(.insight-card-large)");
  if (cards.length < 2) {
    return;
  }

  cards[0].innerHTML = `
    <p class="section-label">Jobb Og Verv</p>
    <h3>${escapeHtml(String(currentPaid))} jobber og ${escapeHtml(String(currentVolunteer))} verv akkurat nå.</h3>
    <p>Det er mye å holde på med, men det passer meg bra.</p>
  `;

  cards[1].innerHTML = `
    <p class="section-label">Retning</p>
    <h3>Jeg vil bli god på å bygge ting som faktisk brukes.</h3>
    <p>Både teknisk, og sammen med andre.</p>
  `;
}

function renderExperienceSection(experiences) {
  renderExperienceFilters(experiences);
  renderExperienceCards(experiences);
}

function renderExperienceFilters(experiences) {
  const target = document.getElementById("experience-filters");
  if (!target) {
    return;
  }

  const counts = experiences.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      acc.Alle += 1;
      return acc;
    },
    { Alle: 0 }
  );

  const order = ["Alle", "Betalt", "Frivillig", "Utdanning"];
  let activeFilter = "Alle";

  const update = () => {
    target.querySelectorAll(".filter-chip").forEach((button) => {
      const isActive = button.dataset.filter === activeFilter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll(".experience-card[data-type]").forEach((card) => {
      const shouldShow = activeFilter === "Alle" || card.dataset.type === activeFilter;
      card.classList.toggle("hidden", !shouldShow);
    });
  };

  target.innerHTML = order
    .filter((key) => counts[key] > 0)
    .map((key) => {
      const meta = TYPE_META[key] || TYPE_META.Alle;
      return `
        <button class="filter-chip${key === activeFilter ? " active" : ""}" type="button" data-filter="${escapeHtml(key)}" aria-pressed="${String(key === activeFilter)}">
          ${meta.emoji} ${escapeHtml(key)} <span>(${counts[key]})</span>
        </button>
      `;
    })
    .join("");

  target.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "Alle";
      update();
    });
  });

  update();
}

function renderExperienceCards(experiences) {
  const target = document.getElementById("experience-grid");
  if (!target || experiences.length === 0) {
    return;
  }

  target.innerHTML = experiences
    .map((item) => {
      const meta = TYPE_META[item.type] || TYPE_META.Alle;
      const tags = Array.isArray(item.tags) ? item.tags : [];

      return `
        <article class="experience-card" data-type="${escapeHtml(item.type)}" data-reveal>
          <div class="experience-logo">
            <img src="${escapeHtml(item.imagePath)}" alt="${escapeHtml(item.organization)}" loading="lazy">
          </div>
          <div class="experience-body">
            <div class="experience-topline">
              <span class="pill" data-tone="${meta.tone}">${meta.emoji} ${escapeHtml(item.type)}</span>
            </div>
            <h3 class="experience-title">${escapeHtml(item.title)}</h3>
            <p class="experience-org">${escapeHtml(item.organization)}</p>
            <p class="experience-period">${escapeHtml(formatPeriod(item.start, item.end))}</p>
            <p class="experience-description">${escapeHtml(item.description)}</p>
            <div class="tag-row">
              ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderGallery() {
  const target = document.getElementById("gallery-grid");
  if (!target) {
    return;
  }

  target.innerHTML = GALLERY_ITEMS
    .map((item) => {
      return `
        <figure class="gallery-item" data-reveal>
          <img
            src="${escapeHtml(item.src)}"
            alt="${escapeHtml(item.title)}"
            width="${escapeHtml(String(item.width))}"
            height="${escapeHtml(String(item.height))}"
            loading="lazy"
          >
        </figure>
      `;
    })
    .join("");
}

function renderProjects() {
  const target = document.getElementById("project-grid");
  if (!target) {
    return;
  }

  target.innerHTML = PROJECT_ITEMS
    .map(
      (item) => `
        <article class="project-card" data-reveal>
          <div class="project-topline">
            <span class="pill" data-tone="blue">Repo</span>
            <a class="project-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Åpne på GitHub</a>
          </div>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <div class="tag-row">
            ${item.stack.map((entry) => `<span class="tag">${escapeHtml(entry)}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderCourses(courses) {
  renderCourseSummary(courses);
  renderCourseFiltersAndGrid(courses);
}

function renderCourseSummary(courses) {
  const target = document.getElementById("course-summary");
  if (!target) {
    return;
  }

  const allCourses = courses.flatMap((semester) => semester.courses || []);
  const summary = [
    { value: courses.length, label: "semestre registrert" },
    { value: formatNumber(allCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0)), label: "studiepoeng" },
    { value: allCourses.length, label: "emner gjennomført eller planlagt" }
  ];

  target.innerHTML = summary
    .map(
      (item) => `
        <article class="course-summary-card">
          <strong>${escapeHtml(String(item.value))}</strong>
          <span>${escapeHtml(item.label)}</span>
        </article>
      `
    )
    .join("");
}

function renderCourseFiltersAndGrid(courses) {
  const filtersTarget = document.getElementById("course-filters");
  const gridTarget = document.getElementById("course-grid");

  if (!filtersTarget || !gridTarget || courses.length === 0) {
    return;
  }

  let active = `${courses[0].term} ${courses[0].year}`;

  const render = () => {
    filtersTarget.innerHTML = courses
      .map((semester) => {
        const key = `${semester.term} ${semester.year}`;
        const isActive = key === active;
        return `
          <button class="filter-chip${isActive ? " active" : ""}" type="button" data-key="${escapeHtml(key)}" aria-pressed="${String(isActive)}">
            ${escapeHtml(key)}
          </button>
        `;
      })
      .join("");

    filtersTarget.querySelectorAll(".filter-chip").forEach((button) => {
      button.addEventListener("click", () => {
        active = button.dataset.key || active;
        render();
      });
    });

    const semester = courses.find((item) => `${item.term} ${item.year}` === active);
    if (!semester) {
      gridTarget.innerHTML = "";
      return;
    }

    gridTarget.innerHTML = semester.courses
      .map(
        (course) => `
          <article class="course-card" data-reveal>
            <div class="course-card-header">
              <span class="course-code">${escapeHtml(course.code)}</span>
              <span class="course-credits">${escapeHtml(formatNumber(Number(course.credits || 0)))} sp</span>
            </div>
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.type || "Emne")}</p>
          </article>
        `
      )
      .join("");

    initRevealAnimations();
  };

  render();
}

function initRevealAnimations() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (elements.length === 0) {
    return;
  }

  assignRevealDelays(elements);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.22, rootMargin: "0px 0px -12% 0px" }
  );

  elements.forEach((element) => {
    if (!element.classList.contains("is-visible")) {
      observer.observe(element);
    }
  });
}

function assignRevealDelays(elements) {
  elements.forEach((element, index) => {
    if (element.classList.contains("is-visible")) {
      return;
    }

    const delay = Math.min(index % 6, 5) * 70;
    element.style.setProperty("--reveal-delay", `${delay}ms`);
  });
}

function countCurrentRoles(experiences) {
  return experiences.filter((item) => isCurrentExperience(item)).length;
}

function sortExperiences(a, b) {
  const aScore = getFreshnessScore(a);
  const bScore = getFreshnessScore(b);
  return bScore - aScore;
}

function getFreshnessScore(item) {
  const endScore = isCurrentExperience(item) ? 10000 : Number(item.end) || 0;
  const startScore = Number(item.start) || 0;
  return endScore * 10 + startScore;
}

function isCurrentExperience(item) {
  if (!item || !item.end) {
    return false;
  }

  if (item.end === "Nå") {
    return true;
  }

  const currentYear = new Date().getFullYear();
  const endYear = Number(item.end);
  return Number.isFinite(endYear) && endYear >= currentYear;
}

function formatPeriod(start, end) {
  return `${start}–${end}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("nb-NO").format(value);
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
