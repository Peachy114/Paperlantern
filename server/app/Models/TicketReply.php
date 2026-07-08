<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TicketReply extends Model
{
    use HasUuids;

    protected $fillable = [
        'ticket_id',
        'user_id',
        'message',
        'is_admin',
    ];

    protected function casts(): array
    {
        return [
            'is_admin' => 'boolean',
        ];
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}