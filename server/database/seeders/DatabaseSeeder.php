<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            CreditPackageSeeder::class,
            SuperLikeAwardSeeder::class,
            // WorkSeeder::class,
        ]);

        // User::factory(10)->create();
        User::factory()->create([
            'name'     => 'Test User',
            'username' => 'testuser',
            'email'    => 'test@devorbit.com',
            'role'     => 'wanderer',
        ]);

        // Storyteller
        User::factory()->create([
            'name'     => 'Test Storyteller',
            'username' => 'storyteller',
            'email'    => 'storyteller@devorbit.com',
            'role'     => 'storyteller',
        ]);
    }
}
