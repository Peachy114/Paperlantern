<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Art;
use App\Models\ArtistSticker;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\CommissionOrder;
use App\Models\EarningTransaction;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use App\Models\Work;
use App\Services\PayoutSimulationService;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RevenueController extends Controller
{
    private const PAYOUT_DAYS = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    ];

    public function index(Request $request): JsonResponse
    {
        $type = $request->string('type', 'artist')->toString();
        $perPage = min(50, max(1, $request->integer('per_page', 20)));

        $data = match ($type) {
            'noble' => $this->platformQuery(['sticker_purchase', 'super_like'])->paginate($perPage),
            'subscription' => EarningTransaction::query()->whereRaw('1 = 0')->paginate($perPage),
            'topups' => WalletTransaction::query()
                ->with('user:id,name,email,role')
                ->where('type', 'credit')
                ->where('source', 'purchase')
                ->latest()
                ->paginate($perPage)
                ->through(fn(WalletTransaction $transaction) => $this->topUpRow($transaction)),
            default => $this->platformQuery(null, ['sticker_purchase', 'super_like'])->paginate($perPage),
        };

        if ($type !== 'topups') {
            $data->through(fn(EarningTransaction $transaction) => $this->earningRow($transaction));
        }

        return response()->json([
            'summary' => $this->summary(),
            'payout_settings' => $this->payoutSettings(),
            'data' => $data,
        ]);
    }

    public function showPayoutSettings(): JsonResponse
    {
        return response()->json(['payout_settings' => $this->payoutSettings()]);
    }

    private function payoutSettings(): array
    {
        return AppSetting::valueFor('payout_settings', [
            'day' => 'thursday',
            'notice' => 'Withdrawals are available every Thursday. Requests may be reviewed and processed throughout the payout day. Transfer fees are shouldered by the withdrawing artist or wanderer.',
        ]);
    }

    public function updatePayoutSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'day' => ['required', 'string', Rule::in(self::PAYOUT_DAYS)],
            'notice' => ['nullable', 'string', 'max:500'],
        ]);

        $settings = [
            'day' => strtolower($data['day']),
            'notice' => $data['notice']
                ?: 'Withdrawals are available every ' . ucfirst($data['day']) . '. Requests may be reviewed and processed throughout the payout day. Transfer fees are shouldered by the withdrawing artist or wanderer.',
        ];

        AppSetting::putValue('payout_settings', $settings);

        return response()->json([
            'message' => 'Payout settings updated.',
            'payout_settings' => $settings,
        ]);
    }

    public function simulatePayouts(PayoutSimulationService $payouts): JsonResponse
    {
        $result = $payouts->processPending();

        return response()->json([
            'message' => "Simulated {$result['processed']} payout request(s).",
            'data' => $result,
        ]);
    }

    private function platformQuery(?array $sources = null, ?array $excludeSources = null)
    {
        return EarningTransaction::query()
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
            ->when($sources, fn($query) => $query->whereIn('source', $sources))
            ->when($excludeSources, fn($query) => $query->whereNotIn('source', $excludeSources))
            ->latest();
    }

    private function summary(): array
    {
        $artist = EarningTransaction::query()
            ->whereNotIn('source', ['sticker_purchase', 'super_like'])
            ->selectRaw('SUM(platform_cut) as credits, SUM(platform_php) as php, COUNT(*) as count')
            ->first();
        $noble = EarningTransaction::query()
            ->whereIn('source', ['sticker_purchase', 'super_like'])
            ->selectRaw('SUM(platform_cut) as credits, SUM(platform_php) as php, COUNT(*) as count')
            ->first();
        $topups = WalletTransaction::query()
            ->where('type', 'credit')
            ->where('source', 'purchase')
            ->selectRaw('SUM(amount) as credits, COUNT(*) as count')
            ->first();
        $pending = WithdrawalRequest::query()
            ->where('status', 'pending')
            ->selectRaw('COUNT(*) as count, SUM(amount_php) as php')
            ->first();

        return [
            'artist' => [
                'credits' => (float) ($artist->credits ?? 0),
                'php' => (float) ($artist->php ?? 0),
                'count' => (int) ($artist->count ?? 0),
            ],
            'noble' => [
                'credits' => (float) ($noble->credits ?? 0),
                'php' => (float) ($noble->php ?? 0),
                'count' => (int) ($noble->count ?? 0),
            ],
            'topups' => [
                'credits' => (float) ($topups->credits ?? 0),
                'count' => (int) ($topups->count ?? 0),
            ],
            'pending_withdrawals' => [
                'count' => (int) ($pending->count ?? 0),
                'php' => (float) ($pending->php ?? 0),
            ],
        ];
    }

    private function earningRow(EarningTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'created_at' => $transaction->created_at?->toIso8601String(),
            'source' => $transaction->source,
            'description' => $this->earningDescription($transaction),
            'credits_spent' => (float) $transaction->credits_spent,
            'platform_cut' => (float) $transaction->platform_cut,
            'platform_php' => (float) $transaction->platform_php,
            'receiver_cut' => (float) $transaction->storyteller_cut,
            'receiver_php' => (float) $transaction->storyteller_php,
            'sender' => $transaction->reader ? [
                'name' => $transaction->reader->name,
                'email' => $transaction->reader->email,
                'role' => $transaction->reader->role,
            ] : null,
            'receiver' => $transaction->storyteller ? [
                'name' => $transaction->storyteller->name,
                'email' => $transaction->storyteller->email,
                'role' => $transaction->storyteller->role,
            ] : null,
        ];
    }

    private function topUpRow(WalletTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'created_at' => $transaction->created_at?->toIso8601String(),
            'description' => $transaction->description,
            'credits' => (float) $transaction->amount,
            'balance_after' => (float) $transaction->balance_after,
            'user' => $transaction->user ? [
                'name' => $transaction->user->name,
                'email' => $transaction->user->email,
                'role' => $transaction->user->role,
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

        return trim(ucwords($source) . ($title ? " - {$title}" : ''));
    }
}
