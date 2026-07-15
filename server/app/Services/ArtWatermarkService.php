<?php

namespace App\Services;

use App\Models\ArtWatermark;
use App\Models\ArtWatermarkSetting;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ArtWatermarkService
{
    private ImageManager $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    public function createDisplayCopy(
        string $originalAbsolutePath,
        string $publicRelativePath,
        bool $applyWatermark = true,
        string $target = 'arts'
    ): void
    {
        $displayPath = storage_path('app/public/' . $publicRelativePath);
        File::ensureDirectoryExists(dirname($displayPath));

        if (! $applyWatermark) {
            File::copy($originalAbsolutePath, $displayPath);
            return;
        }

        try {
            $image = $this->manager->read($originalAbsolutePath);

            foreach ($this->watermarks($target) as $config) {
                $watermark = $this->manager->read($config['path']);
                $watermarkWidth = max(32, (int) round($image->width() * ($config['width_percent'] / 100)));
                $watermark->scaleDown(width: $watermarkWidth);
                if ((int) $config['rotation'] !== 0) {
                    $watermark->rotate((int) $config['rotation']);
                }

                $image->place(
                    $watermark,
                    $config['position'],
                    $config['offset_x'],
                    $config['offset_y'],
                    $config['opacity'],
                );
            }

            $image->save($displayPath, quality: 88);
            $this->applyNoise($displayPath);
        } catch (\Throwable $exception) {
            Log::warning('ArtWatermarkService: watermark fallback copy used.', [
                'path' => $publicRelativePath,
                'error' => $exception->getMessage(),
            ]);

            File::copy($originalAbsolutePath, $displayPath);
        }
    }

    private function watermarks(string $target = 'arts'): array
    {
        $adminWatermarks = ArtWatermark::where('is_active', true)
            ->where('target', $target)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get()
            ->map(function (ArtWatermark $watermark) {
                $path = Storage::disk('public')->path($watermark->image_path);
                if (! is_file($path)) {
                    return null;
                }

                return [
                    'path' => $path,
                    'position' => $watermark->position,
                    'offset_x' => $watermark->offset_x,
                    'offset_y' => $watermark->offset_y,
                    'width_percent' => $watermark->width_percent,
                    'opacity' => $watermark->opacity,
                    'rotation' => $watermark->rotation,
                ];
            })
            ->filter()
            ->values()
            ->all();

        if ($adminWatermarks !== []) {
            return $adminWatermarks;
        }

        $fallback = $this->fallbackLogoPath();

        return $fallback ? [[
            'path' => $fallback,
            'position' => 'bottom-right',
            'offset_x' => 24,
            'offset_y' => 24,
            'width_percent' => 18,
            'opacity' => 58,
            'rotation' => 0,
        ]] : [];
    }

    private function fallbackLogoPath(): ?string
    {
        $paths = [
            base_path('../client/public/logo_white.png'),
            base_path('../client/public/logo_black.png'),
        ];

        foreach ($paths as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function applyNoise(string $displayPath): void
    {
        $settings = ArtWatermarkSetting::current();
        if (! $settings->noise_enabled) {
            return;
        }

        $info = @getimagesize($displayPath);
        if (! $info) {
            return;
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($displayPath),
            IMAGETYPE_PNG => @imagecreatefrompng($displayPath),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($displayPath) : false,
            default => false,
        };

        if (! $image) {
            return;
        }

        imagealphablending($image, true);
        imagesavealpha($image, true);

        $width = imagesx($image);
        $height = imagesy($image);
        $density = max(1, min(15, (int) $settings->noise_density));
        $opacity = max(1, min(30, (int) $settings->noise_opacity));
        $alpha = max(0, min(127, 127 - (int) round($opacity * 1.27)));
        $points = (int) round($width * $height * ($density / 100));

        for ($i = 0; $i < $points; $i++) {
            $shade = random_int(0, 1) === 1 ? 255 : 0;
            $color = imagecolorallocatealpha($image, $shade, $shade, $shade, $alpha);
            imagesetpixel($image, random_int(0, $width - 1), random_int(0, $height - 1), $color);
        }

        match ($info[2]) {
            IMAGETYPE_JPEG => imagejpeg($image, $displayPath, 88),
            IMAGETYPE_PNG => imagepng($image, $displayPath, 6),
            IMAGETYPE_WEBP => function_exists('imagewebp') ? imagewebp($image, $displayPath, 88) : null,
            default => null,
        };

        imagedestroy($image);
    }
}
