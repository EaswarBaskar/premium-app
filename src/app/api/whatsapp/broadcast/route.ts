import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { localStore } from "@/lib/local-store";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizePhone, sanitizeSlug, sanitizeText } from "@/lib/sanitize";

export type BroadcastPayload = {
  slug: string;
  templateTone?: "formal" | "warmth" | "reminder";
  recipients: Array<{
    name: string;
    phone: string;
    guests?: number;
  }>;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`whatsapp-broadcast:${ip}`, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                  // Max 10 broadcast requests
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Broadcast rate limit exceeded. Please wait 15 minutes before sending another broadcast." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  let body: BroadcastPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: rateLimit.headers });
  }

  const { slug: rawSlug, templateTone = "warmth", recipients } = body;
  const slug = sanitizeSlug(rawSlug);

  if (!slug || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json(
      { error: "Valid invitation slug and at least one recipient are required." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  if (recipients.length > 50) {
    return NextResponse.json(
      { error: "Maximum 50 recipients allowed per broadcast request." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  // Verify Authentication & Ownership
  const supabase = getSupabaseAdmin();
  const isAdmin = await verifyAdminAuth(request);

  if (supabase) {
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!isAdmin && !user) {
      return NextResponse.json(
        { error: "Authentication required to trigger WhatsApp broadcasts." },
        { status: 401, headers: rateLimit.headers }
      );
    }

    if (!isAdmin && user) {
      const { data: inv } = await supabase
        .from("invitations")
        .select("owner_id")
        .eq("slug", slug.toLowerCase())
        .maybeSingle();

      if (inv && inv.owner_id && inv.owner_id !== user.id) {
        return NextResponse.json(
          { error: "Access denied. You can only send broadcasts for invitations you own." },
          { status: 403, headers: rateLimit.headers }
        );
      }
    }
  } else {
    // In local demo mode: verify slug exists in localStore
    const local = localStore.getInvitationBySlug(slug);
    if (!local) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404, headers: rateLimit.headers });
    }
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const metaPhoneId = process.env.META_WHATSAPP_PHONE_ID;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  const results: Array<{
    phone: string;
    name: string;
    status: "sent" | "simulated" | "failed";
    messageId?: string;
    error?: string;
  }> = [];

  for (const recipient of recipients) {
    const cleanPhone = sanitizePhone(recipient?.phone).replace(/\D/g, "");
    const cleanName = sanitizeText(recipient?.name, 80);

    if (!cleanPhone || cleanPhone.length < 10) {
      results.push({
        phone: recipient?.phone || "unknown",
        name: cleanName || "Guest",
        status: "failed",
        error: "Invalid phone number",
      });
      continue;
    }

    const inviteLink = `${origin}/invite/${encodeURIComponent(slug)}?g=${encodeURIComponent(cleanName)}`;

    let messageText = "";
    if (templateTone === "formal") {
      messageText = `Respected ${cleanName},\n\nWe cordially request the honour of your esteemed presence to celebrate our joyful occasion.\n\nKindly find your personal invitation and RSVP details here:\n${inviteLink}\n\nWarm regards,\nThe Family`;
    } else if (templateTone === "reminder") {
      messageText = `Hi ${cleanName}! ⏳\n\nJust a gentle reminder regarding our upcoming celebration. We are currently finalizing seating & catering arrangements.\n\nKindly take 10 seconds to confirm your attendance:\n${inviteLink}\n\nLooking forward to celebrating with you!`;
    } else {
      messageText = `Namaste ${cleanName}! 🙏\n\nOur celebration would truly be incomplete without you and your family!\n\nKindly view your invitation and let us know if you can join us:\n${inviteLink}\n\nWith love & warm wishes!`;
    }

    if (metaToken && metaPhoneId) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${metaToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhone,
              type: "text",
              text: { preview_url: true, body: messageText },
            }),
          }
        );

        if (metaRes.ok) {
          const data = await metaRes.json();
          results.push({
            phone: cleanPhone,
            name: cleanName,
            status: "sent",
            messageId: data.messages?.[0]?.id,
          });
        } else {
          results.push({
            phone: cleanPhone,
            name: cleanName,
            status: "failed",
            error: "Delivery failed",
          });
        }
      } catch {
        results.push({
          phone: cleanPhone,
          name: cleanName,
          status: "failed",
          error: "Gateway error",
        });
      }
    } else if (twilioSid && twilioAuth) {
      try {
        const toNum = `whatsapp:+${cleanPhone}`;
        const authHeader = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: twilioFrom,
              To: toNum,
              Body: messageText,
            }).toString(),
          }
        );

        if (twilioRes.ok) {
          const data = await twilioRes.json();
          results.push({
            phone: cleanPhone,
            name: cleanName,
            status: "sent",
            messageId: data.sid,
          });
        } else {
          results.push({
            phone: cleanPhone,
            name: cleanName,
            status: "failed",
            error: "Twilio delivery failed",
          });
        }
      } catch {
        results.push({
          phone: cleanPhone,
          name: cleanName,
          status: "failed",
          error: "Twilio network error",
        });
      }
    } else {
      results.push({
        phone: cleanPhone,
        name: cleanName,
        status: "simulated",
        messageId: `sim_${crypto.randomUUID().slice(0, 8)}`,
      });
    }
  }

  const totalSuccess = results.filter((r) => r.status === "sent" || r.status === "simulated").length;

  return NextResponse.json(
    {
      success: true,
      provider: metaToken ? "meta" : twilioSid ? "twilio" : "simulator (keys not configured)",
      totalRecipients: recipients.length,
      successfulCount: totalSuccess,
      failedCount: recipients.length - totalSuccess,
      results,
    },
    { headers: rateLimit.headers }
  );
}
