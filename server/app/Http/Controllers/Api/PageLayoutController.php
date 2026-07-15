<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PageLayoutService;
use Illuminate\Http\JsonResponse;

class PageLayoutController extends Controller
{
    public function __construct(private PageLayoutService $layouts) {}

    public function show(string $page): JsonResponse
    {
        return response()->json($this->layouts->get($page));
    }
}
