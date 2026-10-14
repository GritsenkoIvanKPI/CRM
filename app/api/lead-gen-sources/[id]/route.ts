import { NextRequest, NextResponse } from "next/server";
import { deleteLeadGenSource } from "@/lib/queries/leadGenSources";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await deleteLeadGenSource(id);
  return NextResponse.json({ ok: true });
}
