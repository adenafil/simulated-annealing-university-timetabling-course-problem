/**
 * Example: Generate PDF timetables for each class
 */

import { generateTimetablePDFs } from "../utils/pdf-generator.js";
import path from "path";

const solutionPath = path.join(process.cwd(), "src/examples/result/solution.json");
const outputDir = path.join(process.cwd(), "src/examples/result/timetables");

// Check command line argument
const singleFile = process.argv.includes("--single");

console.log("=".repeat(60));
console.log("Timetable PDF Generator");
console.log("=".repeat(60));
console.log(`\nMode: ${singleFile ? "Single PDF (all classes)" : "Multiple PDFs (one per class)"}`);
console.log(`Input: ${solutionPath}`);
console.log(`Output: ${outputDir}\n`);

try {
  generateTimetablePDFs(solutionPath, outputDir, singleFile);
} catch (error) {
  console.error("❌ Error generating PDFs:", error);
  process.exit(1);
}
