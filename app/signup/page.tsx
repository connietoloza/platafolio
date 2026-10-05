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
            <path d="M9 8 Q20 -1 31 8 Q32 18 31 25 Q31 31 25 31 L15 31 Q9 31 9 25 Q8 18 9 8 Z" fill="#A97C3F" />
            <ellipse cx="20" cy="17" rx="9.5" ry="10.5" fill="#FBDCC4" />
            <path d="M10.5 9 Q20 2.5 29.5 9 Q29.5 13 26 12 Q20 9 14 12 Q10.5 13 10.5 9 Z" fill="#C79B52" />
            <circle cx="14.5" cy="20.5" r="1.7" fill="var(--accent)" opacity="0.45" />
            <circle cx="25.5" cy="20.5" r="1.7" fill="var(--accent)" opacity="0.45" />
            <path d="M12.3 17.6 Q14.5 15.9 16.7 17.6" stroke="#3A2A1E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M12.0 17.4 L9.2 15.7 M11.8 18.0 L8.9 17.2 M12.1 18.5 L9.4 18.8" stroke="#3A2A1E" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M23.3 17.6 Q25.5 15.9 27.7 17.6" stroke="#3A2A1E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            <path d="M28.0 17.4 L30.8 15.7 M28.2 18.0 L31.1 17.2 M27.9 18.5 L30.6 18.8" stroke="#3A2A1E" strokeWidth="0.85" strokeLinecap="round" />
            <path d="M16.5 23.3 Q20 27.5 23.5 23.3" stroke="#C2454F" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          </svg>
          by Connie Toloza
        </div>
        <h1>Platafolio</h1>
        {checkEmail ? (
          <p className="loginsub">
            Check <b>{email}</b> for a confirmation link, then come back and sign in.
          </p>
        ) : (
          <>
            <p className="loginsub">Make an account and start tracking exactly where your money goes, and don&rsquo;t let college steal it all :)</p>
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
