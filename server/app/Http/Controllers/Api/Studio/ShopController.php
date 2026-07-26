<?php

namespace App\Http\Controllers\Api\Studio;

use App\Http\Controllers\Controller;
use App\Models\ShopItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ShopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = ShopItem::query()
            ->where('user_id', $request->user()->id)
            ->with('files')
            ->latest()
            ->paginate(max(1, min(40, (int) $request->query('limit', 20))));

        return response()->json(['items' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateItem($request);

        $item = DB::transaction(function () use ($request, $validated) {
            $user = $request->user();
            $validated['user_id'] = $user->id;
            $validated['slug'] = ShopItem::generateSlug($validated['title'], $user->id);
            $validated['labels'] = $this->normalizeLabels($validated['labels'] ?? []);
            $validated['usage'] = $this->normalizeUsage($validated['usage'] ?? []);
            $validated['credit_cost'] = $validated['download_policy'] === 'free'
                ? 0
                : max(1, (int) ($validated['credit_cost'] ?? 1));

            if ($request->hasFile('image')) {
                $validated['image_path'] = $request->file('image')->store("shop/items/{$user->id}", 'public');
            }

            unset($validated['image'], $validated['files']);

            $item = ShopItem::create($validated);
            $this->replaceFiles($item, $request);

            return $item->load('files', 'user:id,name,username,avatar');
        });

        return response()->json($item, 201);
    }

    public function update(Request $request, ShopItem $shopItem): JsonResponse
    {
        abort_unless($shopItem->user_id === $request->user()->id, 403);

        $validated = $this->validateItem($request, true);

        $item = DB::transaction(function () use ($request, $shopItem, $validated) {
            if (isset($validated['title'])) {
                $validated['slug'] = ShopItem::generateSlug($validated['title'], $shopItem->user_id, $shopItem->id);
            }

            if (array_key_exists('labels', $validated)) {
                $validated['labels'] = $this->normalizeLabels($validated['labels'] ?? []);
            }

            if (array_key_exists('usage', $validated)) {
                $validated['usage'] = $this->normalizeUsage($validated['usage'] ?? []);
            }

            if (array_key_exists('download_policy', $validated) || array_key_exists('credit_cost', $validated)) {
                $policy = $validated['download_policy'] ?? $shopItem->download_policy;
                $validated['credit_cost'] = $policy === 'free'
                    ? 0
                    : max(1, (int) ($validated['credit_cost'] ?? $shopItem->credit_cost ?? 1));
            }

            if ($request->hasFile('image')) {
                if ($shopItem->image_path) {
                    Storage::disk('public')->delete($shopItem->image_path);
                }
                $validated['image_path'] = $request->file('image')->store("shop/items/{$shopItem->user_id}", 'public');
            }

            unset($validated['image'], $validated['files']);
            $shopItem->update($validated);

            if ($request->hasFile('files')) {
                $this->replaceFiles($shopItem, $request);
            }

            return $shopItem->fresh(['files', 'user:id,name,username,avatar']);
        });

        return response()->json($item);
    }

    public function destroy(Request $request, ShopItem $shopItem): JsonResponse
    {
        abort_unless($shopItem->user_id === $request->user()->id, 403);
        $shopItem->delete();

        return response()->json(['message' => 'Shop item moved to trash.']);
    }

    private function validateItem(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['sometimes', 'string', 'in:download,adoptable,sticker'],
            'labels' => ['nullable', 'array', 'max:12'],
            'labels.*' => ['string', 'max:50'],
            'status' => ['sometimes', 'string', 'in:draft,published,archived'],
            'download_policy' => ['sometimes', 'string', 'in:free,paid'],
            'credit_cost' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'usage' => ['nullable', 'array'],
            'usage.comments' => ['sometimes', 'boolean'],
            'usage.profile' => ['sometimes', 'boolean'],
            'usage.backgrounds' => ['sometimes', 'boolean'],
            'usage.messages' => ['sometimes', 'boolean'],
            'image' => [$partial ? 'nullable' : 'required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,zip,rar,psd,clip,txt,pdf', 'max:102400'],
        ]);
    }

    private function normalizeLabels(array $labels): array
    {
        return collect($labels)
            ->map(fn($label) => trim((string) $label))
            ->filter()
            ->unique(fn($label) => mb_strtolower($label))
            ->take(12)
            ->values()
            ->all();
    }

    private function normalizeUsage(array $usage): array
    {
        return [
            'comments' => (bool) ($usage['comments'] ?? false),
            'profile' => (bool) ($usage['profile'] ?? false),
            'backgrounds' => (bool) ($usage['backgrounds'] ?? false),
            'messages' => (bool) ($usage['messages'] ?? false),
        ];
    }

    private function replaceFiles(ShopItem $item, Request $request): void
    {
        $paths = $item->files()->pluck('file_path')->filter()->all();
        Storage::disk('local')->delete($paths);
        $item->files()->delete();

        foreach (array_values($request->file('files', [])) as $index => $file) {
            $path = $file->store("shop/downloads/{$item->user_id}/{$item->id}", 'local');
            $item->files()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize() ?: 0,
                'sort_order' => $index,
            ]);
        }
    }
}
