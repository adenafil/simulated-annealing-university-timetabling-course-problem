/**
 * Constraint checker for timetabling problem
 * Validates both hard and soft constraints
 */

import type {
  Room,
  Lecturer,
  ScheduleEntry,
  ConstraintViolation,
} from "../types/index.js";
import { LAB_ROOMS, EXCLUSIVE_ROOMS } from "../constants/index.js";
import {
  calculateEndTime,
  timeToMinutes,
  getPrayerTimeOverlap,
  isValidFridayStartTime,
  isStartingDuringPrayerTime,
  canUseExclusiveRoom,
} from "../utils/index.js";

export class ConstraintChecker {
  private rooms: Map<string, Room>;
  private lecturers: Map<string, Lecturer>;
  private violations: ConstraintViolation[] = [];

  constructor(rooms: Room[], lecturers: Lecturer[]) {
    this.rooms = new Map(rooms.map((r) => [r.Code, r]));
    this.lecturers = new Map(lecturers.map((l) => [l.Code, l]));
  }

  resetViolations(): void {
    this.violations = [];
  }

  getViolations(): ConstraintViolation[] {
    return this.violations;
  }

  private addViolation(violation: ConstraintViolation): void {
    this.violations.push(violation);
  }

  // HARD CONSTRAINTS

  /**
   * HC1: No lecturer can teach two classes at the same time
   */
  checkNoLecturerConflict(schedule: ScheduleEntry[], entry: ScheduleEntry): boolean {
    for (const existing of schedule) {
      if (this.isTimeOverlap(existing, entry)) {
        for (const lecturer of entry.lecturers) {
          if (existing.lecturers.includes(lecturer)) {
            this.addViolation({
              classId: entry.classId,
              className: entry.className,
              constraintType: "HC1: Lecturer Conflict",
              reason: `Lecturer ${lecturer} has conflict with class ${existing.classId} on ${entry.timeSlot.day} at ${entry.timeSlot.startTime}`,
              severity: "hard",
              details: { conflictsWith: existing.classId, lecturer },
            });
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * HC2: No two classes can use the same room at the same time
   */
  checkNoRoomConflict(schedule: ScheduleEntry[], entry: ScheduleEntry): boolean {
    for (const existing of schedule) {
      if (existing.room === entry.room && this.isTimeOverlap(existing, entry)) {
        this.addViolation({
          classId: entry.classId,
          className: entry.className,
          constraintType: "HC2: Room Conflict",
          reason: `Room ${entry.room} is already occupied by class ${existing.classId} on ${entry.timeSlot.day} at ${entry.timeSlot.startTime}`,
          severity: "hard",
          details: { conflictsWith: existing.classId, room: entry.room },
        });
        return false;
      }
    }
    return true;
  }

  /**
   * HC3: Room capacity must accommodate all participants
   */
  checkRoomCapacity(entry: ScheduleEntry): boolean {
    const room = this.rooms.get(entry.room);
    if (!room) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "HC3: Room Capacity",
        reason: `Room ${entry.room} not found`,
        severity: "hard",
      });
      return false;
    }

    if (room.Capacity < entry.participants) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "HC3: Room Capacity",
        reason: `Room ${entry.room} capacity (${room.Capacity}) is less than participants (${entry.participants})`,
        severity: "hard",
        details: { roomCapacity: room.Capacity, participants: entry.participants },
      });
      return false;
    }

