<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AdminLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'admin_id',
        'action',
        'target_type',
        'target_id',
        'notes',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}