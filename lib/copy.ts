import type { Lang, Semester } from "./types";

export const TYPE_COLOR = {
  Betalt: "#d9ff63",
  Frivillig: "#ff8f5a",
  Utdanning: "#2a7fff",
} as const;

export interface ProjectCopy {
  name: string;
  tag: string;
  url: string;
  webUrl: string;
  link: string;
  openLabel: string;
  description: string;
  stack: string[];
}

export interface CtaCopy {
  label: string;
  title: string;
  note: string;
}

export interface Copy {
  eyebrow: string;
  navNow: string;
  navWork: string;
  navExp: string;
  navStudy: string;
  navLife: string;
  navContact: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
  heroHeading: string;
  heroCta: string;
  nowTitle: string;
  workTitle: string;
  workLede: string;
  featured: string;
  openLive: string;
  placeholder: string;
  kfDesc: string;
  expTitle: string;
  timelineHint: string;
  viewGantt: string;
  viewList: string;
  viewHeat: string;
  linesWord: string;
  commitsWord: string;
  roleCol: string;
  rolesWord: string;
  heatHint: string;
  pickHint: string;
  heatLede: string;
  blameHint: string;
  concurrent: string;
  ganttHint: string;
  rollMeta: string;
  framesWord: string;
  studyTitle: string;
  studyMeta: string;
  lifeTitle: string;
  lifeLede: string;
  cta: CtaCopy;
  footerNote: string;
  footerSitesLabel: string;
  factRoles: string;
  factTotal: string;
  factCredits: string;
  factLive: string;
  now: { tag: string; title: string; detail: string; since: string }[];
  nowNet: string[];
  nowCaps: { net: string; corp: string; cube: string };
  roles: string[];
  projects: ProjectCopy[];
  kfStack: string[];
  filters: Record<string, string>;
  nowWord: string;
}

