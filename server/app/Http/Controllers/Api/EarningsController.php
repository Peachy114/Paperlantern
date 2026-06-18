<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarningsController extends Controller
{
    public function __construct(private CommissionService $commissionService) {}

    /**
     * GET /api/studio/earnings
     * Storyteller's current balance + history.
     */
    public function show(Request $request): JsonResponse
    {
        $earning = $this->commissionService->getEarnings($request->user());

        return response()->json([
            'balance_credits' => $earning->balance,
            'balance_php'     => $earning->php_balance,
            'min_withdrawal'  => CommissionService::MIN_WITHDRAWAL_PHP,
            'can_withdraw'    => $earning->php_balance >= CommissionService::MIN_WITHDRAWAL_PHP,
        ]);
    }

    /**
     * GET /api/studio/earnings/history
     */
    public function history(Request $request): JsonResponse
    {
        $history = $this->commissionService->getEarningHistory(
            $request->user(),
            $request->integer('per_page', 15)
        );

        return response()->json($history);
    }

    /**
     * POST /api/studio/earnings/withdraw
     * Body: { amount_php, payout_method: gcash|maya|bank, payout_details }
     */
    public function withdraw(Request $request): JsonResponse
    {
        $request->validate([
            'amount_php'     => ['required', 'numeric', 'min:' . CommissionService::MIN_WITHDRAWAL_PHP],
            'payout_method'  => ['required', 'in:gcash,maya,bank'],
            'payout_details' => ['required', 'string', 'max:255'],
        ]);

        $result = $this->commissionService->requestWithdrawal($request->user(), $request->all());

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    //ADMIN
    public function adminOverview(): JsonResponse
    {
        $totals = \App\Models\EarningTransaction::selectRaw('
            SUM(credits_spent)    as total_credits_spent,
            SUM(platform_cut)     as total_platform_credits,
            SUM(storyteller_cut)  as total_storyteller_credits,
            SUM(platform_php)     as total_platform_php,
            SUM(storyteller_php)  as total_storyteller_php,
            COUNT(*)              as total_transactions
        ')->first();

        $pendingWithdrawals = \App\Models\WithdrawalRequest::where('status', 'pending')
            ->selectRaw('COUNT(*) as count, SUM(amount_php) as total_php')
            ->first();

        return response()->json([
            'total_credits_spent'        => (int)   ($totals->total_credits_spent        ?? 0),
            'total_platform_credits'     => (int)   ($totals->total_platform_credits     ?? 0),
            'total_storyteller_credits'  => (int)   ($totals->total_storyteller_credits  ?? 0),
            'total_platform_php'         => (float) ($totals->total_platform_php         ?? 0),
            'total_storyteller_php'      => (float) ($totals->total_storyteller_php      ?? 0),
            'total_transactions'         => (int)   ($totals->total_transactions         ?? 0),
            'pending_withdrawals_count'  => (int)   ($pendingWithdrawals->count          ?? 0),
            'pending_withdrawals_php'    => (float) ($pendingWithdrawals->total_php      ?? 0),
        ]);
    }
}