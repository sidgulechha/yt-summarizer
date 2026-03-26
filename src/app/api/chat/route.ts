import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const client = new Anthropic();

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  // ── auth ──────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, videoId, history } = body as {
      question: string;
      videoId: string;
      history: Message[];
    };

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    // ── fetch transcript from DB ─────────────────────────────────────────────
    const { data: row, error: dbError } = await supabaseAdmin
      .from("summaries")
      .select("transcript")
      .eq("user_id", session.user.id)
      .eq("video_id", videoId)
      .maybeSingle();

    if (dbError || !row?.transcript) {
      return NextResponse.json(
        { error: "Transcript not found. Please re-summarize the video first." },
        { status: 404 }
      );
    }

    const transcript = row.transcript as string;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: [
              {
                type: "text",
                text: "You are a helpful assistant that answers questions about a YouTube video. Only answer based on what is in the transcript. If the answer isn't in the transcript, say so honestly. Be concise.",
              },
              {
                type: "text",
                text: `Here is the full transcript of the video:\n\n${transcript}`,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [
              ...(history ?? []),
              { role: "user", content: question },
            ],
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }

          controller.close();
        } catch (err) {
          console.error("Anthropic chat stream error:", err);
          controller.enqueue(encoder.encode(`\n__ERROR__Something went wrong while generating the response. Please try again.`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
