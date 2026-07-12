<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Exports\TicketsExport;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['user:id,name,email', 'latestReply', 'source'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json($query->get());
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return response()->json($ticket->load(['user:id,name,email', 'source']));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status'      => ['sometimes', 'in:open,in_progress,resolved,closed'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (($validated['status'] ?? null) === 'resolved' && $ticket->status !== 'resolved') {
            $validated['resolved_at'] = now();
        }

        $ticket->update($validated);

        return response()->json($ticket->fresh());
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted.']);
    }

    public function export()
    {
        return Excel::download(new TicketsExport, 'tickets_' . now()->format('Y-m-d') . '.xlsx');
    }

    public function replies(Ticket $ticket): JsonResponse
    {
        return response()->json($ticket->replies()->with('user:id,name')->get());
    }

    public function storeReply(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $reply = $ticket->replies()->create([
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'is_admin' => true,
        ]);

        return response()->json($reply->load('user:id,name'), 201);
    }

}
