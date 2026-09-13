export type Entry = {
  id: string;
  user_id: string;
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
