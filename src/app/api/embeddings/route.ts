import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 },
      );
    }

    const response = await fetch("https://api.deepseek.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_V3_API}`,
      },
      body: JSON.stringify({
        model: "deepseek-coder",
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `DeepSeek API error: ${response.status} ${JSON.stringify(errorData)}`,
      );
    }

    const responseData = await response.json();
    const embedding = responseData.data[0].embedding;

    return NextResponse.json({
      embedding,
      model: "deepseek-coder",
      usage: responseData.usage,
    });
  } catch (error) {
    console.error("Embedding generation error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Embedding generation failed: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
