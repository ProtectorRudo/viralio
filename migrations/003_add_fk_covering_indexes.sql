CREATE INDEX IF NOT EXISTS sessions_referred_by_idx
  ON public.sessions(referred_by)
  WHERE referred_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS sessions_reward_id_idx
  ON public.sessions(reward_id)
  WHERE reward_id IS NOT NULL;
