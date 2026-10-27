"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Globe2, LockKeyhole } from "lucide-react";
import styles from "./login.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const next = () => new URLSearchParams(window.location.search).get("next") || "/dashboard";

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "signup" && !result.data.session) { setMessage("Check your email to confirm your account, then log in."); return; }
    router.push(next()); router.refresh();
  }

  async function continueWithGoogle() {
    setBusy(true); setMessage("");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next())}` } });
    if (error) { setBusy(false); setMessage(error.message); }
  }

  return <main className={styles.page}><div className={styles.card}><Link href="/" className={styles.brand}><span>7</span> invite<span>.</span></Link><div className={styles.icon}><LockKeyhole size={18} /></div><div className={styles.kicker}>{mode === "login" ? "HOST LOGIN" : "CREATE HOST ACCOUNT"}</div><h1>{mode === "login" ? <>Welcome<br /><em>back.</em></> : <>Make it<br /><em>yours.</em></>}</h1><p className={styles.intro}>Sign in to manage guests, RSVPs and your invitation.</p><button type="button" className={styles.googleButton} onClick={continueWithGoogle} disabled={busy}><Globe2 size={16} /> Continue with Google</button><div className={styles.divider}><span>or use email</span></div><form onSubmit={submit}><label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p className={styles.message}>{message}</p>}<button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={15} /></button></form><button className={styles.switch} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "New here? Create a host account" : "Already have an account? Sign in"}</button><small className={styles.note}><Check size={12} /> Your dashboard is private to your account.</small></div></main>;
}                 
