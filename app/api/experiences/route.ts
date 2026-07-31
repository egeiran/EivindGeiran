import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import type { Experience } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "data", "experiences.json");

const TYPES = new Set(["Betalt", "Frivillig", "Utdanning"]);

function isLocalized(v: unknown): v is { no: string; en: string } {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as Record<string, unknown>).no === "string" &&
    typeof (v as Record<string, unknown>).en === "string"
  );
}

function isValidExperience(e: unknown): e is Experience {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return false;
  if (!isLocalized(o.title) || !isLocalized(o.description)) return false;
  if (typeof o.organization !== "string") return false;
  if (typeof o.type !== "string" || !TYPES.has(o.type)) return false;
  if (typeof o.from !== "number" || !Number.isFinite(o.from)) return false;
  if (o.to !== null && (typeof o.to !== "number" || !Number.isFinite(o.to))) return false;
  if (o.segments !== undefined) {
    if (!Array.isArray(o.segments)) return false;
    for (const s of o.segments) {
      if (
        !Array.isArray(s) ||
        s.length !== 2 ||
        typeof s[0] !== "number" ||
        typeof s[1] !== "number"
      )
        return false;
    }
  }
  if (o.note !== undefined && !isLocalized(o.note)) return false;
  if (typeof o.imagePath !== "string") return false;
  const tags = o.tags as Record<string, unknown> | undefined;
  if (!tags || !Array.isArray(tags.no) || !Array.isArray(tags.en)) return false;
  return true;
}

export async function GET() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  // Skriving til fil er kun mulig lokalt under utvikling. I produksjon (Vercel)
  // er filsystemet flyktig — admin-siden tilbyr JSON-eksport i stedet.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Read-only in production" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const experiences = (body as { experiences?: unknown })?.experiences;
  if (!Array.isArray(experiences) || !experiences.every(isValidExperience)) {
    return NextResponse.json({ error: "Invalid experience payload" }, { status: 400 });
  }
  const current = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const next = { _comment: current._comment, experiences };
  await fs.writeFile(DATA_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return NextResponse.json({ ok: true });
}
