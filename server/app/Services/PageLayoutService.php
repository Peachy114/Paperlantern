<?php

namespace App\Services;

use App\Models\PageLayout;
use Illuminate\Support\Str;

class PageLayoutService
{
    public const PAGES = ['home', 'arts', 'commissions'];

    public function get(string $pageKey): array
    {
        $pageKey = $this->normalizePageKey($pageKey);
        $layout = PageLayout::where('page_key', $pageKey)->first();

        return [
            'page_key' => $pageKey,
            'widgets' => $layout?->widgets ?: $this->defaultWidgets($pageKey),
            'is_default' => ! $layout,
        ];
    }

    public function save(string $pageKey, array $widgets, ?string $userId = null): array
    {
        $pageKey = $this->normalizePageKey($pageKey);

        $layout = PageLayout::updateOrCreate(
            ['page_key' => $pageKey],
            [
                'widgets' => $this->sanitizeWidgets($widgets, $pageKey),
                'updated_by' => $userId,
            ]
        );

        return [
            'page_key' => $pageKey,
            'widgets' => $layout->widgets,
            'is_default' => false,
        ];
    }

    public function reset(string $pageKey): array
    {
        $pageKey = $this->normalizePageKey($pageKey);
        PageLayout::where('page_key', $pageKey)->delete();

        return $this->get($pageKey);
    }

    public function defaultWidgets(string $pageKey): array
    {
        return match ($this->normalizePageKey($pageKey)) {
            'arts' => [
                $this->widget('featured_artists', 'Featured Artists', ['enabled' => true]),
                $this->widget('labels', 'Labels', ['enabled' => true]),
                $this->widget('arts_grid', 'Arts', ['enabled' => true, 'grid' => 'masonry']),
            ],
            'commissions' => [
                $this->widget('commission_grid', 'Open Commissions', ['enabled' => true, 'grid' => 'masonry']),
            ],
            default => [
                $this->widget('hero', 'Hero', ['enabled' => true]),
                $this->widget('announcement_banner', 'Announcement Banner', ['enabled' => false]),
                $this->widget('weekly', 'Weekly', ['enabled' => true, 'filter' => 'all', 'limit' => 10]),
                $this->widget('today_releases', "Today's Releases", ['enabled' => true, 'filter' => 'all', 'limit' => 12]),
                $this->widget('today_top', "Today's Top 10", ['enabled' => false, 'filter' => 'all', 'limit' => 10, 'metric' => 'views', 'layout' => 'horizontal']),
                $this->widget('fresh', 'Fresh Release', ['enabled' => true, 'filter' => 'all', 'limit' => 12]),
                $this->widget('latest', 'Latest Chapters', ['enabled' => true, 'limit' => 12]),
                $this->widget('popular', 'Popular', ['enabled' => false, 'filter' => 'all', 'limit' => 12]),
                $this->widget('top_liker', 'Top Liker', ['enabled' => false, 'filter' => 'all', 'limit' => 10, 'layout' => 'horizontal']),
            ],
        };
    }

    private function sanitizeWidgets(array $widgets, string $pageKey): array
    {
        return collect($widgets)
            ->filter(fn($widget) => is_array($widget))
            ->values()
            ->map(function (array $widget, int $index) use ($pageKey) {
                $type = (string) ($widget['type'] ?? 'text');
                $settings = is_array($widget['settings'] ?? null) ? $widget['settings'] : [];
                $style = is_array($widget['style'] ?? null) ? $widget['style'] : [];

                return [
                    'id' => (string) ($widget['id'] ?? (string) Str::uuid()),
                    'type' => $this->allowedType($type, $pageKey),
                    'title' => Str::limit((string) ($widget['title'] ?? Str::headline($type)), 80, ''),
                    'enabled' => (bool) ($widget['enabled'] ?? true),
                    'settings' => $this->sanitizeSettings($settings, $type),
                    'style' => $this->sanitizeStyle($style),
                    'sort_order' => $index,
                ];
            })
            ->all();
    }

