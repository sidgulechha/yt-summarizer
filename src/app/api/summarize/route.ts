import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import ytdl from "ytdl-core";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const client = new Anthropic();

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SYSTEM_PROMPT = `You are a YouTube video analyst. Given a video transcript and metadata, produce a structured JSON summary with these exact fields:

{
  "title": "video title",
  "channel": "channel name",
  "duration": "human readable duration",
  "overview": "2-3 sentence high-level summary of what the video is about",
  "keyPoints": ["point 1", "point 2", "point 3", ...],
  "timestamps": [
    { "time": "0:00", "label": "Introduction", "description": "Brief description" }
  ],
  "targetAudience": "Who would benefit most from watching this",
  "sentiment": "Tone of the video: educational / entertaining / persuasive / etc.",
  "tags": ["topic1", "topic2", ...]
}

Rules:
- keyPoints: 5-8 most important takeaways
- timestamps: 6-10 meaningful chapter markers derived from content shifts in the transcript
- tags: 5-7 relevant tags
- Return ONLY valid JSON. No markdown, no explanation.`;

export async function POST(req: NextRequest) {
  // ── auth ──────────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please enter a valid YouTube video link." },
        { status: 400 }
      );
    }

    // ── cache check ──────────────────────────────────────────────────────────
    const { data: cached } = await supabaseAdmin
      .from("summaries")
      .select("summary_data, thumbnail, created_at, transcript")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        ...cached.summary_data,
        cached: true,
        cachedAt: cached.created_at,
        thumbnail: cached.thumbnail,
        videoId,
      });
    }

    // ── fetch metadata ───────────────────────────────────────────────────────
    let metadata = {
      title: "Unknown Title",
      author: "Unknown Channel",
      duration: "Unknown",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      publishDate: "",
    };

    try {
      const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`);
      const details = info.videoDetails;
      metadata = {
        title: details.title,
        author: details.author.name,
        duration: details.lengthSeconds
          ? formatDuration(parseInt(details.lengthSeconds))
          : "Unknown",
        thumbnail:
          details.thumbnails?.[details.thumbnails.length - 1]?.url ||
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishDate: details.publishDate || "",
      };
    } catch {
      // Proceed with defaults
    }

    // ── fetch transcript ─────────────────────────────────────────────────────
    let transcriptText = "";
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcript
        .map((item) => `[${formatTimestamp(item.offset / 1000)}] ${item.text}`)
        .join(" ");
    } catch {
      return NextResponse.json(
        { error: "This video doesn't have captions available. Please try a video with subtitles enabled." },
        { status: 422 }
      );
    }

    if (!transcriptText.trim()) {
      return NextResponse.json(
        { error: "This video doesn't have captions available." },
        { status: 422 }
      );
    }

    const userMessage = `Video Metadata:
Title: ${metadata.title}
Channel: ${metadata.author}
Duration: ${metadata.duration}
Published: ${metadata.publishDate}

Transcript (with timestamps):
${transcriptText.slice(0, 50000)}`;

    // ── stream from Anthropic ────────────────────────────────────────────────
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userMessage }],
          });

          let fullText = "";
          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              fullText += chunk.delta.text;
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }

          // ── persist to Supabase (non-blocking on error) ──────────────────
          try {
            const cleaned = fullText.trim()
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/\s*```$/, "");
            const summaryData = JSON.parse(cleaned);
            await supabaseAdmin.from("summaries").insert({
              user_id: userId,
              video_id: videoId,
              video_url: url,
              title: metadata.title,
              thumbnail: metadata.thumbnail,
              duration: metadata.duration,
              channel: metadata.author,
              summary_data: summaryData,
              transcript: transcriptText,
            });
          } catch (dbErr) {
            console.error("Summary save error:", dbErr);
          }

          const metaMarker = `\n__META__${JSON.stringify({
            thumbnail: metadata.thumbnail,
            videoId,
            cached: false,
          })}`;
          controller.enqueue(encoder.encode(metaMarker));
          controller.close();
        } catch (err) {
          console.error("Anthropic stream error:", err);
          controller.enqueue(encoder.encode(`\n__ERROR__Something went wrong while generating the summary. Please try again.`));
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
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
