import { NextResponse } from "next/server";
import { repository } from "@/persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reachable = await repository.healthCheck();
    return NextResponse.json(
      {
        status: reachable ? "ok" : "error",
        persistence: repository.kind,
        databaseReachable: reachable,
        app: "viralio",
      },
      { status: reachable ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "error",
        persistence: repository.kind,
        databaseReachable: false,
        app: "viralio",
      },
      { status: 503 },
    );
  }
}
