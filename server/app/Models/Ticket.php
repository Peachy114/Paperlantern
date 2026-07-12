<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'category',
        'subject',
        'message',
        'status',
        'source_type',
        'source_id',
        'admin_notes',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function replies()
    {
        return $this->hasMany(TicketReply::class)->orderBy('created_at');
    }

    public function latestReply()
    {
        return $this->hasOne(TicketReply::class)->latestOfMany();
    }

    public function source()
    {
        return $this->morphTo(__FUNCTION__, 'source_type', 'source_id');
    }
}
