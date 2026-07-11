<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private string $baseUrl  = 'https://api.paymongo.com/v1';
    private string $secretKey;
    private string $publicKey;

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
        $this->publicKey = config('services.paymongo.public_key');
    }

    /**
     * Create a PayMongo checkout link for a credit package.
     *
     * @param  array{amount: int|float, description: string, metadata: array, success_url?: string, cancel_url?: string}  $payload
     */
    public function createCheckoutLink(array $payload): array
    {
        $amountInCentavos = (int) round($payload['amount'] * 100);
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/checkout_sessions", [
                'data' => [
                    'attributes' => [
                        'line_items' => [[
                            'currency' => 'PHP',
                            'amount'   => $amountInCentavos,
                            'name'     => $payload['description'],
                            'quantity' => 1,
                        ]],
                        'payment_method_types' => ["qrph"],
                        'success_url' => $payload['success_url'] ?? "{$frontendUrl}/credits?payment_status=success",
                        'cancel_url'  => $payload['cancel_url'] ?? "{$frontendUrl}/credits?payment_status=failed",
                        'metadata'    => $payload['metadata'],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error('PayMongo createCheckoutSession failed', [
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);
            throw new \RuntimeException('Failed to create PayMongo checkout session.');
        }

        $data = $response->json('data');

        return [
            'checkout_url' => $data['attributes']['checkout_url'],
            'reference_id' => $data['id'],
        ];
    }

    public function mode(): string
    {
        return str_starts_with((string) $this->secretKey, 'sk_test_') ? 'test' : 'live';
    }

    public function canSimulatePayments(): bool
    {
        return app()->environment(['local', 'testing']) || $this->mode() === 'test';
    }

    /**
     * Verify webhook signature from PayMongo.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $webhookSecret = config('services.paymongo.webhook_secret');

        parse_str(str_replace(',', '&', $signature), $parts);

        $timestamp     = $parts['t'] ?? '';
        $signedPayload = $timestamp . '.' . $payload;
        $expected      = hash_hmac('sha256', $signedPayload, $webhookSecret);

        // test mode uses 'te', live mode uses 'li'
        $received = $parts['te'] ?? $parts['li'] ?? '';

        Log::info('PayMongo sig debug', [
            'received' => $received,
            'expected' => $expected,
            'match'    => hash_equals($expected, $received),
        ]);

        return ! empty($received) && hash_equals($expected, $received);
    }

    /**
     * Parse webhook event type and data.
     */
    public function parseWebhookPayload(array $payload): array
    {
        // The envelope
        $attrs = $payload['data']['attributes'] ?? [];
        
        // The actual checkout session is nested inside 'data'
        $session      = $attrs['data'] ?? [];
        $sessionAttrs = $session['attributes'] ?? [];
        $metadata     = $sessionAttrs['metadata'] ?? [];

        return [
            'event'        => $attrs['type'] ?? null,
            'payment_id'   => $session['id'] ?? null,
            'reference_id' => $session['id'] ?? null,
            'amount'       => ($sessionAttrs['line_items'][0]['amount'] ?? 0) / 100,
            'metadata'     => is_array($metadata) ? $metadata : [],
        ];
    }
}
