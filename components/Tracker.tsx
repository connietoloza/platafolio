"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Entry, Accounts, Goal } from "@/lib/types";

const DEFAULT_TARGETS: Record<string, number> = { transport: 38, food: 35 };
const USUAL_IN = 250;

type Cat = { id: string; label: string; color: string };
const CATS: Record<"out" | "in" | "dad", Cat[]> = {
  out: [
    { id: "transport", label: "Gas", color: "var(--c-transport)" },
    { id: "food", label: "Food out", color: "var(--c-food)" },
    { id: "groceries", label: "Groceries", color: "var(--c-groceries)" },
    { id: "health", label: "Nails & beauty", color: "var(--c-health)" },
    { id: "bills", label: "College & bills", color: "var(--c-bills)" },
    { id: "fun", label: "Going out", color: "var(--c-fun)" },
    { id: "shopping", label: "Shopping", color: "var(--c-shopping)" },
    { id: "other", label: "Other", color: "var(--c-other)" },
  ],
  in: [
    { id: "work", label: "Work (PayPal)", color: "var(--in)" },
    { id: "tips", label: "Tips", color: "var(--in)" },
    { id: "sidejob", label: "Side job", color: "var(--in)" },
    { id: "refund", label: "Refund", color: "var(--in)" },
    { id: "other_in", label: "Other", color: "var(--in)" },
  ],
  dad: [{ id: "dad", label: "Zelled to my bank account from dad", color: "var(--accent)" }],
};
const CATMAP: Record<string, Cat> = {};
(["out", "in", "dad"] as const).forEach((k) => CATS[k].forEach((c) => (CATMAP[c.id] = c)));

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const money0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pesos = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const fmt = (n: number) => money.format(n);
const fmtShort = (n: number) => (n % 1 === 0 ? money0.format(n) : money.format(n));

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function dkey(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parseKey(s: string) {
  const p = String(s || "").split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (d: Date) => MON[d.getMonth()] + " " + d.getDate();
const localId = () => "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function BowIcon() {
  return (
    <svg width="38" height="34" viewBox="0 0 40 36" aria-hidden="true">
      <path
        d="M9 8 Q20 -1 31 8 Q32 18 31 25 Q31 31 25 31 L15 31 Q9 31 9 25 Q8 18 9 8 Z"
        fill="#A97C3F"
      />
      <ellipse cx="20" cy="17" rx="9.5" ry="10.5" fill="#FBDCC4" />
      <path
        d="M10.5 9 Q20 2.5 29.5 9 Q29.5 13 26 12 Q20 9 14 12 Q10.5 13 10.5 9 Z"
        fill="#C79B52"
      />
      <circle cx="14.5" cy="20.5" r="1.7" fill="var(--accent)" opacity="0.45" />
      <circle cx="25.5" cy="20.5" r="1.7" fill="var(--accent)" opacity="0.45" />
      <path d="M12.3 17.6 Q14.5 15.9 16.7 17.6" stroke="#3A2A1E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path
        d="M12.0 17.4 L9.2 15.7 M11.8 18.0 L8.9 17.2 M12.1 18.5 L9.4 18.8"
        stroke="#3A2A1E"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path d="M23.3 17.6 Q25.5 15.9 27.7 17.6" stroke="#3A2A1E" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path
        d="M28.0 17.4 L30.8 15.7 M28.2 18.0 L31.1 17.2 M27.9 18.5 L30.6 18.8"
        stroke="#3A2A1E"
        strokeWidth="0.85"
        strokeLinecap="round"
      />
      <path d="M16.5 23.3 Q20 27.5 23.5 23.3" stroke="#C2454F" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

type Mood = "hello" | "great" | "ok" | "warn";

function MasonIcon({ mood }: { mood: Mood }) {
  const furBrown = "#C08A4E";
  const furShade = "#A9723A";
  const ivory = "#FDF8F3";
  const dark = "#3A2A1E";
  const pink = "#E24A82";
  return (
    <svg width="96" height="108" viewBox="0 0 100 112" aria-hidden="true" className="masonicon">
      <path d="M22 34 Q9 44 15 64 Q24 68 29 54 Q27 40 22 34 Z" fill={furShade} />
      <path d="M78 34 Q91 44 85 64 Q76 68 71 54 Q73 40 78 34 Z" fill={furShade} />
      <ellipse cx="50" cy="82" rx="32" ry="26" fill={furBrown} />
      <ellipse cx="50" cy="94" rx="20" ry="15" fill={ivory} />
      <ellipse cx="33" cy="105" rx="8" ry="6" fill={ivory} />
      <ellipse cx="67" cy="105" rx="8" ry="6" fill={ivory} />
      <circle cx="50" cy="46" r="30" fill={furBrown} />
      <ellipse cx="50" cy="58" rx="20" ry="15" fill={ivory} />
      {mood === "warn" ? (
        <>
          <path d="M31 30 L45 35" stroke={furShade} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M69 30 L55 35" stroke={furShade} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M38 24 Q50 19 62 24" stroke={furShade} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M45 29 Q50 27 55 29" stroke={furShade} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === "great" ? (
        <>
          <path d="M32 44 Q38 35 44 44" stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M56 44 Q62 35 68 44" stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="29" cy="52" r="3.6" fill={pink} opacity="0.35" />
          <circle cx="71" cy="52" r="3.6" fill={pink} opacity="0.35" />
        </>
      ) : (
        <>
          <circle cx="38" cy="42" r={mood === "warn" ? 6.6 : 6} fill={dark} />
          <circle cx="62" cy="42" r={mood === "warn" ? 6.6 : 6} fill={dark} />
          <circle cx="40" cy="40" r="1.9" fill="#fff" />
          <circle cx="64" cy="40" r="1.9" fill="#fff" />
        </>
      )}
      <ellipse cx="50" cy="54" rx="6.5" ry="5" fill={dark} />
      {mood === "great" ? (
        <>
          <path d="M50 58.5 L50 61 M36 61 Q50 76 64 61 Z" stroke={dark} strokeWidth="2.2" fill="#8B2E3C" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M44 68 Q50 76 56 68 Q50 65 44 68 Z" fill="#F27A94" />
        </>
      ) : mood === "warn" ? (
        <path d="M50 58.5 L50 62 M50 62 Q42 57 36 64 M50 62 Q58 57 64 64" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M50 58.5 L50 63 M50 63 Q41 70 34 63 M50 63 Q59 70 66 63" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}
      {mood === "warn" && <path d="M78 22 Q83 30 78 34 Q73 30 78 22 Z" fill="#7CC4F0" stroke="#3B8CC0" strokeWidth="1" />}
      <path d="M26 70 Q50 80 74 70" stroke={pink} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="80" r="4.5" fill="#fff" stroke={pink} strokeWidth="2" />
    </svg>
  );
}

export default function Tracker() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Accounts>({ paypal: 0, usbank: 0, clp: 0, rate: 942 });
  const [balDraft, setBalDraft] = useState<{ paypal: string; usbank: string; clp: string } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>(DEFAULT_TARGETS);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalBy, setGoalBy] = useState("");
  const [whatIfWeekly, setWhatIfWeekly] = useState("130");
  const [whatIfDate, setWhatIfDate] = useState("2026-12-31");
  const [offset, setOffset] = useState(0);
  const [kind, setKind] = useState<"out" | "in" | "dad">("out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cat, setCat] = useState(CATS.out[0].id);
  const [entryAccount, setEntryAccount] = useState<"paypal" | "usbank" | "clp">("usbank");
  const [date, setDate] = useState(() => dkey(new Date()));
  const [toast, setToastMsg] = useState<{ text: string; undo?: () => void } | null>(null);
  const [banner, setBanner] = useState("");
  const [loaded, setLoaded] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const [{ data: e, error: e1 }, { data: a, error: e2 }, { data: g, error: e3 }] = await Promise.all([
        supabase.from("entries").select("*"),
        supabase.from("accounts").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("goals").select("*"),
      ]);
      if (!alive) return;
      if (e1 || e2 || e3) setBanner("Couldn't load your data. Reload the page to try again.");
      if (e) setEntries(e as Entry[]);
      if (a) {
        setAccounts({ paypal: Number(a.paypal) || 0, usbank: Number(a.usbank) || 0, clp: Number(a.clp) || 0, rate: Number(a.rate) || 942 });
        if (a.targets) setTargets(a.targets as Record<string, number>);
      }
      if (g) setGoals(g as Goal[]);
      setLoaded(true);

      const channel = supabase
        .channel("wiwo-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "entries", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setEntries((prev) => {
              if (payload.eventType === "DELETE") return prev.filter((x) => x.id !== (payload.old as any).id);
              const row = payload.new as Entry;
              const i = prev.findIndex((x) => x.id === row.id);
              if (i >= 0) {
                const next = prev.slice();
                next[i] = row;
                return next;
              }
              return [...prev, row];
            });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "accounts", filter: `id=eq.${user.id}` },
          (payload) => {
            const row = payload.new as any;
            if (!row) return;
            setAccounts({ paypal: Number(row.paypal) || 0, usbank: Number(row.usbank) || 0, clp: Number(row.clp) || 0, rate: Number(row.rate) || 942 });
            if (row.targets) setTargets(row.targets);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "goals", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setGoals((prev) => {
              if (payload.eventType === "DELETE") return prev.filter((x) => x.id !== (payload.old as any).id);
              const row = payload.new as Goal;
              const i = prev.findIndex((x) => x.id === row.id);
              if (i >= 0) {
                const next = prev.slice();
                next[i] = row;
                return next;
              }
              return [...prev, row];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  function showToast(text: string, undo?: () => void) {
    setToastMsg({ text, undo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 6000);
  }

  async function applyAccountDelta(account: Entry["account"], kind: "in" | "out", amount: number) {
    if (!account || !userId) return;
    const sign = kind === "out" ? -1 : 1;
    const rate = accounts.rate > 0 ? accounts.rate : 942;
    const next = { ...accounts };
    if (account === "clp") next.clp = accounts.clp + sign * amount * rate;
    else next[account] = accounts[account] + sign * amount;
    setAccounts(next);
    const { error } = await supabase.from("accounts").upsert({ id: userId, ...next, updated_at: Date.now() });
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  async function addEntry(data: Omit<Entry, "id" | "ts" | "user_id">) {
    if (!userId) return;
    const e: Entry = { id: localId(), ts: Date.now(), user_id: userId, ...data };
    setEntries((prev) => [...prev, e]);
    const { error } = await supabase.from("entries").insert(e);
    if (error) setBanner("That didn't save. Check your connection and try again.");
    if (e.account) await applyAccountDelta(e.account, e.kind, e.amount);
  }

  async function removeEntry(e: Entry) {
    setEntries((prev) => prev.filter((x) => x.id !== e.id));
    await supabase.from("entries").delete().eq("id", e.id);
    if (e.account) await applyAccountDelta(e.account, e.kind === "out" ? "in" : "out", e.amount);
    showToast(`Deleted ${fmt(e.amount)}${e.note ? " · " + e.note : ""}`, () => addEntry(e));
  }

  async function updateEntryCat(e: Entry, newCat: string) {
    if (newCat === e.cat) return;
    setEntries((prev) => prev.map((x) => (x.id === e.id ? { ...x, cat: newCat } : x)));
    const { error } = await supabase.from("entries").update({ cat: newCat }).eq("id", e.id);
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  function readBalDraft() {
    const num = (s: string) => {
      const v = parseFloat(s.replace(/[^0-9.-]/g, ""));
      return isFinite(v) ? v : 0;
    };
    return balDraft
      ? { paypal: num(balDraft.paypal), usbank: num(balDraft.usbank), clp: num(balDraft.clp) }
      : accounts;
  }

  async function addGoal(ev: React.FormEvent) {
    ev.preventDefault();
    if (!userId) return;
    const target = Math.abs(parseFloat(goalTarget.replace(/[^0-9.-]/g, "")));
    if (!goalName.trim() || !target || !isFinite(target)) return;
    const g: Goal = { id: localId(), user_id: userId, name: goalName.trim(), target, saved: 0, by: goalBy || null, ts: Date.now() };
    setGoals((prev) => [...prev, g]);
    setGoalName("");
    setGoalTarget("");
    setGoalBy("");
    const { error } = await supabase.from("goals").insert(g);
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  async function updateGoalSaved(id: string, value: string) {
    const saved = Math.abs(parseFloat(value.replace(/[^0-9.-]/g, ""))) || 0;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, saved } : g)));
    const { error } = await supabase.from("goals").update({ saved }).eq("id", id);
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  async function updateGoalBy(id: string, value: string) {
    const by = value || null;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, by } : g)));
    const { error } = await supabase.from("goals").update({ by }).eq("id", id);
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  function weeklyNeeded(g: Goal) {
    if (!g.by) return null;
    const target = parseKey(g.by);
    const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
    if (days <= 0) return null;
    const weeksLeft = Math.max(1, days / 7);
    const remaining = g.target - g.saved;
    if (remaining <= 0) return 0;
    return remaining / weeksLeft;
  }

  async function removeGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await supabase.from("goals").delete().eq("id", id);
  }

  async function saveTarget(catId: string, value: string) {
    if (!userId) return;
    const n = Math.abs(parseFloat(value.replace(/[^0-9.]/g, ""))) || 0;
    const next = { ...targets };
    if (n > 0) next[catId] = n;
    else delete next[catId];
    setTargets(next);
    const { error } = await supabase.from("accounts").upsert({ id: userId, targets: next, updated_at: Date.now() });
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  async function saveBalances() {
    if (!userId) return;
    const next = { ...accounts, ...readBalDraft() };
    setAccounts(next);
    setBalDraft(null);
    const { error } = await supabase.from("accounts").upsert({ id: userId, ...next, updated_at: Date.now() });
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  ["bal-paypal", "bal-usbank", "bal-clp"]; // (kept for reference; inputs are controlled below)

  function weekRange(off: number) {
    const s = startOfWeek(new Date());
    s.setDate(s.getDate() + off * 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    return { start: s, end: e, startKey: dkey(s), endKey: dkey(e) };
  }

  const range = useMemo(() => weekRange(offset), [offset]);
  const week = useMemo(() => entries.filter((e) => e.date >= range.startKey && e.date <= range.endKey), [entries, range]);

  const totals = useMemo(() => {
    let earned = 0, fromDad = 0, spent = 0;
    week.forEach((e) => {
      if (e.kind === "out") spent += e.amount;
      else if (e.cat === "dad") fromDad += e.amount;
      else earned += e.amount;
    });
    const totIn = earned + fromDad;
    return { earned, fromDad, spent, totIn, net: totIn - spent };
  }, [week]);

  const lastWeekRange = useMemo(() => weekRange(offset - 1), [offset]);
  const lastWeekNet = useMemo(() => {
    return entries
      .filter((e) => e.date >= lastWeekRange.startKey && e.date <= lastWeekRange.endKey)
      .reduce((s, e) => s + (e.kind === "out" ? -e.amount : e.amount), 0);
  }, [entries, lastWeekRange]);

  const sinceFlow = useMemo(() => entries.reduce((s, e) => s + (e.kind === "in" ? e.amount : -e.amount), 0), [entries]);
  const firstDate = useMemo(
    () => (entries.length ? entries.reduce((a, e) => (e.date < a ? e.date : a), entries[0].date) : null),
    [entries]
  );

  const rateVal = accounts.rate > 0 ? accounts.rate : 942;
  const clpUsd = accounts.clp / rateVal;
  const currentTotal = accounts.paypal + accounts.usbank + clpUsd;
  const totalAsOfWeekEnd = useMemo(() => {
    const laterFlow = entries
      .filter((e) => e.date > range.endKey)
      .reduce((s, e) => s + (e.kind === "out" ? -e.amount : e.amount), 0);
    return currentTotal - laterFlow;
  }, [entries, range, currentTotal]);
  const whatIfProjection = useMemo(() => {
    const weekly = Math.abs(parseFloat(whatIfWeekly)) || 0;
    if (!whatIfDate) return null;
    const target = parseKey(whatIfDate);
    const days = Math.ceil((target.getTime() - Date.now()) / 86400000);
    if (days <= 0) return null;
    const weeksLeft = days / 7;
    const saved = weekly * weeksLeft;
    return { saved, total: currentTotal + saved, weeksLeft };
  }, [whatIfWeekly, whatIfDate, currentTotal]);

  const totalGoalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalGoalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const weeklyGoalSum = goals.reduce((s, g) => s + (g.by ? weeklyNeeded(g) || 0 : g.target / 52), 0);
  const weeklyGoal = weeklyGoalSum > 0 ? weeklyGoalSum : 130;

  const barRows = useMemo(() => {
    const sums: Record<string, { amount: number; n: number }> = {};
    week.forEach((e) => {
      if (e.kind !== "out") return;
      const c = e.cat || "other";
      if (!sums[c]) sums[c] = { amount: 0, n: 0 };
      sums[c].amount += e.amount;
      sums[c].n++;
    });
    const rows = CATS.out
      .filter((c) => sums[c.id] || targets[c.id] != null)
      .map((c) => ({ cat: c, amount: sums[c.id]?.amount || 0, n: sums[c.id]?.n || 0, target: targets[c.id] || 0 }))
      .sort((a, b) => (b.amount || 0) - (a.amount || 0) || b.target - a.target);
    const max = rows.reduce((m, r) => Math.max(m, r.amount, r.target), 1);
    return { rows, max };
  }, [week, targets]);

  const byDay = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    week.forEach((e) => (map[e.date] = map[e.date] || []).push(e));
    return Object.keys(map)
      .sort()
      .reverse()
      .map((d) => ({
        d,
        day: parseKey(d),
        items: map[d].slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)),
        net: map[d].reduce((s, e) => s + (e.kind === "in" ? e.amount : -e.amount), 0),
      }));
  }, [week]);

  const goal = useMemo(() => {
    const banked = entries.reduce((s, e) => s + (e.kind === "in" ? e.amount : -e.amount), 0);
    if (!entries.length || !firstDate) return { banked, weeks: [] as any[], maxV: weeklyGoal, minV: 0, hit: 0 };

    const nets: Record<string, number> = {};
    entries.forEach((e) => {
      const wk = dkey(startOfWeek(parseKey(e.date)));
      nets[wk] = (nets[wk] || 0) + (e.kind === "in" ? e.amount : -e.amount);
    });

    const cursor = startOfWeek(parseKey(firstDate));
    const lastWeek = range.start;
    let weeks: { start: Date; k: string; net: number }[] = [];
    const c = new Date(cursor);
    while (c <= lastWeek && weeks.length < 200) {
      const k = dkey(c);
      weeks.push({ start: new Date(c), k, net: nets[k] || 0 });
      c.setDate(c.getDate() + 7);
    }
    if (weeks.length > 12) weeks = weeks.slice(-12);

    const hit = weeks.filter((w) => w.net >= weeklyGoal).length;
    const maxV = weeks.reduce((m, w) => Math.max(m, w.net), weeklyGoal * 1.15);
    const minV = weeks.reduce((m, w) => Math.min(m, w.net), 0);
    return { banked, weeks, maxV, minV, hit };
  }, [entries, firstDate, range, weeklyGoal]);

  function fillCats(k: "out" | "in" | "dad") {
    return CATS[k];
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    let amt = Math.abs(parseFloat(amount.replace(/[^0-9.-]/g, "")));
    if (!amt || !isFinite(amt)) {
      showToast("Enter an amount first, like 12.50");
      return;
    }
    amt = Math.round(amt * 100) / 100;
    addEntry({
      kind: kind === "out" ? "out" : "in",
      amount: amt,
      note: note.trim(),
      cat: kind === "dad" ? "dad" : cat,
      account: entryAccount,
      date: date || dkey(new Date()),
    });
    setAmount("");
    setNote("");
  }

  function recommendation(): { mood: Mood; title: string; text: string } {
    if (!week.length)
      return { mood: "hello", title: "Hi, I'm Mason!", text: "Log a few things this week and I'll tell you exactly what to adjust to hit your goal." };
    const topCat = barRows.rows.reduce<typeof barRows.rows[number] | null>(
      (top, r) => (r.amount > (top?.amount ?? 0) ? r : top),
      null
    );
    if (totals.net >= weeklyGoal) {
      return {
        mood: "great",
        title: "Great job!",
        text: `You hit this week's ${fmtShort(weeklyGoal)} goal and kept ${fmt(totals.net)}. Keep this pace and that's about ${fmtShort(
          weeklyGoal * 4
        )} saved a month toward your goal.`,
      };
    }
    if (totals.net >= 0) {
      const gap = weeklyGoal - totals.net;
      const catMsg = topCat ? ` ${topCat.cat.label} was your biggest spend at ${fmt(topCat.amount)}, so cutting back there next week would close most of the gap.` : "";
      return { mood: "ok", title: "Almost there!", text: `You're ${fmt(gap)} short of this week's ${fmtShort(weeklyGoal)} goal.${catMsg}` };
    }
    const catMsg = topCat ? ` Most of it went to ${topCat.cat.label} (${fmt(topCat.amount)}).` : "";
    return {
      mood: "warn",
      title: "Uh oh, heads up!",
      text: `You spent ${fmt(-totals.net)} more than came in this week.${catMsg} Try trimming that next week so you don't fall behind on your goal.`,
    };
  }
  const rec = recommendation();

  const pct = totals.totIn > 0 ? Math.min(100, (totals.spent / totals.totIn) * 100) : totals.spent > 0 ? 100 : 0;
  const draft = balDraft ?? {
    paypal: accounts.paypal ? accounts.paypal.toFixed(2) : "",
    usbank: accounts.usbank ? accounts.usbank.toFixed(2) : "",
    clp: accounts.clp ? String(Math.round(accounts.clp)) : "",
  };

  const usualOut = (targets.transport || 0) + (targets.food || 0);

  if (!loaded) return null;

  return (
    <div className="wrap">
      <div className="signature">
        <BowIcon />
        by Connie Toloza
      </div>
      <header>
        <div>
          <div className="headtop">
            <h1>Platafolio</h1>
            <button className="logout" onClick={logout} type="button">
              log out{userEmail ? ` (${userEmail})` : ""}
            </button>
          </div>
          <p className="since">
            {entries.length ? (
              <>
                Since {shortDate(parseKey(firstDate!))}, in minus out:{" "}
                <b>
                  {sinceFlow >= 0 ? "+" : "−"}
                  {fmt(Math.abs(sinceFlow))}
                </b>
              </>
            ) : (
              "Nothing logged yet. Start with whatever you spent today."
            )}
          </p>
        </div>
        <nav className="weeknav" aria-label="Week">
          <button className="arrow" aria-label="Previous week" onClick={() => setOffset((o) => o - 1)}>
            ‹
          </button>
          <button disabled={offset === 0} onClick={() => setOffset(0)}>
            {offset === 0 ? "This week" : `${shortDate(range.start)} – ${shortDate(range.end)}`}
          </button>
          <button className="arrow" aria-label="Next week" disabled={offset >= 0} onClick={() => setOffset((o) => Math.min(0, o + 1))}>
            ›
          </button>
        </nav>
      </header>

      <section className="panel accounts" aria-label="Account balances">
        <div className="acct">
          <span className="who">
            <i className="dotmark" style={{ background: "var(--c-bills)" }} />
            PayPal
          </span>
          <div className="balwrap">
            <span className="sym">$</span>
            <input
              className="bal num"
              inputMode="decimal"
              aria-label="PayPal balance"
              value={draft.paypal}
              onChange={(e) => setBalDraft({ ...draft, paypal: e.target.value })}
              onBlur={saveBalances}
            />
          </div>
          <span className="sub">where your pay lands</span>
        </div>
        <div className="acct">
          <span className="who">
            <i className="dotmark" style={{ background: "var(--c-transport)" }} />
            US bank
          </span>
          <div className="balwrap">
            <span className="sym">$</span>
            <input
              className="bal num"
              inputMode="decimal"
              aria-label="US bank balance"
              value={draft.usbank}
              onChange={(e) => setBalDraft({ ...draft, usbank: e.target.value })}
              onBlur={saveBalances}
            />
          </div>
          <span className="sub">Zelle lands here</span>
        </div>
        <div className="acct">
          <span className="who">
            <i className="dotmark" style={{ background: "var(--c-shopping)" }} />
            Chilean bank
          </span>
          <div className="balwrap">
            <input
              className="bal num"
              inputMode="decimal"
              aria-label="Chilean bank balance in pesos"
              value={draft.clp}
              onChange={(e) => setBalDraft({ ...draft, clp: e.target.value })}
              onBlur={saveBalances}
            />
            <span className="sym">CLP</span>
          </div>
          <span className="sub">
            about {fmt(clpUsd)} · {pesos.format(accounts.clp)} pesos
          </span>
        </div>
        <div className="acct total">
          <span className="who">All together</span>
          <div className="amount">{fmt(currentTotal)}</div>
          <span className="sub">at {pesos.format(rateVal)} CLP to the dollar</span>
        </div>
      </section>

      <section className="panel week" aria-label="This week's summary">
        <div className="weektop">
          <span className="eyebrow">
            {shortDate(range.start)} – {shortDate(range.end)}
            {offset === 0 ? " · this week" : ""}
          </span>
          <p className="weekgrowth">
            {fmt(totalAsOfWeekEnd)} total as of then
            {week.length > 0 && (
              <>
                {" "}
                · {totals.net >= lastWeekNet ? "▲" : "▼"} {fmt(Math.abs(totals.net - lastWeekNet))} vs the week before
              </>
            )}
          </p>
        </div>
        <div className="weekstats">
          <div className="stat">
            <span className="statlbl">Spent</span>
            <div className="statnum out num">{fmt(totals.spent)}</div>
          </div>
          <div className="stat">
            <span className="statlbl">Earned</span>
            <div className="statnum in num">{fmt(totals.totIn)}</div>
            {totals.fromDad > 0 && <span className="statsub">incl. {fmt(totals.fromDad)} from dad</span>}
          </div>
          <div className="stat">
            <span className="statlbl">Saved</span>
            <div className={"statnum num " + (totals.net >= 0 ? "in" : "out")}>
              {totals.net < 0 ? "−" : ""}
              {fmt(Math.abs(totals.net))}
            </div>
          </div>
        </div>
        <div className="track">
          <div className={"fill" + (totals.spent > totals.totIn && totals.spent > 0 ? " over" : "")} style={{ width: pct + "%" }} />
        </div>
        <p className="usual">
          Your usual week: about {fmtShort(USUAL_IN)} in, {fmtShort(targets.transport || 0)} gas + {fmtShort(targets.food || 0)} food, roughly{" "}
          {fmtShort(USUAL_IN - usualOut)} left over.
        </p>
      </section>

      <form className="panel add" onSubmit={submit} autoComplete="off">
        <div className="seg" role="group" aria-label="What kind of entry">
          <button
            type="button"
            className="out"
            aria-pressed={kind === "out"}
            onClick={() => {
              setKind("out");
              setCat(CATS.out[0].id);
              setEntryAccount("usbank");
            }}
          >
            Spent
          </button>
          <button
            type="button"
            className="in"
            aria-pressed={kind === "in"}
            onClick={() => {
              setKind("in");
              setCat(CATS.in[0].id);
              setEntryAccount("paypal");
            }}
          >
            Earned
          </button>
          <button
            type="button"
            className="dad"
            aria-pressed={kind === "dad"}
            onClick={() => {
              setKind("dad");
              setCat("dad");
              setEntryAccount("usbank");
            }}
          >
            From dad
          </button>
        </div>
        <label className="field">
          <span className="cur">$</span>
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="field f-note">
          <input
            placeholder={kind === "out" ? "what was it?" : kind === "in" ? "who paid you?" : "what was it for?"}
            aria-label="Description"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <label className="field">
          <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} disabled={kind === "dad"}>
            {fillCats(kind).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <select aria-label="Which account" value={entryAccount} onChange={(e) => setEntryAccount(e.target.value as typeof entryAccount)}>
            <option value="paypal">PayPal</option>
            <option value="usbank">US bank</option>
            <option value="clp">Chilean bank</option>
          </select>
        </label>
        <label className="field">
          <input id="date" type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="addbtn" type="submit" disabled={!loaded}>
          Add
        </button>
      </form>

      {banner && <div className="banner">{banner}</div>}

      <div className="cols">
        <section className="panel card" aria-label="Where it's going">
          <div className="cardhead">
            <h2>Where it&rsquo;s going</h2>
            <span className="meta">{totals.spent ? fmt(totals.spent) + " out this week" : "nothing spent yet"}</span>
          </div>
          <div className="bars">
            {barRows.rows.map((row) => {
              const pctOfTotal = totals.spent ? Math.round((row.amount / totals.spent) * 100) : 0;
              const title =
                `${row.cat.label} · ${fmt(row.amount)}` +
                (row.n ? ` · ${row.n} ${row.n === 1 ? "entry" : "entries"}` : "") +
                (totals.spent && row.amount ? ` · ${pctOfTotal}% of spending` : "") +
                (row.target ? (row.target - row.amount >= 0 ? ` · ${fmt(row.target - row.amount)} left of target` : ` · ${fmt(row.amount - row.target)} over target`) : "");
              return (
                <div className={"barrow" + (row.target && row.amount > row.target ? " over" : "")} key={row.cat.id} title={title}>
                  <div className="name">
                    <i className="dotmark" style={{ background: row.cat.color }} />
                    <span>{row.cat.label}</span>
                  </div>
                  <div className="amt">
                    {fmtShort(row.amount)}
                    <span className="goal">
                      {" / $"}
                      <input
                        className="targetinput"
                        inputMode="decimal"
                        aria-label={`Weekly target for ${row.cat.label}`}
                        placeholder="set"
                        key={row.cat.id + ":" + row.target}
                        defaultValue={row.target ? String(row.target) : ""}
                        onBlur={(e) => saveTarget(row.cat.id, e.target.value)}
                      />
                    </span>
                  </div>
                  <div className="bartrack">
                    <div
                      className="barfill"
                      style={{ background: row.cat.color, width: (row.amount > 0 ? Math.max(2, (row.amount / barRows.max) * 100) : 0) + "%" }}
                    />
                    {row.target ? <div className="tick" style={{ left: `calc(${(row.target / barRows.max) * 100}% - 1px)` }} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="legendnote">
            <i /> the line is your weekly target
          </p>
        </section>

        <section className="panel card" aria-label="Entries this week">
          <div className="cardhead">
            <h2>Everything logged</h2>
            <span className="meta">{week.length ? week.length + (week.length === 1 ? " entry" : " entries") : ""}</span>
          </div>
          {!week.length ? (
            <p className="empty">
              {offset === 0 ? "Nothing yet this week. Add the first one above: amount, a couple of words, done." : "Nothing was logged this week."}
            </p>
          ) : (
            byDay.map(({ d, day, items, net }) => (
              <div className="daygroup" key={d}>
                <div className="dayhead">
                  <span>
                    {DOW[day.getDay()]} {shortDate(day)}
                  </span>
                  <span className="num">
                    {net >= 0 ? "+" : "−"}
                    {fmt(Math.abs(net))}
                  </span>
                </div>
                <ul className="entries">
                  {items.map((e) => {
                    const c = CATMAP[e.cat] || CATMAP.other;
                    const tone = e.kind === "out" ? "out" : e.cat === "dad" ? "dad" : "in";
                    return (
                      <li key={e.id}>
                        <i className="dotmark" style={{ background: c.color }} />
                        <div className="etext">
                          <div className="what">{e.note || (e.kind === "in" ? "Money in" : "Spending")}</div>
                          {e.cat === "dad" ? (
                            <div className="cat">{c.label}</div>
                          ) : (
                            <select
                              className="catedit"
                              aria-label={`Category for ${e.note || "this entry"}`}
                              value={e.cat}
                              onChange={(ev) => updateEntryCat(e, ev.target.value)}
                            >
                              {CATS[e.kind === "out" ? "out" : "in"].map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className={"eamt " + tone}>
                          {e.kind === "in" ? "+" : "−"}
                          {fmt(e.amount)}
                        </div>
                        <button className="del" type="button" aria-label="Delete entry" onClick={() => removeEntry(e)}>
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="panel card goal" aria-label="Savings goal">
        <div className="cardhead">
          <h2>Savings goal</h2>
          <span className="meta">
            {goal.weeks.length ? `${goal.hit} of ${goal.weeks.length} ${goal.weeks.length === 1 ? "week" : "weeks"} hit ${fmtShort(weeklyGoal)}` : ""}
          </span>
        </div>
        <div className="goaltop">
          <div>
            <span className="eyebrow">Kept since you started</span>
            <div className="goalbig num" style={{ color: goal.banked >= 0 ? "var(--in)" : "var(--out)" }}>
              {goal.banked < 0 ? "−" : ""}
              {fmt(Math.abs(goal.banked))}
            </div>
            <p className="herofoot">
              {!entries.length
                ? `Aiming for ${fmtShort(weeklyGoal)} a week. Log a few weeks and this shows how you're tracking.`
                : totals.net >= weeklyGoal
                ? `This week you're ${fmt(totals.net - weeklyGoal)} past the ${fmtShort(weeklyGoal)} mark.`
                : `${fmt(weeklyGoal - totals.net)} more this week to reach ${fmtShort(weeklyGoal)}. At ${fmtShort(weeklyGoal)} a week that's ${fmtShort(weeklyGoal * 4)} a month.`}
            </p>
          </div>
          <div>
            <div className="chartarea">
              {goal.weeks.length > 0 && (
                <>
                  {(() => {
                    const range2 = goal.maxV - goal.minV || 1;
                    const pos = (v: number) => ((v - goal.minV) / range2) * 100;
                    return (
                      <>
                        <div className="refline zero" style={{ bottom: pos(0) + "%" }} />
                        <div className="refline target" style={{ bottom: pos(weeklyGoal) + "%" }}>
                          <span className="tag">{fmtShort(weeklyGoal)} goal</span>
                        </div>
                        <div className="wkrow">
                          {goal.weeks.map((w) => {
                            const isNow = w.k === range.startKey;
                            const color = w.net >= weeklyGoal ? "var(--in)" : w.net >= 0 ? "color-mix(in srgb, var(--in) 42%, var(--surface))" : "var(--out)";
                            const end = new Date(w.start);
                            end.setDate(end.getDate() + 6);
                            const t = `${shortDate(w.start)}–${shortDate(end)} · kept ${w.net < 0 ? "−" : ""}${fmt(Math.abs(w.net))} · ${
                              w.net >= weeklyGoal ? "hit the goal" : fmt(weeklyGoal - w.net) + " short"
                            }`;
                            return (
                              <div className="wk" key={w.k} title={t}>
                                <div
                                  className="wkbar"
                                  style={{ background: color, bottom: pos(Math.min(0, w.net)) + "%", height: Math.max(1.5, (Math.abs(w.net) / range2) * 100) + "%" }}
                                />
                                {(isNow || w.net === goal.maxV) && (
                                  <div className="val" style={{ bottom: `calc(${pos(Math.max(0, w.net))}% + 4px)` }}>
                                    {w.net < 0 ? "−" : ""}
                                    {fmtShort(Math.abs(w.net))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
            <div className="wklabels">
              {goal.weeks.length === 0 ? (
                <div>Nothing to chart yet</div>
              ) : (
                goal.weeks.map((w) => (
                  <div className={w.k === range.startKey ? "now" : ""} key={w.k}>
                    {goal.weeks.length > 8 ? String(w.start.getDate()) : shortDate(w.start)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel card" aria-label="Your goals">
        <div className="cardhead">
          <h2>Your goals</h2>
          <span className="meta">{goals.length ? `${fmt(totalGoalSaved)} of ${fmt(totalGoalTarget)}` : ""}</span>
        </div>
        {goals.length === 0 ? (
          <p className="empty">Add what you're saving for below, tuition, a trip, a laptop, whatever, each with its own target.</p>
        ) : (
          goals.map((g) => {
            const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
            const need = weeklyNeeded(g);
            return (
              <div className="goalrow" key={g.id}>
                <span className="gname">{g.name}</span>
                <span className="gamt">
                  $
                  <input
                    inputMode="decimal"
                    aria-label={`Saved toward ${g.name}`}
                    defaultValue={g.saved ? String(Math.round(g.saved)) : "0"}
                    onBlur={(e) => updateGoalSaved(g.id, e.target.value)}
                  />
                  <span className="gtarget">/ {fmtShort(g.target)}</span>
                </span>
                <button className="goaldel" type="button" aria-label={`Remove ${g.name}`} onClick={() => removeGoal(g.id)}>
                  ×
                </button>
                <div className="goalbar">
                  <div className="goalfill" style={{ width: Math.max(2, pct) + "%" }} />
                </div>
                <div className="goalby">
                  <label>
                    by
                    <input
                      type="date"
                      aria-label={`Target date for ${g.name}`}
                      defaultValue={g.by || ""}
                      onChange={(e) => updateGoalBy(g.id, e.target.value)}
                    />
                  </label>
                  {g.by && (
                    <span className="goalneed">
                      {need === null ? "date's passed" : need === 0 ? "already there!" : `${fmt(need)}/week to make it`}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <form className="goaladd" onSubmit={addGoal}>
          <label className="field">
            <input
              placeholder="what are you saving for?"
              aria-label="Goal name"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </label>
          <label className="field amt">
            <span className="cur">$</span>
            <input
              inputMode="decimal"
              placeholder="target"
              aria-label="Goal target amount"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
            />
          </label>
          <label className="field by">
            <span className="cur">by</span>
            <input type="date" aria-label="Goal target date" value={goalBy} onChange={(e) => setGoalBy(e.target.value)} />
          </label>
          <button className="addbtn" type="submit" disabled={!goalName.trim() || !goalTarget}>
            Add goal
          </button>
        </form>
      </section>

      <section className="panel card whatif" aria-label="What if calculator">
        <div className="cardhead">
          <h2>What if?</h2>
        </div>
        <p className="whatifrow">
          If I save
          <span className="field amt whatifamt">
            <span className="cur">$</span>
            <input
              inputMode="decimal"
              aria-label="Weekly amount to save"
              value={whatIfWeekly}
              onChange={(e) => setWhatIfWeekly(e.target.value)}
            />
          </span>
          a week starting now, until
          <span className="field by whatifdate">
            <input type="date" aria-label="Until this date" value={whatIfDate} onChange={(e) => setWhatIfDate(e.target.value)} />
          </span>
        </p>
        <p className="whatifresult">
          {whatIfProjection === null ? (
            "Pick a date after today."
          ) : (
            <>
              that's about {whatIfProjection.weeksLeft.toFixed(1)} weeks, so <b>{fmt(whatIfProjection.saved)}</b> saved on top of what you have now,{" "}
              <b>{fmt(whatIfProjection.total)}</b> total by then.
            </>
          )}
        </p>
      </section>

      <section className="panel card advisor" aria-label="Mason's recommendation">
        <MasonIcon mood={rec.mood} />
        <div className={"bubble mood-" + rec.mood}>
          <div className="bubblehead">
            <span className="bubbletag">Mason says</span>
            <h2>{rec.title}</h2>
          </div>
          <p>{rec.text}</p>
        </div>
      </section>

      <footer className="note">Entries and balances save automatically and sync from any device you log into.</footer>

      {toast && (
        <div className="toast show">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                setToastMsg(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
