<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private WalletService $walletService) {}

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
}