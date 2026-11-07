import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`uploads:${ip}`, {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20,                  // Max 20 image uploads
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Upload rate limit exceeded. Please wait a few minutes." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400, headers: rateLimit.headers });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400, headers: rateLimit.headers });
  }

  // Strict MIME type validation (blocks SVG, HTML, executable scripts)
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Only JPG, PNG, WEBP, and GIF images are allowed." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Images must be smaller than 8 MB." }, { status: 400, headers: rateLimit.headers });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      // Secure random file key with clean sanitized extension
      const safeExtension = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
      const sanitizedBaseName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 32);
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedBaseName}.${safeExtension}`;

      const { error } = await supabase.storage
        .from("invitation-assets")
        .upload(path, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type,
          upsert: false,
        });

      if (!error) {
        const { data } = supabase.storage.from("invitation-assets").getPublicUrl(path);
        return NextResponse.json({ url: data.publicUrl }, { headers: rateLimit.headers });
      }
    }
  }

  // Fallback for unauthenticated preview or demo/local mode: return as sanitized data URL
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  return NextResponse.json({ url: dataUrl }, { headers: rateLimit.headers });
}
