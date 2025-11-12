"use strict";
/**
 * ==========================================
 * SIMULATED ANNEALING FOR UTCP - ENHANCED VERSION
 * University Timetabling with Course Scheduling Problem
 * ==========================================
 *
 * NEW FEATURES:
 * - Friday time restrictions (no start at 11:00, 12:00, 13:00)
 * - Prayer time handling (automatic duration extension)
 * - Evening class priority (18:30 first, then 15:30 if full)
 * - Lab room fallback to non-lab rooms
 * - Detailed constraint violation reporting
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstraintChecker = exports.SimulatedAnnealing = void 0;
exports.loadData = loadData;
const fs_1 = __importDefault(require("fs"));
const XLSX = __importStar(require("xlsx"));
// ============================================
// CONSTANTS
// ============================================
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Prayer times (in minutes from midnight for easier calculation)
const PRAYER_TIMES = {
    DZUHUR: { start: 11 * 60 + 40, end: 12 * 60 + 30, duration: 50 }, // 11:40-12:30
    ASHAR: { start: 15 * 60, end: 15 * 60 + 30, duration: 30 }, // 15:00-15:30
    MAGHRIB: { start: 18 * 60, end: 18 * 60 + 30, duration: 30 } // 18:00-18:30
};
// Lab rooms
const LAB_ROOMS = ['CM-206', 'CM-207', 'CM-LabVirtual', 'CM-Lab3', 'G5-Lab1', 'G5-Lab2', 'G5-LabAudioVisual'];
// Non-lab rooms (fallback for lab classes)
const NON_LAB_ROOMS = [
    'B2-R1', 'B3-R1', 'B3-R2', 'B3R3', 'CM-101', 'CM-102', 'CM-103',
    'CM-201', 'CM-202', 'CM-203', 'CM-204', 'CM-205', 'CM-208',
    'G2-R2', 'G2-R3', 'G2-R4', 'G2-R5', 'G2-R6', 'G2-R7',
    'G3-R1', 'G3-R2', 'G3-R3', 'G3-R4',
    'G4-R1', 'G4-R2', 'G4-R3', 'G4-R4'
];
const TIME_SLOTS_PAGI = [];
const TIME_SLOTS_SORE = [];
const TIME_SLOTS = [];
// Generate time slots for PAGI (07:30 - 17:00)
for (let day of DAYS) {
    let hour = 7;
    let minute = 30;
    let period = 1;
    while (hour < 17 || (hour === 17 && minute === 0)) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Add 50 minutes for class period
        let endHour = hour;
        let endMinute = minute + 50;
        if (endMinute >= 60) {
            endHour += Math.floor(endMinute / 60);
            endMinute = endMinute % 60;
        }
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        const slot = { day, startTime, endTime, period };
        TIME_SLOTS_PAGI.push(slot);
        TIME_SLOTS.push(slot);
        // Add 10 minutes break
        minute = endMinute + 10;
        if (minute >= 60) {
            hour += Math.floor(minute / 60);
            minute = minute % 60;
        }
        else {
            hour = endHour;
        }
        period++;
    }
}
// Generate time slots for SORE (18:30 - 21:00)
for (let day of DAYS) {
    let hour = 18;
    let minute = 30;
    let period = 1;
    while (hour < 21 || (hour === 21 && minute === 0)) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Add 50 minutes for class period
        let endHour = hour;
        let endMinute = minute + 50;
        if (endMinute >= 60) {
            endHour += Math.floor(endMinute / 60);
            endMinute = endMinute % 60;
        }
        // Stop if end time exceeds 21:00
        if (endHour > 21 || (endHour === 21 && endMinute > 0)) {
            break;
        }
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        const slot = { day, startTime, endTime, period };
        TIME_SLOTS_SORE.push(slot);
        TIME_SLOTS.push(slot);
        // Add 10 minutes break
        minute = endMinute + 10;
        if (minute >= 60) {
            hour += Math.floor(minute / 60);
            minute = minute % 60;
        }
        else {
            hour = endHour;
        }
        period++;
    }
}
// ============================================
// HELPER FUNCTIONS
// ============================================
/**
 * Convert time string to minutes from midnight
 */
function timeToMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
}
/**
 * Convert minutes from midnight to time string
 */
function minutesToTime(minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}
/**
 * Check if a time range overlaps with prayer time
 * Returns the prayer time duration to add (0 if no overlap)
 */
function getPrayerTimeOverlap(startTime, sks, day) {
    // Saturday has no dzuhur/ashar restrictions in this implementation
    // but still has maghrib
    const startMinutes = timeToMinutes(startTime);
    const classMinutes = sks * 50 + (sks - 1) * 10; // without prayer time
    const endMinutes = startMinutes + classMinutes;
    let totalPrayerTime = 0;
    // Check Dzuhur (11:40-12:30) - 50 minutes - All days except check
    if (startMinutes < PRAYER_TIMES.DZUHUR.end && endMinutes > PRAYER_TIMES.DZUHUR.start) {
        totalPrayerTime += PRAYER_TIMES.DZUHUR.duration;
    }
    // Check Ashar (15:00-15:30) - 30 minutes - All days
    if (startMinutes < PRAYER_TIMES.ASHAR.end && endMinutes > PRAYER_TIMES.ASHAR.start) {
        totalPrayerTime += PRAYER_TIMES.ASHAR.duration;
    }
    // Check Maghrib (18:00-18:30) - 30 minutes - All days
    if (startMinutes < PRAYER_TIMES.MAGHRIB.end && endMinutes > PRAYER_TIMES.MAGHRIB.start) {
        totalPrayerTime += PRAYER_TIMES.MAGHRIB.duration;
    }
    return totalPrayerTime;
}
/**
 * Calculate actual end time based on SKS and prayer times
 */
