import Tracker from "@/components/Tracker";

// This page reads Supabase env vars at render time; skip static build-time
// prerendering so a deploy never fails just because those aren't set yet.
export const dynamic = "force-dynamic";

export default function Page() {
  return <Tracker />;
}
