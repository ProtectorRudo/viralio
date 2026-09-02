import type { EventName, FlowState } from "./types";

const transitions: Record<FlowState, Partial<Record<EventName, FlowState>>> = {
  LANDING: { unlock_viewed: "UNLOCK" },
  UNLOCK: { share_initiated: "SHARED" },
  SHARED: { wheel_spun: "REWARDED" },
  REWARDED: {},
};

export function transition(current: FlowState, event: EventName): FlowState {
  const next = transitions[current][event];
  if (!next) throw new Error(`Event ${event} is invalid while session is ${current}`);
  return next;
}

export function canRecordEvent(state: FlowState, event: EventName): boolean {
  const minimum: Partial<Record<EventName, FlowState[]>> = {
    unlock_viewed: ["LANDING"],
    share_channel_selected: ["UNLOCK"],
    share_initiated: ["UNLOCK"],
    wheel_unlocked: ["SHARED"],
    wheel_spun: ["SHARED"],
    reward_issued: ["REWARDED"],
    whatsapp_save_clicked: ["REWARDED"],
  };
  return !minimum[event] || minimum[event]?.includes(state) === true;
}
