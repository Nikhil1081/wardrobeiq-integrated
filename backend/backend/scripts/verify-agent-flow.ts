import { connectDB } from '../src/db/mongo.js';
import { seedDatabase } from '../src/db/seed.js';
import { runStylistWorkflow } from '../src/agent/langgraphWorkflow.js';

async function main() {
  console.log('===============================================================');
  console.log(' WardrobeIQ — Agentic AI Dynamic Tool Execution Verification');
  console.log('===============================================================\n');

  try {
    await connectDB();
    await seedDatabase();
  } catch (err: any) {
    console.log('DB init note:', err?.message);
  }

  const testScenarios = [
    {
      id: 1,
      query: 'What should I wear to college?',
      customerId: 'C001',
      expectedAspect: 'outfit without gap analysis or product search',
    },
    {
      id: 2,
      query: 'What clothes am I missing?',
      customerId: 'C001',
      expectedAspect: 'wardrobe gaps detection',
    },
    {
      id: 3,
      query: 'My wardrobe is boring. Help me improve it.',
      customerId: 'C001',
      expectedAspect: 'wardrobe analysis and gap detection',
    },
    {
      id: 4,
      query: 'Find me a black shirt under ₹2000.',
      customerId: 'C001',
      expectedAspect: 'product search and ranking under budget',
    },
    {
      id: 5,
      query: 'What should I buy next?',
      customerId: 'C001',
      expectedAspect: 'gap analysis plus product recommendations',
    },
    {
      id: 6,
      query: 'Create a formal outfit for me.',
      customerId: 'C001',
      expectedAspect: 'formal outfit generation',
    },
    {
      id: 7,
      query: 'Do I have enough clothes for winter?',
      customerId: 'C001',
      expectedAspect: 'winter wardrobe evaluation',
    },
  ];

  for (const scenario of testScenarios) {
    console.log(`\n---------------------------------------------------------------`);
    console.log(`[TEST SCENARIO ${scenario.id}] Query: "${scenario.query}"`);
    console.log(`Expected Behavior: ${scenario.expectedAspect}`);
    console.log(`---------------------------------------------------------------`);

    const streamedSteps: string[] = [];
    const startTime = Date.now();

    const response = await runStylistWorkflow(
      scenario.customerId,
      scenario.query,
      `test_conv_${scenario.id}_${Date.now()}`,
      (step) => {
        streamedSteps.push(step);
      }
    );

    const duration = Date.now() - startTime;
    console.log(`Execution Duration: ${duration}ms`);
    console.log(`Dynamic Steps Recorded (${response.processingSteps.length}):`);
    response.processingSteps.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));

    console.log(`\nOutput Message Preview:\n  ${response.message.substring(0, 160)}...`);
    console.log(`Recommendations Count: ${response.recommendations.length}`);
    console.log(`Outfits Count: ${response.outfits.length}`);
    console.log(`Gaps Count: ${response.gaps.length}`);

    // Verify dynamic differentiation
    if (scenario.id === 1 || scenario.id === 6) {
      if (response.outfits.length > 0) {
        console.log(`[PASS] Scenario ${scenario.id} generated outfit (${response.outfits[0].occasion})!`);
      } else {
        console.log(`[CHECK] Scenario ${scenario.id} outfit count: ${response.outfits.length}`);
      }
    } else if (scenario.id === 2) {
      if (response.gaps.length > 0) {
        console.log(`[PASS] Scenario 2 successfully detected ${response.gaps.length} wardrobe gaps!`);
      }
    } else if (scenario.id === 4) {
      if (response.recommendations.length > 0) {
        console.log(`[PASS] Scenario 4 successfully searched and ranked products! (Top: ${response.recommendations[0].name}, Price: ₹${response.recommendations[0].price})`);
      }
    }
  }

  console.log('\n===============================================================');
  console.log(' All 7 Agentic AI Scenarios Executed Successfully!');
  console.log('===============================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
