<?php

namespace Tests\Feature;

use App\Models\Art;
use App\Models\User;
use App\Models\Work;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreatorFeatureVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unchecked_features_hide_related_public_content_without_deleting_it(): void
    {
        $creator = User::factory()->create([
            'role' => 'storyteller',
            'creator_role' => 'artist',
            'creator_features' => ['arts', 'commission', 'shop'],
        ]);

        $art = Art::create([
            'user_id' => $creator->id,
            'title' => 'Visible Art',
            'slug' => 'visible-art',
            'image_path' => 'arts/visible-art.jpg',
            'status' => 'published',
            'moderation_status' => 'approved',
        ]);
        $webcomix = Work::factory()->create([
            'user_id' => $creator->id,
            'type' => 'webtoon',
            'status' => 'ongoing',
            'moderation_status' => 'approved',
        ]);

        $this->assertTrue(Art::creatorFeatureVisible()->whereKey($art)->exists());
        $this->assertFalse(Work::creatorFeatureVisible()->whereKey($webcomix)->exists());
        $this->assertDatabaseHas('works', ['id' => $webcomix->id]);

        $creator->update([
            'creator_features' => ['arts', 'commission', 'shop', 'webcomix'],
        ]);

        $this->assertTrue(Work::creatorFeatureVisible()->whereKey($webcomix)->exists());
    }

    public function test_novel_and_webcomix_visibility_are_independent(): void
    {
        $creator = User::factory()->create([
            'role' => 'storyteller',
            'creator_role' => 'storyteller',
            'creator_features' => ['novels', 'shop'],
        ]);

        $novel = Work::factory()->create(['user_id' => $creator->id, 'type' => 'novel']);
        $webcomix = Work::factory()->create(['user_id' => $creator->id, 'type' => 'webtoon']);

        $this->assertTrue(Work::creatorFeatureVisible()->whereKey($novel)->exists());
        $this->assertFalse(Work::creatorFeatureVisible()->whereKey($webcomix)->exists());
    }
}