    return true;
  }

  /**
   * SC4 (Soft): Lab classes should be in lab rooms
   */
  checkLabRequirement(entry: ScheduleEntry): number {
    if (!entry.needsLab) {
      if (LAB_ROOMS.includes(entry.room)) {
        return 0.7;
      }
      return 1;
    }

    const room = this.rooms.get(entry.room);
    if (!room) return 0;

    if (room.Type.toLowerCase().includes("lab") || LAB_ROOMS.includes(room.Code)) {
      return 1;
    }

    return 0.3;
  }

  /**
   * HC5: No two classes from the same program can be scheduled at the same time
   */
  checkNoClassConflictSameProdi(schedule: ScheduleEntry[], entry: ScheduleEntry): boolean {
    for (const existing of schedule) {
      if (existing.prodi === entry.prodi && this.isTimeOverlap(existing, entry)) {
        this.addViolation({
          classId: entry.classId,
          className: entry.className,
          constraintType: "HC5: Prodi Conflict",
          reason: `Same program (${entry.prodi}) has class ${existing.classId} at the same time on ${entry.timeSlot.day}`,
          severity: "hard",
          details: { conflictsWith: existing.classId, prodi: entry.prodi },
        });
        return false;
      }
    }
    return true;
  }

  /**
   * SC8 (Soft): Avoid scheduling on lecturer's research day
   */
  checkResearchDay(entry: ScheduleEntry): number {
    for (const lecturerCode of entry.lecturers) {
      const lecturer = this.lecturers.get(lecturerCode);
      if (lecturer && lecturer.Research_Day) {
        const researchDay = lecturer.Research_Day.trim();

        if ((researchDay && entry.timeSlot.day === researchDay) || researchDay.includes(entry.timeSlot.day)) {
          this.addViolation({
            classId: entry.classId,
            className: entry.className,
            constraintType: "SC8: Research Day",
            reason: `Lecturer ${lecturerCode} has research day on ${researchDay}`,
            severity: "soft",
            details: { lecturer: lecturerCode, researchDay },
          });
          return 0.3;
        }
      }
    }
    return 1;
  }

  /**
   * HC7: Lecturer cannot exceed maximum daily teaching periods
   */
  checkMaxDailyPeriods(schedule: ScheduleEntry[], entry: ScheduleEntry): boolean {
    for (const lecturerCode of entry.lecturers) {
      const lecturer = this.lecturers.get(lecturerCode);
      if (!lecturer || !lecturer.Max_Daily_Periods) continue;

      let periodsCount = 0;
      for (const existing of schedule) {
        if (existing.timeSlot.day === entry.timeSlot.day && existing.lecturers.includes(lecturerCode)) {
          periodsCount += existing.sks;
        }
      }

      periodsCount += entry.sks;

      if (periodsCount > lecturer.Max_Daily_Periods) {
        this.addViolation({
          classId: entry.classId,
          className: entry.className,
          constraintType: "HC7: Max Daily Periods",
          reason: `Lecturer ${lecturerCode} exceeds max daily periods (${lecturer.Max_Daily_Periods}) on ${entry.timeSlot.day}`,
          severity: "hard",
          details: { lecturer: lecturerCode, periods: periodsCount, max: lecturer.Max_Daily_Periods },
        });
        return false;
      }
    }
    return true;
  }

  /**
   * HC8: Class type must match time slot (morning/evening)
   */
  checkClassTypeTime(entry: ScheduleEntry): boolean {
    const hour = parseInt(entry.timeSlot.startTime.split(":")[0]!);
    const minute = parseInt(entry.timeSlot.startTime.split(":")[1]!);
    const startMinutes = hour * 60 + minute;

    if (entry.classType === "sore") {
      if (startMinutes < 15 * 60 + 30) {
        this.addViolation({
          classId: entry.classId,
          className: entry.className,
          constraintType: "HC8: Class Type Time",
          reason: `Evening class starting too early at ${entry.timeSlot.startTime}`,
          severity: "hard",
        });
        return false;
      }
      return true;
    } else {
      if (hour >= 18 && minute >= 30) {
        this.addViolation({
          classId: entry.classId,
          className: entry.className,
          constraintType: "HC8: Class Type Time",
          reason: `Morning class starting too late at ${entry.timeSlot.startTime}`,
          severity: "hard",
        });
        return false;
      }
      return true;
    }
  }

  /**
   * HC9: Only Magister Manajemen can have classes on Saturday
   */
  checkSaturdayRestriction(entry: ScheduleEntry): boolean {
    if (entry.timeSlot.day !== "Saturday") {
      return true;
    }

    const isMagisterManajemen = entry.prodi.toLowerCase().includes("magister manajemen");
    if (!isMagisterManajemen) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "HC9: Saturday Restriction",
        reason: `Only Magister Manajemen allowed on Saturday, but class is from ${entry.prodi}`,
        severity: "hard",
        details: { prodi: entry.prodi },
      });
    }
    return isMagisterManajemen;
  }

  /**
   * HC10: Friday time restrictions (cannot start at 11:00, 12:00, 13:00)
   */
  checkFridayTimeRestriction(entry: ScheduleEntry): boolean {
    if (entry.timeSlot.day !== "Friday") {
      return true;
    }

    if (!isValidFridayStartTime(entry.timeSlot.startTime)) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "HC10: Friday Time Restriction",
        reason: `Cannot start class at ${entry.timeSlot.startTime} on Friday (prohibited: 11:00, 12:00, 13:00)`,
        severity: "hard",
        details: { startTime: entry.timeSlot.startTime },
      });
      return false;
    }

    return true;
  }

  /**
   * HC11: Classes cannot start during prayer time
   */
  checkNotStartingDuringPrayerTime(entry: ScheduleEntry): boolean {
    if (isStartingDuringPrayerTime(entry.timeSlot.startTime)) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "HC11: Prayer Time Start",
        reason: `Class cannot start during prayer time at ${entry.timeSlot.startTime}`,
        severity: "hard",
        details: { startTime: entry.timeSlot.startTime },
      });
      return false;
    }
    return true;
  }

  /**
   * HC12: Exclusive room constraint (certain rooms for specific courses)
   */
  checkExclusiveRoomConstraint(entry: ScheduleEntry): boolean {
    const exclusiveConfig = EXCLUSIVE_ROOMS[entry.room];
    if (!exclusiveConfig) return true;

    if (!canUseExclusiveRoom(entry.room, entry.className, entry.prodi)) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "HC12: Exclusive Room",
        reason: `Room ${entry.room} is exclusive for ${exclusiveConfig.courses.join(", ")} from ${exclusiveConfig.prodi || "any prodi"}`,
        severity: "hard",
        details: { room: entry.room, allowedCourses: exclusiveConfig.courses },
      });
      return false;
    }

    return true;
  }

  private isTimeOverlap(entry1: ScheduleEntry, entry2: ScheduleEntry): boolean {
    if (entry1.timeSlot.day !== entry2.timeSlot.day) return false;

    const calc1 = calculateEndTime(entry1.timeSlot.startTime, entry1.sks, entry1.timeSlot.day);
    const calc2 = calculateEndTime(entry2.timeSlot.startTime, entry2.sks, entry2.timeSlot.day);

    const start1 = timeToMinutes(entry1.timeSlot.startTime);
    const end1 = timeToMinutes(calc1.endTime);
    const start2 = timeToMinutes(entry2.timeSlot.startTime);
    const end2 = timeToMinutes(calc2.endTime);

    return start1 < end2 && start2 < end1;
  }

  // SOFT CONSTRAINTS

  /**
   * SC1: Prefer lecturer's preferred time slots
   */
  checkPreferredTime(entry: ScheduleEntry): number {
    let totalScore = 0;
    let count = 0;

    for (const lecturerCode of entry.lecturers) {
      const lecturer = this.lecturers.get(lecturerCode);
      if (!lecturer || !lecturer.Prefered_Time) {
        continue;
      }

      const entryDay = entry.timeSlot.day.toLowerCase();
      const entryTimeStr = entry.timeSlot.startTime;

      const [entryHour, entryMinute] = entryTimeStr.split(":").map(Number);
      const entryTimeInMinutes = entryHour! * 60 + entryMinute!;

      const dailySchedules = lecturer.Prefered_Time.toLowerCase().split(", ");

      let isPreferred = false;

      for (const schedule of dailySchedules) {
        const [timeRange1, _, timeRange2, day] = schedule.trim().split(" ");
        const timeRange = `${timeRange1} ${_} ${timeRange2}`;

        if (day !== entryDay) {
          continue;
        }

        const [startTime, endTime] = timeRange.split(" - ");

        const [startHour, startMinute] = startTime!.split(".").map(Number);
        const [endHour, endMinute] = endTime!.split(".").map(Number);

        const startTimeInMinutes = startHour! * 60 + startMinute!;
        const endTimeInMinutes = endHour! * 60 + endMinute!;

        if (entryTimeInMinutes >= startTimeInMinutes && entryTimeInMinutes < endTimeInMinutes) {
          isPreferred = true;
          break;
        }
      }

      count++;
      if (isPreferred) {
        totalScore += 1;
      }
    }

    return count > 0 ? totalScore / count : 1;
  }

  /**
   * SC2: Prefer lecturer's preferred room
   */
  checkPreferredRoom(entry: ScheduleEntry): number {
    let totalScore = 0;
    let count = 0;

    for (const lecturerCode of entry.lecturers) {
      const lecturer = this.lecturers.get(lecturerCode);
      if (!lecturer || !lecturer.Prefered_Room) continue;

      count++;

      if (lecturer.Prefered_Room === entry.room) {
        totalScore += 1;
      }
    }

    return count > 0 ? totalScore / count : 1;
  }

  /**
   * SC3: Ensure sufficient transit time between classes for lecturers
   */
  checkTransitTime(schedule: ScheduleEntry[], entry: ScheduleEntry): number {
    let minScore = 1;

    for (const lecturerCode of entry.lecturers) {
      const lecturer = this.lecturers.get(lecturerCode);
      if (!lecturer || !lecturer.Transit_Time) continue;

      for (const existing of schedule) {
        if (existing.timeSlot.day !== entry.timeSlot.day) continue;
        if (!existing.lecturers.includes(lecturerCode)) continue;

        const calc = calculateEndTime(existing.timeSlot.startTime, existing.sks, existing.timeSlot.day);
        const prevEndMins = timeToMinutes(calc.endTime);
        const currentStartMins = timeToMinutes(entry.timeSlot.startTime);

        if (prevEndMins >= currentStartMins) {
          continue;
        }

        const gapMinutes = currentStartMins - prevEndMins;

        if (gapMinutes < lecturer.Transit_Time) {
          const score = Math.max(0, gapMinutes / lecturer.Transit_Time);

          this.addViolation({
            classId: entry.classId,
            className: entry.className,
            constraintType: "SC3: Transit Time",
            reason: `Lecturer ${lecturerCode} has insufficient transit time (${gapMinutes} mins, required: ${lecturer.Transit_Time} mins) between class ${existing.classId} and ${entry.classId}`,
            severity: "soft",
            details: {
              lecturer: lecturerCode,
              gapMinutes,
              requiredTransitTime: lecturer.Transit_Time,
              previousClassId: existing.classId,
            },
          });
          minScore = Math.min(minScore, score);
        }
      }
    }

    return minScore;
  }

  /**
   * SC4: Prefer compact schedules with minimal gaps
   */
  checkCompactness(schedule: ScheduleEntry[], entry: ScheduleEntry): number {
    const sameDayClasses = schedule.filter((s) => s.timeSlot.day === entry.timeSlot.day);

    if (sameDayClasses.length === 0) return 1;

    let minGap = Infinity;
    const currentStartMins = timeToMinutes(entry.timeSlot.startTime);
    const currentEndMins = timeToMinutes(
      calculateEndTime(entry.timeSlot.startTime, entry.sks, entry.timeSlot.day).endTime
    );

    for (const existing of sameDayClasses) {
      const existingEndMins = timeToMinutes(
        calculateEndTime(existing.timeSlot.startTime, existing.sks, existing.timeSlot.day).endTime
      );
      const existingStartMins = timeToMinutes(existing.timeSlot.startTime);

      if (existingEndMins <= currentStartMins) {
        const gap = currentStartMins - existingEndMins;
        minGap = Math.min(minGap, gap);
      }

      if (currentEndMins <= existingStartMins) {
        const gap = existingStartMins - currentEndMins;
        minGap = Math.min(minGap, gap);
      }
    }

    if (minGap === Infinity) return 1;
    return minGap <= 60 ? 1 : Math.max(0, 1 - (minGap - 60) / 180);
  }

  /**
   * SC5: Minimize prayer time overlaps
   */
  checkPrayerTimeOverlap(entry: ScheduleEntry): number {
    const prayerTime = getPrayerTimeOverlap(entry.timeSlot.startTime, entry.sks, entry.timeSlot.day);

    if (prayerTime === 0) {
      return 1;
    }

    let score = Math.max(0.5, 1 - prayerTime / 100);

    if (entry.timeSlot.day === "Friday") {
      const startMinutes = timeToMinutes(entry.timeSlot.startTime);
      const endTime = calculateEndTime(entry.timeSlot.startTime, entry.sks, entry.timeSlot.day).endTime;
      const endMinutes = timeToMinutes(endTime);

      const fridayPrayerStart = 12 * 60;
      const fridayPrayerEnd = 13 * 60;

      if (startMinutes < fridayPrayerEnd && endMinutes > fridayPrayerStart) {
        score = 0.1;
      }
    }

    this.addViolation({
      classId: entry.classId,
      className: entry.className,
      constraintType: "SC5: Prayer Time Overlap",
      reason: `Class overlaps with ${prayerTime} minutes of prayer time`,
      severity: "soft",
      details: { prayerTimeMinutes: prayerTime },
    });

    return score;
  }

  /**
   * SC6: Evening classes should start at preferred times
   */
  checkEveningClassPriority(entry: ScheduleEntry): number {
    if (entry.classType !== "sore") return 1;

    const startMinutes = timeToMinutes(entry.timeSlot.startTime);

    if (startMinutes >= 15 * 60 + 30 && startMinutes < 16 * 60) {
      return 0.8;
    } else if (startMinutes >= 16 * 60 && startMinutes < 18 * 60) {
      return 0.8;
    } else if (startMinutes >= 18 * 60 && startMinutes < 18 * 60 + 30) {
      return 0.85;
    } else if (startMinutes === 18 * 60 + 30) {
      return 1.0;
    } else if (startMinutes >= 19 * 60 + 30) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "SC6: Late Evening Start",
        reason: `Evening class starting too late at ${entry.timeSlot.startTime} (should avoid 19:30+)`,
        severity: "soft",
        details: { startTime: entry.timeSlot.startTime },
      });
      return 0.1;
    }

    return 0.1;
  }

  /**
   * SC7: Penalty for non-lab classes using lab rooms
   */
  checkOverflowPenalty(entry: ScheduleEntry): number {
    if (entry.isOverflowToLab) {
      this.addViolation({
        classId: entry.classId,
        className: entry.className,
        constraintType: "SC7: Overflow to Lab",
        reason: `Non-lab class using lab room ${entry.room} due to non-lab rooms being full`,
        severity: "soft",
        details: { room: entry.room },
      });
      return 0.7;
    }
    return 1;
  }
}
