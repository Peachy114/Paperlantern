<?php

namespace App\Services;

use App\Models\Art;
use App\Models\CommissionService;
use App\Models\FeatureBoost;
use App\Models\User;
use App\Models\Work;
use App\Repositories\WalletRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FeatureBoostService
{
    public const PRICES = [
        'art' => 20,
        'webtoon' => 40,
        'novel' => 40,
        'artist_profile' => 60,
        'commission' => 50,
    ];

    public function __construct(private WalletRepository $walletRepo) {}

    public function prices(): array
    {
        return self::PRICES;
    }

    public function purchase(User $user, array $validated): array
    {
        if ($user->role !== 'storyteller') {
            abort(403, 'Only artists can buy boosts.');
        }

        [$targetType, $targetId, $priceKey, $targetTitle, $placement] = $this->resolveTarget(
            $user,
            $validated['target_type'],
            $validated['target_id'] ?? null
        );

        $days = (int) $validated['days'];
        $pricePerDay = self::PRICES[$priceKey];
        $cost = $days * $pricePerDay;

        return DB::transaction(function () use (
            $user,
            $targetType,
            $targetId,
            $priceKey,
            $targetTitle,
            $placement,
            $days,
            $pricePerDay,
            $cost
        ) {
            $wallet = $this->walletRepo->findOrCreateByUser($user->id);

            $transaction = $this->walletRepo->debit($wallet, $cost, [
                'source' => 'bonus',
                'description' => "Boost {$targetTitle} for {$days} days",
                'meta' => [
                    'kind' => 'feature_boost',
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'price_key' => $priceKey,
                    'days' => $days,
                    'price_per_day' => $pricePerDay,
                    'placement' => $placement,
                ],
            ]);

            if ($transaction === false) {
                throw ValidationException::withMessages([
                    'credits' => ['Insufficient credits for this boost.'],
                ]);
            }

            $now = now();
            $activeUntil = FeatureBoost::where('target_type', $targetType)
                ->where('target_id', $targetId)
                ->where('status', 'active')
                ->where('ends_at', '>', $now)
                ->max('ends_at');

            $base = $activeUntil ? Carbon::parse($activeUntil) : $now->copy();
            if ($base->lt($now)) {
                $base = $now->copy();
            }

            $boost = FeatureBoost::create([
                'user_id' => $user->id,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'days' => $days,
                'credits_spent' => $cost,
                'starts_at' => $now,
                'ends_at' => $base->copy()->addDays($days),
                'status' => 'active',
            ]);

            return [
                'boost' => $boost,
                'wallet_balance' => $wallet->fresh()->balance,
                'cost' => $cost,
                'price_per_day' => $pricePerDay,
                'placement' => $placement,
            ];
        });
    }

    private function resolveTarget(User $user, string $targetType, ?string $targetId): array
    {
        if ($targetType === 'artist_profile') {
            return [
                'artist_profile',
                $user->id,
                'artist_profile',
                $user->name . ' profile',
                'top of Featured Artists',
            ];
        }

        if ($targetType === 'art') {
            $art = Art::where('user_id', $user->id)
                ->where('id', $targetId)
                ->where('status', 'published')
                ->firstOrFail();

            return ['art', $art->id, 'art', $art->title, 'top of Arts Explore'];
        }

        if ($targetType === 'work') {
            $work = Work::where('user_id', $user->id)
                ->where('id', $targetId)
                ->where('status', '!=', 'draft')
                ->firstOrFail();

            $priceKey = $work->type === 'wattpad' ? 'novel' : 'webtoon';
            $placement = $work->type === 'wattpad'
                ? 'top of Novel Explore'
                : 'top of Webtoon Explore';

            return ['work', $work->id, $priceKey, $work->title, $placement];
        }

        if ($targetType === 'commission_service') {
            $service = CommissionService::where('user_id', $user->id)
                ->where('id', $targetId)
                ->where('is_published', true)
                ->firstOrFail();

            return ['commission_service', $service->id, 'commission', $service->title, 'top of Commission Explore'];
        }

        abort(422, 'Invalid boost target.');
    }
}
