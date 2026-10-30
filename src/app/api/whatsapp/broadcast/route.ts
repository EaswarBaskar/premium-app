import { NextResponse } from "next/server";
import { localStore } from "@/lib/local-store";

export type BroadcastPayload = {
  slug: string;
  templateTone: "formal" | "warmth" | "reminder";
  recipients: Array<{
    name: string;
    phone: string;
    guests?: number;
  }>;
};

export async function POST(request: Request) {
  let body: BroadcastPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { slug, templateTone = "warmth", recipients } = body;
  if (!slug || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json(
      { error: "Slug and at least one recipient are required." },
      { status: 400 }
    );
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";
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
    const cleanPhone = recipient.phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      results.push({
        phone: recipient.phone,
        name: recipient.name,
        status: "failed",
        error: "Invalid phone number",
      });
      continue;
    }

    const inviteLink = `${origin}/invite/${encodeURIComponent(slug)}?g=${encodeURIComponent(recipient.name)}`;
    
    // Generate message copy based on tone
    let messageText = "";
    if (templateTone === "formal") {
      messageText = `Respected ${recipient.name},\n\nWe cordially request the honour of your esteemed presence to celebrate our joyful occasion.\n\nKindly find your personal invitation and RSVP details here:\n${inviteLink}\n\nWarm regards,\nThe Family`;
    } else if (templateTone === "reminder") {
      messageText = `Hi ${recipient.name}! ⏳\n\nJust a gentle reminder regarding our upcoming celebration. We are currently finalizing seating & catering arrangements.\n\nKindly take 10 seconds to confirm your attendance:\n${inviteLink}\n\nLooking forward to celebrating with you!`;
    } else {
      // Family Warmth (default)
      messageText = `Namaste ${recipient.name}! 🙏\n\nOur celebration would truly be incomplete without you and your family!\n\nKindly view your invitation and let us know if you can join us:\n${inviteLink}\n\nWith love & warm wishes!`;
    }

    // 1. Meta WhatsApp Cloud API (if configured)
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
            phone: recipient.phone,
            name: recipient.name,
            status: "sent",
            messageId: data.messages?.[0]?.id,
          });
        } else {
          const errData = await metaRes.json();
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            status: "failed",
            error: errData.error?.message || "Meta API Error",
          });
        }
      } catch (err: any) {
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: "failed",
          error: err.message || "Network Error",
        });
      }
    }
    // 2. Twilio WhatsApp API (if configured)
    else if (twilioSid && twilioAuth) {
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
            phone: recipient.phone,
            name: recipient.name,
            status: "sent",
            messageId: data.sid,
          });
        } else {
          const errData = await twilioRes.json();
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            status: "failed",
            error: errData.message || "Twilio API Error",
          });
        }
      } catch (err: any) {
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          status: "failed",
          error: err.message || "Twilio Network Error",
        });
      }
    }
    // 3. Simulated Demo Mode (Zero API keys required - instant local preview)
    else {
      results.push({
        phone: recipient.phone,
        name: recipient.name,
        status: "simulated",
        messageId: `sim_${Math.random().toString(36).substring(2, 9)}`,
      });
    }
  }

  const totalSuccess = results.filter((r) => r.status === "sent" || r.status === "simulated").length;

  return NextResponse.json({
    success: true,
    provider: metaToken ? "meta" : twilioSid ? "twilio" : "simulator (keys not configured)",
    totalRecipients: recipients.length,
    successfulCount: totalSuccess,
    failedCount: recipients.length - totalSuccess,
    results,
  });
}

