/**
 * Core type definitions for the University Course Timetabling Problem (UCTP) solver
 */

export interface Room {
  Code: string;
  Name: string;
  Type: string;
  Capacity: number;
}

export interface Lecturer {
  "Prodi Code": string;
  Code: string;
  Name: string;
  Prefered_Time: string;
  Research_Day: string;
  Transit_Time: number;
  Max_Daily_Periods: number;
  Prefered_Room: string;
}

export interface ClassRequirement {
  Prodi: string;
  Kelas: string;
  Kode_Matakuliah: string;
  Mata_Kuliah: string;
  SKS: number;
  Jenis: string;
  Peserta: number;
  Kode_Dosen1: string;
  Kode_Dosen2: string;
  Kode_Dosen_Prodi_Lain1: string;
  Kode_Dosen_Prodi_Lain2: string;
  Class_Type: string;
  should_on_the_lab: string;
  rooms: string;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  period: number;
}

export interface ScheduleEntry {
  classId: string;
  className: string;
  class: string;
  prodi: string;
  lecturers: string[];
  room: string;
  timeSlot: TimeSlot;
  sks: number;
  needsLab: boolean;
  participants: number;
  classType: string;
  prayerTimeAdded: number;
  isOverflowToLab?: boolean;
}

export interface Solution {
  schedule: ScheduleEntry[];
  fitness: number;
  hardViolations: number;
  softViolations: number;
  violationReport?: ViolationReport;
}

export interface ViolationReport {
  hardConstraintViolations: ConstraintViolation[];
  softConstraintViolations: ConstraintViolation[];
  summary: {
    totalHardViolations: number;
    totalSoftViolations: number;
    violationsByType: { [key: string]: number };
  };
}

export interface ConstraintViolation {
  classId: string;
  className: string;
  constraintType: string;
  reason: string;
  severity: "hard" | "soft";
  details?: any;
}

export interface OperatorStats {
  move: { attempts: number; improvements: number; successRate: number };
  swap: { attempts: number; improvements: number; successRate: number };
}

/**
 * Configuration for exclusive room assignments
 */
export interface ExclusiveRoomConfig {
  courses: string[];
  prodi?: string;
}

/**
 * Prayer time configuration
 */
export interface PrayerTime {
  start: number;
  end: number;
  duration: number;
}

/**
 * Algorithm configuration options
 */
export interface AlgorithmConfig {
  initialTemperature?: number;
  minTemperature?: number;
  coolingRate?: number;
  maxIterations?: number;
  reheatingThreshold?: number;
  reheatingFactor?: number;
  maxReheats?: number;
  hardConstraintWeight?: number;
  softConstraintWeights?: SoftConstraintWeights;
}

export interface SoftConstraintWeights {
  preferredTime?: number;
  preferredRoom?: number;
  transitTime?: number;
  compactness?: number;
  prayerTimeOverlap?: number;
  eveningClassPriority?: number;
  labRequirement?: number;
  overflowPenalty?: number;
}

/**
 * Input data structure for the solver
 */
export interface TimetableInput {
  rooms: Room[];
  lecturers: Lecturer[];
  classes: ClassRequirement[];
}

/**
 * Output format for timetable results
 */
export interface TimetableOutput {
  "Class ID": string;
  "Class Name": string;
  Class: string;
  Program: string;
  Lecturers: string;
  Room: string;
  "Room Type": string;
  "Is Overflow": string;
  Day: string;
  "Start Time": string;
  "End Time": string;
  SKS: number;
  "Base Duration (minutes)": number;
  "Prayer Time Added (minutes)": number;
  "Total Duration (minutes)": number;
  Participants: number;
  "Class Type": string;
  "Needs Lab": string;
}
