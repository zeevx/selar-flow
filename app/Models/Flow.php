<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flow extends Model
{
    // use HasFactory;

    protected $fillable = [
        'id',
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

    public function product(): belongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
