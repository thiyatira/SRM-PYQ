import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), "public", "data");

    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({ error: "Data directory not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedCode = searchParams.get("code");

    // If a specific subject code is requested
    if (requestedCode) {
      // Basic sanitization to prevent directory traversal
      const safeCode = path.basename(requestedCode.trim());
      const subjectDir = path.join(dataDir, safeCode);

      if (!fs.existsSync(subjectDir) || !fs.statSync(subjectDir).isDirectory()) {
        return NextResponse.json({ code: safeCode, files: [] });
      }

      const files = fs
        .readdirSync(subjectDir)
        .filter((file) => file.endsWith(".json") && file.toLowerCase() !== "manifest.json")
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

      return NextResponse.json({ code: safeCode, files });
    }

    // Return map of all subjects: { [code]: files[] }
    const result: Record<string, string[]> = {};
    const entries = fs.readdirSync(dataDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subjectDir = path.join(dataDir, entry.name);
        const files = fs
          .readdirSync(subjectDir)
          .filter((file) => file.endsWith(".json") && file.toLowerCase() !== "manifest.json")
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

        result[entry.name] = files;
      }
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error reading PYQ files:", error);
    return NextResponse.json({ error: "Failed to read PYQ files" }, { status: 500 });
  }
}
