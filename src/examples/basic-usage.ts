/**
 * Basic usage example for timetable-sa package
 */

import { SimulatedAnnealing, loadDataFromExcel } from "../index.js";

async function main() {
  console.log("=".repeat(50));
  console.log("Timetable-SA: Basic Usage Example");
  console.log("=".repeat(50));

  // Load data from Excel file
  const dataPath = process.argv[2] || "./data/timetable-data.xlsx";
  console.log(`\nLoading data from: ${dataPath}`);

  const { rooms, lecturers, classes } = loadDataFromExcel(dataPath);

  console.log(`✅ Loaded ${rooms.length} rooms`);
  console.log(`✅ Loaded ${lecturers.length} lecturers`);
  console.log(`✅ Loaded ${classes.length} classes\n`);

  // Create solver with default configuration
  const solver = new SimulatedAnnealing(rooms, lecturers, classes);

  // Or with custom configuration:
  // const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  //   maxIterations: 20000,
  //   coolingRate: 0.995,
  //   initialTemperature: 15000,
  // });

  // Run the optimization
  const solution = solver.solve();

  // Display results
  console.log("\n" + "=".repeat(50));
  console.log("RESULTS");
  console.log("=".repeat(50));
  console.log(`Final fitness score: ${solution.fitness.toFixed(2)}`);
  console.log(`Classes scheduled: ${solution.schedule.length}`);

  if (solution.violationReport) {
    console.log(`\nHard constraint violations: ${solution.violationReport.summary.totalHardViolations}`);
    console.log(`Soft constraint violations: ${solution.violationReport.summary.totalSoftViolations}`);

    console.log("\nViolations by type:");
    for (const [type, count] of Object.entries(solution.violationReport.summary.violationsByType)) {
      console.log(`  ${type}: ${count}`);
    }
  }

  console.log("\nSample schedule entries:");
  for (let i = 0; i < Math.min(5, solution.schedule.length); i++) {
    const entry = solution.schedule[i]!;
    console.log(`\n  ${i + 1}. ${entry.className} (${entry.classId})`);
    console.log(`     Room: ${entry.room}`);
    console.log(`     Time: ${entry.timeSlot.day} ${entry.timeSlot.startTime}`);
    console.log(`     Lecturers: ${entry.lecturers.join(", ")}`);
  }

  console.log("\n" + "=".repeat(50));
}

main().catch(console.error);