function calculateEndTime(startTime, sks, day) {
    const startMinutes = timeToMinutes(startTime);
    // Calculate class duration without prayer time
    const classMinutes = sks * 50 + (sks - 1) * 10;
    // Check for prayer time overlaps
    const prayerTimeAdded = getPrayerTimeOverlap(startTime, sks, day);
    // Total duration including prayer time
    const totalMinutes = classMinutes + prayerTimeAdded;
    const endMinutes = startMinutes + totalMinutes;
    return {
        endTime: minutesToTime(endMinutes),
        prayerTimeAdded
    };
}
/**
 * Check if a start time is valid for Friday
 */
function isValidFridayStartTime(startTime) {
    const hour = parseInt(startTime.split(':')[0]);
    // Cannot start at 11:00, 12:00, or 13:00
    return !(hour === 11 || hour === 12 || hour === 13);
}
/**
 * Check if start time is during prayer time (not allowed)
 */
function isStartingDuringPrayerTime(startTime) {
    const startMinutes = timeToMinutes(startTime);
    // Check if starting exactly during prayer times
    if (startMinutes >= PRAYER_TIMES.DZUHUR.start && startMinutes < PRAYER_TIMES.DZUHUR.end) {
        return true;
    }
    if (startMinutes >= PRAYER_TIMES.ASHAR.start && startMinutes < PRAYER_TIMES.ASHAR.end) {
        return true;
    }
    if (startMinutes >= PRAYER_TIMES.MAGHRIB.start && startMinutes < PRAYER_TIMES.MAGHRIB.end) {
        return true;
    }
    return false;
}
// ============================================
// DATA LOADING
// ============================================
function loadData(filepath) {
    const workbook = XLSX.readFile(filepath);
    const roomsSheet = workbook.Sheets['ruangan'];
    const lecturersSheet = workbook.Sheets['dosen'];
    const classesSheet = workbook.Sheets['kebutuhan_kelas'];
    const rooms = XLSX.utils.sheet_to_json(roomsSheet);
    const lecturers = XLSX.utils.sheet_to_json(lecturersSheet);
    const classes = XLSX.utils.sheet_to_json(classesSheet);
    return { rooms, lecturers, classes };
}
// ============================================
// CONSTRAINT CHECKING FUNCTIONS
// ============================================
class ConstraintChecker {
    rooms;
    lecturers;
    violations = [];
    constructor(rooms, lecturers) {
        this.rooms = new Map(rooms.map(r => [r.Code, r]));
        this.lecturers = new Map(lecturers.map(l => [l.Code, l]));
    }
    resetViolations() {
        this.violations = [];
    }
    getViolations() {
        return this.violations;
    }
    addViolation(violation) {
        this.violations.push(violation);
    }
    // ============================================
    // HARD CONSTRAINTS
    // ============================================
    /**
     * HC1: No lecturer conflict
     */
    checkNoLecturerConflict(schedule, entry) {
        for (const existing of schedule) {
            if (this.isTimeOverlap(existing, entry)) {
                for (const lecturer of entry.lecturers) {
                    if (existing.lecturers.includes(lecturer)) {
                        this.addViolation({
                            classId: entry.classId,
                            className: entry.className,
                            constraintType: 'HC1: Lecturer Conflict',
                            reason: `Lecturer ${lecturer} has conflict with class ${existing.classId} on ${entry.timeSlot.day} at ${entry.timeSlot.startTime}`,
                            severity: 'hard',
                            details: { conflictsWith: existing.classId, lecturer }
                        });
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * HC2: No room conflict
     */
    checkNoRoomConflict(schedule, entry) {
        for (const existing of schedule) {
            if (existing.room === entry.room && this.isTimeOverlap(existing, entry)) {
                this.addViolation({
                    classId: entry.classId,
                    className: entry.className,
                    constraintType: 'HC2: Room Conflict',
                    reason: `Room ${entry.room} is already occupied by class ${existing.classId} on ${entry.timeSlot.day} at ${entry.timeSlot.startTime}`,
                    severity: 'hard',
                    details: { conflictsWith: existing.classId, room: entry.room }
                });
                return false;
            }
        }
        return true;
    }
    /**
     * HC3: Room capacity
     */
    checkRoomCapacity(entry) {
        const room = this.rooms.get(entry.room);
        if (!room) {
            this.addViolation({
                classId: entry.classId,
                className: entry.className,
                constraintType: 'HC3: Room Capacity',
                reason: `Room ${entry.room} not found`,
                severity: 'hard'
            });
            return false;
        }
        if (room.Capacity < entry.participants) {
            this.addViolation({
                classId: entry.classId,
                className: entry.className,
                constraintType: 'HC3: Room Capacity',
                reason: `Room ${entry.room} capacity (${room.Capacity}) is less than participants (${entry.participants})`,
                severity: 'hard',
                details: { roomCapacity: room.Capacity, participants: entry.participants }
            });
            return false;
        }
        return true;
    }
    /**
     * HC4: Lab requirement (NOW SOFT - can fallback to non-lab)
     */
    checkLabRequirement(entry) {
        if (!entry.needsLab)
            return 1; // No lab needed, perfect
        const room = this.rooms.get(entry.room);
        if (!room)
            return 0;
        // Check if it's a lab room
        if (room.Type.toLowerCase().includes('lab') || LAB_ROOMS.includes(room.Code)) {
            return 1; // Perfect! Lab class in lab room
        }
        // Not in lab room - soft violation
        return 0.5; // Penalty for not being in preferred lab
    }
    /**
     * HC5: No class conflict same prodi
     */
    checkNoClassConflictSameProdi(schedule, entry) {
        for (const existing of schedule) {
            if (existing.prodi === entry.prodi && this.isTimeOverlap(existing, entry)) {
                this.addViolation({
                    classId: entry.classId,
                    className: entry.className,
                    constraintType: 'HC5: Prodi Conflict',
                    reason: `Same program (${entry.prodi}) has class ${existing.classId} at the same time on ${entry.timeSlot.day}`,
                    severity: 'hard',
                    details: { conflictsWith: existing.classId, prodi: entry.prodi }
                });
                return false;
            }
        }
        return true;
    }
    /**
     * HC6: Research day
     */
    checkResearchDay(entry) {
        for (const lecturerCode of entry.lecturers) {
            const lecturer = this.lecturers.get(lecturerCode);
            if (lecturer && lecturer.Research_Day) {
                const researchDay = lecturer.Research_Day.trim();
                if (researchDay && entry.timeSlot.day === researchDay) {
                    this.addViolation({
                        classId: entry.classId,
                        className: entry.className,
                        constraintType: 'HC6: Research Day',
                        reason: `Lecturer ${lecturerCode} has research day on ${researchDay}`,
                        severity: 'hard',
                        details: { lecturer: lecturerCode, researchDay }
                    });
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * HC7: Max daily periods
     */
    checkMaxDailyPeriods(schedule, entry) {
        for (const lecturerCode of entry.lecturers) {
            const lecturer = this.lecturers.get(lecturerCode);
            if (!lecturer || !lecturer.Max_Daily_Periods)
                continue;
            let periodsCount = 0;
            for (const existing of schedule) {
                if (existing.timeSlot.day === entry.timeSlot.day &&
                    existing.lecturers.includes(lecturerCode)) {
                    periodsCount += existing.sks;
                }
            }
            periodsCount += entry.sks;
            if (periodsCount > lecturer.Max_Daily_Periods) {
                this.addViolation({
                    classId: entry.classId,
                    className: entry.className,
                    constraintType: 'HC7: Max Daily Periods',
                    reason: `Lecturer ${lecturerCode} exceeds max daily periods (${lecturer.Max_Daily_Periods}) on ${entry.timeSlot.day}`,
                    severity: 'hard',
                    details: { lecturer: lecturerCode, periods: periodsCount, max: lecturer.Max_Daily_Periods }
                });
                return false;
            }
        }
        return true;
    }
    /**
     * HC8: Class type time
     */
    checkClassTypeTime(entry) {
        const hour = parseInt(entry.timeSlot.startTime.split(':')[0]);
        if (entry.classType === 'sore') {
            // Evening classes should start at 18:30 or later (or 15:30+ if 18:30 slots are full)
            if (hour < 15) {
                this.addViolation({
                    classId: entry.classId,
                    className: entry.className,
                    constraintType: 'HC8: Class Type Time',
                    reason: `Evening class starting too early at ${entry.timeSlot.startTime}`,
                    severity: 'hard'
                });
                return false;
            }
            return true;
        }
        else {
            // Morning classes must be < 18:30
            if (hour >= 18) {
                this.addViolation({
                    classId: entry.classId,
                    className: entry.className,
                    constraintType: 'HC8: Class Type Time',
                    reason: `Morning class starting too late at ${entry.timeSlot.startTime}`,
                    severity: 'hard'
                });
                return false;
            }
            return true;
        }
    }
    /**
     * HC9: Saturday restriction
     */
    checkSaturdayRestriction(entry) {
        if (entry.timeSlot.day !== 'Saturday') {
            return true;
        }
        const isMagisterManajemen = entry.prodi.toLowerCase().includes('magister manajemen');
        if (!isMagisterManajemen) {
            this.addViolation({
                classId: entry.classId,
                className: entry.className,
                constraintType: 'HC9: Saturday Restriction',
                reason: `Only Magister Manajemen allowed on Saturday, but class is from ${entry.prodi}`,
                severity: 'hard',
                details: { prodi: entry.prodi }
            });
        }
        return isMagisterManajemen;
    }
    /**
     * HC10: Friday time restriction (NEW)
     */
    checkFridayTimeRestriction(entry) {
        if (entry.timeSlot.day !== 'Friday') {
            return true;
        }
        if (!isValidFridayStartTime(entry.timeSlot.startTime)) {
            this.addViolation({
                classId: entry.classId,
                className: entry.className,
                constraintType: 'HC10: Friday Time Restriction',
                reason: `Cannot start class at ${entry.timeSlot.startTime} on Friday (prohibited: 11:00, 12:00, 13:00)`,
                severity: 'hard',
                details: { startTime: entry.timeSlot.startTime }
            });
            return false;
        }
        return true;
    }
    /**
     * HC11: Not starting during prayer time (NEW)
     */
    checkNotStartingDuringPrayerTime(entry) {
        if (isStartingDuringPrayerTime(entry.timeSlot.startTime)) {
            this.addViolation({
                classId: entry.classId,
                className: entry.className,
                constraintType: 'HC11: Prayer Time Start',
                reason: `Class cannot start during prayer time at ${entry.timeSlot.startTime}`,
                severity: 'hard',
                details: { startTime: entry.timeSlot.startTime }
            });
            return false;
        }
        return true;
    }
    /**
     * Helper: Check time overlap considering actual durations with prayer time
     */
    isTimeOverlap(entry1, entry2) {
        if (entry1.timeSlot.day !== entry2.timeSlot.day)
            return false;
        const calc1 = calculateEndTime(entry1.timeSlot.startTime, entry1.sks, entry1.timeSlot.day);
        const calc2 = calculateEndTime(entry2.timeSlot.startTime, entry2.sks, entry2.timeSlot.day);
        const start1 = timeToMinutes(entry1.timeSlot.startTime);
        const end1 = timeToMinutes(calc1.endTime);
        const start2 = timeToMinutes(entry2.timeSlot.startTime);
        const end2 = timeToMinutes(calc2.endTime);
        return start1 < end2 && start2 < end1;
    }
    // ============================================
    // SOFT CONSTRAINTS
    // ============================================
    /**
     * SC1: Preferred time
     */
    checkPreferredTime(entry) {
        let totalScore = 0;
        let count = 0;
        for (const lecturerCode of entry.lecturers) {
            const lecturer = this.lecturers.get(lecturerCode);
            if (!lecturer || !lecturer.Prefered_Time)
                continue;
            const preferredTime = lecturer.Prefered_Time.toLowerCase();
            const hour = parseInt(entry.timeSlot.startTime.split(':')[0]);
            count++;
            if (preferredTime === 'pagi' && hour >= 7 && hour < 12) {
                totalScore += 1;
            }
            else if (preferredTime === 'siang' && hour >= 12 && hour < 15) {
                totalScore += 1;
            }
            else if (preferredTime === 'sore' && hour >= 15 && hour < 18) {
                totalScore += 1;
            }
            else if (preferredTime === 'malam' && hour >= 18) {
                totalScore += 1;
            }
        }
        return count > 0 ? totalScore / count : 1;
    }
    /**
     * SC2: Preferred room
     */
    checkPreferredRoom(entry) {
        let totalScore = 0;
        let count = 0;
        for (const lecturerCode of entry.lecturers) {
            const lecturer = this.lecturers.get(lecturerCode);
            if (!lecturer || !lecturer.Prefered_Room)
                continue;
            count++;
            if (lecturer.Prefered_Room === entry.room) {
                totalScore += 1;
            }
        }
        return count > 0 ? totalScore / count : 1;
    }
    /**
     * SC3: Transit time
     */
    checkTransitTime(schedule, entry) {
        let minScore = 1;
        for (const lecturerCode of entry.lecturers) {
            const lecturer = this.lecturers.get(lecturerCode);
            if (!lecturer || !lecturer.Transit_Time)
                continue;
            for (const existing of schedule) {
                if (existing.timeSlot.day !== entry.timeSlot.day)
                    continue;
                if (!existing.lecturers.includes(lecturerCode))
                    continue;
                const calc = calculateEndTime(existing.timeSlot.startTime, existing.sks, existing.timeSlot.day);
                const prevEndMins = timeToMinutes(calc.endTime);
                const currentStartMins = timeToMinutes(entry.timeSlot.startTime);
                const gapMinutes = currentStartMins - prevEndMins;
                if (gapMinutes < lecturer.Transit_Time) {
                    const score = Math.max(0, gapMinutes / lecturer.Transit_Time);
                    minScore = Math.min(minScore, score);
                }
            }
        }
        return minScore;
    }
    /**
     * SC4: Compactness
     */
    checkCompactness(schedule, entry) {
        const sameDayClasses = schedule.filter(s => s.timeSlot.day === entry.timeSlot.day);
        if (sameDayClasses.length === 0)
            return 1;
        let minGap = Infinity;
        const currentStartMins = timeToMinutes(entry.timeSlot.startTime);
        for (const existing of sameDayClasses) {
            const calc = calculateEndTime(existing.timeSlot.startTime, existing.sks, existing.timeSlot.day);
            const existingEndMins = timeToMinutes(calc.endTime);
            const existingStartMins = timeToMinutes(existing.timeSlot.startTime);
            if (existingEndMins <= currentStartMins) {
                const gap = currentStartMins - existingEndMins;
                minGap = Math.min(minGap, gap);
            }
            const currentCalc = calculateEndTime(entry.timeSlot.startTime, entry.sks, entry.timeSlot.day);
            const currentEndMins = timeToMinutes(currentCalc.endTime);
            if (currentEndMins <= existingStartMins) {
                const gap = existingStartMins - currentEndMins;
                minGap = Math.min(minGap, gap);
            }
        }
        if (minGap === Infinity)
            return 1;
        return minGap <= 60 ? 1 : Math.max(0, 1 - (minGap - 60) / 180);
    }
    /**
     * SC5: Avoid prayer time overlap (NEW - soft constraint)
     */
    checkPrayerTimeOverlap(entry) {
        const prayerTime = getPrayerTimeOverlap(entry.timeSlot.startTime, entry.sks, entry.timeSlot.day);
        if (prayerTime === 0) {
            return 1; // Perfect, no overlap
        }
        // Penalty based on how much prayer time is overlapped
        // 0 minutes = score 1.0
        // 50+ minutes = score 0.5
        const score = Math.max(0.5, 1 - (prayerTime / 100));
        this.addViolation({
            classId: entry.classId,
            className: entry.className,
            constraintType: 'SC5: Prayer Time Overlap',
            reason: `Class overlaps with ${prayerTime} minutes of prayer time`,
            severity: 'soft',
            details: { prayerTimeMinutes: prayerTime }
        });
        return score;
    }
    /**
     * SC6: Evening class priority (18:30 preferred over 15:30) (NEW)
     */
    checkEveningClassPriority(entry) {
        if (entry.classType !== 'sore')
            return 1;
        const hour = parseInt(entry.timeSlot.startTime.split(':')[0]);
        if (hour === 18) {
            return 1; // Perfect! Starting at 18:30
        }
        else if (hour >= 15 && hour < 18) {
            return 0.7; // Acceptable but not preferred
        }
        return 0.5; // Not ideal
    }
}
exports.ConstraintChecker = ConstraintChecker;
// ============================================
// SIMULATED ANNEALING SOLVER
// ============================================
class SimulatedAnnealing {
    rooms;
    lecturers;
    classes;
    checker;
    initialTemperature = 1000;
    minTemperature = 0.1;
    coolingRate = 0.995;
    maxIterations = 50000;
    hardConstraintWeight = 10000;
    softConstraintWeights = {
        preferredTime: 10,
        preferredRoom: 5,
        transitTime: 20,
        compactness: 8,
        prayerTimeOverlap: 15, // NEW
        eveningClassPriority: 12, // NEW
        labRequirement: 10 // Changed from hard to soft
    };
    constructor(rooms, lecturers, classes) {
        this.rooms = rooms;
        this.lecturers = lecturers;
        this.classes = classes;
        this.checker = new ConstraintChecker(rooms, lecturers);
    }
    /**
     * Generate initial solution
     */
    generateInitialSolution() {
        const schedule = [];
        for (const classReq of this.classes) {
            if (!classReq.Kode_Matakuliah)
                continue;
            const lecturers = [];
            if (classReq.Kode_Dosen1)
                lecturers.push(classReq.Kode_Dosen1);
            if (classReq.Kode_Dosen2)
                lecturers.push(classReq.Kode_Dosen2);
            if (classReq.Kode_Dosen_Prodi_Lain1)
                lecturers.push(classReq.Kode_Dosen_Prodi_Lain1);
            if (classReq.Kode_Dosen_Prodi_Lain2)
                lecturers.push(classReq.Kode_Dosen_Prodi_Lain2);
            if (lecturers.length === 0)
                continue;
            const participants = classReq.Peserta || 30;
            const needsLab = classReq.should_on_the_lab?.toLowerCase() === 'yes';
            const classType = classReq.Class_Type?.toLowerCase() || 'pagi';
            const prodi = classReq.Prodi || 'Unknown';
            // Get available rooms - prioritize lab rooms if needed, but allow fallback
            let roomCodes = [];
            if (classReq.rooms) {
                roomCodes = classReq.rooms.split(',').map(r => r.trim()).filter(r => {
                    const room = this.rooms.find(room => room.Code === r);
                    return room && room.Capacity >= participants;
                });
            }
            // If no specific rooms or need lab, get appropriate rooms
            if (roomCodes.length === 0) {
                if (needsLab) {
                    // Try lab rooms first
                    roomCodes = this.rooms
                        .filter(r => LAB_ROOMS.includes(r.Code) && r.Capacity >= participants)
                        .map(r => r.Code);
                    // Fallback to non-lab if no lab available
                    if (roomCodes.length === 0) {
                        roomCodes = this.rooms
                            .filter(r => NON_LAB_ROOMS.includes(r.Code) && r.Capacity >= participants)
                            .map(r => r.Code);
                    }
                }
                else {
                    roomCodes = this.rooms
                        .filter(r => r.Capacity >= participants)
                        .map(r => r.Code);
                }
            }
            if (roomCodes.length === 0)
                continue;
            // Select time slots based on class type and constraints
            let availableTimeSlots = [];
            if (classType === 'sore') {
                // Evening classes: prioritize 18:30, allow 15:30+ as fallback
                availableTimeSlots = TIME_SLOTS.filter(slot => {
                    const hour = parseInt(slot.startTime.split(':')[0]);
                    return hour >= 15; // Allow 15:30+ for evening classes
                });
            }
            else {
                availableTimeSlots = TIME_SLOTS_PAGI.slice();
            }
            // Filter by day constraints
            const isMagisterManajemen = prodi.toLowerCase().includes('magister manajemen');
            if (!isMagisterManajemen) {
                availableTimeSlots = availableTimeSlots.filter(slot => slot.day !== 'Saturday');
            }
            // Filter Friday time restrictions
            availableTimeSlots = availableTimeSlots.filter(slot => {
                if (slot.day === 'Friday') {
                    return isValidFridayStartTime(slot.startTime);
                }
                return true;
            });
            // Filter out prayer time starts
            availableTimeSlots = availableTimeSlots.filter(slot => {
                return !isStartingDuringPrayerTime(slot.startTime);
            });
            if (availableTimeSlots.length === 0)
                continue;
            const randomRoom = roomCodes[Math.floor(Math.random() * roomCodes.length)];
            const randomTimeSlot = availableTimeSlots[Math.floor(Math.random() * availableTimeSlots.length)];
            const prayerTimeCalc = calculateEndTime(randomTimeSlot.startTime, classReq.SKS || 3, randomTimeSlot.day);
            schedule.push({
                classId: classReq.Kode_Matakuliah,
                className: classReq.Mata_Kuliah || 'Unknown',
                prodi,
                lecturers,
                room: randomRoom,
                timeSlot: randomTimeSlot,
                sks: classReq.SKS || 3,
                needsLab,
                participants,
                classType,
                prayerTimeAdded: prayerTimeCalc.prayerTimeAdded
            });
        }
        const fitness = this.calculateFitness(schedule);
        return {
            schedule,
            fitness: isNaN(fitness) ? 999999 : fitness,
            hardViolations: 0,
            softViolations: 0
        };
    }
    /**
     * Calculate fitness with violation tracking
     */
    calculateFitness(schedule) {
        this.checker.resetViolations();
        let hardViolations = 0;
        let softPenalty = 0;
        for (let i = 0; i < schedule.length; i++) {
            const entry = schedule[i];
            const scheduleBeforeEntry = schedule.slice(0, i);
            // HARD CONSTRAINTS
            if (!this.checker.checkNoLecturerConflict(scheduleBeforeEntry, entry))
                hardViolations++;
            if (!this.checker.checkNoRoomConflict(scheduleBeforeEntry, entry))
                hardViolations++;
            if (!this.checker.checkRoomCapacity(entry))
                hardViolations++;
            if (!this.checker.checkNoClassConflictSameProdi(scheduleBeforeEntry, entry))
                hardViolations++;
            if (!this.checker.checkResearchDay(entry))
                hardViolations++;
            if (!this.checker.checkMaxDailyPeriods(scheduleBeforeEntry, entry))
                hardViolations++;
            if (!this.checker.checkClassTypeTime(entry))
                hardViolations++;
            if (!this.checker.checkSaturdayRestriction(entry))
                hardViolations++;
            if (!this.checker.checkFridayTimeRestriction(entry))
                hardViolations++;
            if (!this.checker.checkNotStartingDuringPrayerTime(entry))
                hardViolations++;
            // SOFT CONSTRAINTS
            softPenalty += (1 - this.checker.checkPreferredTime(entry)) * this.softConstraintWeights.preferredTime;
            softPenalty += (1 - this.checker.checkPreferredRoom(entry)) * this.softConstraintWeights.preferredRoom;
            softPenalty += (1 - this.checker.checkTransitTime(scheduleBeforeEntry, entry)) * this.softConstraintWeights.transitTime;
            softPenalty += (1 - this.checker.checkCompactness(scheduleBeforeEntry, entry)) * this.softConstraintWeights.compactness;
            softPenalty += (1 - this.checker.checkLabRequirement(entry)) * this.softConstraintWeights.labRequirement;
            softPenalty += (1 - this.checker.checkPrayerTimeOverlap(entry)) * this.softConstraintWeights.prayerTimeOverlap;
            softPenalty += (1 - this.checker.checkEveningClassPriority(entry)) * this.softConstraintWeights.eveningClassPriority;
        }
        return hardViolations * this.hardConstraintWeight + softPenalty;
    }
    /**
     * Generate neighbor solution
     */
    generateNeighbor(solution) {
        const newSchedule = JSON.parse(JSON.stringify(solution.schedule));
        const modType = Math.random();
        const randomIndex = Math.floor(Math.random() * newSchedule.length);
        const entry = newSchedule[randomIndex];
        if (modType < 0.5) {
            // Change time slot
            let availableTimeSlots = [];
            if (entry.classType === 'sore') {
                availableTimeSlots = TIME_SLOTS.filter(slot => {
                    const hour = parseInt(slot.startTime.split(':')[0]);
                    return hour >= 15;
                });
            }
            else {
                availableTimeSlots = TIME_SLOTS_PAGI.slice();
            }
            // Apply constraints
            const isMM = entry.prodi.toLowerCase().includes('magister manajemen');
            if (!isMM) {
                availableTimeSlots = availableTimeSlots.filter(slot => slot.day !== 'Saturday');
            }
            availableTimeSlots = availableTimeSlots.filter(slot => {
                if (slot.day === 'Friday') {
                    return isValidFridayStartTime(slot.startTime);
                }
                return true;
            });
            availableTimeSlots = availableTimeSlots.filter(slot => {
                return !isStartingDuringPrayerTime(slot.startTime);
            });
            if (availableTimeSlots.length > 0) {
                const newSlot = availableTimeSlots[Math.floor(Math.random() * availableTimeSlots.length)];
                entry.timeSlot = newSlot;
                // Recalculate prayer time
                const calc = calculateEndTime(newSlot.startTime, entry.sks, newSlot.day);
                entry.prayerTimeAdded = calc.prayerTimeAdded;
            }
        }
        else {
            // Change room
            const classReq = this.classes.find(c => c.Kode_Matakuliah === entry.classId);
            let roomCodes = [];
            if (classReq && classReq.rooms) {
                roomCodes = classReq.rooms.split(',').map(r => r.trim()).filter(r => {
                    const room = this.rooms.find(room => room.Code === r);
                    return room && room.Capacity >= entry.participants;
                });
            }
            if (roomCodes.length === 0) {
                if (entry.needsLab) {
                    roomCodes = this.rooms
                        .filter(r => LAB_ROOMS.includes(r.Code) && r.Capacity >= entry.participants)
                        .map(r => r.Code);
                    if (roomCodes.length === 0) {
                        roomCodes = this.rooms
                            .filter(r => NON_LAB_ROOMS.includes(r.Code) && r.Capacity >= entry.participants)
                            .map(r => r.Code);
                    }
                }
                else {
                    roomCodes = this.rooms
                        .filter(r => r.Capacity >= entry.participants)
                        .map(r => r.Code);
                }
            }
            if (roomCodes.length > 0) {
                entry.room = roomCodes[Math.floor(Math.random() * roomCodes.length)];
            }
        }
        const fitness = this.calculateFitness(newSchedule);
        return {
            schedule: newSchedule,
            fitness: isNaN(fitness) ? 999999 : fitness,
            hardViolations: 0,
            softViolations: 0
        };
    }
    /**
     * Acceptance probability
     */
    acceptanceProbability(currentFitness, newFitness, temperature) {
        if (newFitness < currentFitness) {
            return 1.0;
        }
        return Math.exp((currentFitness - newFitness) / temperature);
    }
    /**
     * Main SA algorithm
     */
    solve() {
        console.log('🚀 Starting Enhanced Simulated Annealing...\n');
        let currentSolution = this.generateInitialSolution();
        let bestSolution = JSON.parse(JSON.stringify(currentSolution));
        let temperature = this.initialTemperature;
        let iteration = 0;
        console.log(`Initial fitness: ${currentSolution.fitness.toFixed(2)}\n`);
        while (temperature > this.minTemperature && iteration < this.maxIterations) {
            const newSolution = this.generateNeighbor(currentSolution);
            const acceptProb = this.acceptanceProbability(currentSolution.fitness, newSolution.fitness, temperature);
            if (Math.random() < acceptProb) {
                currentSolution = newSolution;
                if (currentSolution.fitness < bestSolution.fitness) {
                    bestSolution = JSON.parse(JSON.stringify(currentSolution));
                    console.log(`✨ New best! Iteration ${iteration}, ` +
                        `Temperature: ${temperature.toFixed(2)}, ` +
                        `Fitness: ${bestSolution.fitness.toFixed(2)}`);
                }
            }
            temperature *= this.coolingRate;
            iteration++;
            if (iteration % 1000 === 0) {
                console.log(`⏳ Iteration ${iteration}, ` +
                    `Temperature: ${temperature.toFixed(2)}, ` +
                    `Current Fitness: ${currentSolution.fitness.toFixed(2)}`);
            }
        }
        console.log(`\n🎉 Optimization complete!`);
        console.log(`Final best fitness: ${bestSolution.fitness.toFixed(2)}`);
        console.log(`Total iterations: ${iteration}\n`);
        // Generate final violation report
        this.calculateFitness(bestSolution.schedule);
        const violations = this.checker.getViolations();
        const hardViolations = violations.filter(v => v.severity === 'hard');
        const softViolations = violations.filter(v => v.severity === 'soft');
        const violationsByType = {};
        for (const v of violations) {
            violationsByType[v.constraintType] = (violationsByType[v.constraintType] || 0) + 1;
        }
        bestSolution.violationReport = {
            hardConstraintViolations: hardViolations,
            softConstraintViolations: softViolations,
            summary: {
                totalHardViolations: hardViolations.length,
                totalSoftViolations: softViolations.length,
                violationsByType
            }
        };
        return bestSolution;
    }
}
exports.SimulatedAnnealing = SimulatedAnnealing;
// ============================================
// MAIN EXECUTION
// ============================================
function main() {
    console.log('==========================================');
    console.log('ENHANCED SIMULATED ANNEALING - UTCP SOLVER');
    console.log('University Timetabling Problem');
    console.log('==========================================\n');
    const { rooms, lecturers, classes } = loadData("/home/aikano/ade-belajar/timetable-sa/src/data_uisi.xlsx");
    console.log(`✅ Loaded ${rooms.length} rooms`);
    console.log(`✅ Loaded ${lecturers.length} lecturers`);
    console.log(`✅ Loaded ${classes.filter(c => c.Kode_Matakuliah).length} classes\n`);
    const sa = new SimulatedAnnealing(rooms, lecturers, classes);
    const solution = sa.solve();
    console.log('💾 Saving results...\n');
    // Convert to readable format
    const output = solution.schedule.map(entry => {
        const calc = calculateEndTime(entry.timeSlot.startTime, entry.sks, entry.timeSlot.day);
        return {
            'Class ID': entry.classId,
            'Class Name': entry.className,
            'Program': entry.prodi,
            'Lecturers': entry.lecturers.join(', '),
            'Room': entry.room,
            'Day': entry.timeSlot.day,
            'Start Time': entry.timeSlot.startTime,
            'End Time': calc.endTime,
            'SKS': entry.sks,
            'Base Duration (minutes)': entry.sks * 50 + (entry.sks - 1) * 10,
            'Prayer Time Added (minutes)': entry.prayerTimeAdded,
            'Total Duration (minutes)': entry.sks * 50 + (entry.sks - 1) * 10 + entry.prayerTimeAdded,
            'Participants': entry.participants,
            'Class Type': entry.classType,
            'Needs Lab': entry.needsLab ? 'Yes' : 'No'
        };
    });
    fs_1.default.writeFileSync("/home/aikano/ade-belajar/timetable-sa/out/timetable_result_enhanced.json", JSON.stringify(output, null, 2));
    // Save violation report
    if (solution.violationReport) {
        fs_1.default.writeFileSync('/home/aikano/ade-belajar/timetable-sa/out/violation_report.json', JSON.stringify(solution.violationReport, null, 2));
        // Create human-readable violation report
        let reportText = '==========================================\n';
        reportText += 'CONSTRAINT VIOLATION REPORT\n';
        reportText += '==========================================\n\n';
        reportText += `📊 SUMMARY:\n`;
        reportText += `   Total Hard Violations: ${solution.violationReport.summary.totalHardViolations}\n`;
        reportText += `   Total Soft Violations: ${solution.violationReport.summary.totalSoftViolations}\n\n`;
        reportText += `📋 VIOLATIONS BY TYPE:\n`;
        for (const [type, count] of Object.entries(solution.violationReport.summary.violationsByType)) {
            reportText += `   ${type}: ${count}\n`;
        }
        reportText += '\n';
        if (solution.violationReport.hardConstraintViolations.length > 0) {
            reportText += `🚫 HARD CONSTRAINT VIOLATIONS:\n`;
            for (const v of solution.violationReport.hardConstraintViolations.slice(0, 20)) {
                reportText += `   • ${v.classId} (${v.className})\n`;
                reportText += `     ${v.constraintType}: ${v.reason}\n\n`;
            }
            if (solution.violationReport.hardConstraintViolations.length > 20) {
                reportText += `   ... and ${solution.violationReport.hardConstraintViolations.length - 20} more\n\n`;
            }
        }
        if (solution.violationReport.softConstraintViolations.length > 0) {
            reportText += `⚠️  SOFT CONSTRAINT VIOLATIONS (Sample):\n`;
            for (const v of solution.violationReport.softConstraintViolations.slice(0, 10)) {
                reportText += `   • ${v.classId}: ${v.reason}\n`;
            }
            if (solution.violationReport.softConstraintViolations.length > 10) {
                reportText += `   ... and ${solution.violationReport.softConstraintViolations.length - 10} more\n`;
            }
        }
        fs_1.default.writeFileSync("/home/aikano/ade-belajar/timetable-sa/out/violation_report.txt", reportText);
    }
    // Create Excel output
    const ws = XLSX.utils.json_to_sheet(output);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, "/home/aikano/ade-belajar/timetable-sa/out/timetable_result_enhanced.xlsx");
    console.log('✅ Results saved to:');
    console.log('   - timetable_result_enhanced.json');
    console.log('   - timetable_result_enhanced.xlsx');
    console.log('   - violation_report.json');
    console.log('   - violation_report.txt\n');
    console.log('==========================================');
    console.log('PROCESS COMPLETE! 🎓');
    console.log('==========================================');
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map