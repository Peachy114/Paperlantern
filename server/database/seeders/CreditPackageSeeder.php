<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CreditPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Starter',
                'credits' => 30,
                'price' => 39.00,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Popular',
                'credits' => 75,
                'price' => 89.00,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Value',
                'credits' => 150,
                'price' => 169.00,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Supporter',
                'credits' => 300,
                'price' => 319.00,
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::transaction(function () use ($packages) {
            DB::table('credit_packages')
                ->whereIn('name', array_column($packages, 'name'))
                ->delete();

            DB::table('credit_packages')->insert($packages);
        });
    }
}
