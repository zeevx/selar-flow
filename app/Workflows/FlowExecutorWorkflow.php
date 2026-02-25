<?php

namespace App\Workflows;

use App\Models\Flow;
use App\Workflows\Activities\SendEmailActivity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Workflow\Workflow;

use function Workflow\activity;
use function Workflow\timer;

class FlowExecutorWorkflow extends Workflow
{
    private const MAX_NODE_VISITS = 1000;

    public function execute(int $flowId, array $context): array|\Generator
    {
        Log::info("=========");
        Log::info("Starting flow execution", ['flow_id' => $flowId]);

        $flow = Flow::query()->find($flowId);
        if (!$flow || $flow->status !== 'live') {
            Log::warning("Flow not found or not live", ['flow_id' => $flowId]);
            return ['error' => 'Flow not found or not live'];
        }

        $nodes = collect($flow->nodes)->keyBy('id');
        $edges = collect($flow->edges);

        $first_node = $nodes->firstWhere('type', 'start');

        if (!$first_node) {
            return ['error' => 'No start node found'];
        }

        $visited = [];
        yield from $this->executeNode($first_node, $nodes, $edges, $context, $visited, 0);

        Log::info("Flow execution completed", ['flow_id' => $flowId]);
        Log::info("=========");

        return $context;
    }

    private function executeNode(
        array $node,
        Collection $nodes,
        Collection $edges,
        array &$context,
        array &$visited,
        int $steps
    ): \Generator
    {
        $node_id = data_get($node, 'id');
        $node_type = data_get($node, 'type');

        if ($steps > self::MAX_NODE_VISITS) {
            Log::warning('Aborting flow execution due to excessive node traversal', ['node_id' => $node_id]);
            return;
        }

        if ($node_id !== null && isset($visited[$node_id])) {
            Log::warning('Detected cycle in flow. Aborting execution path.', ['node_id' => $node_id]);
            return;
        }

        if ($node_id !== null) {
            $visited[$node_id] = true;
        }

        Log::info("Executing node", ['node_id' => $node_id, 'type' => $node_type]);

        if ($node_type === 'end') {
            Log::info("Reached end node");
            return;
        }

        if ($node_type === 'action') {
            yield from $this->executeNodeAction($node, $context);
        }

        $next_node_id = $this->getNextNodeId($node, $edges, $context);

        if ($next_node_id && $nodes->has($next_node_id)) {
            yield from $this->executeNode($nodes->get($next_node_id), $nodes, $edges, $context, $visited, $steps + 1);
        }
    }

    private function executeNodeAction(array $node, array &$context): \Generator
    {
        $type = data_get($node, 'data.type');

        switch ($type) {
            case 'delay':
                $duration = (int) data_get($node, 'data.duration', 1);
                $unit = data_get($node, 'data.unit', 'hours');
                Log::info("Starting delay", ['duration' => $duration, 'unit' => $unit]);
                yield timer("{$duration} {$unit}");
                Log::info("Delay completed");
                break;

            case 'send_email':
                $email = data_get($context, 'email', '');
                $subject = data_get($node, 'data.subject', 'No Subject');
                $body = $this->interpolateVariables(data_get($node, 'data.body', ''), $context);

                if ($email) {
                    Log::info("Sending email", ['to' => $email, 'subject' => $subject]);
                    yield activity(SendEmailActivity::class, $email, $subject, $body);
                    Log::info("Email sent");
                }
                break;
        }
    }

    private function interpolateVariables(string $text, array $context): string
    {
        $replacements = [
            '{{email}}' => data_get($context, 'email', ''),
            '{{quantity}}' => data_get($context, 'quantity', ''),
            '{{total_price}}' => data_get($context, 'total_price', ''),
            '{{product_name}}' => data_get($context, 'product_name', ''),
            '{{customer_name}}' => data_get($context, 'customer_name', ''),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }

    private function getNextNodeId(array $node, Collection $edges, array $context): ?string
    {
        if (data_get($node, 'type') === 'condition') {
            $result = $this->evaluateNodeCondition($node, $context);
            Log::info("Condition result", ['result' => $result]);
            $handle_id = $result ? 'source-right' : 'source-left';

            $next_edge = $edges->first(fn($edge) =>
                data_get($edge, 'source') === data_get($node, 'id') &&
                data_get($edge, 'sourceHandle') === $handle_id
            );

            return data_get($next_edge, 'target');
        }

        $next_edge = $edges->firstWhere('source', data_get($node, 'id'));
        return data_get($next_edge, 'target');
    }

    private function evaluateNodeCondition(array $node, array $context): bool
    {
        $property = data_get($node, 'data.property', '');
        $operator = data_get($node, 'data.operator', 'equals');
        $value = data_get($node, 'data.value', '');

        $actual_value = $this->getNodeConditionContextValue($property, $context);
        Log::info("Condition property", ['property' => $property]);
        Log::info("Condition actual value", ['actual_value' => $actual_value]);
        Log::info("Condition value", ['value' => $value]);
        Log::info("Condition operator", ['operator' => $operator]);

        return match ($operator) {
            'equals' => $this->areValuesEqual($actual_value, $value),
            'not_equals' => !$this->areValuesEqual($actual_value, $value),
            'contains' => is_string($actual_value) && str_contains($actual_value, $value),
            'greater_than' => is_numeric($actual_value) && $actual_value > (float) $value,
            'less_than' => is_numeric($actual_value) && $actual_value < (float) $value,
            'greater_or_equal' => is_numeric($actual_value) && $actual_value >= (float) $value,
            'less_or_equal' => is_numeric($actual_value) && $actual_value <= (float) $value,
            default => false,
        };
    }

    private function areValuesEqual(mixed $actualValue, mixed $expectedValue): bool
    {
        if (is_numeric($actualValue) && is_numeric($expectedValue)) {
            return (float) $actualValue === (float) $expectedValue;
        }

        return (string) $actualValue === (string) $expectedValue;
    }

    private function getNodeConditionContextValue(string $property, array $context): mixed
    {
        return match ($property) {
            'purchase_email' => data_get($context, 'email'),
            'purchase_quantity' => data_get($context, 'quantity'),
            'purchase_total_price' => data_get($context, 'total_price'),
            default => data_get($context, $property),
        };
    }

}
