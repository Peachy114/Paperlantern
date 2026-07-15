<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'payment_settings' => $this->payload($request->user()->payment_settings ?? []),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'gcash.account_name' => ['nullable', 'string', 'max:120'],
            'gcash.account_number' => ['nullable', 'string', 'max:40'],
            'maya.account_name' => ['nullable', 'string', 'max:120'],
            'maya.account_number' => ['nullable', 'string', 'max:40'],
        ]);

        $settings = $this->payload($data);
        $request->user()->update(['payment_settings' => $settings]);

        return response()->json([
            'message' => 'Payment settings saved.',
            'payment_settings' => $settings,
        ]);
    }

    private function payload(array $data): array
    {
        return [
            'gcash' => [
                'account_name' => $data['gcash']['account_name'] ?? '',
                'account_number' => $data['gcash']['account_number'] ?? '',
            ],
            'maya' => [
                'account_name' => $data['maya']['account_name'] ?? '',
                'account_number' => $data['maya']['account_number'] ?? '',
            ],
        ];
    }
}
