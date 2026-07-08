<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeRequest;
use App\Services\SubscriberServiceInterface;

class SubscribeController extends Controller
{
    public function __construct(
        private readonly SubscriberServiceInterface $subscriberService
    ) {}

    public function store(SubscribeRequest $request)
    {
        $result = $this->subscriberService->subscribe(
            $request->validated('email')
        );

        if ($result['status'] === 'already_subscribed') {
            return response()->json([
                'message' => 'You are already subscribed!',
            ], 200);
        }

        return response()->json([
            'message' => 'You are subscribed! Check your inbox for confirmation.',
        ], 201);
    }
}