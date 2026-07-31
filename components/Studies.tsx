"use client";

import { COURSES, type Copy } from "@/lib/copy";
import headStyles from "./SectionHead.module.css";
import styles from "./Studies.module.css";

export default function Studies({ t }: { t: Copy }) {
  return (
    <section id="studiet" className={styles.section}>
      <div className={headStyles.head}>
        <h2 className={headStyles.title}>{t.studyTitle}</h2>
        <p className={headStyles.asideMono}>{t.studyMeta}</p>
      </div>
      <div className={styles.grid}>
        {COURSES.map((sem, i) => (
          <div key={`${sem.term}-${sem.year}`}>
            <div className={styles.semHead}>
              <span
                className={styles.semKey}
                style={{ color: i === 0 ? "var(--lime)" : "rgba(244,241,232,.5)" }}
              >
                {sem.term} {sem.year}
              </span>
              <span className={styles.semCredits}>30 sp</span>
            </div>
            {sem.courses.map((c) => (
              <div key={c.code} className={styles.course}>
                <div className={styles.courseCode}>{c.code}</div>
                <div className={styles.courseTitle}>{c.title}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
