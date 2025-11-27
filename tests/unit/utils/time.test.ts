/**
 * Unit tests for time utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  timeToMinutes,
  minutesToTime,
  getPrayerTimeOverlap,
  calculateEndTime,
  isValidFridayStartTime,
  isStartingDuringPrayerTime,
} from '../../../src/utils/time.js';

describe('Time Utilities', () => {
  describe('timeToMinutes', () => {
    it('should convert morning time to minutes', () => {
      expect(timeToMinutes('08:30')).toBe(510);
      expect(timeToMinutes('07:30')).toBe(450);
    });

    it('should convert afternoon time to minutes', () => {
      expect(timeToMinutes('12:00')).toBe(720);
      expect(timeToMinutes('15:30')).toBe(930);
    });

    it('should convert evening time to minutes', () => {
      expect(timeToMinutes('18:30')).toBe(1110);
      expect(timeToMinutes('20:00')).toBe(1200);
    });

    it('should handle midnight', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTime', () => {
    it('should convert minutes to time string', () => {
      expect(minutesToTime(510)).toBe('08:30');
      expect(minutesToTime(450)).toBe('07:30');
    });

    it('should pad single digit hours and minutes', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(5)).toBe('00:05');
      expect(minutesToTime(65)).toBe('01:05');
    });

    it('should handle large values', () => {
      expect(minutesToTime(1439)).toBe('23:59');
      expect(minutesToTime(720)).toBe('12:00');
    });
  });

  describe('getPrayerTimeOverlap', () => {
    it('should return 0 when no overlap with prayer times', () => {
      // Class from 08:00 (1 SKS = 50 mins) ends at 08:50
      expect(getPrayerTimeOverlap('08:00', 1, 'Monday')).toBe(0);
    });

    it('should calculate Dzuhur prayer overlap', () => {
      // Dzuhur: 11:40 - 12:30 (50 mins)
      // Class from 11:00 (2 SKS = 100 mins) ends at 12:40
      expect(getPrayerTimeOverlap('11:00', 2, 'Monday')).toBe(50);
    });

    it('should calculate Ashar prayer overlap', () => {
      // Ashar: 15:00 - 15:30 (30 mins)
      // Class from 14:30 (2 SKS = 100 mins) ends at 16:10
      expect(getPrayerTimeOverlap('14:30', 2, 'Monday')).toBe(30);
    });

    it('should calculate Maghrib prayer overlap', () => {
      // Maghrib: 18:00 - 18:30 (30 mins)
      // Class from 17:30 (2 SKS = 100 mins) ends at 19:10
      expect(getPrayerTimeOverlap('17:30', 2, 'Monday')).toBe(30);
    });

    it('should calculate multiple prayer time overlaps', () => {
      // Class from 11:00 (7 SKS = 350 mins) ends at 16:50
      // Overlaps with Dzuhur (50) and Ashar (30)
      expect(getPrayerTimeOverlap('11:00', 7, 'Monday')).toBe(80);
    });

    it('should return 0 when class ends before prayer time', () => {
      // Class from 10:00 (1 SKS) ends at 10:50, before Dzuhur
      expect(getPrayerTimeOverlap('10:00', 1, 'Monday')).toBe(0);
    });
  });

  describe('calculateEndTime', () => {
    it('should calculate end time without prayer overlap', () => {
      const result = calculateEndTime('08:00', 2, 'Monday');
      expect(result.endTime).toBe('09:40'); // 08:00 + 100 mins
      expect(result.prayerTimeAdded).toBe(0);
    });

    it('should calculate end time with Dzuhur prayer', () => {
      const result = calculateEndTime('11:00', 2, 'Monday');
      expect(result.prayerTimeAdded).toBe(50);
      // The prayer time calculation is based on overlap, which adds to total duration
      // 11:00 + 100 (class) = 12:40, but prayer time extends it
      expect(result.endTime).toBe('13:30'); // Correct calculation based on actual implementation
    });

    it('should calculate end time with multiple prayers', () => {
      const result = calculateEndTime('11:00', 7, 'Monday');
      expect(result.prayerTimeAdded).toBe(80); // Dzuhur + Ashar
      // 11:00 + 350 (7*50) + 80 = 11:00 + 430 = 18:10
      expect(result.endTime).toBe('18:10');
    });

    it('should handle 3 SKS class', () => {
      const result = calculateEndTime('07:30', 3, 'Monday');
      expect(result.endTime).toBe('10:00'); // 07:30 + 150 mins
      expect(result.prayerTimeAdded).toBe(0);
    });
  });

  describe('isValidFridayStartTime', () => {
    it('should allow valid Friday start times', () => {
      expect(isValidFridayStartTime('07:30')).toBe(true);
      expect(isValidFridayStartTime('08:00')).toBe(true);
      expect(isValidFridayStartTime('10:00')).toBe(true);
      expect(isValidFridayStartTime('14:00')).toBe(true);
    });

    it('should reject 11:00 on Friday', () => {
      expect(isValidFridayStartTime('11:00')).toBe(false);
      expect(isValidFridayStartTime('11:30')).toBe(false);
    });

    it('should reject 12:00 on Friday', () => {
      expect(isValidFridayStartTime('12:00')).toBe(false);
      expect(isValidFridayStartTime('12:30')).toBe(false);
    });

    it('should reject 13:00 on Friday', () => {
      expect(isValidFridayStartTime('13:00')).toBe(false);
      expect(isValidFridayStartTime('13:30')).toBe(false);
    });
  });

  describe('isStartingDuringPrayerTime', () => {
    it('should return false for times outside prayer periods', () => {
      expect(isStartingDuringPrayerTime('08:00')).toBe(false);
      expect(isStartingDuringPrayerTime('10:00')).toBe(false);
      expect(isStartingDuringPrayerTime('16:00')).toBe(false);
    });

    it('should return true during Dzuhur prayer (11:40 - 12:30)', () => {
      expect(isStartingDuringPrayerTime('11:40')).toBe(true);
      expect(isStartingDuringPrayerTime('12:00')).toBe(true);
      expect(isStartingDuringPrayerTime('12:20')).toBe(true);
    });

    it('should return true during Ashar prayer (15:00 - 15:30)', () => {
      expect(isStartingDuringPrayerTime('15:00')).toBe(true);
      expect(isStartingDuringPrayerTime('15:15')).toBe(true);
      expect(isStartingDuringPrayerTime('15:25')).toBe(true);
    });

    it('should return true during Maghrib prayer (18:00 - 18:30)', () => {
      expect(isStartingDuringPrayerTime('18:00')).toBe(true);
      expect(isStartingDuringPrayerTime('18:15')).toBe(true);
      expect(isStartingDuringPrayerTime('18:25')).toBe(true);
    });

    it('should return false just before prayer times', () => {
      expect(isStartingDuringPrayerTime('11:39')).toBe(false);
      expect(isStartingDuringPrayerTime('14:59')).toBe(false);
      expect(isStartingDuringPrayerTime('17:59')).toBe(false);
    });

    it('should return false just after prayer times', () => {
      expect(isStartingDuringPrayerTime('12:30')).toBe(false);
      expect(isStartingDuringPrayerTime('15:30')).toBe(false);
      expect(isStartingDuringPrayerTime('18:30')).toBe(false);
    });
  });

  describe('Integration: Time calculations with prayer times', () => {
    it('should correctly calculate a full day schedule', () => {
      // Morning class: 08:00 - 10:00 (2 SKS, no prayer)
      const morning = calculateEndTime('08:00', 2, 'Monday');
      expect(morning.endTime).toBe('09:40');
      expect(morning.prayerTimeAdded).toBe(0);

      // Noon class: 11:00 - 13:00 (2 SKS, with Dzuhur)
      const noon = calculateEndTime('11:00', 2, 'Monday');
      expect(noon.prayerTimeAdded).toBe(50);

      // Afternoon class: 14:00 - 17:00 (3 SKS, with Ashar)
      const afternoon = calculateEndTime('14:00', 3, 'Monday');
      expect(afternoon.prayerTimeAdded).toBe(30);
    });
  });
});
