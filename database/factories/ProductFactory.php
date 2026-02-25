<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => 'Product ' . fake()->numberBetween(1, 100),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 10, 1000),
        ];
    }
}
