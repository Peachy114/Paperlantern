<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Art;
use App\Models\ArtistSticker;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\EarningTransaction;
use App\Models\CommissionOrder;
use App\Models\Work;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 100);

        $walletTransactions = WalletTransaction::query()
            ->with('user:id,name,email,role')
            ->latest()
            ->limit($perPage)
            ->get()
            ->map(fn (WalletTransaction $transaction) => $this->walletRow($transaction));

        $platformIncome = EarningTransaction::query()
            ->with([
                'storyteller:id,name,email,role',
                'reader:id,name,email,role',
                'chapter:id,title',
                'earnable' => function (MorphTo $morphTo) {
                    $morphTo->morphWith([
                        Art::class => [],
                        ArtistSticker::class => [],
                        Chapter::class => ['work:id,title'],
                        Comment::class => [],
                        CommissionOrder::class => ['service:id,title'],
                        Work::class => [],
                    ]);
                },
            ])
            ->latest()
            ->limit($perPage)
            ->get()
            ->map(fn (EarningTransaction $transaction) => $this->platformIncomeRow($transaction));

        $withdrawals = WithdrawalRequest::query()
            ->with('user:id,name,email,role')
            ->latest()
            ->limit($perPage)
            ->get()
            ->map(fn (WithdrawalRequest $withdrawal) => $this->withdrawalRow($withdrawal));

        $rows = $walletTransactions
            ->concat($platformIncome)
            ->concat($withdrawals)
            ->sortByDesc('created_at')
            ->values();

        $income = $rows->where('direction', 'income')->values();
        $expense = $rows->where('direction', 'expense')->values();

        return response()->json([
            'summary' => [
                'income_credits' => (float) $income->sum('credits'),
                'expense_credits' => (float) $expense->sum('credits'),
                'income_php' => (float) $income->sum('php_amount'),
                'expense_php' => (float) $expense->sum('php_amount'),
                'income_count' => $income->count(),
                'expense_count' => $expense->count(),
            ],
            'all' => $rows,
            'income' => $income,
            'expense' => $expense,
        ]);
    }

    private function walletRow(WalletTransaction $transaction): array
    {
        $isIncome = $transaction->type === 'credit';

        if (in_array($transaction->source, ['chapter_unlock', 'art_download', 'commission_escrow'], true)) {
            $isIncome = false;
        }

        if (in_array($transaction->source, ['refund', 'commission_refund'], true)) {
            $isIncome = false;
        }

        return [
            'id' => "wallet-{$transaction->id}",
            'created_at' => $transaction->created_at?->toIso8601String(),
            'direction' => $isIncome ? 'income' : 'expense',
            'source' => $transaction->source,
            'description' => $transaction->description,
            'credits' => (float) $transaction->amount,
            'current_credits' => (float) $transaction->balance_after,
            'php_amount' => null,
            'status' => 'success',
            'user' => $transaction->user ? [
                'id' => $transaction->user->id,
                'name' => $transaction->user->name,
                'email' => $transaction->user->email,
                'role' => $transaction->user->role,
            ] : null,
        ];
    }

    private function platformIncomeRow(EarningTransaction $transaction): array
    {
        return [
            'id' => "platform-{$transaction->id}",
            'created_at' => $transaction->created_at?->toIso8601String(),
            'direction' => 'income',
            'source' => "{$transaction->source}_platform_cut",
            'description' => $this->earningDescription($transaction),
            'credits' => (float) $transaction->platform_cut,
            'current_credits' => null,
            'php_amount' => (float) $transaction->platform_php,
            'status' => 'success',
            'user' => $transaction->reader ? [
                'id' => $transaction->reader->id,
                'name' => $transaction->reader->name,
                'email' => $transaction->reader->email,
                'role' => $transaction->reader->role,
            ] : null,
            'counterparty' => $transaction->storyteller ? [
                'id' => $transaction->storyteller->id,
                'name' => $transaction->storyteller->name,
                'email' => $transaction->storyteller->email,
                'role' => $transaction->storyteller->role,
            ] : null,
        ];
    }

    private function withdrawalRow(WithdrawalRequest $withdrawal): array
    {
        return [
            'id' => "withdrawal-{$withdrawal->id}",
            'created_at' => $withdrawal->created_at?->toIso8601String(),
            'direction' => 'expense',
            'source' => 'withdrawal',
            'description' => "Withdrawal to {$withdrawal->payout_method}",
            'credits' => (float) $withdrawal->credits_redeemed,
            'current_credits' => null,
            'php_amount' => (float) $withdrawal->amount_php,
            'status' => match ($withdrawal->status) {
                'paid' => 'success',
                'rejected' => 'failed',
                default => 'pending',
            },
            'user' => $withdrawal->user ? [
                'id' => $withdrawal->user->id,
                'name' => $withdrawal->user->name,
                'email' => $withdrawal->user->email,
                'role' => $withdrawal->user->role,
            ] : null,
        ];
    }

    private function earningDescription(EarningTransaction $transaction): string
    {
        $source = str_replace('_', ' ', $transaction->source);
        $title = $transaction->chapter?->title
            ?? $transaction->earnable?->title
            ?? $transaction->earnable?->service?->title
            ?? $transaction->earnable?->work?->title
            ?? $transaction->earnable?->name
            ?? $transaction->earnable?->body
            ?? null;

        return trim(ucfirst($source) . ($title ? " - {$title}" : ''));
    }
}
