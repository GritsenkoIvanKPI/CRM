import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listLeadGenSources, createLeadGenSource } from "@/lib/queries/leadGenSources";

const createSchema = z.object({
  name: z.string().trim().min(1, "Вкажіть назву").max(200),
});

export async function GET() {
  const sources = await listLeadGenSources();
  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невірні дані" },
      { status: 400 },
    );
  }

  try {
    const source = await createLeadGenSource(parsed.data.name);
    return NextResponse.json({ source }, { status: 201 });
  } catch (err) {
    const isDuplicate =
      typeof err === "object" && err !== null && "code" in err && err.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Такий лідген вже є у списку" : "Не вдалося додати лідген" },
      { status: 400 },
    );
  }
}