    private function sanitizeSettings(array $settings, string $type = ''): array
    {
        $placement = in_array($settings['placement'] ?? '', ['tight', 'overlay'], true)
            ? $settings['placement']
            : 'tight';
        $allowOverlap = (bool) ($settings['allow_overlap'] ?? ($placement === 'overlay'));
        if ($allowOverlap) {
            $placement = 'overlay';
        }

        return [
            'text' => Str::limit((string) ($settings['text'] ?? ''), 5000, ''),
            'asset_path' => Str::limit((string) ($settings['asset_path'] ?? ''), 500, ''),
            'sticker_id' => Str::limit((string) ($settings['sticker_id'] ?? ''), 80, ''),
            'sticker_image_path' => Str::limit((string) ($settings['sticker_image_path'] ?? ''), 500, ''),
            'font_url' => Str::limit((string) ($settings['font_url'] ?? ''), 500, ''),
            'grid' => in_array($settings['grid'] ?? '', ['standard', 'masonry', 'bento', 'magazine', 'gallery', 'carousel'], true)
                ? $settings['grid']
                : 'masonry',
            'filter' => in_array($settings['filter'] ?? '', ['all', 'webtoon', 'novel', 'art'], true)
                ? $settings['filter']
                : 'all',
            'layout' => in_array($settings['layout'] ?? '', ['horizontal', 'vertical', 'compact', 'row', 'column'], true)
                ? $settings['layout']
                : 'horizontal',
            'align' => in_array($settings['align'] ?? '', ['auto', 'start', 'center', 'end', 'stretch', 'justify'], true)
                ? $settings['align']
                : 'auto',
            'display' => in_array($settings['display'] ?? '', ['block', 'inline'], true)
                ? $settings['display']
                : 'block',
            'columns' => isset($settings['columns']) && (int) $settings['columns'] > 0
                ? max(1, min(6, (int) $settings['columns']))
                : null,
            'info_layout' => in_array($settings['info_layout'] ?? '', ['image_only', 'image_title', 'image_title_inline', 'title_image', 'image_title_description'], true)
                ? $settings['info_layout']
                : (in_array($type, ['arts_grid', 'commission_grid', 'boosted_commissions'], true)
                    ? 'image_only'
                    : 'image_title_description'),
            'placement' => $placement,
            'anchor_widget_id' => isset($settings['anchor_widget_id'])
                ? Str::limit((string) $settings['anchor_widget_id'], 80, '')
                : null,
            'metric' => in_array($settings['metric'] ?? '', ['views', 'likes'], true)
                ? $settings['metric']
                : 'views',
            'limit' => max(1, min(30, (int) ($settings['limit'] ?? 12))),
            'allow_overlap' => $allowOverlap,
            'selected_board_item_id' => Str::limit((string) ($settings['selected_board_item_id'] ?? ''), 80, ''),
            'board_items' => $this->sanitizeBoardItems(
                is_array($settings['board_items'] ?? null) ? $settings['board_items'] : []
            ),
        ];
    }

    private function sanitizeBoardItems(array $items): array
    {
        return collect($items)
            ->filter(fn($item) => is_array($item))
            ->take(80)
            ->values()
            ->map(function (array $item, int $index) {
                $type = in_array($item['type'] ?? '', ['sticker', 'image', 'text'], true)
                    ? $item['type']
                    : 'text';
                $style = is_array($item['style'] ?? null) ? $item['style'] : [];

                return [
                    'id' => Str::limit((string) ($item['id'] ?? (string) Str::uuid()), 80, ''),
                    'type' => $type,
                    'x' => max(0, min(100, (float) ($item['x'] ?? 0))),
                    'y' => max(0, min(5000, (int) ($item['y'] ?? 0))),
                    'w' => max(4, min(100, (float) ($item['w'] ?? 20))),
                    'h' => max(24, min(5000, (int) ($item['h'] ?? 120))),
                    'text' => Str::limit((string) ($item['text'] ?? ''), 5000, ''),
                    'asset_path' => Str::limit((string) ($item['asset_path'] ?? ''), 500, ''),
                    'sticker_id' => Str::limit((string) ($item['sticker_id'] ?? ''), 80, ''),
                    'sticker_image_path' => Str::limit((string) ($item['sticker_image_path'] ?? ''), 500, ''),
                    'font_url' => Str::limit((string) ($item['font_url'] ?? ''), 500, ''),
                    'style' => [
                        'background' => $this->sanitizeColor($style['background'] ?? ''),
                        'text_color' => $this->sanitizeColor($style['text_color'] ?? ''),
                        'border_color' => $this->sanitizeColor($style['border_color'] ?? ''),
                        'font_family' => Str::limit((string) ($style['font_family'] ?? ''), 120, ''),
                        'transparent' => (bool) ($style['transparent'] ?? true),
                        'border' => (bool) ($style['border'] ?? false),
                        'radius' => max(0, min(80, (int) ($style['radius'] ?? 0))),
                        'padding' => max(0, min(80, (int) ($style['padding'] ?? 0))),
                        'padding_block' => max(0, min(120, (int) ($style['padding_block'] ?? ($style['padding'] ?? 0)))),
                        'padding_inline' => max(0, min(120, (int) ($style['padding_inline'] ?? ($style['padding'] ?? 0)))),
                        'font_size' => max(8, min(160, (int) ($style['font_size'] ?? 16))),
                        'text_align' => in_array($style['text_align'] ?? '', ['start', 'center', 'end'], true)
                            ? $style['text_align']
                            : 'start',
                        'z_index' => max(0, min(100, (int) ($style['z_index'] ?? ($index + 1)))),
                        'rotate' => max(-180, min(180, (int) ($style['rotate'] ?? 0))),
                    ],
                ];
            })
            ->all();
    }

