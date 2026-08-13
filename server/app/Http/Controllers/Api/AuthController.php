<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
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

    public function verifyEmailCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        return response()->json($this->service->verifyEmailCode(
            $validated['email'],
            $validated['code']
        ));
    }

    public function resendEmailVerificationCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        return response()->json($this->service->resendEmailVerificationCode($validated['email']));
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

    public function profile(Request $request): JsonResponse
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
            'avatar'        => ['nullable', 'image', 'dimensions:min_width=64,min_height=64,max_width=12000,max_height=12000', 'max:10240'],
            'twitter_url'   => ['nullable', 'url', 'max:255'],
            'discord_url'   => ['nullable', 'string', 'max:255'],
            'instagram_url' => ['nullable', 'url', 'max:255'],
            'facebook_url'  => ['nullable', 'url', 'max:255'],
            'tiktok_url'    => ['nullable', 'url', 'max:255'],
            'account_menu_style' => ['sometimes', 'string', 'in:circular,detailed'],
            'creator_role' => ['sometimes', Rule::in(['artist', 'storyteller'])],
            'creator_features' => ['sometimes', 'array'],
            'creator_features.*' => ['string', 'distinct', Rule::in(['webcomix', 'novels', 'arts', 'commission', 'shop'])],
        ]);

        if (array_key_exists('creator_role', $validated) || array_key_exists('creator_features', $validated)) {
            $creatorRole = $validated['creator_role'] ?? $user->creator_role
                ?? ($user->role === 'storyteller' ? 'storyteller' : 'artist');
            $required = $creatorRole === 'artist'
                ? ['arts', 'commission', 'shop']
                : ['webcomix', 'novels', 'shop'];
            $validated['creator_role'] = $creatorRole;
            $validated['creator_features'] = array_values(array_unique(array_merge(
                $required,
                $validated['creator_features'] ?? $user->normalizedCreatorFeatures(),
            )));
            if ($user->role === 'wanderer') {
                // Keep the legacy authorization role compatible while creator_role controls
                // whether the creator is primarily an Artist or Storyteller.
                $validated['role'] = 'storyteller';
            }
        }
        $emailChanged = isset($validated['email'])
            && $validated['email'] !== $user->email
            && $user->role !== 'super_admin';

        if ($request->hasFile('avatar')) {
            if ($user->avatar) Storage::delete($user->avatar);
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar_moderation_status'] = 'pending';
            $validated['avatar_uploaded_at'] = now();
        }

        if ($emailChanged) {
            $validated['email_verified_at'] = null;
            $validated['email_verification_code'] = null;
            $validated['email_verification_expires_at'] = null;
        }

        $user->update($validated);

        if ($emailChanged) {
            $this->service->sendVerificationCodeForUser($user->fresh());
        }

        return response()->json([
            'message' => $emailChanged
                ? 'Profile updated. Please verify your new email address.'
                : 'Profile updated.',
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
