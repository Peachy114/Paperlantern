<?php

namespace App\Services;

use App\Models\WithdrawalRequest;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PayoutSimulationService
{
    public function __construct(private CommissionService $commissionService) {}

    public function processPending(?int $limit = null): array
    {
        $query = WithdrawalRequest::query()
            ->where('status', 'pending')
            ->oldest();

        if ($limit) {
            $query->limit($limit);
        }

        /** @var Collection<int, WithdrawalRequest> $withdrawals */
        $withdrawals = $query->get();

        $processed = 0;
        $totalPhp = 0.0;

        DB::transaction(function () use ($withdrawals, &$processed, &$totalPhp) {
            foreach ($withdrawals as $withdrawal) {
                $withdrawal->update([
                    'status' => 'paid',
                    'admin_notes' => trim(($withdrawal->admin_notes ? $withdrawal->admin_notes . "\n" : '') . $this->note()),
                    'processed_at' => now(),
                ]);

                $processed++;
                $totalPhp += (float) $withdrawal->amount_php;
            }
        });

        return [
            'processed' => $processed,
            'total_php' => round($totalPhp, 2),
            'payout_day' => $this->commissionService->payoutSettings()['day'] ?? 'thursday',
        ];
    }

    private function note(): string
    {
        return 'Paid by simulated payout automation. Replace with PayMongo disbursement confirmation before production.';
    }
}
