<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tickets = $request->user()
            ->tickets()
            ->latest()
            ->get();

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'in:bug,account,payment,other'],
            'subject'  => ['required', 'string', 'max:255'],
            'message'  => ['required', 'string', 'max:2000'],
        ]);

        $ticket = $request->user()->tickets()->create($validated);

        return response()->json($ticket, 201);
    }

    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json($ticket);
    }

    public function replies(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json($ticket->replies()->with('user:id,name')->get());
    }

    public function storeReply(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $reply = $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'is_admin' => false,
        ]);

        return response()->json($reply->load('user:id,name'), 201);
    }
}