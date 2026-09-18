/**
 * Syncbay PaaS — Master E2E Test Runner
 * Executes all 4 tiers of opaque-box requirement tests across F1 to F20:
 * - Tier 1: Feature Coverage (>=5 per feature, 100 tests)
 * - Tier 2: Boundary & Corner Cases (>=5 per feature, 100 tests)
 * - Tier 3: Pairwise Cross-Feature Interactions (12 tests)
 * - Tier 4: Real-World Application Scenarios (10 scenarios)
 *
 * Usage:
 *   npx tsx tests/e2e/run-all.ts
 *   npx tsx tests/e2e/run-all.ts --tier=1
 *   npx tsx tests/e2e/run-all.ts --tier=4
 *   npx tsx tests/e2e/run-all.ts --feature=F6
 */

import { registry, type TestCase, type TestResult } from "../harness";

// Import all tier test suites
import "./tier1.test";
import "./tier2.test";
import "./tier3.test";
import "./tier4.test";

// Parse CLI arguments
const args = process.argv.slice(2);
const tierArg = args.find((a) => a.startsWith("--tier="))?.split("=")[1];
const featureArg = args.find((a) => a.startsWith("--feature="))?.split("=")[1];

const filterTier = tierArg ? parseInt(tierArg, 10) : undefined;
const filterFeature = featureArg || undefined;

const TIER_TITLES: Record<number, string> = {
  1: "Tier 1 — Feature Coverage (F1 to F20)",
  2: "Tier 2 — Boundary & Corner Cases (F1 to F20)",
  3: "Tier 3 — Pairwise Cross-Feature Combinations",
  4: "Tier 4 — Real-World Application Scenarios",
};

async function runSuite() {
  const startTime = Date.now();
  console.log("================================================================================");
  console.log("             SYNCBAY PaaS — COMPREHENSIVE E2E TEST RUNNER                      ");
  console.log("================================================================================");
  console.log(`Node: ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}`);
  if (filterTier) console.log(`Filter: Tier ${filterTier}`);
  if (filterFeature) console.log(`Filter: Feature ${filterFeature}`);
  console.log("--------------------------------------------------------------------------------\n");

  const allTests = registry.getTests({ tier: filterTier, feature: filterFeature });
  if (allTests.length === 0) {
    console.warn("No tests matched the specified filter criteria.");
    process.exit(0);
  }

  const results: TestResult[] = [];
  let currentTier = -1;

  for (const test of allTests) {
    if (test.tier !== currentTier) {
      currentTier = test.tier;
      console.log(`\n▶ ${TIER_TITLES[currentTier] || `Tier ${currentTier}`}`);
      console.log("─".repeat(80));
    }

    const tStart = Date.now();
    try {
      await test.run();
      const durationMs = Date.now() - tStart;
      results.push({
        id: test.id,
        name: test.name,
        tier: test.tier,
        feature: test.feature,
        passed: true,
        durationMs,
      });
      console.log(`  ✔ [${test.id.padEnd(14)}] [${test.feature.padEnd(10)}] ${test.name} (${durationMs}ms)`);
    } catch (err: any) {
      const durationMs = Date.now() - tStart;
      results.push({
        id: test.id,
        name: test.name,
        tier: test.tier,
        feature: test.feature,
        passed: false,
        error: err,
        durationMs,
      });
      console.error(`  ✘ [${test.id.padEnd(14)}] [${test.feature.padEnd(10)}] ${test.name} (${durationMs}ms)`);
      console.error(`    Error: ${err.message}`);
      if (err.stack) {
        console.error(`    ${err.stack.split("\n")[1]?.trim() || ""}`);
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n================================================================================");
  console.log("                             TEST EXECUTION SUMMARY                             ");
  console.log("================================================================================");

  // Per-Tier Summary Table
  console.log("\n  Tier Breakdown:");
  console.log("  ┌────────┬──────────────────────────────────────────┬───────┬────────┬────────┐");
  console.log("  │ Tier   │ Description                              │ Total │ Passed │ Failed │");
  console.log("  ├────────┼──────────────────────────────────────────┼───────┼────────┼────────┤");

  const tierNumbers = [1, 2, 3, 4].filter((t) => !filterTier || t === filterTier);
  for (const t of tierNumbers) {
    const tierResults = results.filter((r) => r.tier === t);
    const total = tierResults.length;
    const passed = tierResults.filter((r) => r.passed).length;
    const failed = tierResults.filter((r) => !r.passed).length;
    const title = (TIER_TITLES[t] || "").split(" — ")[1] || `Tier ${t}`;
    console.log(
      `  │ Tier ${t} │ ${title.padEnd(40)} │ ${String(total).padStart(5)} │ ${String(passed).padStart(6)} │ ${String(failed).padStart(6)} │`
    );
  }
  console.log("  └────────┴──────────────────────────────────────────┴───────┴────────┴────────┘");

  // Feature Checklist (F1 through F20)
  const allFeatures = Array.from({ length: 20 }, (_, i) => `F${i + 1}`);
  console.log("\n  Feature Inventory Coverage (F1 to F20):");
  console.log("  ┌─────────┬────────┬────────┬────────┬────────┬─────────┐");
  console.log("  │ Feature │ Tier 1 │ Tier 2 │ Tier 3 │ Tier 4 │ Status  │");
  console.log("  ├─────────┼────────┼────────┼────────┼────────┼─────────┤");

  for (const f of allFeatures) {
    const t1 = results.filter((r) => r.feature === f && r.tier === 1);
    const t2 = results.filter((r) => r.feature === f && r.tier === 2);
    const t3 = results.filter((r) => r.feature.includes(f) && r.tier === 3);
    const t4 = results.filter((r) => r.tier === 4); // Scenarios exercise all subsystems

    const fPassed = results.filter((r) => r.feature.includes(f) && !r.passed).length === 0;
    const status = fPassed ? "PASS ✔" : "FAIL ✘";

    console.log(
      `  │ ${f.padEnd(7)} │ ${String(t1.length).padStart(6)} │ ${String(t2.length).padStart(6)} │ ${String(t3.length).padStart(6)} │ ${String(t4.length > 0 ? "✓" : "-").padStart(6)} │ ${status.padEnd(7)} │`
    );
  }
  console.log("  └─────────┴────────┴────────┴────────┴────────┴─────────┘");

  console.log("\n--------------------------------------------------------------------------------");
  console.log(`TOTAL TESTS:   ${results.length}`);
  console.log(`PASSED:        ${passedCount}`);
  console.log(`FAILED:        ${failedCount}`);
  console.log(`TOTAL TIME:    ${(totalDuration / 1000).toFixed(2)}s`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error(`💥 TEST SUITE FAILED with ${failedCount} failure(s).\n`);
    process.exit(1);
  } else {
    console.log("✨ ALL E2E TESTS PASSED SUCCESSFULLY! (Exit Code 0)\n");
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
