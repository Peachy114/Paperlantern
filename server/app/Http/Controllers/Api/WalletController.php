<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditPaymentSession;
use App\Services\PayMongoService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(
        private WalletService $walletService,
        private PayMongoService $payMongo,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $wallet = $this->walletService->getWallet($request->user());
        return response()->json(['balance' => $wallet->balance]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $history = $this->walletService->getTransactionHistory(
            $request->user(),
            $request->integer('per_page', 15),
        );
        return response()->json($history);
    }

    public function packages(): JsonResponse
    {
        return response()->json(['packages' => $this->walletService->getPackages()]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $request->validate(['package_id' => ['required', 'integer', 'exists:credit_packages,id']]);

        try {
            $result = $this->walletService->initiateCheckout(
                $request->user(),
                $request->integer('package_id'),
            );
            return response()->json($result);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => 'Payment gateway error. Please try again.'], 502);
        }
    }

    public function payment(Request $request, string $payment): JsonResponse
    {
        $session = $this->walletService->getPaymentSession($request->user(), $payment);

        return response()->json($this->paymentPayload($session));
    }

    public function simulatePayment(Request $request, string $payment): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:paid,success,failed,expired'],
        ]);

        try {
            $session = $this->walletService->simulatePayment(
                $request->user(),
                $payment,
                $data['status'],
            );

            $wallet = $this->walletService->getWallet($request->user());

            return response()->json([
                'payment' => $this->paymentPayload($session),
                'wallet' => ['balance' => $wallet->fresh()->balance],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }

    private function paymentPayload(CreditPaymentSession $payment): array
    {
        return [
            'id' => $payment->id,
            'reference_id' => $payment->reference_id,
            'checkout_url' => $payment->checkout_url,
            'status' => $payment->status,
            'currency' => $payment->currency,
            'amount' => (float) $payment->amount,
            'credits' => $payment->credits,
            'description' => $payment->description,
            'provider' => $payment->provider,
            'provider_mode' => $payment->provider_mode,
            'can_simulate' => $this->payMongo->canSimulatePayments(),
            'paid_at' => $payment->paid_at?->toIso8601String(),
            'failed_at' => $payment->failed_at?->toIso8601String(),
            'expired_at' => $payment->expired_at?->toIso8601String(),
            'expires_at' => $payment->expires_at?->toIso8601String(),
            'package' => $payment->package ? [
                'id' => $payment->package->id,
                'name' => $payment->package->name,
                'credits' => $payment->package->credits,
                'price' => (float) $payment->package->price,
            ] : null,
        ];
    }
}
