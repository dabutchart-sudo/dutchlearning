import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeVisualGenerationStatus,visualGenerationStatusSummary} from '../src/engine/visual-generation-status.js';

test('normalizes ready visual-generation status and remaining budgets',()=>{
 const status=normalizeVisualGenerationStatus({enabled:true,ready:true,reason:'ready',model:'gpt-image-2',bucket:'visual-cues',dailyLimit:1,monthlyLimit:10,usedToday:0,usedMonth:3,estimatedCostGbp:0.08,monthlyBudgetGbp:2,usedCostGbp:0.24});
 assert.equal(status.dailyRemaining,1);
 assert.equal(status.monthlyRemaining,7);
 assert.equal(status.costRemainingGbp,1.76);
 assert.match(visualGenerationStatusSummary(status),/£1\.76/);
});

test('disabled service never reports ready',()=>{
 const status=normalizeVisualGenerationStatus({enabled:false,ready:false,reason:'disabled'});
 assert.equal(status.ready,false);
 assert.match(visualGenerationStatusSummary(status),/disabled/i);
});

test('rounds currency fields to pennies',()=>{
 const status=normalizeVisualGenerationStatus({enabled:true,ready:true,monthlyBudgetGbp:1,usedCostGbp:0.1+0.2,costRemainingGbp:0.7});
 assert.equal(status.usedCostGbp,0.3);
 assert.equal(status.costRemainingGbp,0.7);
});

test('accepts snake case status fields',()=>{
 const status=normalizeVisualGenerationStatus({enabled:true,ready:true,daily_limit:2,monthly_limit:12,used_today:1,used_month:4,daily_remaining:1,monthly_remaining:8,estimated_cost_gbp:0.05,monthly_budget_gbp:1,used_cost_gbp:0.2,cost_remaining_gbp:0.8});
 assert.equal(status.dailyLimit,2);
 assert.equal(status.monthlyRemaining,8);
 assert.equal(status.estimatedCostGbp,0.05);
});
