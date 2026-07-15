<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Studio\CommissionController as StudioCommissionController;
use App\Models\CommissionArtistProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = (string) $request->query('status', 'pending');

        $profiles = CommissionArtistProfile::query()
            ->when(
                in_array($status, ['not_applied', 'pending', 'approved', 'rejected', 'suspended'], true),
                fn($query) => $query->where('application_status', $status)
            )
            ->with([
                'user' => fn($query) => $query
                    ->select('id', 'name', 'username', 'email', 'role', 'avatar', 'artist_title', 'artist_verified', 'created_at')
                    ->withCount(['works', 'arts']),
            ])
            ->latest()
            ->paginate(30);

        $profiles->getCollection()->transform(fn(CommissionArtistProfile $profile) => $this->format($profile));

        return response()->json([
            'applications' => $profiles,
            'counts' => CommissionArtistProfile::query()
                ->selectRaw('application_status, COUNT(*) as total')
                ->groupBy('application_status')
                ->pluck('total', 'application_status'),
        ]);
    }

    public function update(Request $request, CommissionArtistProfile $profile): JsonResponse
    {
        $validated = $request->validate([
            'application_status' => ['required', 'in:approved,rejected,suspended'],
        ]);

        $status = $validated['application_status'];
        $updates = ['application_status' => $status];

        if ($status === 'approved') {
            $updates['terms_moderation_status'] = 'approved';
        }

        if (in_array($status, ['rejected', 'suspended'], true)) {
            $updates['commissions_enabled'] = false;
            $updates['commission_status'] = 'closed';
        }

        $profile->update($updates);

        return response()->json([
            'message' => "Commission application {$status}.",
            'commission_profile' => $this->format($profile->fresh()->load('user')),
        ]);
    }

    private function format(CommissionArtistProfile $profile): array
    {
        return array_merge(StudioCommissionController::formatProfile($profile), [
            'created_at' => $profile->created_at,
            'updated_at' => $profile->updated_at,
            'user' => $profile->user ? [
                'id' => $profile->user->id,
                'name' => $profile->user->name,
                'username' => $profile->user->username,
                'email' => $profile->user->email,
                'role' => $profile->user->role,
                'avatar' => $profile->user->avatar,
                'artist_title' => $profile->user->artist_title,
                'artist_verified' => (bool) $profile->user->artist_verified,
                'works_count' => (int) ($profile->user->works_count ?? 0),
                'arts_count' => (int) ($profile->user->arts_count ?? 0),
                'created_at' => $profile->user->created_at,
            ] : null,
        ]);
    }
}
