<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthRepository
{
    public function create(array $data): User
    {
        return User::create([
            'name'     => $data['name'],
            'nickname' => $data['nickname'] ?? null,
            'username' => $data['username'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
            'twitter_url' => $data['twitter_url'] ?? null,
            'discord_url' => $data['discord_url'] ?? null,
            'instagram_url' => $data['instagram_url'] ?? null,
            'tiktok_url' => $data['tiktok_url'] ?? null,
        ]);
    }

    public function findByEmailOrUsername(string $login): ?User
    {
        return User::where('email', $login)
            ->orWhere('username', $login)
            ->first();
    }

    public function createToken(User $user): string
    {
        return $user->createToken('auth_token')->plainTextToken;
    }

    public function deleteCurrentToken(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    public function deleteAllTokens(User $user): void
    {
        $user->tokens()->delete();
    }

    public function becomeCreator(User $user): User
    {
        $user->update(['role' => 'storyteller']);
        return $user->fresh();
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function generateUsername(string $name): string
    {
        $base     = strtolower(preg_replace('/\s+/', '_', $name));
        $username = $base;
        $i        = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . '_' . $i++;
        }

        return $username;
    }
}
