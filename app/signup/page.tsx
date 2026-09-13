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

  async function withGoogle() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="loginwrap">
      <form className="loginpanel" onSubmit={submit}>
        <div className="signature">
          <svg width="38" height="34" viewBox="0 0 40 36" aria-hidden="true">
            <path d="M9 8 Q20 -1 31 8 Q32 18 31 25 Q31 31 25 31 L15 31 Q9 31 9 25 Q8 18 9 8 Z" fill="var(--ink)" opacity="0.88" />
            <ellipse cx="20" cy="17" rx="9.5" ry="10.5" fill="#FBDCC4" />
            <path d="M10.5 9 Q20 2.5 29.5 9 Q29.5 13 26 12 Q20 9 14 12 Q10.5 13 10.5 9 Z" fill="var(--ink)" opacity="0.88" />
            <circle cx="14.5" cy="20.5" r="1.7" fill="var(--accent)" opacity="0.45" />
            <circle cx="25.5" cy="20.5" r="1.7" fill="var(--accent)" opacity="0.45" />
            <path d="M12.5 17.5 Q14.5 19.7 16.5 17.5" stroke="var(--ink)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M12.2 17.3 L9.5 14.9 M12.0 17.9 L9.0 16.3 M12.4 18.3 L9.6 17.2" stroke="var(--ink)" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M23.5 17.5 Q25.5 19.7 27.5 17.5" stroke="var(--ink)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M27.8 17.3 L30.5 14.9 M28.0 17.9 L31.0 16.3 M27.6 18.3 L30.4 17.2" stroke="var(--ink)" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M17.5 24 Q20 26 22.5 24" stroke="var(--ink)" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M24.5 28.5 L30.5 22.5" stroke="#FBDCC4" strokeWidth="3" strokeLinecap="round" />
            <path d="M30.5 28.5 L24.5 22.5" stroke="#FBDCC4" strokeWidth="3" strokeLinecap="round" />
            <path d="M27.5 24.1c-.55-.65-1.55-.28-1.55.45 0 .7.9 1.35 1.55 1.9.65-.55 1.55-1.2 1.55-1.9 0-.73-1-1.1-1.55-.45z" fill="var(--accent)" />
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
            <p className="loginsub">Make an account and start tracking exactly where your money goes — and don&rsquo;t let college steal it all :)</p>
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
            <div className="logindivider"><span>or</span></div>
            <button className="googlebtn" type="button" onClick={withGoogle}>
              <GoogleIcon /> Continue with Google
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

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
