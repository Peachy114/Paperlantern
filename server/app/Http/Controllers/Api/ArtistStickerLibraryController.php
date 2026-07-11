<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtistSticker;
use App\Models\User;
use App\Services\ArtistStickerLibraryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtistStickerLibraryController extends Controller
{
    public function __construct(private ArtistStickerLibraryService $stickers) {}

    public function artistStore(Request $request, string $username): JsonResponse
    {
        $artist = User::where('username', $username)->where('role', 'storyteller')->firstOrFail();
        $viewer = auth('sanctum')->user();

        return response()->json($this->stickers->artistStore($artist, $viewer));
    }

    public function library(Request $request): JsonResponse
    {
        return response()->json($this->stickers->userLibrary($request->user()));
    }

    public function subscribe(Request $request, ArtistSticker $sticker): JsonResponse
    {
        return response()->json($this->stickers->subscribe($request->user(), $sticker));
    }

    public function purchase(Request $request, ArtistSticker $sticker): JsonResponse
    {
        return response()->json($this->stickers->purchase($request->user(), $sticker));
    }
}
