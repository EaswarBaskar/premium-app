"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Globe2,
  Heart,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import styles from "./admin.module.css";
import BrandLogo from "@/components/BrandLogo";

type EnrichedInvitation = {
  id: string;
  slug: string;
  firstName: string;
  secondName?: string | null;
  eventType: string;
  date: string;
  time: string;
  venue: string;
  template: string;
  plan: string;
  views: number;
  viewsByPlace?: Record<string, number>;
  createdAt: string;
  expiresAt?: string;
  isExpired: boolean;
  rsvpsCount: number;
  attendingCount: number;
};

type MasterRsvp = {
  id: string;
  invitation_id: string;
  name: string;
  guest_count: number;
  response: string;
  message: string;
  event_name?: string | null;
  created_at: string;
  invitations?: {
    slug: string;
    first_name: string;
    second_name?: string | null;
  } | null;
};

type AdminData = {
  isLive: boolean;
  databaseEngine: string;
  databaseHost: string;
  supabaseUrl: string;
  serverTimestamp: string;
  metrics: {
    totalInvitations: number;
    activeCount: number;
    expiredCount: number;
    totalViews: number;
    totalRsvps: number;
    attendingRsvps: number;
    declinedRsvps: number;
    maybeRsvps: number;
    templateBreakdown: Record<string, number>;
    globalPlaces?: Record<string, number>;
    planBreakdown: Record<string, number>;
  };
  invitations: EnrichedInvitation[];
  rsvps: MasterRsvp[];
};

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [activeTab, setActiveTab] = useState<"invitations" | "rsvps" | "whatsapp" | "settings">("invitations");
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState("");

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function deleteInvite(slug: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}" (/invite/${slug})?`)) return;
    try {
      const res = await fetch(`/api/admin/overview?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback(`Deleted invitation "${slug}".`);
        loadData();
      }
    } catch {
      alert("Failed to delete invitation.");
    }
  }

  async function extendInvite(slug: string) {
    try {
      const res = await fetch("/api/admin/overview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "extend", extraDays: 7 }),
      });
      if (res.ok) {
        setFeedback(`Extended validity for "${slug}" by +7 days.`);
        loadData();
      }
    } catch {
      alert("Failed to extend invitation.");
    }
  }

  function exportMasterCsv() {
    if (!data?.rsvps?.length) return;
    const rows = [
      ["Guest Name", "Guests", "Response", "Event / Ceremony", "Couple / Slug", "Message", "Submitted At"],
      ...data.rsvps.map((r) => [
        r.name,
        r.guest_count,
        r.response,
        r.event_name || "All Events",
        r.invitations?.slug || r.invitation_id,
        r.message || "",
        new Date(r.created_at).toLocaleString("en-IN"),
      ]),
    ];
    const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invite7-master-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const filteredInvitations = useMemo(() => {
    if (!data?.invitations) return [];
    return data.invitations.filter((inv) => {
      const title = `${inv.firstName} ${inv.secondName || ""}`.toLowerCase();
      const matchSearch =
        title.includes(search.toLowerCase()) ||
        inv.slug.toLowerCase().includes(search.toLowerCase()) ||
        inv.venue.toLowerCase().includes(search.toLowerCase());
      const matchTemplate = templateFilter === "all" || inv.template.toLowerCase().replace(/\s+/g, "") === templateFilter.toLowerCase().replace(/\s+/g, "");
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !inv.isExpired) ||
        (statusFilter === "expired" && inv.isExpired);
      return matchSearch && matchTemplate && matchStatus;
    });
  }, [data, search, templateFilter, statusFilter]);

  if (loading && !data) {
    return (
      <main className={styles.adminPage}>
        <div style={{ display: "grid", placeItems: "center", minHeight: "80vh", color: "#a7553f", fontSize: "20px", fontFamily: "Georgia, serif" }}>
          Loading Admin Platform Overview...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.adminPage}>
      {/* Top Admin Header */}
      <header className={styles.adminHeader}>
        <BrandLogo href="/admin" variant="admin" extraBadge="Superadmin" />
        <div className={styles.headerRight}>
          <div className={styles.systemStatusLive} title={`Connected live to ${data?.databaseHost || "Supabase PostgreSQL"}`}>
            <span className={styles.livePulseDot} />
            <span>{data?.isLive ? "LIVE SUPABASE POSTGRESQL" : "OFFLINE LOCAL STORE"}</span>
          </div>
          <Link href="/dashboard" className={styles.headerLink}>
            <LayoutDashboard size={14} /> Host Dashboard
          </Link>
          <Link href="/" className={styles.headerLink}>
            <Globe2 size={14} /> Main Site <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>

      <div className={styles.container}>
        {feedback && (
          <div style={{ background: "#e8f5ec", color: "#2e7d32", padding: "10px 16px", borderRadius: "8px", marginBottom: "18px", fontSize: "12px", fontWeight: "500", display: "flex", justifyContent: "space-between" }}>
            <span>{feedback}</span>
            <button type="button" onClick={() => setFeedback("")} style={{ border: 0, background: "transparent", cursor: "pointer", color: "#2e7d32" }}>×</button>
          </div>
        )}

        {/* Live Database Status Banner */}
        <div className={styles.liveStatusBar}>
          <div className={styles.liveStatusLeft}>
            <span className={styles.livePill}>
              <i className={styles.livePillDot} /> LIVE DATABASE
            </span>
            <strong>{data?.databaseEngine || "Supabase PostgreSQL (Live Production)"}</strong>
            <span>Directly syncing {data?.metrics.totalInvitations || 0} celebrations and {data?.metrics.totalRsvps || 0} live RSVPs across the cloud.</span>
          </div>
          <div className={styles.liveStatusRight}>
            <span className={styles.syncTime}>Last synced: {lastSyncTime || "Just now"}</span>
            <button
              type="button"
              onClick={() => loadData()}
              className={styles.refreshLiveBtn}
              disabled={loading}
              title="Sync live records from Supabase"
            >
              <RefreshCw size={12} className={loading ? styles.spinning : ""} />
              {loading ? "Syncing..." : "Sync Live Data"}
            </button>
          </div>
        </div>

        <div className={styles.pageTitleRow}>
          <div>
            <div className={styles.kicker}>PLATFORM MANAGEMENT</div>
            <h1>Superadmin Portal</h1>
          </div>
          <button
            type="button"
            onClick={() => loadData()}
            className={styles.actionBtn}
            style={{ background: "#fff", padding: "8px 14px", fontSize: "12px" }}
          >
            <RefreshCw size={13} /> Refresh Data
          </button>
        </div>

        {/* Global KPIs */}
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <small>Total Invitations</small>
            <strong>{data?.metrics.totalInvitations || 0}</strong>
            <span>{data?.metrics.activeCount || 0} active · {data?.metrics.expiredCount || 0} expired</span>
          </div>

          <div className={styles.kpiCard}>
            <small>Total RSVPs Received</small>
            <strong style={{ color: "#357a4a" }}>{data?.metrics.totalRsvps || 0}</strong>
            <span>{data?.metrics.attendingRsvps || 0} attending · {data?.metrics.declinedRsvps || 0} declined</span>
          </div>

          <div className={styles.kpiCard}>
            <small>Global Page Views</small>
            <strong style={{ color: "#b4945b" }}>{data?.metrics.totalViews || 0}</strong>
            <span>{Object.keys(data?.metrics.globalPlaces || {}).length > 0 ? Object.entries(data?.metrics.globalPlaces || {}).slice(0, 3).map(([p, c]) => `${p} (${c})`).join(" · ") : "Across all live invitations"}</span>
          </div>

          <div className={styles.kpiCard}>
            <small>Plan Distribution</small>
            <strong>{data?.metrics.planBreakdown?.starter || 0}</strong>
            <span>Starter (Free ₹0) · Signature & Keepsake Coming Soon</span>
          </div>
        </section>

        {/* Tabs */}
        <nav className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "invitations" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("invitations")}
          >
            <Layers size={15} /> All Invitations ({data?.invitations.length || 0})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "rsvps" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("rsvps")}
          >
            <Heart size={15} /> Master RSVP Stream ({data?.rsvps.length || 0})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "whatsapp" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("whatsapp")}
          >
            <MessageSquare size={15} /> WhatsApp Broadcast Gateway
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "settings" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={15} /> System & Environment Health
          </button>
        </nav>

        {/* TAB 1: ALL INVITATIONS */}
        {activeTab === "invitations" && (
          <div>
            <div className={styles.tableHeader}>
              <div className={styles.searchBox}>
                <Search size={14} color="#8c857a" />
                <input
                  placeholder="Search by couple, slug, or venue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  value={templateFilter}
                  onChange={(e) => setTemplateFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Templates</option>
                  <option value="elegantgold">Elegant Gold</option>
                  <option value="royalindian">Royal Indian</option>
                  <option value="modernivory">Modern Ivory</option>
                  <option value="gardenfloral">Garden Floral</option>
                  <option value="funbright">Fun & Bright</option>
                  <option value="midnightluxe">Midnight Luxe</option>
                  <option value="minimaljoy">Minimal Joy</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="expired">Expired Only</option>
                </select>
              </div>
            </div>

            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Couple / Event</th>
                    <th>Slug & Link</th>
                    <th>Template</th>
                    <th>Event Date</th>
                    <th>Views</th>
                    <th>RSVPs</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "34px", color: "#8c857a" }}>
                        No invitations match the current search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvitations.map((inv) => {
                      const title = inv.eventType === "Birthday" ? inv.firstName : `${inv.firstName} & ${inv.secondName || ""}`;
                      return (
                        <tr key={inv.slug}>
                          <td className={styles.titleCell}>
                            <strong>{title}</strong>
                            <small>{inv.eventType} · {inv.venue}</small>
                          </td>
                          <td>
                            <code className={styles.slugCode}>{inv.slug}</code>
                          </td>
                          <td>
                            <span className={styles.templateBadge}>{inv.template}</span>
                          </td>
                          <td>
                            <span>{inv.date}</span>
                          </td>
                          <td>
                            <strong>{inv.views}</strong>{inv.viewsByPlace && Object.keys(inv.viewsByPlace).length > 0 && <small style={{ display: "block", fontSize: "10px", color: "#8c857a" }}>{Object.entries(inv.viewsByPlace).slice(0, 1).map(([p, c]) => `${p}`).join("")}</small>}
                          </td>
                          <td>
                            <strong>{inv.rsvpsCount}</strong>{" "}
                            <small style={{ color: "#357a4a" }}>({inv.attendingCount} attending)</small>
                          </td>
                          <td>
                            <span className={inv.isExpired ? styles.expiredBadge : styles.activeBadge}>
                              {inv.isExpired ? "Expired" : "Active"}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionBtns}>
                              <Link
                                href={`/invite/${inv.slug}`}
                                target="_blank"
                                className={styles.actionBtn}
                                title="Open Live Invitation"
                              >
                                <Eye size={12} /> View
                              </Link>
                              <button
                                type="button"
                                onClick={() => extendInvite(inv.slug)}
                                className={styles.actionBtn}
                                title="Extend validity by +7 days"
                              >
                                <Clock size={12} /> +7d
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteInvite(inv.slug, title)}
                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                title="Delete Invitation"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER RSVP STREAM */}
        {activeTab === "rsvps" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#6e675d", margin: 0 }}>
                Live global stream of all guest replies submitted across every celebration.
              </p>
              <button
                type="button"
                onClick={exportMasterCsv}
                className={styles.actionBtn}
                style={{ background: "#263b33", color: "#fff", padding: "8px 16px" }}
              >
                <Download size={13} /> Export Master RSVPs (CSV)
              </button>
            </div>

            <div className={styles.rsvpStream}>
              {data?.rsvps.length === 0 ? (
                <div style={{ background: "#fff", padding: "34px", textAlign: "center", borderRadius: "10px", color: "#8c857a" }}>
                  No RSVPs have been submitted yet.
                </div>
              ) : (
                data?.rsvps.map((rsvp) => (
                  <div className={styles.rsvpCard} key={rsvp.id}>
                    <div className={styles.rsvpCardLeft}>
                      <strong>{rsvp.name}</strong>
                      <small>({rsvp.guest_count} {rsvp.guest_count === 1 ? "guest" : "guests"})</small>
                      <small style={{ color: "#a7553f" }}>
                        · Event: {rsvp.event_name || "Wedding Celebration"}
                      </small>
                      {rsvp.message && <p>“{rsvp.message}”</p>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                      <span
                        className={
                          rsvp.response === "attending"
                            ? styles.activeBadge
                            : rsvp.response === "maybe"
                            ? styles.templateBadge
                            : styles.expiredBadge
                        }
                      >
                        {rsvp.response === "attending" ? "Attending" : rsvp.response}
                      </span>
                      <small style={{ color: "#8c857a", fontSize: "10px" }}>
                        {new Date(rsvp.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WHATSAPP BROADCAST GATEWAY */}
        {activeTab === "whatsapp" && (
          <div className={styles.settingsGrid}>
            <div className={styles.settingBox}>
              <h3>WhatsApp Gateway Status</h3>
              <p style={{ fontSize: "12px", color: "#6e675d", lineHeight: "1.5", marginBottom: "16px" }}>
                Manage the outbound broadcast service used by planners to send invitations and reminders.
              </p>
              <div className={styles.checkItem}>
                <div>
                  <strong>Meta WhatsApp Cloud API</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>Official Meta Graph API v19.0</div>
                </div>
                <span className={styles.checkWarn}>Simulator / Ready to link</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Twilio WhatsApp API</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>Twilio WhatsApp Sandbox</div>
                </div>
                <span className={styles.checkWarn}>Optional fallback</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Direct 1-Click WhatsApp Queue</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>Client-side sequential runner (100% free)</div>
                </div>
                <span className={styles.checkOk}>Active & Live</span>
              </div>
            </div>

            <div className={styles.settingBox}>
              <h3>Test Cloud API Broadcast</h3>
              <p style={{ fontSize: "12px", color: "#6e675d", lineHeight: "1.5", marginBottom: "16px" }}>
                Send a test ping to <code>/api/whatsapp/broadcast</code> to verify delivery payload.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/whatsapp/broadcast", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        slug: data?.invitations[0]?.slug || "live",
                        templateTone: "warmth",
                        recipients: [{ name: "Admin Test", phone: "+919876543210" }],
                      }),
                    });
                    const resData = await res.json();
                    alert(`Gateway responded successfully! Provider: ${resData.provider}. Delivered: ${resData.successfulCount}`);
                  } catch {
                    alert("Test ping failed.");
                  }
                }}
                className={styles.actionBtn}
                style={{ background: "#263b33", color: "#fff", padding: "10px 18px" }}
              >
                <Send size={13} /> Send Gateway Test Ping
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM & ENVIRONMENT */}
        {activeTab === "settings" && (
          <div className={styles.settingsGrid}>
            <div className={styles.settingBox}>
              <h3>Database & Storage Engine</h3>
              <div className={styles.checkItem}>
                <div>
                  <strong>Primary Database Engine</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>{data?.databaseEngine || "Supabase PostgreSQL"}</div>
                </div>
                <span className={styles.checkOk}>Live & Healthy</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Cloud Endpoint</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>{data?.databaseHost || "Connected"}</div>
                </div>
                <span className={styles.checkOk}>100% Live Sync</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Image Storage</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>Supabase Storage & Cloud CDN</div>
                </div>
                <span className={styles.checkOk}>Active</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Live Records Monitored</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>{data?.metrics.totalInvitations || 0} Live Invitations · {data?.metrics.totalRsvps || 0} RSVPs</div>
                </div>
                <span className={styles.checkOk}>Real-Time Tracking</span>
              </div>
            </div>

            <div className={styles.settingBox}>
              <h3>Monetization & Plans Control</h3>
              <div className={styles.checkItem}>
                <div>
                  <strong>Starter Plan (₹0)</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>Free 3-day validity, basic templates</div>
                </div>
                <span className={styles.checkOk}>Active</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Signature Plan (₹199)</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>7-day validity, RSVP analytics</div>
                </div>
                <span className={styles.checkWarn}>Coming Soon</span>
              </div>
              <div className={styles.checkItem}>
                <div>
                  <strong>Keepsake Plan (₹399)</strong>
                  <div style={{ fontSize: "11px", color: "#8c857a" }}>Forever archive, custom domain</div>
                </div>
                <span className={styles.checkWarn}>Coming Soon</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

