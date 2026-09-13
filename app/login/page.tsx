"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="loginwrap">
      <form className="loginpanel" onSubmit={submit}>
        <div className="signature">
          <svg width="26" height="18" viewBox="0 0 28 20" fill="none" aria-hidden="true">
            <path d="M13 10 C13 10 4 2 2 6 C0 10 8 10 13 10 Z" fill="var(--accent)" />
            <path d="M15 10 C15 10 24 2 26 6 C28 10 20 10 15 10 Z" fill="var(--accent)" />
            <circle cx="14" cy="10" r="2.4" fill="var(--ink)" opacity="0.15" />
            <circle cx="14" cy="10" r="2" fill="var(--accent)" />
          </svg>
          made by connie
        </div>
        <h1>Know Your Money w/ Connie</h1>
        <p className="loginsub">Sign in to open your tracker.</p>
        <input
          className="loginfield"
          type="email"
          autoFocus
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="loginfield"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="loginerr">{error}</p>}
        <button className="loginbtn" type="submit" disabled={busy || !email || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="loginswitch">
          New here? <a href="/signup">Create an account</a>
        </p>
      </form>
    </div>
  );
}
