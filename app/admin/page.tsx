"use client";

import { useEffect, useState } from "react";
import { MONTHS, monthOf, toDecimalYear, yearOf } from "@/lib/time";
import type { Experience, ExperienceType, Localized } from "@/lib/types";
import styles from "./admin.module.css";

const YEARS = Array.from({ length: 2030 - 2010 + 1 }, (_, i) => 2010 + i);
const TYPES: ExperienceType[] = ["Betalt", "Frivillig", "Utdanning"];

function MonthYearPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const y = yearOf(value);
  const m = monthOf(value);
  return (
    <span className={styles.inline}>
      <select
        className={styles.select}
        value={m}
        onChange={(e) => onChange(toDecimalYear(y, Number(e.target.value)))}
      >
        {MONTHS.no.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </select>
      <select
        className={styles.select}
        value={y}
        onChange={(e) => onChange(toDecimalYear(Number(e.target.value), m))}
      >
        {YEARS.map((yy) => (
          <option key={yy} value={yy}>
            {yy}
          </option>
        ))}
      </select>
    </span>
  );
}

function LocalizedField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: Localized;
  onChange: (v: Localized) => void;
  textarea?: boolean;
}) {
  const field = (lang: "no" | "en") => {
    const common = {
      value: value[lang],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...value, [lang]: e.target.value }),
    };
    return textarea ? (
      <textarea className={styles.textarea} {...common} />
    ) : (
      <input className={styles.input} {...common} />
    );
  };
  return (
    <>
      <div className={styles.field}>
        <span className={styles.label}>{label} (NO)</span>
        {field("no")}
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{label} (EN)</span>
        {field("en")}
      </div>
    </>
  );
}

