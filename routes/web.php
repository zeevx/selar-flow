<?php

use App\Http\Controllers\FlowController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'products' => App\Models\Product::query()->get(),
        'flow' => App\Models\Flow::query()->first(),
    ]);
})->name('home');

Route::post('/flow', [FlowController::class, 'store'])->name('flow.store');
