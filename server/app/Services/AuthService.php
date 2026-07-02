<?php

namespace App\Services;

use App\Models\User;
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
        return ['user' => $this->formatUser($updated)];
    }

    public function formatUser(User $user): array
    {
        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'username'  => $user->username,
            'email'     => $user->email,
            'role'      => $user->role,
            'is_banned' => $user->is_banned,
            'dark_mode' => (bool) $user->dark_mode,
            'avatar'    => $user->avatar ? url(Storage::url($user->avatar)) : null,
            'bio'       => $user->bio,
            'twitter_url'   => $user->twitter_url,
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