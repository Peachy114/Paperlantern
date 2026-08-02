<?php

namespace Database\Seeders;

use App\Models\ArtistSticker;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DefaultStickerSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'super_admin')->first();

        if (! $admin) {
            return;
        }

        $stickers = [
            ['Riri Smile', '#ffe066', '#56b6f7', ':)'],
            ['Riri Cheer', '#ffd43b', '#ff8fab', '!!'],
            ['Riri Love', '#ffe066', '#ff6b9a', '<3'],
            ['Riri Shock', '#ffec99', '#74c0fc', '!?'],
            ['Riri Cry', '#ffd43b', '#91a7ff', ":'("],
            ['Riri Sparkle', '#fff3bf', '#69db7c', '*'],
        ];

        foreach ($stickers as $index => [$name, $hood, $accent, $face]) {
            $path = 'default-stickers/' . str($name)->slug() . '.svg';

            Storage::disk('public')->put($path, $this->svg($name, $hood, $accent, $face));

            ArtistSticker::updateOrCreate(
                [
                    'user_id' => $admin->id,
                    'name' => $name,
                ],
                [
                    'description' => 'Default Riri sticker.',
                    'bundle_name' => 'Riri Defaults',
                    'image_path' => $path,
                    'sort_order' => $index + 1,
                    'is_free' => true,
                    'credit_cost' => 0,
                    'is_public' => true,
                    'subscription_free' => true,
                    'published_at' => now(),
                ]
            );
        }
    }

    private function svg(string $name, string $hood, string $accent, string $face): string
    {
        $safeName = e($name);
        $safeFace = e($face);

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="{$safeName}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#001b44" flood-opacity=".22"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="none"/>
  <g filter="url(#shadow)">
    <circle cx="154" cy="110" r="54" fill="{$hood}" stroke="#0b2c66" stroke-width="12"/>
    <circle cx="358" cy="110" r="54" fill="{$hood}" stroke="#0b2c66" stroke-width="12"/>
    <rect x="72" y="92" width="368" height="320" rx="150" fill="{$hood}" stroke="#0b2c66" stroke-width="14"/>
    <ellipse cx="256" cy="260" rx="150" ry="104" fill="#fff7f2" stroke="#0b2c66" stroke-width="10"/>
    <circle cx="198" cy="258" r="16" fill="#ff7096"/>
    <circle cx="314" cy="258" r="16" fill="#ff7096"/>
    <circle cx="226" cy="234" r="11" fill="#0b2c66"/>
    <circle cx="286" cy="234" r="11" fill="#0b2c66"/>
    <path d="M238 286q18 20 36 0" fill="none" stroke="#0b2c66" stroke-width="10" stroke-linecap="round"/>
    <path d="M248 149q30 26 57 0" fill="none" stroke="#f08c00" stroke-width="14" stroke-linecap="round"/>
    <circle cx="382" cy="202" r="20" fill="{$accent}"/>
    <text x="256" y="392" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="#0b2c66">{$safeFace}</text>
  </g>
</svg>
SVG;
    }
}
