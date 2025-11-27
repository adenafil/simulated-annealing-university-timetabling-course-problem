/**
 * Example with custom configuration
 */

import { SimulatedAnnealing, loadDataFromExcel, DEFAULT_ALGORITHM_CONFIG } from "../index.js";
import type { AlgorithmConfig } from "../index.js";

async function main() {
  // Load data
  const dataPath = process.argv[2] || "./data/timetable-data.xlsx";
  const { rooms, lecturers, classes } = loadDataFromExcel(dataPath);

  console.log("Using custom algorithm configuration:\n");

  // Custom configuration
  const customConfig: AlgorithmConfig = {
    initialTemperature: 15000, // Higher starting temperature
    minTemperature: 0.00001,
    coolingRate: 0.995, // Slower cooling
    maxIterations: 20000, // More iterations
    reheatingThreshold: 1500,
    reheatingFactor: 120,
    maxReheats: 10,
    hardConstraintWeight: 150000, // Stricter on hard constraints
    softConstraintWeights: {
      preferredTime: 15, // Increased importance
      preferredRoom: 8,
      transitTime: 25,
      compactness: 10,
      prayerTimeOverlap: 20,
      eveningClassPriority: 30,
      labRequirement: 12,
      overflowPenalty: 7,
    },
  };

  console.log("Custom config:");
  console.log(`  Initial Temperature: ${customConfig.initialTemperature}`);
  console.log(`  Max Iterations: ${customConfig.maxIterations}`);
  console.log(`  Cooling Rate: ${customConfig.coolingRate}\n`);

  console.log("Default config for comparison:");
  console.log(`  Initial Temperature: ${DEFAULT_ALGORITHM_CONFIG.initialTemperature}`);
  console.log(`  Max Iterations: ${DEFAULT_ALGORITHM_CONFIG.maxIterations}`);
  console.log(`  Cooling Rate: ${DEFAULT_ALGORITHM_CONFIG.coolingRate}\n`);

  // Create solver with custom configuration
  const solver = new SimulatedAnnealing(rooms, lecturers, classes, customConfig);

  // Run optimization
  const solution = solver.solve();

  console.log(`\nFinal fitness: ${solution.fitness.toFixed(2)}`);
  console.log(`Classes scheduled: ${solution.schedule.length}`);
}

main().catch(console.error);
