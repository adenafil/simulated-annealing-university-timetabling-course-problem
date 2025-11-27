/**
 * @packageDocumentation
 * University Course Timetabling Problem (UCTP) Solver
 *
 * A powerful, modular solver for university timetabling using Simulated Annealing.
 *
 * @example
 * ```typescript
 * import { SimulatedAnnealing, loadDataFromExcel } from 'timetable-sa';
 *
 * // Load data from Excel file
 * const data = loadDataFromExcel('./timetable-data.xlsx');
 *
 * // Create solver instance
 * const solver = new SimulatedAnnealing(
 *   data.rooms,
 *   data.lecturers,
 *   data.classes
 * );
 *
 * // Run optimization
 * const solution = solver.solve();
 * console.log(`Fitness: ${solution.fitness}`);
 * console.log(`Classes scheduled: ${solution.schedule.length}`);
 * ```
 */
export { SimulatedAnnealing } from "./algorithm/index.js";
export { DEFAULT_ALGORITHM_CONFIG, DEFAULT_SOFT_CONSTRAINT_WEIGHTS, mergeConfig } from "./algorithm/index.js";
export { ConstraintChecker } from "./constraints/index.js";
export { loadDataFromExcel } from "./parsers/index.js";
export { loadDataFromJSON, loadDataFromObject } from "./parsers/index.js";
export { PRAYER_TIMES, LAB_ROOMS, NON_LAB_ROOMS, EXCLUSIVE_ROOMS, DAYS, TIME_SLOTS_PAGI, TIME_SLOTS_SORE, TIME_SLOTS, initializeTimeSlots, } from "./constants/index.js";
export { timeToMinutes, minutesToTime, getPrayerTimeOverlap, calculateEndTime, isValidFridayStartTime, isStartingDuringPrayerTime, canUseExclusiveRoom, isRoomAvailable, getAvailableRooms, } from "./utils/index.js";
export type { Room, Lecturer, ClassRequirement, TimeSlot, ScheduleEntry, Solution, ViolationReport, ConstraintViolation, OperatorStats, ExclusiveRoomConfig, PrayerTime, AlgorithmConfig, SoftConstraintWeights, TimetableInput, TimetableOutput, } from "./types/index.js";
//# sourceMappingURL=index.d.ts.map