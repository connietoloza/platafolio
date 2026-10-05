export const metadata = { title: "Privacy · Platafolio" };

export default function PrivacyPage() {
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div className="panel card" style={{ marginTop: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Privacy</h1>
        <p className="herofoot" style={{ maxWidth: "none" }}>
          Platafolio is a small personal budgeting tool. Here&rsquo;s what it does with your
          information:
        </p>
        <ul style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7, paddingLeft: 20 }}>
          <li>Your account is authenticated via Supabase (email/password or Google sign-in).</li>
          <li>Your tracker entries and account balances are stored in a Supabase database and are only ever readable by you, enforced by row-level security.</li>
          <li>Nothing is sold, shared, or used for advertising. There is no third-party analytics or tracking on this site.</li>
          <li>If you sign in with Google, this app only receives your basic profile (name, email) needed to create your account, nothing else.</li>
        </ul>
        <p className="herofoot" style={{ maxWidth: "none" }}>
          Questions? Reach out to whoever shared this site with you.
        </p>
      </div>
    </div>
  );
}
