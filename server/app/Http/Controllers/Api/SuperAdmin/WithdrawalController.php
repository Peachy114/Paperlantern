<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Services\CommissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WithdrawalController extends Controller
{
    public function __construct(private CommissionService $commissionService) {}

    /**
     * GET /api/admin/withdrawals
     * List all withdrawal requests (filterable by status).
     */
    public function index(Request $request): JsonResponse
    {
        $withdrawals = WithdrawalRequest::with('user:id,name,email')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        return response()->json($withdrawals);
    }

    /**
     * PUT /api/admin/withdrawals/{withdrawal}/process
     * Body: { status: approved|rejected|paid, admin_notes? }
     */
    public function process(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $request->validate([
            'status'      => ['required', 'in:approved,rejected,paid'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        if (! $withdrawal->isPending() && $request->status !== 'paid') {
            return response()->json(['message' => 'This request has already been processed.'], 422);
        }

        $this->commissionService->processWithdrawal(
            $withdrawal,
            $request->status,
            $request->admin_notes
        );

        return response()->json(['message' => "Withdrawal marked as {$request->status}."]);
    }
}