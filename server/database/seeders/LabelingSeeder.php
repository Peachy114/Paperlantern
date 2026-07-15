<?php

namespace Database\Seeders;

use App\Models\CommissionCategory;
use App\Models\ContentLabel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LabelingSeeder extends Seeder
{
    public function run(): void
    {
        $genres = [
            'Action',
            'Adventure',
            'Comedy',
            'Drama',
            'Fantasy',
            'Horror',
            'Mystery',
            'Romance',
            'Sci-Fi',
            'Slice of Life',
            'Thriller',
            'Sports',
            'Supernatural',
            'Historical',
            'Psychological',
        ];

        $labels = [
            'Featured',
            'New Creator',
            'Staff Pick',
            'Trending',
            'Completed',
            'Early Access',
            'Premium',
            'Mature Themes',
        ];

        foreach ($genres as $index => $name) {
            $this->upsertLabel('genre', $name, $index + 1);
        }

        foreach ($labels as $index => $name) {
            $this->upsertLabel('label', $name, $index + 1);
        }

        $commissionTypes = [
            'Illustration',
            'Character Design',
            'Webtoon Art',
            'Novel Cover',
            'Stickers',
            'Chibi',
            'Reference Sheet',
        ];

        foreach ($commissionTypes as $index => $name) {
            CommissionCategory::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ]
            );
        }
    }

    private function upsertLabel(string $type, string $name, int $sortOrder): void
    {
        ContentLabel::updateOrCreate(
            ['type' => $type, 'slug' => ContentLabel::makeSlug($name)],
            [
                'name' => $name,
                'sort_order' => $sortOrder,
                'is_active' => true,
            ]
        );
    }
}
