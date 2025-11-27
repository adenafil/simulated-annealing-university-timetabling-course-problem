/**
 * Time slot generation for morning (pagi) and evening (sore) classes
 */

import type { TimeSlot } from "../types/index.js";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TIME_SLOTS_PAGI: TimeSlot[] = [];
export const TIME_SLOTS_SORE: TimeSlot[] = [];
export const TIME_SLOTS: TimeSlot[] = [];

/**
 * Generate time slots for PAGI (morning classes: 07:30 - 17:00)
 */
function generatePagiTimeSlots(): void {
  for (const day of DAYS) {
    let hour = 7;
    let minute = 30;
    let period = 1;

    while (hour < 17 || (hour === 17 && minute === 0)) {
      const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

      let endHour = hour;
      let endMinute = minute + 50;
      if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
      }

      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

      if (hour === 19 && minute === 20) break;

      const slot = { day, startTime, endTime, period };
      TIME_SLOTS_PAGI.push(slot);
      TIME_SLOTS.push(slot);

      minute = endMinute;

      if (minute === 50 && hour === 15) {
        minute -= 20;
      } else if (hour === 18 && minute === 50) {
        minute -= 20;
      }

      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute = minute % 60;
      } else {
        hour = endHour;
      }

      period++;
    }
  }
}

/**
 * Generate time slots for SORE (evening classes: 15:30 - 21:00)
 */
function generateSoreTimeSlots(): void {
  for (const day of DAYS) {
    let hour = 15;
    let minute = 30;
    let period = 1;

    while (hour < 21 || (hour === 21 && minute === 0)) {
      const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

      let endHour = hour;
      let endMinute = minute + 50;
      if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
      }

      if (endHour > 21 || (endHour === 21 && endMinute > 0)) {
        break;
      }
      if (hour === 19 && minute === 20) break;

      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

      const slot = { day, startTime, endTime, period };
      TIME_SLOTS_SORE.push(slot);

      if (hour >= 18 || (hour === 18 && minute >= 30)) {
        TIME_SLOTS.push(slot);
      }

      minute = endMinute;

      if (minute === 50 && hour === 15) {
        minute -= 20;
      } else if (hour === 18 && minute === 50) {
        minute -= 20;
      }

      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute = minute % 60;
      } else {
        hour = endHour;
      }

      period++;
    }
  }
}

/**
 * Initialize time slots (called automatically)
 */
export function initializeTimeSlots(): void {
  if (TIME_SLOTS_PAGI.length === 0) {
    generatePagiTimeSlots();
  }
  if (TIME_SLOTS_SORE.length === 0) {
    generateSoreTimeSlots();
  }
}

// Auto-initialize time slots when module is imported
initializeTimeSlots();
