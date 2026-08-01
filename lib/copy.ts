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
  link: string;
  shot: string;
  description: string;
  stack: string[];
}

export interface CtaCopy {
  label: string;
  title: string;
  sub: string;
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
  heroSub: string;
  heroCta: string;
  nowTitle: string;
  nowDate: string;
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
  factRoles: string;
  factTotal: string;
  factCredits: string;
  factLive: string;
  now: { tag: string; title: string; detail: string; since: string }[];
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
    heroSub: "Datateknologi ved NTNU. Fem pågående roller, tre ting i produksjon, én ledig sommer.",
    heroCta: "Se hva jeg har bygd",
    nowTitle: "Nå.",
    nowDate: "Juli 2026",
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
      title: "Alltid gøy å snakke med folk som bygger ting.",
      sub: "Ta gjerne kontakt — LinkedIn er raskest, ellers når du meg på e-post eller GitHub.",
      note: "Trondheim",
    },
    footerNote: "Bygget i Trondheim",
    factRoles: "pågående roller",
    factTotal: "erfaringer så langt",
    factCredits: "studiepoeng",
    factLive: "prosjekter i drift",
    now: [
      {
        tag: "STUDIUM",
        title: "Datateknologi, NTNU",
        detail: "Master i datateknologi i Trondheim. Fordypning mot maskinlæring og systemutvikling.",
        since: "siden aug 2024",
      },
      {
        tag: "DELTID",
        title: "Utvikler i Computas",
        detail: "Jobber som utvikler ved siden av studiene.",
        since: "siden feb 2026",
      },
      {
        tag: "DELTID",
        title: "Tech-konsulent i Junior Consulting",
        detail: "Leverer IT- og teknologiprosjekter for eksterne kunder, sammen med andre studenter.",
        since: "siden aug 2025",
      },
      {
        tag: "EGNE PROSJEKTER",
        title: "Kort Forklart, NHL-modellen, AI-assistent",
        detail: "Kort Forklart er i drift og brukes av studenter. De to andre er under arbeid.",
        since: "løpende",
      },
    ],
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
        link: "GitHub",
        shot: "value bets + fond",
        description:
          "Predikerer sannsynligheten for hvert utfall i NHL-kamper, sjekker Norsk Tipping sitt Oddsen-API og foreslår value bets. Et fiktivt fond simulerer avkastningen over tid.",
        stack: ["Python", "scikit-learn", "Pandas", "API"],
      },
      {
        name: "Tilbudsscraper",
        tag: "WIP",
        url: "https://github.com/egeiran",
        link: "GitHub",
        shot: "skjermbilde kommer",
        description:
          "Web scraper som samler dagligvaretilbud på tvers av kjedene, så handlelisten kan planlegges etter hva som faktisk er billig denne uka.",
        stack: ["Python", "Scraping", "Data"],
      },
      {
        name: "Sorting Visualizer",
        tag: "VERKTØY",
        url: "https://github.com/egeiran/Sorting-Visualizer",
        link: "GitHub",
        shot: "skjermbilde kommer",
        description:
          "Visualiserer og sammenligner sorteringsalgoritmer side om side. Bygget for å forstå TDT4120 bedre.",
        stack: ["TypeScript", "Frontend", "Algoritmer"],
      },
      {
        name: "TowerDefense",
        tag: "SPILL",
        url: "https://github.com/egeiran/TowerDefense",
        link: "GitHub",
        shot: "skjermbilde kommer",
        description: "Et spillprosjekt med fokus på logikk, struktur og tilstandshåndtering.",
        stack: ["Spill", "Logikk", "OOP"],
      },
      {
        name: "Denne siden",
        tag: "LIVE",
        url: "https://github.com/egeiran/EivindGeiran",
        link: "GitHub",
        shot: "skjermbilde kommer",
        description:
          "Personlig nettside og mini-CV. Redesignet fra bunnen av med Next.js, hostet på Vercel.",
        stack: ["Next.js", "TypeScript", "Vercel"],
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
    heroSub: "Computer science at NTNU. Five active roles, three things in production, one free summer.",
    heroCta: "See what I've built",
    nowTitle: "Now.",
    nowDate: "July 2026",
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
      title: "Always happy to talk to people who build things.",
      sub: "Feel free to reach out — LinkedIn is fastest, or find me by email or on GitHub.",
      note: "Trondheim",
    },
    footerNote: "Built in Trondheim",
    factRoles: "active roles",
    factTotal: "roles to date",
    factCredits: "ECTS credits",
    factLive: "shipped & live",
    now: [
      {
        tag: "STUDIES",
        title: "Computer Science, NTNU",
        detail: "MSc in computer science in Trondheim, majoring in machine learning and systems development.",
        since: "since Aug 2024",
      },
      {
        tag: "PART-TIME",
        title: "Developer at Computas",
        detail: "Working as a developer alongside my studies.",
        since: "since Feb 2026",
      },
      {
        tag: "PART-TIME",
        title: "Tech consultant at Junior Consulting",
        detail: "Delivering IT and technology projects for external clients, together with other students.",
        since: "since Aug 2025",
      },
      {
        tag: "OWN PROJECTS",
        title: "Kort Forklart, NHL model, AI assistant",
        detail: "Kort Forklart is live and used by students. The other two are work in progress.",
        since: "ongoing",
      },
    ],
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
        link: "GitHub",
        shot: "value bets + fund",
        description:
          "Predicts the probability of each NHL match outcome, checks Norsk Tipping's Oddsen API and surfaces value bets. A fictional fund simulates returns over time.",
        stack: ["Python", "scikit-learn", "Pandas", "API"],
      },
      {
        name: "Grocery offer scraper",
        tag: "WIP",
        url: "https://github.com/egeiran",
        link: "GitHub",
        shot: "screenshot pending",
        description:
          "A scraper that collects grocery offers across the Norwegian chains, so a shopping list can be planned around what's actually cheap this week.",
        stack: ["Python", "Scraping", "Data"],
      },
      {
        name: "TowerDefense",
        tag: "GAME",
        url: "https://github.com/egeiran/TowerDefense",
        link: "GitHub",
        shot: "screenshot pending",
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
}

export const GALLERY: GalleryItem[] = [
  { src: "/img/karusell/VentureCup.jpg", title: "Venture Cup", frame: "01", file: "IMG_2417.JPG" },
  { src: "/img/karusell/Newbies.jpg", title: "Faddertid", frame: "02", file: "IMG_2653.JPG" },
  { src: "/img/karusell/Sigrid.jpg", title: "Studentliv", frame: "03", file: "IMG_3108.JPG" },
  { src: "/img/karusell/Oscmas.jpg", title: "Abakus", frame: "04", file: "IMG_3392.JPG" },
  { src: "/img/karusell/Lookout.jpg", title: "På tur", frame: "05", file: "IMG_3744.JPG" },
  { src: "/img/karusell/Kragaluf.jpg", title: "Krågaluf", frame: "06", file: "IMG_4021.JPG" },
];

export const LINKS = {
  github: "https://github.com/egeiran",
  linkedin: "https://www.linkedin.com/in/eivind-systad-geiran-640231238/",
  email: "eivind.geiran@gmail.com",
  kortForklart: "https://kort-forklart.no/",
} as const;
