<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;

class PurchaseFactory extends Factory
{
    protected $model = Purchase::class;

    public function definition(): array
    {
        $unitPrice = fake()->randomFloat(2, 10, 1000);
        $quantity = fake()->numberBetween(1, 10);

        return [
            'product_id' => Product::factory(),
            'email' => fake()->safeEmail(),
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'total_price' => $unitPrice * $quantity,
            'status' => fake()->randomElement(['pending', 'completed', 'cancelled']),
        ];
    }
}
