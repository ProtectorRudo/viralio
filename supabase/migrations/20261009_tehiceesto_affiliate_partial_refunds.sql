-- Audit 2026-10-09: an approved order may receive a partial refund while
-- retaining its approved status. The commission reconciliation function already
-- subtracts refunded_amount_minor, but the trigger previously omitted that
-- column, leaving influencer commissions overstated after partial refunds.
-- Run atomically. No historical order, payout or commission rows are changed.
BEGIN;
DROP TRIGGER IF EXISTS trg_sync_affiliate_commission ON public.orders;
CREATE TRIGGER trg_sync_affiliate_commission
AFTER INSERT OR UPDATE OF status, amount_minor, refunded_amount_minor, paid_at
ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_commission_from_order();
COMMIT;
