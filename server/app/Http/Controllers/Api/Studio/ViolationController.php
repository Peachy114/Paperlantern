<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ViolationController extends Controller
{
    public function myViolations(Request $request)
    {
        return response()->json(
            $request->user()->violations()
                ->where('created_at', '>=', now()->subHours(24))
                ->latest()
                ->get()
        );
    }
}