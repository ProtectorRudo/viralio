/**
 * CIERRE chronological conversation reducer.
 * Input is only pre-classified signals: customer text is never stored in the event log.
 * Fail closed when evidence is incomplete, out of order beyond manageable limits, or
 * when a seller has intervened after a customer's question.
 */
export type EventSignal =
  | "ack" | "purchase" | "rejected" | "optout" | "question" | "ambiguous"
  | "unknown" | "seller_activity" | "human_followup" | "unverified";
export type TimelineEvent = {
  eventId: string;
  atMs: number;
  direction: "in" | "out";
  signal: EventSignal | string;
  aiSignal?: string | null;
};
export type TimelineDecision = {
  status: "candidate" | "waiting" | "review" | "blocked";
  reason: string;
  lastActivityMs: number;
  requiresAiReview: boolean;
};
const HARD_BLOCK = new Set(["purchase", "rejected", "optout", "human_followup"]);
export function assessTimeline(quoteAtMs: number, events: TimelineEvent[]): TimelineDecision {
  const fallback: TimelineDecision = {
    status: "review", reason: "Falta verificar la conversación",
    lastActivityMs: quoteAtMs, requiresAiReview: true,
  };
  if (!Number.isFinite(quoteAtMs) || quoteAtMs <= 0 || events.length > 500) return fallback;
  const ordered = events
    .filter(e => Number.isFinite(e.atMs) && e.atMs >= quoteAtMs)
    .sort((a,b) => a.atMs - b.atMs || a.eventId.localeCompare(b.eventId));
  if (ordered.some(e =>
     HARD_BLOCK.has(e.signal) || ["purchase", "rejection", "optout"].includes(e.aiSignal || "")
  )) {
    return {status:"blocked",reason:"Compra, rechazo, baja o seguimiento humano detectado",
      lastActivityMs:Math.max(quoteAtMs,...ordered.map(e=>e.atMs)),requiresAiReview:false};
  }
  if (events.some(e => !Number.isFinite(e.atMs))) return fallback;
  let openQuestion = false, sellerSinceQuestion = false;
  let unknown = false, sellerIntervention = false, needsAi = false;
  for (const e of ordered) {
    switch (e.signal) {
      case "question": openQuestion=true; sellerSinceQuestion=false; break;
      case "seller_activity":
        sellerIntervention=true;
        if (openQuestion) sellerSinceQuestion=true;
        break;
      case "ack":
        // Acknowledgements never erase prior doubts, open questions, or sales.
        break;
      case "ambiguous":
      case "unknown":
        // An AI classification may be informative but never clears a manual
        // review unless we can verify the whole conversation.
        unknown=true; needsAi=true;break;
      case "unverified":
        unknown=true;break;
      default:
        unknown=true;break;
    }
  }
  const lastActivityMs=ordered.reduce((max,e)=>Math.max(max,e.atMs),quoteAtMs);
  if (unknown)return {status:"review",reason:"Mensaje ambiguo o archivo sin verificar",lastActivityMs,requiresAiReview:needsAi};
  if (openQuestion && !sellerSinceQuestion)
    return {status:"waiting",reason:"El cliente tiene una consulta pendiente",lastActivityMs,requiresAiReview:false};
  if (sellerIntervention)
    return {status:"review",reason:"El vendedor intervino; verificar cierre de la consulta",lastActivityMs,requiresAiReview:false};
  // A bare thank-you after the PDF is not itself a purchase or a rejection.
  return {status:"candidate",reason:"Sin señales de cierre en eventos recibidos; no equivale a permiso de envío",
    lastActivityMs,requiresAiReview:false};
}
