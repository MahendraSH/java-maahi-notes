import { NextResponse } from "next/server";
import { exportPublishedNotesToDisk } from "@/lib/storage";

export async function POST() {
  try {
    const result = await exportPublishedNotesToDisk();
    return NextResponse.json({
      success: true,
      message: `Successfully exported ${result.count} published note(s) to ${result.publishedDir}`,
      count: result.count,
      exportedFiles: result.exportedFiles,
    });
  } catch (err: any) {
    console.error("API POST /api/publish/export error:", err);
    return NextResponse.json(
      { error: "Failed to export published notes", details: err?.message },
      { status: 500 }
    );
  }
}
