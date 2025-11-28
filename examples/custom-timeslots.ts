/**
 * Example: Custom Time Slots Configuration
 *
 * This example demonstrates how to use custom time slot configurations:
 * 1. Mode 1: Merge with defaults (partial override)
 * 2. Mode 2: Full custom time slots (100% override)
 */

import { SimulatedAnnealing } from "../src/algorithm/simulated-annealing.js";
import type { Room, Lecturer, ClassRequirement, TimeSlot } from "../src/types/index.js";

// Sample data (replace with your actual data)
const rooms: Room[] = [
  { Code: "R101", Name: "Room 101", Type: "Classroom", Capacity: 40 },
  { Code: "LAB1", Name: "Lab 1", Type: "Lab", Capacity: 30 },
];

const lecturers: Lecturer[] = [
  {
    "Prodi Code": "IF",
    Code: "L001",
    Name: "Dr. John Doe",
    Prefered_Time: "Monday:08:00",
    Research_Day: "Friday",
    Transit_Time: 30,
    Max_Daily_Periods: 6,
    Prefered_Room: "R101",
  },
];

const classes: ClassRequirement[] = [
  {
    Prodi: "Informatika",
    Kelas: "A",
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
    should_on_the_lab: "no",
    rooms: "",
  },
];

// ============================================================================
// MODE 1: Merge with Defaults (Partial Override)
// ============================================================================

console.log("\n=== MODE 1: Merge with Defaults ===\n");

// Example 1.1: Only change start time for morning classes
const solver1 = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: {
      startTime: "08:00", // Override only start time
      // endTime and slotDuration will use defaults (17:00 and 50 minutes)
    },
    // sore and days will use defaults
  },
  maxIterations: 100, // Quick test
});

console.log("Example 1.1: Changed morning start time to 08:00");
console.log("Other settings (endTime, slotDuration, etc.) use defaults\n");

// Example 1.2: Change multiple settings
const solver2 = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: {
      startTime: "08:00",
      endTime: "16:00",
      slotDuration: 60, // 60 minutes per slot
    },
    sore: {
      startTime: "16:00",
      endTime: "20:00",
      // slotDuration will use default (50 minutes)
    },
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], // No Saturday
  },
  maxIterations: 100,
});

console.log("Example 1.2: Multiple settings changed");
console.log("- Morning: 08:00-16:00, 60min slots");
console.log("- Evening: 16:00-20:00, 50min slots (default)");
console.log("- Days: Mon-Fri only\n");

// ============================================================================
// MODE 2: Full Custom Time Slots (100% Override)
// ============================================================================

console.log("\n=== MODE 2: Full Custom Time Slots ===\n");

// Example 2.1: Provide custom time slots
const customPagiSlots: TimeSlot[] = [
  { day: "Monday", startTime: "08:00", endTime: "09:30", period: 1 },
  { day: "Monday", startTime: "09:45", endTime: "11:15", period: 2 },
  { day: "Monday", startTime: "11:30", endTime: "13:00", period: 3 },
  // ... add more slots as needed
];

const customSoreSlots: TimeSlot[] = [
  { day: "Monday", startTime: "18:00", endTime: "19:30", period: 1 },
  { day: "Monday", startTime: "19:45", endTime: "21:15", period: 2 },
  // ... add more slots as needed
];

const solver3 = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: {
    pagi: customPagiSlots,
    sore: customSoreSlots,
  },
  maxIterations: 100,
});

console.log("Example 2.1: Full custom time slots");
console.log("- Using completely custom slots with 90-minute duration");
console.log("- 15-minute break between slots");
console.log("- Ignores all default configurations\n");

// Example 2.2: Generate custom slots programmatically
function generateCustomSlots(
  days: string[],
  startTime: string,
  endTime: string,
  slotDuration: number,
  breakDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (const day of days) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;
    let period = 1;

    const endMinutes = endHour * 60 + endMin;

    while (true) {
      const currentMinutes = currentHour * 60 + currentMin;

      if (currentMinutes >= endMinutes) break;

      const startTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;

      const endSlotMin = currentMinutes + slotDuration;
      if (endSlotMin > endMinutes) break;

      const endSlotHour = Math.floor(endSlotMin / 60);
      const endSlotMinute = endSlotMin % 60;
      const endTimeStr = `${endSlotHour.toString().padStart(2, "0")}:${endSlotMinute.toString().padStart(2, "0")}`;

      slots.push({
        day,
        startTime: startTimeStr,
        endTime: endTimeStr,
        period,
      });

      const nextSlotMin = endSlotMin + breakDuration;
      currentHour = Math.floor(nextSlotMin / 60);
      currentMin = nextSlotMin % 60;
      period++;
    }
  }

  return slots;
}

const programmaticPagiSlots = generateCustomSlots(
  ["Monday", "Tuesday", "Wednesday", "Thursday"],
  "07:00",
  "12:00",
  100, // 100-minute slots
  20   // 20-minute breaks
);

const solver4 = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: {
    pagi: programmaticPagiSlots,
  },
  maxIterations: 100,
});

console.log("Example 2.2: Programmatically generated custom slots");
console.log("- 100-minute slots with 20-minute breaks");
console.log("- Monday-Thursday, 07:00-12:00");
console.log(`- Total slots generated: ${programmaticPagiSlots.length}\n`);

// ============================================================================
// Default Mode (No Configuration)
// ============================================================================

console.log("\n=== DEFAULT MODE ===\n");

const solver5 = new SimulatedAnnealing(rooms, lecturers, classes, {
  maxIterations: 100,
});

console.log("Example: No time slot configuration");
console.log("- Using default settings from package");
console.log("- Morning: 07:30-17:00, 50min slots");
console.log("- Evening: 15:30-21:00, 50min slots");
console.log("- Days: Mon-Sat\n");

console.log("\n✅ All examples initialized successfully!");
console.log("\nTo run the solver, call solver.solve() method");
console.log("Example: const solution = solver1.solve();\n");
