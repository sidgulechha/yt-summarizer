import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("summaries")
    .select("id, video_id, video_url, title, thumbnail, duration, channel, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
  }

  return NextResponse.json({ summaries: data ?? [] });
}
