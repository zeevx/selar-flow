<?php

namespace App\Http\Controllers;

use App\Models\Flow;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FlowController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'id' => 'nullable|exists:flows,id',
            'name' => 'nullable|string|max:255',
            'product_id' => 'nullable|exists:products,id',
            'trigger' => 'nullable|string|in:purchased,abandoned',
            'nodes' => 'required|array',
            'edges' => 'present|array',
            'status' => 'nullable|in:draft,live',
        ]);

        $flow = Flow::query()->where('id', $request->input('id'))->first();
        if ($flow) {
            $flow->update([
                'name' => $request->input('name', $flow->name),
                'product_id' => $request->input('product_id'),
                'trigger' => $request->input('trigger'),
                'nodes' => $request->input('nodes'),
                'edges' => $request->input('edges'),
                'status' => $request->input('status', $flow->status),
            ]);
        } else {
            $flow = Flow::query()->create([
                'name' => $request->input('name', 'Untitled Flow'),
                'product_id' => $request->input('product_id'),
                'trigger' => $request->input('trigger'),
                'nodes' => $request->input('nodes'),
                'edges' => $request->input('edges'),
                'status' => $request->input('status', 'draft'),
            ]);
        }

        return Inertia::flash('savedFlowId', $flow->id)->back();
    }
}
