<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flow extends Model
{
    protected $fillable = [
        'name',
        'product_id',
        'trigger',
        'nodes',
        'edges',
        'status',
    ];

    protected $casts = [
        'nodes' => 'array',
        'edges' => 'array',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
