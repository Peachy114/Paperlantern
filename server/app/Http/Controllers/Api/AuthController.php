<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function __construct(private AuthService $service) {}

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:50', 'unique:users,username'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
            'role'     => ['required', 'in:wanderer,storyteller'],
        ]);

        return response()->json($this->service->register($validated), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        try {
            $result = $this->service->login($validated['login'], $validated['password']);
            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json(['message' => $e->errors()['login'][0]], 403);
        }
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->service->formatUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->service->logout($request->user());
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $this->service->logoutAll($request->user());
        return response()->json(['message' => 'Logged out from all devices.']);
    }

    // BECOME CREATOR
    public function becomeCreator(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'wanderer') {
            return response()->json(['message' => 'Already a creator.'], 422);
        }

        return response()->json($this->service->becomeCreator($request->user()));
    }


    // DARK MODE
    public function updatePreferences(Request $request)
    {
        $request->validate([
            'dark_mode' => 'required|boolean',
        ]);

        $request->user()->update([
            'dark_mode' => $request->dark_mode,
        ]);

        return response()->json(['message' => 'Preferences updated']);
    }

    // PROFILE
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'username'      => ['sometimes', 'string', 'max:50', 'unique:users,username,' . $user->id],
            'email'         => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'bio'           => ['nullable', 'string', 'max:500'],
            'avatar'        => ['nullable', 'image', 'max:2048'],
            'twitter_url'   => ['nullable', 'url', 'max:255'],
            'instagram_url' => ['nullable', 'url', 'max:255'],
            'tiktok_url'    => ['nullable', 'url', 'max:255'],
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) Storage::delete($user->avatar);
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated.',
            'user'    => $this->service->formatUser($user->fresh()),
        ]);
    }

    // update password
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password'  => ['required', 'current_password'],
            'password'          => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $request->user()->update([
            'password' => $request->password,
        ]);

        return response()->json(['message' => 'Password updated.']);
    }

    //google
    public function googleRedirect(): \Illuminate\Http\RedirectResponse
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallback(): \Illuminate\Http\RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $result     = $this->service->handleGoogleLogin($googleUser);
            $token      = $result['token'];
            $user       = urlencode(json_encode($result['user']));

            return redirect("http://localhost:5173/auth/callback?token={$token}&user={$user}");
        } catch (\Exception $e) {
            return redirect('http://localhost:5173/auth/callback?error=failed');
        }
    }
}