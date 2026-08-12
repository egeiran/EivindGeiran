// Den maskinlesbare flaten: alt innholdet i ett server-rendret dokument, uten
// tabs, uten scroll-avhengig rendering og uten klientside-state. En parser som
// henter denne URL-en har hele CV-en i første respons.

import { COPY } from "@/lib/copy";
import { buildCv, type CvRole } from "@/lib/cv";
import { MACHINE_ROUTES, ROUTES, SAME_AS, SITE_URL } from "@/lib/site";
import type { Lang } from "@/lib/types";
import JsonLd from "./JsonLd";
import LangRoot from "./LangRoot";
import styles from "./CvPage.module.css";

/** Settes ved build, på linje med lastModified i sitemapet. */
const BUILD_MONTH = new Date().toISOString().slice(0, 7);

function Period({ role }: { role: CvRole }) {
  return (
    <p className={styles.period}>
      <time dateTime={role.startISO}>{role.startLabel}</time>
      <span aria-hidden="true"> – </span>
      {role.endISO ? (
        <time dateTime={role.endISO}>{role.endLabel}</time>
      ) : (
        <span className={styles.live}>{role.endLabel}</span>
      )}
    </p>
  );
}

function RoleList({ roles }: { roles: CvRole[] }) {
  return (
    <ol className={styles.roles}>
      {roles.map((r) => (
        <li key={r.id}>
          <article className={styles.role}>
            <div className={styles.roleHead}>
              <h3 className={styles.roleTitle}>{r.title}</h3>
              <p className={styles.roleOrg}>{r.organization}</p>
            </div>
            <div className={styles.roleMeta}>
              <Period role={r} />
              <p className={styles.roleType}>{r.typeLabel}</p>
            </div>
            <div className={styles.roleBody}>
              <p>{r.description}</p>
              {r.note && <p className={styles.roleNote}>{r.note}</p>}
              {r.tags.length > 0 && (
                <ul className={styles.tags}>
                  {r.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

export default function CvPage({ lang, now }: { lang: Lang; now: number }) {
  const t = COPY[lang];
  const c = t.cv;
  const cv = buildCv(lang, now);
  const other: Lang = lang === "no" ? "en" : "no";

  return (
    <LangRoot lang={lang}>
      <main className={styles.page}>
        <nav className={styles.topNav} aria-label={c.heading}>
          <a href={ROUTES[lang].home}>← {c.backToSite}</a>
          <a href={ROUTES[other].cv} hrefLang={other === "no" ? "nb-NO" : "en"}>
            {c.otherLangLabel}
          </a>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.name}>
            {cv.fullName} — {c.heading}
          </h1>
          <p className={styles.jobTitle}>
            {cv.jobTitle} · {cv.locality}, {cv.country}
          </p>
          <p className={styles.summary}>{cv.summary}</p>

          <dl className={styles.facts}>
            <div>
              <dt>{c.availabilityLabel}</dt>
              <dd>{cv.availability}</dd>
            </div>
            <div>
              <dt>{c.contactHeading}</dt>
              <dd>
                <a href={`mailto:${cv.email}`}>{cv.email}</a>
              </dd>
            </div>
            <div>
              <dt>{c.updatedLabel}</dt>
              <dd>
                <time dateTime={BUILD_MONTH}>{BUILD_MONTH}</time>
              </dd>
            </div>
          </dl>

          <ul className={styles.profiles}>
            {SAME_AS.map((url) => (
              <li key={url}>
                <a href={url} rel="me noreferrer" target="_blank">
                  {new URL(url).hostname.replace(/^www\./, "")}
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.printHint}>{c.printHint}</p>
        </header>

        <section className={styles.section} aria-labelledby="ferdigheter">
          <h2 id="ferdigheter" className={styles.sectionTitle}>
            {c.skillsHeading}
          </h2>
          <dl className={styles.skills}>
            <dt>{c.techLabel}</dt>
            <dd>{cv.tech.join(", ")}</dd>
            <dt>{c.domainLabel}</dt>
            <dd>{cv.domains.join(", ")}</dd>
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="arbeid">
          <h2 id="arbeid" className={styles.sectionTitle}>
            {c.workHeading}
          </h2>
          <RoleList roles={cv.work} />
        </section>

        <section className={styles.section} aria-labelledby="frivillig">
          <h2 id="frivillig" className={styles.sectionTitle}>
            {c.volunteerHeading}
          </h2>
          <RoleList roles={cv.volunteer} />
        </section>

        <section className={styles.section} aria-labelledby="utdanning">
          <h2 id="utdanning" className={styles.sectionTitle}>
            {c.educationHeading}
          </h2>
          <RoleList roles={cv.education} />

          <h3 id="emner" className={styles.subTitle}>
            {c.coursesHeading}
          </h3>
          <table className={styles.courses}>
            <caption>
              {cv.courses.reduce((n, s) => n + s.courses.length, 0)} {c.coursesUnit} ·{" "}
              {cv.totalCredits} {c.creditsUnit}
            </caption>
            <thead>
              <tr>
                <th scope="col">{c.codeLabel}</th>
                <th scope="col">{c.courseLabel}</th>
                <th scope="col">{c.termLabel}</th>
              </tr>
            </thead>
            <tbody>
              {cv.courses.flatMap((sem) =>
                sem.courses.map((course) => (
                  <tr key={course.code}>
                    <td className={styles.courseCode}>{course.code}</td>
                    <td>{course.title}</td>
                    <td>
                      {sem.term} {sem.year}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className={styles.section} aria-labelledby="prosjekter">
          <h2 id="prosjekter" className={styles.sectionTitle}>
            {c.projectsHeading}
          </h2>
          <ol className={styles.roles}>
            {cv.projects.map((p) => (
              <li key={p.name}>
                <article className={styles.role}>
                  <div className={styles.roleHead}>
                    <h3 className={styles.roleTitle}>{p.name}</h3>
                    <p className={styles.roleOrg}>
                      <a href={p.webUrl} rel="noreferrer" target="_blank">
                        {new URL(p.webUrl).hostname}
                      </a>
                    </p>
                  </div>
                  <div className={styles.roleMeta}>
                    <p className={styles.roleType}>
                      <a href={p.repoUrl} rel="noreferrer" target="_blank">
                        {c.sourceLabel}
                      </a>
                    </p>
                  </div>
                  <div className={styles.roleBody}>
                    <p>{p.description}</p>
                    <ul className={styles.tags}>
                      {p.stack.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="maskin">
          <h2 id="maskin" className={styles.sectionTitle}>
            {c.machineHeading}
          </h2>
          <p>{c.machineLede}</p>
          <ul className={styles.machine}>
            <li>
              <a href={MACHINE_ROUTES.cvJson}>{MACHINE_ROUTES.cvJson}</a> — JSON Resume
            </li>
            <li>
              <a href={MACHINE_ROUTES.llmsTxt}>{MACHINE_ROUTES.llmsTxt}</a> — llms.txt
            </li>
            <li>
              <a href="/sitemap.xml">/sitemap.xml</a>
            </li>
          </ul>
        </section>
      </main>

      <JsonLd
        lang={lang}
        now={now}
        page={{
          url: `${SITE_URL}${ROUTES[lang].cv}`,
          name: c.metaTitle,
          description: c.metaDescription,
        }}
      />
    </LangRoot>
  );
}
