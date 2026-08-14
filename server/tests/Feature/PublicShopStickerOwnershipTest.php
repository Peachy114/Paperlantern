<?php

namespace Tests\Feature;

use App\Models\ArtistSticker;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicShopStickerOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_admin_stickers_are_already_owned_in_shop(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $viewer = User::factory()->create();
        $sticker = ArtistSticker::query()->create([
            'user_id' => $admin->id,
            'name' => 'Default Sticker',
            'image_path' => 'stickers/default.png',
            'sort_order' => 1,
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/public/shop')->assertOk();
        $shopSticker = collect($response->json('stickers'))->firstWhere('id', $sticker->id);

        $this->assertNotNull($shopSticker);
        $this->assertTrue($shopSticker['owned']);
        $this->assertTrue($shopSticker['can_use']);
        $this->assertTrue($shopSticker['is_free']);
        $this->assertSame(0, $shopSticker['credit_cost']);
    }
}