    private function sanitizeStyle(array $style): array
    {
        return [
            'background' => $this->sanitizeColor($style['background'] ?? ''),
            'text_color' => $this->sanitizeColor($style['text_color'] ?? ''),
            'border_color' => $this->sanitizeColor($style['border_color'] ?? ''),
            'font_family' => Str::limit((string) ($style['font_family'] ?? ''), 120, ''),
            'transparent' => (bool) ($style['transparent'] ?? true),
            'border' => (bool) ($style['border'] ?? false),
            'radius' => max(0, min(80, (int) ($style['radius'] ?? 0))),
            'padding' => max(0, min(80, (int) ($style['padding'] ?? 0))),
            'padding_block' => max(0, min(120, (int) ($style['padding_block'] ?? ($style['padding'] ?? 0)))),
            'padding_inline' => max(0, min(120, (int) ($style['padding_inline'] ?? ($style['padding'] ?? 0)))),
            'margin' => max(0, min(80, (int) ($style['margin'] ?? 0))),
            'margin_block' => max(-160, min(160, (int) ($style['margin_block'] ?? ($style['margin'] ?? 0)))),
            'margin_inline' => max(-160, min(160, (int) ($style['margin_inline'] ?? 0))),
            'offset_x' => max(-5000, min(5000, (int) ($style['offset_x'] ?? 0))),
            'offset_y' => max(-5000, min(5000, (int) ($style['offset_y'] ?? 0))),
            'offset_x_percent' => isset($style['offset_x_percent'])
                ? max(-500, min(500, (float) $style['offset_x_percent']))
                : null,
            'offset_y_percent' => isset($style['offset_y_percent'])
                ? max(-500, min(500, (float) $style['offset_y_percent']))
                : null,
            'z_index' => max(0, min(100, (int) ($style['z_index'] ?? 1))),
            'rotate' => max(-180, min(180, (int) ($style['rotate'] ?? 0))),
            'sticker_size' => max(48, min(900, (int) ($style['sticker_size'] ?? 160))),
            'content_width' => max(48, min(1360, (int) ($style['content_width'] ?? 720))),
            'content_height' => max(24, min(1200, (int) ($style['content_height'] ?? 120))),
            'font_size' => max(8, min(160, (int) ($style['font_size'] ?? 14))),
            'text_align' => in_array($style['text_align'] ?? '', ['start', 'center', 'end'], true)
                ? $style['text_align']
                : 'start',
        ];
    }

    private function sanitizeColor(mixed $value): string
    {
        $color = trim((string) $value);
        if ($color === '') {
            return '';
        }

        if (preg_match('/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/', $color)) {
            return "#{$color}";
        }

        return Str::limit($color, 80, '');
    }

    private function widget(string $type, string $title, array $settings = []): array
    {
        return [
            'id' => (string) Str::uuid(),
            'type' => $type,
            'title' => $title,
            'enabled' => (bool) ($settings['enabled'] ?? true),
            'settings' => $this->sanitizeSettings($settings, $type),
            'style' => $this->sanitizeStyle([]),
            'sort_order' => 0,
        ];
    }

    private function allowedType(string $type, string $pageKey): string
    {
        $common = ['text', 'image', 'sticker', 'board', 'spacer'];
        $types = match ($pageKey) {
            'arts' => ['featured_artists', 'labels', 'arts_grid'],
            'commissions' => ['commission_grid', 'boosted_commissions', 'featured_artists'],
            default => ['hero', 'announcement_banner', 'announcement_hero', 'weekly', 'daily', 'today_releases', 'today_top', 'fresh', 'latest', 'popular', 'top_liker'],
        };

        return in_array($type, [...$types, ...$common], true) ? $type : 'text';
    }

    private function normalizePageKey(string $pageKey): string
    {
        abort_unless(in_array($pageKey, self::PAGES, true), 404);

        return $pageKey;
    }
}
