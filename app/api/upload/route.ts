import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file was provided." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const backendResponse = await fetch("http://127.0.0.1:8001/upload", {
      method: "POST",
      body: uploadFormData,
    });

    const responseText = await backendResponse.text();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: `Upload backend request failed (${backendResponse.status}): ${responseText || "Unknown error"}`,
        },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        {
          error: "Upload succeeded, but the backend returned an invalid JSON response.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload the PDF. Please try again.",
      },
      { status: 500 }
    );
  }
}
