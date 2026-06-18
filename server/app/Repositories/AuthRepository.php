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
            'username' => $data['username'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
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
}