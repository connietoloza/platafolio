"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
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
        {checkEmail ? (
          <p className="loginsub">
            Check <b>{email}</b> for a confirmation link, then come back and sign in.
          </p>
        ) : (
          <>
            <p className="loginsub">Create your own account &mdash; your own tracker, just for you.</p>
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
              placeholder="Password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="loginerr">{error}</p>}
            <button className="loginbtn" type="submit" disabled={busy || !email || password.length < 6}>
              {busy ? "Creating…" : "Create account"}
            </button>
            <p className="loginswitch">
              Already have one? <a href="/login">Sign in</a>
            </p>
          </>
        )}
      </form>
    </div>
  );
}
