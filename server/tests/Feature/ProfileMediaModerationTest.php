<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use App\Services\ArtistProfileService;

class ProfileMediaModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_profile_image_is_pending_and_hidden_from_other_users(): void
    {
        Storage::fake('public');
        $creator = User::factory()->create(['role' => 'storyteller']);
        Sanctum::actingAs($creator);

        $this->post('/api/artist-profile/header', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 1200, 1200),
        ])->assertOk();

        $creator->refresh();
        $this->assertSame('pending', $creator->avatar_moderation_status);

        Sanctum::actingAs(User::factory()->create());
        $profile = app(ArtistProfileService::class)->show($creator->username);
        $this->assertNull($profile['artist']['avatar']);
    }

    public function test_validation_uses_clear_megabyte_message(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->post('/api/profile', [
            'avatar' => UploadedFile::fake()->create('huge.jpg', 10241, 'image/jpeg'),
        ])->assertStatus(422)
            ->assertJsonPath('errors.avatar.0', 'Avatar must be 10 MB or smaller.');
    }

    public function test_super_admin_can_save_complete_manage_profile_settings(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        Sanctum::actingAs($admin);

        $tabs = [
            'visibility' => ['board' => true, 'arts' => true, 'works' => true],
            'global_styles' => [
                'show_profile_info' => true,
                'cover_image_fit' => 'cover',
                'avatar_image_fit' => 'cover',
                'background_image_fit' => 'cover',
                'cover_image_zoom' => 1.25,
                'background_image_position_x' => 35,
                'background_image_position_y' => 65,
                'background_image_zoom' => 1.5,
            ],
        ];

        $this->postJson('/api/artist-profile/header', [
            'profile_background_color_enabled' => false,
            'profile_background_has_gradient' => false,
            'profile_show_cover' => true,
            'profile_tabs_config' => json_encode($tabs),
        ])->assertOk()
            ->assertJsonPath('artist.role', 'super_admin')
            ->assertJsonPath('artist.profile_background_color_enabled', false);

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'profile_background_color_enabled' => false,
        ]);
    }
}
