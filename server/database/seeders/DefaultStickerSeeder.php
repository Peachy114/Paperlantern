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
            ['Riri Smile', 'riri-smile.png'],
            ['Riri Plead', 'riri-plead.png'],
            ['Riri Cry', 'riri-cry.png'],
            ['Riri Shock', 'riri-shock.png'],
            ['Riri Love', 'riri-love.png'],
            ['Riri Sparkle Body', 'riri-sparkle-body.png'],
            ['Riri Side Body', 'riri-side-body.png'],
            ['Riri Back Body', 'riri-back-body.png'],
        ];

        foreach ($stickers as $index => [$name, $fileName]) {
            $source = database_path("seeders/assets/riri-stickers/{$fileName}");

            if (! is_file($source)) {
                continue;
            }

            $path = "default-stickers/{$fileName}";
            Storage::disk('public')->put($path, file_get_contents($source));

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
}