export default function AdminPage() {
  const [items, setItems] = useState<Experience[] | null>(null);
  const [comment, setComment] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; msg: string }>({
    kind: "idle",
    msg: "",
  });

  useEffect(() => {
    fetch("/api/experiences")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.experiences as Experience[]);
        setComment(d._comment);
      })
      .catch(() => setStatus({ kind: "error", msg: "Klarte ikke å laste data." }));
  }, []);

  const update = (i: number, patch: Partial<Experience>) => {
    setItems((prev) => prev && prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  };

  const move = (i: number, dir: -1 | 1) => {
    setItems((prev) => {
      if (!prev) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const addEntry = () => {
    setItems((prev) => [
      ...(prev || []),
      {
        id: `ny-${Date.now().toString(36)}`,
        title: { no: "Ny rolle", en: "New role" },
        organization: "",
        type: "Betalt",
        from: toDecimalYear(new Date().getFullYear(), 1),
        to: null,
        description: { no: "", en: "" },
        imagePath: "/img/erfaringer/ntnu.webp",
        tags: { no: [], en: [] },
      },
    ]);
  };

  const download = () => {
    if (!items) return;
    const doc = comment ? { _comment: comment, experiences: items } : { experiences: items };
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "experiences.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const save = async () => {
    if (!items) return;
    setStatus({ kind: "idle", msg: "Lagrer…" });
    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experiences: items }),
      });
      if (res.ok) {
        setStatus({ kind: "ok", msg: "Lagret til data/experiences.json — commit og deploy." });
      } else if (res.status === 403) {
        setStatus({
          kind: "error",
          msg: "Skrivebeskyttet i produksjon — bruk «Last ned JSON» og legg filen i data/.",
        });
      } else {
        const d = await res.json().catch(() => ({ error: "ukjent feil" }));
        setStatus({ kind: "error", msg: `Feil: ${d.error || res.status}` });
      }
    } catch {
      setStatus({ kind: "error", msg: "Nettverksfeil — kjører dev-serveren?" });
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Erfaringsdata</h1>
      <p className={styles.lede}>
        Rediger datoene og periodene som driver tidslinjen, aktivitetskartet, listen og git
        blame-visningen. Lokalt skrives endringene rett til <code>data/experiences.json</code>; i
        produksjon laster du ned filen og committer den. Segmenter brukes for sesongarbeid (somre,
        høytider, semestre) — uten segmenter tegnes rollen som én sammenhengende periode.
      </p>

      <div className={styles.toolbar}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={save}>
          Lagre
        </button>
        <button type="button" className={styles.btn} onClick={download}>
          Last ned JSON
        </button>
        <button type="button" className={styles.btn} onClick={addEntry}>
          + Ny erfaring
        </button>
        <span
          className={`${styles.status} ${
            status.kind === "error" ? styles.statusError : status.kind === "ok" ? styles.statusOk : ""
          }`}
        >
          {status.msg}
        </span>
      </div>

      {!items && <p className={styles.hint}>Laster…</p>}

      {items?.map((e, i) => (
        <section key={`${e.id}-${i}`} className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardName}>
              {e.title.no || "(uten tittel)"} · {e.organization || "(uten organisasjon)"}
            </span>
            <div className={styles.cardBtns}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSmall}`}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSmall}`}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                onClick={() => setItems((prev) => prev && prev.filter((_, j) => j !== i))}
              >
                Slett
              </button>
            </div>
          </div>
          <div className={styles.grid}>
            <LocalizedField
              label="Tittel"
              value={e.title}
              onChange={(v) => update(i, { title: v })}
            />
            <div className={styles.field}>
              <span className={styles.label}>Organisasjon</span>
              <input
                className={styles.input}
                value={e.organization}
                onChange={(ev) => update(i, { organization: ev.target.value })}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Type</span>
              <select
                className={styles.select}
                value={e.type}
                onChange={(ev) => update(i, { type: ev.target.value as ExperienceType })}
              >
                {TYPES.map((tp) => (
                  <option key={tp}>{tp}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Fra</span>
              <MonthYearPicker value={e.from} onChange={(v) => update(i, { from: v })} />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Til</span>
              <span className={styles.inline}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={e.to === null}
                    onChange={(ev) =>
                      update(i, {
                        to: ev.target.checked
                          ? null
                          : toDecimalYear(new Date().getFullYear(), 6),
                      })
                    }
                  />
                  Pågår
                </label>
                {e.to !== null && (
                  <MonthYearPicker value={e.to} onChange={(v) => update(i, { to: v })} />
                )}
              </span>
            </div>
            <LocalizedField
              label="Beskrivelse"
              value={e.description}
              onChange={(v) => update(i, { description: v })}
              textarea
            />
            <div className={styles.field}>
              <span className={styles.label}>Bilde-sti</span>
              <input
                className={styles.input}
                value={e.imagePath}
                onChange={(ev) => update(i, { imagePath: ev.target.value })}
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Notat (f.eks. «6 sesonger») NO / EN</span>
              <span className={styles.inline}>
                <input
                  className={styles.input}
                  placeholder="NO"
                  value={e.note?.no || ""}
                  onChange={(ev) =>
                    update(i, {
                      note:
                        ev.target.value || e.note?.en
                          ? { no: ev.target.value, en: e.note?.en || "" }
                          : undefined,
                    })
                  }
                />
                <input
                  className={styles.input}
                  placeholder="EN"
                  value={e.note?.en || ""}
                  onChange={(ev) =>
                    update(i, {
                      note:
                        ev.target.value || e.note?.no
                          ? { no: e.note?.no || "", en: ev.target.value }
                          : undefined,
                    })
                  }
                />
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Tags NO (kommaseparert)</span>
              <input
                className={styles.input}
                value={e.tags.no.join(", ")}
                onChange={(ev) =>
                  update(i, {
                    tags: {
                      ...e.tags,
                      no: ev.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Tags EN (kommaseparert)</span>
              <input
                className={styles.input}
                value={e.tags.en.join(", ")}
                onChange={(ev) =>
                  update(i, {
                    tags: {
                      ...e.tags,
                      en: ev.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    },
                  })
                }
              />
            </div>
            <div className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.label}>Segmenter (sesongarbeid)</span>
              <div className={styles.segments}>
                {(e.segments || []).map((s, si) => (
                  <div key={si} className={styles.segRow}>
                    <MonthYearPicker
                      value={s[0]}
                      onChange={(v) =>
                        update(i, {
                          segments: (e.segments || []).map((seg, sj) =>
                            sj === si ? [v, seg[1]] : seg
                          ),
                        })
                      }
                    />
                    <span className={styles.hint}>→</span>
                    <MonthYearPicker
                      value={s[1]}
                      onChange={(v) =>
                        update(i, {
                          segments: (e.segments || []).map((seg, sj) =>
                            sj === si ? [seg[0], v] : seg
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                      onClick={() => {
                        const next = (e.segments || []).filter((_, sj) => sj !== si);
                        update(i, { segments: next.length ? next : undefined });
                      }}
                    >
                      Fjern
                    </button>
                  </div>
                ))}
                <div>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSmall}`}
                    onClick={() =>
                      update(i, {
                        segments: [
                          ...(e.segments || []),
                          [e.from, e.to ?? toDecimalYear(new Date().getFullYear(), 6)],
                        ],
                      })
                    }
                  >
                    + Segment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
