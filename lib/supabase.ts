import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

export type Entry = {
  id: string;
  kind: "in" | "out";
  amount: number;
  note: string;
  cat: string;
  date: string; // YYYY-MM-DD
  ts: number;
};

export type Accounts = {
  paypal: number;
  usbank: number;
  clp: number;
  rate: number;
};
