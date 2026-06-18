<?php

namespace Database\Seeders;

use App\Models\Chapter;
use App\Models\User;
use App\Models\Work;
use Illuminate\Database\Seeder;

class WorkSeeder extends Seeder
{
    public function run(): void
    {
        // Download fake images into storage
        $this->downloadFakeImages();

        User::factory(5)->create(['role' => 'storyteller'])->each(function (User $storyteller) {
            Work::factory(10)->create(['user_id' => $storyteller->id])->each(function (Work $work) {
                foreach (range(1, 10) as $order) {
                    $chapter = Chapter::factory()->create([
                        'work_id'   => $work->id,
                        'title'     => "Chapter {$order}: " . fake()->sentence(3),
                        'order'     => $order,
                        'status'    => $order <= 8 ? 'published' : 'draft',
                        'is_locked' => $order > 5,
                    ]);

                    foreach (range(1, 5) as $imgOrder) {
                        \App\Models\ChapterImage::create([
                            'chapter_id' => $chapter->id,
                            'path'       => 'chapters/chapter_' . fake()->numberBetween(1, 50) . '.jpg',
                            'order'      => $imgOrder,
                        ]);
                    }
                }
            });
        });
    }

    private function downloadFakeImages(): void
    {
        $dirs = ['covers', 'banners', 'chapters'];
        foreach ($dirs as $dir) {
            \Storage::disk('public')->makeDirectory($dir);
        }

        // Download 20 covers
        for ($i = 1; $i <= 20; $i++) {
            $path = storage_path("app/public/covers/cover_{$i}.jpg");
            if (!file_exists($path)) {
                $img = file_get_contents("https://picsum.photos/seed/cover{$i}/300/400");
                file_put_contents($path, $img);
            }
        }

        // Download 20 banners
        for ($i = 1; $i <= 20; $i++) {
            $path = storage_path("app/public/banners/banner_{$i}.jpg");
            if (!file_exists($path)) {
                $img = file_get_contents("https://picsum.photos/seed/banner{$i}/1200/400");
                file_put_contents($path, $img);
            }
        }

        // Download 50 chapter images
        for ($i = 1; $i <= 50; $i++) {
            $path = storage_path("app/public/chapters/chapter_{$i}.jpg");
            if (!file_exists($path)) {
                $img = file_get_contents("https://picsum.photos/seed/chapter{$i}/800/1200");
                file_put_contents($path, $img);
            }
        }

        $this->command->info('✅ Fake images downloaded.');
    }
}