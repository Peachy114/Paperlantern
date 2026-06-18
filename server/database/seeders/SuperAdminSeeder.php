<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'admin@paperlantern.com')],
            [
                'name'     => 'Paperlantern Admin',
                'username' => 'admin',
                'email'    => env('SUPER_ADMIN_EMAIL', 'admin@paperlantern.com'),
                'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'MyCuteWebtoon@@')),
                'role'     => 'super_admin',
            ]
        );

        $this->command->info('✅ Super Admin seeded successfully.');
    }
}