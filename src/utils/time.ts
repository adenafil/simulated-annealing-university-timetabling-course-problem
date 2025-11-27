/**
 * Time calculation utilities
 */

import { PRAYER_TIMES } from "../constants/index.js";

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour! * 60 + minute!;
}

/**
 * Convert minutes from midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Calculate prayer time overlap for a class session
 */
export function getPrayerTimeOverlap(startTime: string, sks: number, day: string): number {
  const startMinutes = timeToMinutes(startTime);
  const classMinutes = sks * 50;
  const endMinutes = startMinutes + classMinutes;

  let totalPrayerTime = 0;

  if (startMinutes < PRAYER_TIMES.DZUHUR.end && endMinutes > PRAYER_TIMES.DZUHUR.start) {
    totalPrayerTime += PRAYER_TIMES.DZUHUR.duration;
  }

  if (startMinutes < PRAYER_TIMES.ASHAR.end && endMinutes > PRAYER_TIMES.ASHAR.start) {
    totalPrayerTime += PRAYER_TIMES.ASHAR.duration;
  }

  if (startMinutes < PRAYER_TIMES.MAGHRIB.end && endMinutes > PRAYER_TIMES.MAGHRIB.start) {
    totalPrayerTime += PRAYER_TIMES.MAGHRIB.duration;
  }

  return totalPrayerTime;
}

/**
 * Calculate end time for a class including prayer time
 */
export function calculateEndTime(
  startTime: string,
  sks: number,
  day: string
): { endTime: string; prayerTimeAdded: number } {
  const startMinutes = timeToMinutes(startTime);
  const classMinutes = sks * 50;
  const prayerTimeAdded = getPrayerTimeOverlap(startTime, sks, day);
  const totalMinutes = classMinutes + prayerTimeAdded;
  const endMinutes = startMinutes + totalMinutes;

  return {
    endTime: minutesToTime(endMinutes),
    prayerTimeAdded,
  };
}

/**
 * Check if start time is valid for Friday (cannot start at 11:00, 12:00, 13:00)
 */
export function isValidFridayStartTime(startTime: string): boolean {
  const hour = parseInt(startTime.split(":")[0]!);
  return !(hour === 11 || hour === 12 || hour === 13);
}

/**
 * Check if a class would start during prayer time
 */
export function isStartingDuringPrayerTime(startTime: string): boolean {
  const startMinutes = timeToMinutes(startTime);

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
