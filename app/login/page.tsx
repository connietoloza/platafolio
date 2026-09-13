"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, next: params.get("next") || "/" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "That's not it — try again.");
      return;
    }
    router.replace(data.next || "/");
    router.refresh();
  }

  return (
    <div className="loginwrap">
      <form className="loginpanel" onSubmit={submit}>
        <h1>Week in, week out</h1>
        <p className="loginsub">Enter your passcode to open the tracker.</p>
        <input
          className="loginfield"
          type="password"
          inputMode="text"
          autoFocus
          placeholder="Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
        />
        {error && <p className="loginerr">{error}</p>}
        <button className="loginbtn" type="submit" disabled={busy || !passcode}>
          {busy ? "Checking…" : "Open tracker"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
