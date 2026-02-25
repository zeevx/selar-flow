<?php

use App\Models\Flow;
use App\Models\Product;

function baseFlowPayload(array $overrides = []): array
{
    $default = [
        'name' => 'Welcome Flow',
        'nodes' => [
            [
                'id' => '1',
                'type' => 'start',
                'position' => ['x' => 0, 'y' => 0],
                'data' => ['trigger' => 'purchased'],
            ],
            [
                'id' => 'end',
                'type' => 'end',
                'position' => ['x' => 0, 'y' => 300],
                'data' => [],
            ],
        ],
        'edges' => [
            [
                'id' => 'e-1-end',
                'source' => '1',
                'target' => 'end',
                'sourceHandle' => 'start',
            ],
        ],
        'status' => 'draft',
    ];

    return array_replace_recursive($default, $overrides);
}

test('it creates a new flow', function () {
    $product = Product::factory()->create();

    $response = $this->post(route('flow.store'), baseFlowPayload([
        'product_id' => $product->id,
        'trigger' => 'purchased',
    ]));

    $response->assertStatus(302);
    $this->assertDatabaseHas('flows', [
        'name' => 'Welcome Flow',
        'product_id' => $product->id,
        'trigger' => 'purchased',
        'status' => 'draft',
    ]);
});

test('it updates an existing flow by id', function () {
    $product = Product::factory()->create();
    $flow = Flow::query()->create(baseFlowPayload([
        'name' => 'Old Name',
        'product_id' => $product->id,
        'trigger' => 'purchased',
    ]));

    $response = $this->post(route('flow.store'), baseFlowPayload([
        'id' => $flow->id,
        'name' => 'Updated Name',
        'product_id' => $product->id,
        'trigger' => 'abandoned',
    ]));

    $response->assertStatus(302);
    $this->assertDatabaseHas('flows', [
        'id' => $flow->id,
        'name' => 'Updated Name',
        'trigger' => 'abandoned',
    ]);
});

test('it requires product and trigger when status is live', function () {
    $response = $this->post(route('flow.store'), baseFlowPayload([
        'status' => 'live',
        'product_id' => null,
        'trigger' => null,
    ]));

    $response->assertSessionHasErrors(['product_id', 'trigger']);
});

test('it defaults status to draft when omitted', function () {
    $product = Product::factory()->create();

    $payload = baseFlowPayload([
        'product_id' => $product->id,
        'trigger' => 'purchased',
    ]);

    unset($payload['status']);

    $response = $this->post(route('flow.store'), $payload);
    $response->assertStatus(302);

    $this->assertDatabaseHas('flows', [
        'name' => 'Welcome Flow',
        'status' => 'draft',
    ]);
});

test('flow test command handles flows with nullable product', function () {
    Flow::query()->create(baseFlowPayload([
        'status' => 'live',
        'product_id' => null,
        'trigger' => 'purchased',
    ]));

    $this->artisan('flow:test')->assertExitCode(0);
});
