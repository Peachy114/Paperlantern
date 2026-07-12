<?php

namespace App\Services;

use App\Models\Art;
use App\Models\Chapter;
use App\Models\Comment;
use App\Models\Work;
use Illuminate\Database\Eloquent\Model;

class CommentTargetResolver
{
    public function __construct(private ContentSuspensionService $contentSuspensions) {}

    public function resolve(string $type, string $id): Model
    {
        $target = match ($type) {
            'work' => Work::whereIn('status', ['ongoing', 'completed'])
                ->where('moderation_status', '!=', 'violated')
                ->findOrFail($id),
            'chapter' => Chapter::where('status', '!=', 'draft')
                ->where('moderation_status', '!=', 'violated')
                ->whereHas('work', fn($query) => $query
                    ->whereIn('status', ['ongoing', 'completed'])
                    ->where('moderation_status', '!=', 'violated'))
                ->findOrFail($id),
            'art' => Art::where('status', 'published')->findOrFail($id),
            'comment' => Comment::where('status', 'visible')->findOrFail($id),
            default => abort(404, 'Unsupported comment target.'),
        };

        if ($target instanceof Chapter) {
            $target->loadMissing('work');
            abort_if($target->work && $this->contentSuspensions->isHidden($target->work), 404, 'Content not found.');
        }

        if ($target instanceof Work || $target instanceof Chapter || $target instanceof Art) {
            abort_if($this->contentSuspensions->isHidden($target), 404, 'Content not found.');
        }

        return $target;
    }

    public function typeFor(Model $target): string
    {
        return match (true) {
            $target instanceof Work => 'work',
            $target instanceof Chapter => 'chapter',
            $target instanceof Art => 'art',
            $target instanceof Comment => 'comment',
            default => 'unknown',
        };
    }

    public function owner(Model $target)
    {
        if ($target instanceof Work || $target instanceof Art) {
            return $target->user;
        }

        if ($target instanceof Chapter) {
            $target->loadMissing('work.user');
            return $target->work?->user;
        }

        if ($target instanceof Comment) {
            return $target->user;
        }

        return null;
    }
}
