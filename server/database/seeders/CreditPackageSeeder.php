<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CreditPackageSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('credit_packages')->truncate();

        DB::table('credit_packages')->insert([
            ['name' => 'Starter', 'credits' => 20,  'price' => 29.00, 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Popular', 'credits' => 50,  'price' => 59.00, 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Value',   'credits' => 100, 'price' => 99.00, 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}