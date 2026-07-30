<?php

namespace Tests\Feature;

use App\Models\Art;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\CommissionArtistProfile;
use App\Models\CommissionCategory;
use App\Models\CommissionService;
use App\Models\ShopItem;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Work;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiRouteSmokeTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $artist;
    private User $wanderer;
    private Work $work;
    private Chapter $chapter;
    private Art $art;
    private ShopItem $shopItem;
    private CommissionService $commissionService;
    private Ticket $ticket;
    private Comment $comment;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('local');
        Mail::fake();

        $this->admin = User::factory()->create([
            'role' => 'super_admin',
            'username' => 'admin',
            'credits' => 500,
        ]);
        $this->artist = User::factory()->create([
            'role' => 'storyteller',
            'username' => 'artist',
            'credits' => 500,
            'discord_url' => 'artist#0001',
            'twitter_url' => 'https://x.com/artist',
            'instagram_url' => 'https://instagram.com/artist',
            'facebook_url' => 'https://facebook.com/artist',
        ]);
        $this->wanderer = User::factory()->create([
            'role' => 'wanderer',
            'username' => 'wanderer',
            'credits' => 500,
            'discord_url' => 'wanderer#0001',
            'twitter_url' => 'https://x.com/wanderer',
            'instagram_url' => 'https://instagram.com/wanderer',
            'facebook_url' => 'https://facebook.com/wanderer',
        ]);

        $this->work = Work::create([
            'user_id' => $this->artist->id,
            'title' => 'Smoke Test Work',
            'slug' => 'smoke-test-work',
            'description' => 'A work created for API smoke testing.',
            'type' => 'webtoon',
            'genres' => ['Action', 'Fantasy'],
            'content_rating_assessment' => [
                'violence' => 0,
                'sexual_content' => 0,
                'nudity' => 0,
                'profanity' => 0,
                'substances' => 0,
                'sensitivities' => [],
            ],
            'language' => 'en',
            'cover' => 'covers/smoke.jpg',
            'banner' => 'banners/smoke.jpg',
            'status' => 'ongoing',
            'moderation_status' => 'approved',
            'schedule' => 'weekly',
        ]);

        $this->chapter = Chapter::create([
            'work_id' => $this->work->id,
            'title' => 'Smoke Chapter',
            'slug' => 'smoke-chapter',
            'content' => '<p>Smoke chapter content.</p>',
            'order' => 1,
            'status' => 'published',
            'cover' => 'covers/chapter.jpg',
            'lock_type' => 'free',
            'credits_required' => 0,
            'moderation_status' => 'approved',
        ]);

        $this->art = Art::create([
            'user_id' => $this->artist->id,
            'title' => 'Smoke Art',
            'slug' => 'smoke-art',
            'description' => 'Smoke art.',
            'labels' => ['digital', 'test'],
            'image_path' => 'arts/smoke.jpg',
            'original_image_path' => 'arts/original-smoke.jpg',
            'status' => 'published',
            'moderation_status' => 'approved',
            'download_policy' => 'disabled',
        ]);

        $this->shopItem = ShopItem::create([
            'user_id' => $this->artist->id,
            'title' => 'Smoke Shop Item',
            'slug' => 'smoke-shop-item',
            'description' => 'Smoke shop item.',
            'type' => 'download',
            'labels' => ['test'],
            'status' => 'published',
            'image_path' => 'shop/smoke.jpg',
            'download_policy' => 'free',
            'credit_cost' => 0,
            'usage' => ['comments' => false, 'profile' => false, 'backgrounds' => false, 'messages' => false],
        ]);

        CommissionArtistProfile::create([
            'user_id' => $this->artist->id,
            'application_status' => 'approved',
            'commissions_enabled' => true,
            'commission_status' => 'open',
        ]);
        $category = CommissionCategory::query()->firstOrCreate(
            ['slug' => 'illustration'],
            [
                'name' => 'Illustration',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );
        $this->commissionService = CommissionService::create([
            'user_id' => $this->artist->id,
            'commission_category_id' => $category->id,
            'title' => 'Smoke Commission',
            'slug' => 'smoke-commission',
            'description' => 'Smoke commission service.',
            'base_price_credits' => 30,
            'min_price_credits' => 30,
            'delivery_days' => 7,
            'slots_available' => 3,
            'status' => 'open',
            'is_published' => true,
            'flow' => [['type' => 'pay', 'label' => 'Pay', 'percent' => 100]],
            'client_fields' => [
                'name' => ['collect' => true, 'required' => false],
                'discord' => ['collect' => true, 'required' => true],
            ],
        ]);

        $this->ticket = Ticket::create([
            'user_id' => $this->wanderer->id,
            'category' => 'bug',
            'subject' => 'Smoke ticket',
            'message' => 'Smoke ticket body',
            'status' => 'open',
        ]);

        $this->comment = Comment::create([
            'user_id' => $this->wanderer->id,
            'commentable_type' => Work::class,
            'commentable_id' => $this->work->id,
            'body' => 'Smoke comment',
            'status' => 'visible',
        ]);
    }

    public function test_all_registered_api_controller_methods_exist(): void
    {
        $missing = [];

        foreach (app('router')->getRoutes() as $route) {
            $action = $route->getActionName();
            if (! str_contains($action, '@')) {
                continue;
            }

            [$class, $method] = explode('@', $action);
            if (! class_exists($class) || ! method_exists($class, $method)) {
                $missing[] = implode('|', $route->methods()) . ' ' . $route->uri() . " -> {$action}";
            }
        }

        $this->assertSame([], $missing);
    }

    public function test_protected_api_routes_return_json_auth_errors_without_token(): void
    {
        $failures = [];
        $checked = 0;

        foreach (app('router')->getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/') || ! in_array('auth:sanctum', $route->gatherMiddleware(), true)) {
                continue;
            }

            $method = collect($route->methods())->first(fn(string $method) => $method !== 'HEAD') ?: 'GET';
            $response = $this->json($method, '/' . $this->uriForRoute($uri));
            $checked++;

            if ($response->getStatusCode() >= 500) {
                $failures[] = "{$method} {$uri} returned {$response->getStatusCode()}";
            }
        }

        $this->assertGreaterThan(0, $checked);
        $this->assertSame([], $failures);
    }

    public function test_public_get_routes_do_not_return_server_errors(): void
    {
        $failures = [];
        $checked = 0;

        foreach (app('router')->getRoutes() as $route) {
            $uri = $route->uri();
            if (! str_starts_with($uri, 'api/public/') || ! in_array('GET', $route->methods(), true)) {
                continue;
            }

            $response = $this->getJson('/' . $this->uriForRoute($uri));
            $checked++;

            if ($response->getStatusCode() >= 500) {
                $failures[] = "GET {$uri} returned {$response->getStatusCode()}";
            }
        }

        $this->assertGreaterThan(0, $checked);
        $this->assertSame([], $failures);
    }

    public function test_core_mutation_flows_do_not_return_server_errors(): void
    {
        Sanctum::actingAs($this->wanderer);
        $this->postJson('/api/tickets', [
            'category' => 'bug',
            'subject' => 'Smoke API ticket',
            'message' => 'Smoke API ticket body.',
        ])->assertCreated();
        $this->postJson("/api/tickets/{$this->ticket->id}/replies", [
            'message' => 'Smoke reply.',
        ])->assertCreated();
        $this->postJson("/api/comments/work/{$this->work->id}", [
            'body' => 'Smoke API comment.',
        ])->assertCreated();
        $this->postJson("/api/comments/{$this->comment->id}/like")->assertOk();
        $this->postJson("/api/comments/{$this->comment->id}/report", [
            'reason' => 'Spam',
            'details' => 'Smoke report.',
        ])->assertCreated();

        Sanctum::actingAs($this->artist);
        $workResponse = $this->post('/api/studio/works', $this->multipartWorkPayload('Created Smoke Work'));
        $workResponse->assertCreated();
        $workSlug = $workResponse->json('slug');

        $updatedWorkResponse = $this->patchJson("/api/studio/works/{$workSlug}", [
            'title' => 'Updated Smoke Work',
            'description' => 'Updated smoke description.',
            'type' => 'webtoon',
            'genres' => ['Action'],
            'language' => 'en',
        ]);
        $updatedWorkResponse->assertOk();
        $workSlug = $updatedWorkResponse->json('slug');

        $chapterResponse = $this->postJson("/api/studio/works/{$workSlug}/chapters", [
            'title' => 'Created Smoke Chapter',
            'content' => '<p>Created smoke chapter.</p>',
            'status' => 'draft',
            'lock_type' => 'free',
            'credits_required' => 0,
        ]);
        $chapterResponse->assertCreated();
        $chapterSlug = $chapterResponse->json('slug');

        $updatedChapterResponse = $this->patchJson("/api/studio/works/{$workSlug}/chapters/{$chapterSlug}", [
            'title' => 'Updated Smoke Chapter',
            'content' => '<p>Updated smoke chapter.</p>',
            'status' => 'published',
            'lock_type' => 'free',
            'credits_required' => 0,
        ]);
        $updatedChapterResponse->assertOk();
        $chapterSlug = $updatedChapterResponse->json('slug');
        $this->deleteJson("/api/studio/works/{$workSlug}/chapters/{$chapterSlug}")->assertOk();
        $this->deleteJson("/api/studio/works/{$workSlug}")->assertOk();

        $artResponse = $this->post('/api/studio/arts', [
            'title' => 'Created Smoke Art',
            'description' => 'Created smoke art.',
            'labels' => ['smoke', 'art'],
            'status' => 'published',
            'image' => UploadedFile::fake()->image('art.jpg', 400, 400),
        ]);
        $artResponse->assertCreated();
        $artSlug = $artResponse->json('slug');
        $updatedArtResponse = $this->post("/api/studio/arts/{$artSlug}", [
            'title' => 'Updated Smoke Art',
            'description' => 'Updated smoke art.',
            'labels' => ['updated'],
        ]);
        $updatedArtResponse->assertOk();
        $artSlug = $updatedArtResponse->json('slug');
        $this->deleteJson("/api/studio/arts/{$artSlug}")->assertOk();

        $shopResponse = $this->post('/api/studio/shop', [
            'title' => 'Created Smoke Shop Item',
            'description' => 'Created smoke shop item.',
            'type' => 'download',
            'labels' => ['shop'],
            'status' => 'published',
            'download_policy' => 'free',
            'image' => UploadedFile::fake()->image('shop.jpg', 400, 400),
            'files' => [UploadedFile::fake()->create('readme.txt', 4, 'text/plain')],
        ]);
        $shopResponse->assertCreated();
        $this->post("/api/studio/shop/{$shopResponse->json('id')}", [
            'title' => 'Updated Smoke Shop Item',
            'download_policy' => 'free',
        ])->assertOk();
        $this->deleteJson("/api/studio/shop/{$shopResponse->json('id')}")->assertOk();

        $serviceResponse = $this->postJson('/api/studio/commissions/services', [
            'title' => 'Created Smoke Commission Service',
            'commission_category_id' => CommissionCategory::query()->value('id'),
            'description' => 'Created smoke commission service.',
            'base_price_credits' => 30,
            'delivery_days' => 7,
            'slots_available' => 2,
            'status' => 'open',
            'is_published' => true,
            'flow' => [['type' => 'pay', 'label' => 'Pay', 'percent' => 100]],
        ]);
        $serviceResponse->assertCreated();
        $serviceSlug = $serviceResponse->json('slug');
        $updatedServiceResponse = $this->postJson("/api/studio/commissions/services/{$serviceSlug}", [
            'title' => 'Updated Smoke Commission Service',
            'base_price_credits' => 40,
            'status' => 'open',
        ]);
        $updatedServiceResponse->assertOk();
        $serviceSlug = $updatedServiceResponse->json('slug');
        $this->deleteJson("/api/studio/commissions/services/{$serviceSlug}")->assertOk();
    }

    private function multipartWorkPayload(string $title): array
    {
        return [
            'title' => $title,
            'description' => 'A created smoke work.',
            'type' => 'webtoon',
            'genres' => ['Action', 'Fantasy'],
            'content_rating_assessment' => [
                'violence' => 0,
                'sexual_content' => 0,
                'nudity' => 0,
                'profanity' => 0,
                'substances' => 0,
                'sensitivities' => [],
            ],
            'content_rating_agreement' => '1',
            'language' => 'en',
            'cover' => UploadedFile::fake()->image('cover.jpg', 400, 600),
            'banner' => UploadedFile::fake()->image('banner.jpg', 900, 300),
            'schedule' => 'weekly',
            'schedule_time' => '09:00',
        ];
    }

    private function uriForRoute(string $uri): string
    {
        return preg_replace_callback('/\{([^}:]+)(?::[^}]+)?\}/', function (array $matches) {
            return match ($matches[1]) {
                'user' => $this->admin->id,
                'work' => $this->work->slug,
                'chapter' => $this->chapter->slug,
                'art' => $this->art->id,
                'shopItem' => $this->shopItem->id,
                'commission' => $this->commissionService->slug,
                'service' => $this->commissionService->id,
                'ticket' => $this->ticket->id,
                'comment' => $this->comment->id,
                'username' => $this->artist->username,
                'page' => 'home',
                'type' => 'work',
                'id' => $this->work->id,
                'slug' => $this->work->slug,
                default => (string) Str::uuid(),
            };
        }, $uri);
    }
}
