<?php

namespace App\Services;

use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Models\UserSubscription;
use App\Repositories\AuthRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class AuthService
{
    public function __construct(private AuthRepository $repo) {}

    public function register(array $data): array
    {
        $user  = $this->repo->create($data);
        $token = $this->repo->createToken($user);

        $this->notificationEmails()->send($user, 'Welcome to LaterNComix', [
            "Hi {$user->name},",
            '',
            'Your account has been created successfully.',
            "Account type: {$user->role}",
        ]);

        $this->notificationEmails()->sendToAdmins('New LaterNComix account created', [
            "Name: {$user->name}",
            "Username: {$user->username}",
            "Role: {$user->role}",
            "Email: {$user->email}",
        ]);

        return [
            'message' => 'Registration successful.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ];
    }

    public function login(string $login, string $password): array
    {
        $user = $this->repo->findByEmailOrUsername($login);

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->is_banned) {
            throw ValidationException::withMessages([
                'login' => ['Your account has been banned.'],
            ]);
        }

        $token = $this->repo->createToken($user);

        return [
            'message' => 'Login successful.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ];
    }

    // LOGOUT
    public function logout(User $user): void
    {
        $this->repo->deleteCurrentToken($user);
    }

    //LOGOUT ALL
    public function logoutAll(User $user): void
    {
        $this->repo->deleteAllTokens($user);
    }

    //CREATOR
    public function becomeCreator(User $user): array
    {
        $updated = $this->repo->becomeCreator($user);
        $subscriptionNotice = $this->syncSubscriptionForCreatorRole($updated);

        $this->notificationEmails()->send($updated, 'Creator access enabled', [
            "Hi {$updated->name},",
            '',
            'Your account now has artist tools enabled.',
        ]);

        $this->notificationEmails()->sendToAdmins('A wanderer became an artist', [
            "Name: {$updated->name}",
            "Username: {$updated->username}",
            "Email: {$updated->email}",
        ]);

        return array_filter([
            'user' => $this->formatUser($updated),
            'subscription_notice' => $subscriptionNotice,
        ]);
    }

    private function notificationEmails(): NotificationEmailService
    {
        return app(NotificationEmailService::class);
    }

    private function syncSubscriptionForCreatorRole(User $user): ?string
    {
        $subscription = UserSubscription::with('plan')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->latest()
            ->first();

        if (! $subscription?->plan || $subscription->plan->audience !== 'wanderer') {
            return null;
        }

        $artistPlan = SubscriptionPlan::where('audience', 'storyteller')
            ->where('tier_key', $subscription->plan->tier_key)
            ->where('is_active', true)
            ->orderBy('monthly_credit_cost')
            ->first();

        if (! $artistPlan) {
            $meta = $subscription->meta ?? [];
            $meta['role_change_subscription_notice'] = 'No matching artist subscription is available yet.';
            $subscription->update(['meta' => $meta]);

            return 'Your current subscription stays active, but no matching Artist plan is available yet.';
        }

        $meta = $subscription->meta ?? [];
        $meta['previous_subscription_plan_id'] = $subscription->subscription_plan_id;
        $meta['role_changed_at'] = now()->toDateTimeString();

        if ((int) $artistPlan->monthly_credit_cost === (int) $subscription->plan->monthly_credit_cost) {
            $subscription->update([
                'subscription_plan_id' => $artistPlan->id,
                'meta' => array_merge($meta, [
                    'role_change_subscription_notice' => 'Subscription moved to the matching Artist plan.',
                ]),
            ]);

            return 'Your subscription was moved to the matching Artist plan.';
        }

        $subscription->update([
            'meta' => array_merge($meta, [
                'pending_subscription_plan_id' => $artistPlan->id,
                'role_change_subscription_notice' => 'Artist subscription has a different price. Choose this plan at renewal or cancel your current subscription first.',
            ]),
        ]);

        return 'Your current subscription stays active. The matching Artist plan has a different price, so it is queued until renewal or cancellation.';
    }

    public function formatUser(User $user): array
    {
        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'nickname'  => $user->nickname,
            'username'  => $user->username,
            'email'     => $user->email,
            'role'      => $user->role,
            'is_banned' => $user->is_banned,
            'is_suspended' => (bool) ($user->is_suspended ?? false),
            'dark_mode' => (bool) $user->dark_mode,
            'account_menu_style' => in_array($user->account_menu_style, ['circular', 'detailed'], true)
                ? $user->account_menu_style
                : 'circular',
            'avatar'    => $user->avatar ? url(Storage::url($user->avatar)) : null,
            'profile_cover' => $user->profile_cover ? url(Storage::url($user->profile_cover)) : null,
            'bio'       => $user->bio,
            'artist_title' => $user->artist_title,
            'profile_cover_position_x' => $user->profile_cover_position_x,
            'profile_cover_position_y' => $user->profile_cover_position_y,
            'avatar_position_x' => $user->avatar_position_x,
            'avatar_position_y' => $user->avatar_position_y,
            'show_public_links' => (bool) $user->show_public_links,
            'profile_background_color' => $user->profile_background_color,
            'profile_background_gradient_from' => $user->profile_background_gradient_from,
            'profile_background_gradient_to' => $user->profile_background_gradient_to,
            'profile_background_gradient_direction' => $user->profile_background_gradient_direction,
            'profile_background_image' => $user->profile_background_image ? url(Storage::url($user->profile_background_image)) : null,
            'profile_background_blur' => (int) ($user->profile_background_blur ?? 0),
            'profile_banner_height' => (int) ($user->profile_banner_height ?? 288),
            'profile_avatar_frame_x' => $user->profile_avatar_frame_x ?? 50,
            'profile_avatar_frame_y' => $user->profile_avatar_frame_y ?? 100,
            'profile_avatar_border_width' => (int) ($user->profile_avatar_border_width ?? 4),
            'profile_avatar_border_color' => $user->profile_avatar_border_color,
            'profile_avatar_border_radius' => (int) ($user->profile_avatar_border_radius ?? 100),
            'profile_nav_layout' => $user->profile_nav_layout ?? 'together',
            'profile_nav_x' => $user->profile_nav_x ?? 0,
            'profile_nav_y' => $user->profile_nav_y ?? 0,
            'profile_nav_w' => $user->profile_nav_w ?? 100,
            'profile_nav_h' => (int) ($user->profile_nav_h ?? 32),
            'profile_board_min_height' => (int) ($user->profile_board_min_height ?? 760),
            'profile_arts_tile_width' => (int) ($user->profile_arts_tile_width ?? 220),
            'profile_sticker_size' => (int) ($user->profile_sticker_size ?? 112),
            'profile_show_cover' => (bool) ($user->profile_show_cover ?? true),
            'profile_cover_width' => (int) ($user->profile_cover_width ?? 100),
            'profile_background_has_gradient' => (bool) ($user->profile_background_has_gradient ?? false),
            'profile_tabs_config' => $user->profile_tabs_config,
            'profile_links' => $user->profile_links,
            'profile_border_id' => $user->profile_border_id,
            'twitter_url'   => $user->twitter_url,
            'discord_url'   => $user->discord_url,
            'instagram_url' => $user->instagram_url,
            'tiktok_url'    => $user->tiktok_url,
        ];
    }

    public function handleGoogleLogin(SocialiteUser $googleUser): array
    {
        $user = $this->repo->findByEmail($googleUser->getEmail());

        if (!$user) {
            $user = $this->repo->create([
                'name'     => $googleUser->getName(),
                'username' => $this->repo->generateUsername($googleUser->getName()),
                'email'    => $googleUser->getEmail(),
                'password' => bcrypt(\Illuminate\Support\Str::random(32)),
                'role'     => 'wanderer',
            ]);
        }

        if ($user->is_banned) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'login' => ['Your account has been banned.'],
            ]);
        }

        $token = $this->repo->createToken($user);

        return [
            'message' => 'Login successful.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ];
    }
}
