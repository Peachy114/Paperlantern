<?php

namespace App\Console\Commands;

use App\Services\PayoutSimulationService;
use Illuminate\Console\Command;

class SimulatePayoutRequests extends Command
{
    protected $signature = 'payouts:simulate {--limit= : Maximum pending payout requests to process}';

    protected $description = 'Simulate automated payout processing for pending withdrawal requests.';

    public function handle(PayoutSimulationService $payouts): int
    {
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $result = $payouts->processPending($limit);

        $this->info("Simulated {$result['processed']} payout request(s).");
        $this->line('Total PHP: ' . number_format((float) $result['total_php'], 2));

        return self::SUCCESS;
    }
}
