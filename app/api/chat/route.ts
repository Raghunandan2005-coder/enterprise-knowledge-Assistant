import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch("http://127.0.0.1:8000/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appName: "EnterpriseKnwoledgeassistant",
        userId: "raghu",
        sessionId: "test_session",
        newMessage: {
          role: "user",
          parts: [{ text: message }],
        },
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        {
          error: `Backend request failed (${backendResponse.status}): ${errorText || "Unknown error"}`,
        },
        { status: 502 }
      );
    }

    const events = await backendResponse.json();

    let answer = "";

    for (const event of events) {
      const parts = event?.content?.parts || [];

      for (const part of parts) {
        if (part?.text) {
          answer = part.text;
        }
      }
    }

    if (!answer) {
      return NextResponse.json(
        { error: "The backend did not return a usable answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process request. Please try again.",
      },
      { status: 500 }
    );
  }
}
