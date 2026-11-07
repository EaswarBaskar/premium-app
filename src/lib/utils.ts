export type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean | undefined | null } | ClassValue[];

/** Combines class names cleanly without external dependencies. */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const item of inputs) {
    if (!item) continue;
    if (typeof item === "string" || typeof item === "number") {
      classes.push(String(item));
    } else if (Array.isArray(item)) {
      const inner = cn(...item);
      if (inner) classes.push(inner);
    } else if (typeof item === "object") {
      for (const [key, val] of Object.entries(item)) {
        if (val) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}

export type EventKey = "engagement" | "wedding";

export interface DynamicCalendarEvent {
  title?: string;
  date?: Date | string;
  venue?: string;
  description?: string;
  url?: string;
}

export function formatDate(d: Date | string): string {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!dateObj || Number.isNaN(dateObj.getTime())) {
    return "Date to be announced";
  }
  return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Exports a standard .ics calendar invite dynamically using the active event details.
 */
export function addToCalendar(event?: DynamicCalendarEvent | string) {
  let title = "Celebration & Auspicious Gathering";
  let targetDate = new Date(Date.now() + 30 * 86400000);
  let venue = "";
  let description = "Save the date for our celebration!";

  if (typeof event === "object" && event !== null) {
    if (event.title) title = event.title;
    if (event.date) {
      const parsed = typeof event.date === "string" ? new Date(event.date) : event.date;
      if (!Number.isNaN(parsed.getTime())) targetDate = parsed;
    }
    if (event.venue) venue = event.venue;
    if (event.description) description = event.description;
  } else if (typeof event === "string" && event.trim()) {
    title = event.trim();
  }

  const start = toICSDate(targetDate);
  const endDate = new Date(targetDate.getTime() + 3 * 60 * 60 * 1000);
  const end = toICSDate(endDate);

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TRAXVA//Digital Celebrations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:${title.replace(/[\r\n]+/g, " ")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DESCRIPTION:${description.replace(/[\r\n]+/g, " ")}`,
  ];

  if (venue) {
    icsLines.push(`LOCATION:${venue.replace(/[\r\n]+/g, " ")}`);
  }

  icsLines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");

  const ics = icsLines.join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const cleanFileName = (title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().slice(0, 30) || "celebration") + ".ics";
  link.download = cleanFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Shares the celebration link dynamically via Web Share API or Clipboard.
 */
export function shareEvent(event?: DynamicCalendarEvent | string) {
  let title = "Celebration Invitation";
  let dateStr = "";

  if (typeof event === "object" && event !== null) {
    if (event.title) title = event.title;
    if (event.date) dateStr = ` — ${formatDate(event.date)}`;
  } else if (typeof event === "string" && event.trim()) {
    title = event.trim();
  }

  const text = `${title}${dateStr}`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://traxva.in";

  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ title, text, url: shareUrl }).catch(() => {});
  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(`${text} ${shareUrl}`).catch(() => {});
  }
}
