/**
 * Example using JSON input instead of Excel
 */

import { SimulatedAnnealing, loadDataFromJSON, loadDataFromObject } from "../index.js";
import type { TimetableInput } from "../index.js";

async function exampleWithJSONFile() {
  console.log("Example 1: Loading from JSON file\n");

  const dataPath = process.argv[2] || "./data/timetable-data.json";
  const data = loadDataFromJSON(dataPath);

  const solver = new SimulatedAnnealing(data.rooms, data.lecturers, data.classes);
  const solution = solver.solve();

  console.log(`\nClasses scheduled: ${solution.schedule.length}`);
}

async function exampleWithJSONObject() {
  console.log("\nExample 2: Loading from JavaScript object\n");

  // This is useful for API integrations
  const data: TimetableInput = {
    rooms: [
      { Code: "CM-101", Name: "Classroom 101", Type: "Regular", Capacity: 40 },
      { Code: "CM-Lab1", Name: "Computer Lab 1", Type: "Lab", Capacity: 30 },
    ],
    lecturers: [
      {
        "Prodi Code": "IF",
        Code: "L001",
        Name: "Dr. John Doe",
        Prefered_Time: "08.00 - 10.00 monday, 13.00 - 15.00 wednesday",
        Research_Day: "Friday",
        Transit_Time: 15,
        Max_Daily_Periods: 8,
        Prefered_Room: "CM-101",
      },
    ],
    classes: [
      {
        Prodi: "INFORMATIKA",
        Kelas: "IF-1A",
        Kode_Matakuliah: "IF101",
        Mata_Kuliah: "Introduction to Programming",
        SKS: 3,
        Jenis: "Teori",
        Peserta: 35,
        Kode_Dosen1: "L001",
        Kode_Dosen2: "",
        Kode_Dosen_Prodi_Lain1: "",
        Kode_Dosen_Prodi_Lain2: "",
        Class_Type: "pagi",
        should_on_the_lab: "yes",
        rooms: "",
      },
    ],
  };

  // Validate and load data
  const validatedData = loadDataFromObject(data);

  const solver = new SimulatedAnnealing(
    validatedData.rooms,
    validatedData.lecturers,
    validatedData.classes
  );

  const solution = solver.solve();

  console.log(`\nClasses scheduled: ${solution.schedule.length}`);
}

async function main() {
  console.log("=".repeat(50));
  console.log("JSON Input Examples");
  console.log("=".repeat(50));

  try {
    await exampleWithJSONFile();
  } catch (error) {
    console.log("JSON file example skipped (file not found)");
  }

  await exampleWithJSONObject();

  console.log("\n" + "=".repeat(50));
}

main().catch(console.error);
