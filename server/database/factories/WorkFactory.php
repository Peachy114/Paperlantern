<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class WorkFactory extends Factory
{
    public function definition(): array
    {
        $genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Slice of Life', 'Supernatural'];

        return [
            'user_id'         => User::where('role', 'storyteller')->inRandomOrder()->first()?->id ?? User::factory(),
            'title'           => fake()->unique()->words(3, true),
            'description'     => fake()->paragraphs(2, true),
            'type'            => fake()->randomElement(['webtoon', 'wattpad']),
            'genres'          => fake()->randomElements($genres, rand(2, 4)),
            'cover'  => 'covers/cover_'  . fake()->numberBetween(1, 100) . '.jpg',
            'banner' => 'banners/banner_' . fake()->numberBetween(1, 100) . '.jpg',
            'status'          => fake()->randomElement(['ongoing', 'completed', 'hiatus']),
            'schedule' => fake()->randomElement(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
            'schedule_time'   => null,
            'next_chapter_at' => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'views'           => fake()->numberBetween(0, 10000),
            'likes' => fake()->numberBetween(0, 5000), 
        ];
    }   
}