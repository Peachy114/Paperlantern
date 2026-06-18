<?php

namespace Database\Factories;

use App\Models\Work;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChapterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'work_id'          => Work::factory(),
            'title'            => 'Chapter ' . fake()->unique()->numberBetween(1, 1000) . ': ' . fake()->sentence(3),
            'content'          => fake()->paragraphs(3, true),
            'order'            => 1, // overridden in seeder
            'status'           => fake()->randomElement(['published', 'draft']),
            'cover' => 'covers/cover_' . fake()->numberBetween(1, 100) . '.jpg',
            'scheduled_at'     => null,
            'is_locked'        => fake()->boolean(20),
            'credits_required' => fake()->numberBetween(0, 5),
            'views'            => fake()->numberBetween(0, 5000),
            'likes' => fake()->numberBetween(0, 5000), 
        ];
    }
}