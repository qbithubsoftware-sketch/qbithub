import { NextResponse } from "next/server";

export async function GET() {
  try {

  return NextResponse.json({ message: "Hello, world!" });

  } catch (error) {
    console.error("[API ERROR] GET src/app/api/route.ts:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}