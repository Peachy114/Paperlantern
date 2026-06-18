<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\AuthRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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

    public function logout(User $user): void
    {
        $this->repo->deleteCurrentToken($user);
    }

    public function logoutAll(User $user): void
    {
        $this->repo->deleteAllTokens($user);
    }

    public function becomeCreator(User $user): array
    {
        $updated = $this->repo->becomeCreator($user);
        return ['user' => $this->formatUser($updated)];
    }

    public function formatUser(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'username' => $user->username,
            'email'    => $user->email,
            'role'     => $user->role,
            'is_banned'=> $user->is_banned,
        ];
    }
}