<?php

namespace App\Models\Concerns;

use App\Models\ContentSuspension;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasContentSuspensions
{
    public function contentSuspensions(): MorphMany
    {
        return $this->morphMany(ContentSuspension::class, 'target');
    }

    public function activeContentSuspensions(): MorphMany
    {
        return $this->contentSuspensions()->where('status', 'active');
    }

    public function hasActiveSuspension(?string $field = null): bool
    {
        $query = $this->activeContentSuspensions();

        $field === null
            ? $query->whereNull('target_field')
            : $query->where('target_field', $field);

        return $query->exists();
    }
}