export const COPY: Record<Lang, Copy> = {
  no: {
    eyebrow: "Datateknologi · NTNU · Trondheim",
    navNow: "Nå",
    navWork: "Prosjekter",
    navExp: "Erfaring",
    navStudy: "Studiet",
    navLife: "Bilder",
    navContact: "Ta kontakt",
    menuOpenLabel: "Åpne meny",
    menuCloseLabel: "Lukk meny",
    heroHeading: "Eivind Geiran — datateknologistudent ved NTNU i Trondheim",
    heroCta: "Se hva jeg har bygd",
    nowTitle: "Nå.",
    workTitle: "Prosjekter.",
    workLede: "Ting jeg har bygd fordi jeg hadde lyst, og som andre faktisk bruker.",
    featured: "Størst",
    openLive: "Åpne appen",
    placeholder: "Skjermbilde kommer",
    kfDesc:
      "Webapp for å lære fag ved NTNU raskere. Flervalgsoppgaver, AI-genererte forklaringer og en chat som svarer på oppfølgingsspørsmål. Den største tingen jeg har bygd.",
    expTitle: "Erfaring.",
    timelineHint: "Rull for å følge tidslinjen",
    viewGantt: "tidslinje",
    viewList: "liste",
    viewHeat: "aktivitet",
    linesWord: "linjer",
    commitsWord: "commits",
    roleCol: "Rolle",
    rolesWord: "roller aktive",
    heatHint: "Hold over en måned",
    pickHint: "klikk en rolle for detaljer",
    heatLede:
      "Hver rute er én måned. Fargen viser hva som dominerte, tallet hvor mange roller som løp samtidig.",
    blameHint: "Hold over en linje for å se commiten",
    concurrent: "roller samtidig",
    ganttHint: "Rull for å spole gjennom årene",
    rollMeta: "Rull 01 · Trondheim · 2024–2026",
    framesWord: "bilder",
    studyTitle: "Studiet.",
    studyMeta: "16 emner · 120 studiepoeng · 4 semestre",
    lifeTitle: "Filmrull.",
    lifeLede: "Fadderuke, Venture Cup, turer — det som skjer utenfor forelesningssalen.",
    cta: {
      label: "Kontakt",
      title: "Ta gjerne kontakt",
      note: "Trondheim & Oslo",
    },
    footerNote: "Bygget i Trondheim",
    footerSitesLabel: "Mine sider og profiler",
    factRoles: "pågående roller",
    factTotal: "erfaringer så langt",
    factCredits: "studiepoeng",
    factLive: "prosjekter i drift",
    now: [
      {
        tag: "STUDIUM",
        title: "Datateknologi, NTNU",
        detail: "Master i Trondheim. Fordypning mot maskinlæring og systemutvikling.",
        since: "siden aug 2024",
      },
      {
        tag: "JOBB VED SIDEN AV",
        title: "Computas og Junior Consulting",
        detail: "20 % utvikler i Computas. Prosjektbasert tech-konsulent i Junior Consulting.",
        since: "siden aug 2025",
      },
      {
        tag: "EGNE PROSJEKTER",
        title: "Kort Forklart, NHL-modellen, AI-assistent",
        detail: "Kort Forklart er i drift. NHL-modellen og AI-assistenten er under arbeid.",
        since: "løpende",
      },
    ],
    nowNet: ["INPUT", "SKJULT", "SKJULT", "UT"],
    nowCaps: {
      net: "Maskinlæring, lag for lag",
      corp: "Utvikling, ved siden av studiene",
      cube: "Problemløsing, på fritida",
    },
    roles: [
      "Tech-konsulent, Junior Consulting",
      "Utvikler, Computas",
      "Mentor, ENT3R Trondheim",
      "Bygger av Kort Forklart",
    ],
    projects: [
      {
        name: "NHL ML Prediction Model",
        tag: "ML",
        url: "https://github.com/egeiran/NHL-ML-Prediction-Model",
        webUrl: "https://nhl-ml.eivindgeiran.no/",
        link: "GitHub",
        openLabel: "Åpne prosjektet",
        description:
          "Predikerer sannsynligheten for hvert utfall i NHL-kamper, sjekker Norsk Tipping sitt Oddsen-API og foreslår value bets. Et fiktivt fond simulerer avkastningen over tid.",
        stack: ["Python", "scikit-learn", "Pandas", "API"],
      },
      {
        name: "Tilbudsscraper",
        tag: "WIP",
        url: "https://github.com/egeiran",
        webUrl: "https://tilbud.eivindgeiran.no/",
        link: "GitHub",
        openLabel: "Åpne prosjektet",
        description:
          "Web scraper som samler dagligvaretilbud på tvers av kjedene, så handlelisten kan planlegges etter hva som faktisk er billig denne uka.",
        stack: ["Python", "Scraping", "Data"],
      },
      {
        name: "TowerDefense",
        tag: "SPILL",
        url: "https://github.com/egeiran/TowerDefense",
        webUrl: "https://towerdefense.eivindgeiran.no/",
        link: "GitHub",
        openLabel: "Åpne prosjektet",
        description: "Et spillprosjekt med fokus på logikk, struktur og tilstandshåndtering. Laget allerede på videregående!",
        stack: ["Spill", "Logikk", "OOP"],
      },
    ],
    kfStack: ["Next.js", "React", "TypeScript", "Supabase", "OpenAI API", "Vercel"],
    filters: { Alle: "Alle", Betalt: "Betalt", Frivillig: "Frivillig", Utdanning: "Utdanning" },
    nowWord: "Nå",
  },
  en: {
    eyebrow: "Computer Science · NTNU · Trondheim",
    navNow: "Now",
    navWork: "Work",
    navExp: "Experience",
    navStudy: "Studies",
    navLife: "Photos",
    navContact: "Get in touch",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    heroHeading: "Eivind Geiran — computer science student at NTNU in Trondheim",
    heroCta: "See what I've built",
    nowTitle: "Now.",
    workTitle: "Work.",
    workLede: "Things I built because I wanted to — and that people actually use.",
    featured: "Biggest",
    openLive: "Open the app",
    placeholder: "Screenshot pending",
    kfDesc:
      "A web app for learning NTNU courses faster. Multiple-choice drills, AI-generated explanations and a chat that answers follow-ups. The biggest thing I've built.",
    expTitle: "Experience.",
    timelineHint: "Scroll to follow the timeline",
    viewGantt: "timeline",
    viewList: "list",
    viewHeat: "activity",
    linesWord: "lines",
    commitsWord: "commits",
    roleCol: "Role",
    rolesWord: "roles active",
    heatHint: "Hover a month",
    pickHint: "click a role for details",
    heatLede:
      "Each square is one month. Colour shows what dominated, the number how many roles ran at once.",
    blameHint: "Hover a line to see the commit",
    concurrent: "roles at once",
    ganttHint: "Scroll to sweep through the years",
    rollMeta: "Roll 01 · Trondheim · 2024–2026",
    framesWord: "frames",
    studyTitle: "Studies.",
    studyMeta: "16 courses · 120 ECTS · 4 semesters",
    lifeTitle: "Film roll.",
    lifeLede: "Orientation week, Venture Cup, trips — what happens outside the lecture hall.",
    cta: {
      label: "Contact",
      title: "Feel free to reach out",
      note: "Trondheim & Oslo",
    },
    footerNote: "Built in Trondheim",
    footerSitesLabel: "My sites and profiles",
    factRoles: "active roles",
    factTotal: "roles to date",
    factCredits: "ECTS credits",
    factLive: "shipped & live",
    now: [
      {
        tag: "STUDIES",
        title: "Computer Science, NTNU",
        detail: "MSc in Trondheim, majoring in machine learning and systems development.",
        since: "since Aug 2024",
      },
      {
        tag: "ALONGSIDE STUDIES",
        title: "Computas and Junior Consulting",
        detail: "20% developer at Computas. Project-based tech consultant at Junior Consulting.",
        since: "since Aug 2025",
      },
      {
        tag: "OWN PROJECTS",
        title: "Kort Forklart, NHL model, AI assistant",
        detail: "Kort Forklart is live. The NHL model and AI assistant are in progress.",
        since: "ongoing",
      },
    ],
    nowNet: ["INPUT", "HIDDEN", "HIDDEN", "OUT"],
    nowCaps: {
      net: "Machine learning, layer by layer",
      corp: "Building, alongside my studies",
      cube: "Problem solving, off the clock",
    },
    roles: [
      "Tech consultant, Junior Consulting",
      "Developer, Computas",
      "Mentor, ENT3R Trondheim",
      "Building Kort Forklart",
    ],
    projects: [
      {
        name: "NHL ML Prediction Model",
        tag: "ML",
        url: "https://github.com/egeiran/NHL-ML-Prediction-Model",
        webUrl: "https://nhl-ml.eivindgeiran.no/",
        link: "GitHub",
        openLabel: "Open project",
        description:
          "Predicts the probability of each NHL match outcome, checks Norsk Tipping's Oddsen API and surfaces value bets. A fictional fund simulates returns over time.",
        stack: ["Python", "scikit-learn", "Pandas", "API"],
      },
      {
        name: "Grocery offer scraper",
        tag: "WIP",
        url: "https://github.com/egeiran",
        webUrl: "https://tilbud.eivindgeiran.no/",
        link: "GitHub",
        openLabel: "Open project",
        description:
          "A scraper that collects grocery offers across the Norwegian chains, so a shopping list can be planned around what's actually cheap this week.",
        stack: ["Python", "Scraping", "Data"],
      },
      {
        name: "TowerDefense",
        tag: "GAME",
        url: "https://github.com/egeiran/TowerDefense",
        webUrl: "https://towerdefense.eivindgeiran.no/",
        link: "GitHub",
        openLabel: "Open project",
        description: "A game project focused on logic, structure and state handling.",
        stack: ["Game", "Logic", "OOP"],
      },
    ],
    kfStack: ["Next.js", "React", "TypeScript", "Supabase", "OpenAI API", "Vercel"],
    filters: { Alle: "All", Betalt: "Paid", Frivillig: "Volunteer", Utdanning: "Education" },
    nowWord: "Now",
  },
};

