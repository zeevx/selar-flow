<?php

namespace App\Console\Commands;

use App\Models\Flow;
use App\Workflows\FlowExecutorWorkflow;
use Illuminate\Console\Command;
use Workflow\WorkflowStub;

class TestFlowExecution extends Command
{
    protected $signature = 'flow:test';

    protected $description = 'Test flow execution by simulating a product purchase';

    public function handle(): int
    {
        $this->info("Queuing the workflow");

        $flows = Flow::query()->with('product')->get();
        foreach ($flows as $flow) {

            $context = [
                'email' => 'test@example.com',
                'customer_name' => 'Test customer',
                'product_name' => $flow->product?->name ?? 'Unknown Product',
                'quantity' => 1,
                'total_price' => 99.99,
            ];

            $workflow = WorkflowStub::make(FlowExecutorWorkflow::class);
            $workflow->start($flow->id, $context);
        }

        $this->info('Event dispatched!');

        return 0;
    }
}
