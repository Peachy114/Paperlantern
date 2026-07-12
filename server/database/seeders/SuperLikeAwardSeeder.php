<?php

namespace Database\Seeders;

use App\Models\SuperLikeAward;
use Illuminate\Database\Seeder;

class SuperLikeAwardSeeder extends Seeder
{
    public function run(): void
    {
        foreach (
            [
                ['name' => 'Star', 'icon' => 'star', 'credit_cost' => 1, 'sort_order' => 1],
                ['name' => 'Rocket', 'icon' => 'rocket', 'credit_cost' => 3, 'sort_order' => 2],
                ['name' => 'Glasses', 'icon' => 'glasses', 'credit_cost' => 5, 'sort_order' => 3],
            ] as $award
        ) {
            SuperLikeAward::updateOrCreate(
                ['name' => $award['name']],
                [
                    'icon' => $award['icon'],
                    'credit_cost' => $award['credit_cost'],
                    'is_active' => true,
                    'sort_order' => $award['sort_order'],
                ]
            );
        }
    }
}