export const COURSES: Semester[] = [
  {
    term: "Vår",
    year: 2026,
    courses: [
      { code: "TDT4140", title: "Programvareutvikling" },
      { code: "TDT4145", title: "Datamodellering og databaser" },
      { code: "TDT4186", title: "Operativsystemer" },
      { code: "TTM4100", title: "Kommunikasjon" },
    ],
  },
  {
    term: "Høst",
    year: 2025,
    courses: [
      { code: "IT1901", title: "Informatikk prosjektarbeid I" },
      { code: "TDT4120", title: "Algoritmer og datastrukturer" },
      { code: "TDT4160", title: "Datamaskiner" },
      { code: "TMA4240", title: "Statistikk" },
    ],
  },
  {
    term: "Vår",
    year: 2025,
    courses: [
      { code: "TDT4100", title: "Objektorientert programmering" },
      { code: "TMA4115", title: "Matematikk 3" },
      { code: "TTT4203", title: "Analog og digital elektronikk" },
      { code: "TDT4180", title: "Menneske-maskin-interaksjon" },
    ],
  },
  {
    term: "Høst",
    year: 2024,
    courses: [
      { code: "TDT4109", title: "Informasjonsteknologi, grunnkurs" },
      { code: "TMA4100", title: "Matematikk 1" },
      { code: "EXPH0300", title: "Exphil" },
      { code: "TMA4140", title: "Diskret matematikk" },
    ],
  },
];

export interface GalleryItem {
  src: string;
  title: string;
  frame: string;
  file: string;
  objectPosition?: string;
}

export const GALLERY: GalleryItem[] = [
  { src: "/img/karusell/VentureCup.jpg", title: "Venture Cup", frame: "01", file: "IMG_2417.JPG" },
  { src: "/img/karusell/Newbies.jpg", title: "Arrkom!", frame: "02", file: "IMG_2653.JPG" },
  {
    src: "/img/karusell/Sigrid.jpg",
    title: "<3>",
    frame: "03",
    file: "IMG_3108.JPG",
    objectPosition: "50% 20%",
  },
  { src: "/img/karusell/Oscmas.jpg", title: "Gura", frame: "04", file: "IMG_3392.JPG" },
  { src: "/img/karusell/Lookout.jpg", title: "Amsterdam", frame: "05", file: "IMG_3744.JPG" },
  { src: "/img/karusell/Kragaluf.jpg", title: "Kragerø", frame: "06", file: "IMG_4021.JPG" },
  { src: "/img/karusell/SG.webp", title: "Slipsgutta", frame: "07", file: "IMG_4053.JPG" },
  { src: "/img/karusell/Falken.JPG", title: "Budapest", frame: "08", file: "IMG_4087.JPG" },
  { src: "/img/karusell/GJ.jpg", title: "Gründerjakten", frame: "09", file: "IMG_4134.JPG" },
  { src: "/img/karusell/Toralf.JPG", title: "Cruise", frame: "10", file: "IMG_4496.JPG" },
];

export const LINKS = {
  github: "https://github.com/egeiran",
  linkedin: "https://www.linkedin.com/in/eivind-systad-geiran-640231238/",
  email: "eivind.geiran@gmail.com",
  kortForklart: "https://kort-forklart.no/",
} as const;
