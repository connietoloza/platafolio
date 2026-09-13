"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Entry, type Accounts } from "@/lib/supabase";

const TARGETS: Record<string, number> = { transport: 38, food: 20 };
const USUAL_IN = 250;
const GOAL = 130;

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
  dad: [{ id: "dad", label: "From dad (Zelle)", color: "var(--accent)" }],
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

export default function Tracker() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Accounts>({ paypal: 0, usbank: 0, clp: 0, rate: 942 });
  const [balDraft, setBalDraft] = useState<{ paypal: string; usbank: string; clp: string } | null>(null);
  const [offset, setOffset] = useState(0);
  const [kind, setKind] = useState<"out" | "in" | "dad">("out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cat, setCat] = useState(CATS.out[0].id);
  const [date, setDate] = useState(() => dkey(new Date()));
  const [toast, setToastMsg] = useState<{ text: string; undo?: () => void } | null>(null);
  const [banner, setBanner] = useState("");
  const [loaded, setLoaded] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: e, error: e1 }, { data: a, error: e2 }] = await Promise.all([
        supabase.from("entries").select("*"),
        supabase.from("accounts").select("*").eq("id", "main").maybeSingle(),
      ]);
      if (!alive) return;
      if (e1 || e2) setBanner("Couldn't load your data. Check the Supabase setup and reload.");
      if (e) setEntries(e as Entry[]);
      if (a) setAccounts({ paypal: Number(a.paypal) || 0, usbank: Number(a.usbank) || 0, clp: Number(a.clp) || 0, rate: Number(a.rate) || 942 });
      setLoaded(true);
    })();

    const channel = supabase
      .channel("wiwo-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, (payload) => {
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
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "accounts" }, (payload) => {
        const row = payload.new as any;
        if (!row) return;
        setAccounts({ paypal: Number(row.paypal) || 0, usbank: Number(row.usbank) || 0, clp: Number(row.clp) || 0, rate: Number(row.rate) || 942 });
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function showToast(text: string, undo?: () => void) {
    setToastMsg({ text, undo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 6000);
  }

  async function addEntry(data: Omit<Entry, "id" | "ts">) {
    const e: Entry = { id: localId(), ts: Date.now(), ...data };
    setEntries((prev) => [...prev, e]);
    const { error } = await supabase.from("entries").insert(e);
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

  async function removeEntry(e: Entry) {
    setEntries((prev) => prev.filter((x) => x.id !== e.id));
    await supabase.from("entries").delete().eq("id", e.id);
    showToast(`Deleted ${fmt(e.amount)}${e.note ? " · " + e.note : ""}`, () => addEntry(e));
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

  async function saveBalances() {
    const next = { ...accounts, ...readBalDraft() };
    setAccounts(next);
    setBalDraft(null);
    const { error } = await supabase.from("accounts").upsert({ id: "main", ...next, updated_at: Date.now() });
    if (error) setBanner("That didn't save. Check your connection and try again.");
  }

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

  const sinceFlow = useMemo(() => entries.reduce((s, e) => s + (e.kind === "in" ? e.amount : -e.amount), 0), [entries]);
  const firstDate = useMemo(
    () => (entries.length ? entries.reduce((a, e) => (e.date < a ? e.date : a), entries[0].date) : null),
    [entries]
  );

  const rateVal = accounts.rate > 0 ? accounts.rate : 942;
  const clpUsd = accounts.clp / rateVal;

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
      .filter((c) => sums[c.id] || TARGETS[c.id] != null)
      .map((c) => ({ cat: c, amount: sums[c.id]?.amount || 0, n: sums[c.id]?.n || 0, target: TARGETS[c.id] || 0 }))
      .sort((a, b) => (b.amount || 0) - (a.amount || 0) || b.target - a.target);
    const max = rows.reduce((m, r) => Math.max(m, r.amount, r.target), 1);
    return { rows, max };
  }, [week]);

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
    if (!entries.length || !firstDate) return { banked, weeks: [] as any[], maxV: GOAL, minV: 0, hit: 0 };

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

    const hit = weeks.filter((w) => w.net >= GOAL).length;
    const maxV = weeks.reduce((m, w) => Math.max(m, w.net), GOAL * 1.15);
    const minV = weeks.reduce((m, w) => Math.min(m, w.net), 0);
    return { banked, weeks, maxV, minV, hit };
  }, [entries, firstDate, range]);

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
      date: date || dkey(new Date()),
    });
    setAmount("");
    setNote("");
  }

  function heroFoot() {
    if (!week.length) return offset === 0 ? "Add what you spent or earned below and this fills in." : "Nothing was logged this week.";
    if (totals.totIn === 0) return "No money in yet this week — this is spending only so far.";
    if (totals.net >= 0) return "That's what's still yours out of what came in this week.";
    return "You've spent more than came in this week — the rest is coming out of savings.";
  }
  function trackCap() {
    if (!week.length) return "Nothing in, nothing out.";
    if (totals.totIn === 0) return `Spent ${fmt(totals.spent)} with nothing in yet.`;
    if (totals.net >= 0) return `You've used ${Math.round((totals.spent / totals.totIn) * 100)}% of what came in.`;
    return `Spending is ${fmt(-totals.net)} past this week's income.`;
  }

  const pct = totals.totIn > 0 ? Math.min(100, (totals.spent / totals.totIn) * 100) : totals.spent > 0 ? 100 : 0;
  const draft = balDraft ?? {
    paypal: accounts.paypal ? accounts.paypal.toFixed(2) : "",
    usbank: accounts.usbank ? accounts.usbank.toFixed(2) : "",
    clp: accounts.clp ? String(Math.round(accounts.clp)) : "",
  };

  const usualOut = TARGETS.transport + TARGETS.food;

  return (
    <div className="wrap">
      <header>
        <div>
          <div className="headtop">
            <h1>Week in, week out</h1>
            <button className="logout" onClick={() => (window.location.href = "/api/logout")} type="button">
              log out
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
              "Nothing logged yet — start with whatever you spent today."
            )}
          </p>
        </div>
        <nav className="weeknav" aria-label="Week">
          <button className="arrow" aria-label="Previous week" onClick={() => setOffset((o) => o - 1)}>
            ‹
          </button>
          <button disabled={offset === 0} onClick={() => setOffset(0)}>
            This week
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
          <div className="amount">{fmt(accounts.paypal + accounts.usbank + clpUsd)}</div>
          <span className="sub">at {pesos.format(rateVal)} CLP to the dollar</span>
        </div>
      </section>

      <section className="panel week" aria-label="This week's summary">
        <div className="hero">
          <span className="eyebrow">Left this week</span>
          <div className={"big num " + (totals.net > 0 ? "pos" : totals.net < 0 ? "neg" : "zero")}>
            {totals.net < 0 ? "−" : ""}
            {fmt(Math.abs(totals.net))}
          </div>
          <div className="range">
            {shortDate(range.start)} – {shortDate(range.end)}
            {offset === 0 ? " · this week" : ""}
          </div>
          <p className="herofoot">{heroFoot()}</p>
        </div>
        <div className="flow">
          <div className="flowline">
            <span className="lbl">
              <i className="dotmark" style={{ background: "var(--in)" }} />
              You earned
            </span>
            <span className="val num">{fmt(totals.earned)}</span>
          </div>
          {totals.fromDad > 0 && (
            <div className="flowline">
              <span className="lbl">
                <i className="dotmark" style={{ background: "var(--accent)" }} />
                From your dad
              </span>
              <span className="val num">{fmt(totals.fromDad)}</span>
            </div>
          )}
          <div className="track">
            <div className={"fill" + (totals.spent > totals.totIn && totals.spent > 0 ? " over" : "")} style={{ width: pct + "%" }} />
          </div>
          <div className="flowline">
            <span className="lbl">
              <i className="dotmark" style={{ background: "var(--out)" }} />
              Went out
            </span>
            <span className="val num">{fmt(totals.spent)}</span>
          </div>
          <p className="trackcap">{trackCap()}</p>
          <p className="usual">
            Your usual week: about {fmtShort(USUAL_IN)} in, {fmtShort(TARGETS.transport)} gas + {fmtShort(TARGETS.food)} food — roughly{" "}
            {fmtShort(USUAL_IN - usualOut)} left over.
          </p>
        </div>
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
                    {row.target ? <span className="goal"> / {fmtShort(row.target)}</span> : null}
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
              {offset === 0 ? "Nothing yet this week. Add the first one above — amount, a couple of words, done." : "Nothing was logged this week."}
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
                          <div className="cat">{c.label}</div>
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

      <section className="panel card goal" aria-label="Tuition fund">
        <div className="cardhead">
          <h2>Tuition fund</h2>
          <span className="meta">
            {goal.weeks.length ? `${goal.hit} of ${goal.weeks.length} ${goal.weeks.length === 1 ? "week" : "weeks"} hit ${fmtShort(GOAL)}` : ""}
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
                ? `Aiming for ${fmtShort(GOAL)} a week. Log a few weeks and this shows how you're tracking.`
                : totals.net >= GOAL
                ? `This week you're ${fmt(totals.net - GOAL)} past the ${fmtShort(GOAL)} mark.`
                : `${fmt(GOAL - totals.net)} more this week to reach ${fmtShort(GOAL)}. At ${fmtShort(GOAL)} a week that's ${fmtShort(GOAL * 4)} a month.`}
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
                        <div className="refline target" style={{ bottom: pos(GOAL) + "%" }}>
                          <span className="tag">{fmtShort(GOAL)} goal</span>
                        </div>
                        <div className="wkrow">
                          {goal.weeks.map((w) => {
                            const isNow = w.k === range.startKey;
                            const color = w.net >= GOAL ? "var(--in)" : w.net >= 0 ? "color-mix(in srgb, var(--in) 42%, var(--surface))" : "var(--out)";
                            const end = new Date(w.start);
                            end.setDate(end.getDate() + 6);
                            const t = `${shortDate(w.start)}–${shortDate(end)} · kept ${w.net < 0 ? "−" : ""}${fmt(Math.abs(w.net))} · ${
                              w.net >= GOAL ? "hit the goal" : fmt(GOAL - w.net) + " short"
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
