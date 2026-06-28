<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\ChapterView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function views(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get all chapter IDs belonging to this user's works
        $chapterIds = DB::table('chapters')
            ->join('works', 'chapters.work_id', '=', 'works.id')
            ->where('works.user_id', $user->id)
            ->pluck('chapters.id');

        // Views per day for last 7 days
        $rows = DB::table('chapter_views')
            ->whereIn('chapter_id', $chapterIds)
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(created_at) as date, COUNT(*) as views')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Fill in missing days with 0
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $data[] = [
                'date'  => now()->subDays($i)->format('M d'),
                'views' => $rows[$date]->views ?? 0,
            ];
        }

        return response()->json($data);
    }
}