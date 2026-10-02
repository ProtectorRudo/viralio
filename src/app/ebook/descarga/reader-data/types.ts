export type ReaderBlock =
  | { type: "kicker" | "h1" | "h2" | "p" | "strong" | "callout" | "bullet"; text: string }
  | { type: "table"; rows: string[][] };
