<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PayMongoService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PayMongoWebhookController extends Controller
{
    public function __construct(
        private PayMongoService $payMongo,
        private WalletService   $walletService,
    ) {}

    /**
     * POST /api/webhooks/paymongo
     * Receives and processes PayMongo webhook events.
     * Must be excluded from CSRF middleware.
     */
    public function handle(Request $request): Response
    {
        // 1. Verify signature
        $signature = $request->header('Paymongo-Signature');
        $rawBody   = $request->getContent();

        if (! $signature || ! $this->payMongo->verifyWebhookSignature($rawBody, $signature)) {
            Log::warning('PayMongo webhook: invalid signature');
            return response('Unauthorized', 401);
        }

        // 2. Parse payload
        $payload     = $request->json()->all();
        $webhookData = $this->payMongo->parseWebhookPayload($payload);
        $eventType   = $webhookData['event'];

        // 3. Route event
    match ($eventType) {
        'checkout_session.payment.paid' => $this->walletService->handlePaymentSuccess($webhookData),
        default => Log::info("PayMongo webhook: unhandled event [{$eventType}]"),
    };

        return response('OK', 200);
    }
}