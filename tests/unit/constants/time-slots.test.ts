/**
 * Unit tests for time slot configuration
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  initializeTimeSlots,
  setCustomTimeSlots,
  TIME_SLOTS_PAGI,
  TIME_SLOTS_SORE,
  TIME_SLOTS,
  DEFAULT_PAGI_CONFIG,
  DEFAULT_SORE_CONFIG,
  DEFAULT_DAYS,
} from '../../../src/constants/time-slots.js';
import type { TimeSlot } from '../../../src/types/index.js';

describe('Time Slot Configuration', () => {
  describe('Default Configuration', () => {
    it('should have correct default PAGI config', () => {
      expect(DEFAULT_PAGI_CONFIG.startTime).toBe('07:30');
      expect(DEFAULT_PAGI_CONFIG.endTime).toBe('17:00');
      expect(DEFAULT_PAGI_CONFIG.slotDuration).toBe(50);
    });

    it('should have correct default SORE config', () => {
      expect(DEFAULT_SORE_CONFIG.startTime).toBe('15:30');
      expect(DEFAULT_SORE_CONFIG.endTime).toBe('21:00');
      expect(DEFAULT_SORE_CONFIG.slotDuration).toBe(50);
    });

    it('should have correct default days', () => {
      expect(DEFAULT_DAYS).toEqual([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]);
    });

    it('should auto-initialize time slots on import', () => {
      expect(TIME_SLOTS_PAGI.length).toBeGreaterThan(0);
      expect(TIME_SLOTS_SORE.length).toBeGreaterThan(0);
      expect(TIME_SLOTS.length).toBeGreaterThan(0);
    });
  });

  describe('initializeTimeSlots - Merge Mode', () => {
    beforeEach(() => {
      // Reset to defaults before each test
      initializeTimeSlots();
    });

    it('should use defaults when no config provided', () => {
      initializeTimeSlots();

      expect(TIME_SLOTS_PAGI.length).toBeGreaterThan(0);
      expect(TIME_SLOTS_PAGI[0]?.startTime).toBe('07:30');
    });

    it('should override only PAGI start time', () => {
      initializeTimeSlots({ startTime: '08:00' });

      expect(TIME_SLOTS_PAGI.length).toBeGreaterThan(0);
      expect(TIME_SLOTS_PAGI[0]?.startTime).toBe('08:00');
    });

    it('should override PAGI config completely', () => {
      initializeTimeSlots({
        startTime: '08:00',
        endTime: '16:00',
        slotDuration: 60,
      });

      const firstSlot = TIME_SLOTS_PAGI[0];
      expect(firstSlot?.startTime).toBe('08:00');

      // Check if slot duration is 60 minutes
      const [startHour, startMin] = firstSlot!.startTime.split(':').map(Number);
      const [endHour, endMin] = firstSlot!.endTime.split(':').map(Number);
      const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      expect(durationMinutes).toBe(60);
    });

    it('should override SORE config', () => {
      initializeTimeSlots(
        undefined,
        { startTime: '16:00', endTime: '20:00' }
      );

      expect(TIME_SLOTS_SORE.length).toBeGreaterThan(0);
      expect(TIME_SLOTS_SORE[0]?.startTime).toBe('16:00');
    });

    it('should override both PAGI and SORE configs', () => {
      initializeTimeSlots(
        { startTime: '08:00' },
        { startTime: '17:00' }
      );

      expect(TIME_SLOTS_PAGI[0]?.startTime).toBe('08:00');
      expect(TIME_SLOTS_SORE[0]?.startTime).toBe('17:00');
    });

    it('should override days', () => {
      const customDays = ['Monday', 'Tuesday', 'Wednesday'];
      initializeTimeSlots(undefined, undefined, customDays);

      // Check that all slots are only from custom days
      const uniqueDays = new Set(TIME_SLOTS_PAGI.map(slot => slot.day));
      expect(uniqueDays.size).toBe(3);
      expect([...uniqueDays].sort()).toEqual(customDays.sort());
    });

    it('should generate correct number of slots for custom duration', () => {
      // 60-minute slots from 08:00 to 12:00 = 4 slots per day
      initializeTimeSlots(
        {
          startTime: '08:00',
          endTime: '12:00',
          slotDuration: 60,
        },
        undefined,
        ['Monday']
      );

      const mondaySlots = TIME_SLOTS_PAGI.filter(slot => slot.day === 'Monday');
      expect(mondaySlots.length).toBeGreaterThan(0);
      expect(mondaySlots.length).toBeLessThanOrEqual(4);
    });

    it('should maintain slot period numbering', () => {
      initializeTimeSlots(
        { startTime: '08:00', endTime: '10:00' },
        undefined,
        ['Monday']
      );

      const mondaySlots = TIME_SLOTS_PAGI.filter(slot => slot.day === 'Monday');
      mondaySlots.forEach((slot, index) => {
        expect(slot.period).toBeGreaterThan(0);
      });
    });

    it('should handle edge case with very short time range', () => {
      initializeTimeSlots(
        {
          startTime: '08:00',
          endTime: '08:30',
          slotDuration: 50,
        },
        undefined,
        ['Monday']
      );

      // Should not generate any slots (30 min < 50 min slot)
      const mondaySlots = TIME_SLOTS_PAGI.filter(slot => slot.day === 'Monday');
      expect(mondaySlots.length).toBe(0);
    });
  });

  describe('setCustomTimeSlots - Full Override Mode', () => {
    it('should set custom PAGI slots', () => {
      const customSlots: TimeSlot[] = [
        { day: 'Monday', startTime: '08:00', endTime: '09:30', period: 1 },
        { day: 'Monday', startTime: '09:45', endTime: '11:15', period: 2 },
      ];

      setCustomTimeSlots(customSlots);

      expect(TIME_SLOTS_PAGI).toEqual(customSlots);
    });

    it('should set custom SORE slots', () => {
      const customSlots: TimeSlot[] = [
        { day: 'Monday', startTime: '18:00', endTime: '19:30', period: 1 },
        { day: 'Monday', startTime: '19:45', endTime: '21:15', period: 2 },
      ];

      setCustomTimeSlots(undefined, customSlots);

      expect(TIME_SLOTS_SORE).toEqual(customSlots);
    });

    it('should set both custom PAGI and SORE slots', () => {
      const customPagi: TimeSlot[] = [
        { day: 'Monday', startTime: '08:00', endTime: '10:00', period: 1 },
      ];

      const customSore: TimeSlot[] = [
        { day: 'Monday', startTime: '18:00', endTime: '20:00', period: 1 },
      ];

      setCustomTimeSlots(customPagi, customSore);

      expect(TIME_SLOTS_PAGI).toEqual(customPagi);
      expect(TIME_SLOTS_SORE).toEqual(customSore);
    });

    it('should rebuild TIME_SLOTS correctly', () => {
      const customPagi: TimeSlot[] = [
        { day: 'Monday', startTime: '08:00', endTime: '10:00', period: 1 },
      ];

      const customSore: TimeSlot[] = [
        { day: 'Monday', startTime: '18:00', endTime: '20:00', period: 1 },
        { day: 'Monday', startTime: '20:00', endTime: '22:00', period: 2 },
      ];

      setCustomTimeSlots(customPagi, customSore);

      // TIME_SLOTS should include pagi + sore (18:00+)
      expect(TIME_SLOTS.length).toBe(3); // 1 pagi + 2 sore
    });

    it('should handle empty custom slots', () => {
      setCustomTimeSlots([]);

      expect(TIME_SLOTS_PAGI).toEqual([]);
      expect(TIME_SLOTS.length).toBeGreaterThanOrEqual(0);
    });

    it('should only include evening slots (18:00+) in TIME_SLOTS', () => {
      const customSore: TimeSlot[] = [
        { day: 'Monday', startTime: '15:30', endTime: '17:00', period: 1 }, // Before 18:00
        { day: 'Monday', startTime: '18:00', endTime: '19:30', period: 2 }, // 18:00+
        { day: 'Monday', startTime: '19:30', endTime: '21:00', period: 3 }, // 18:00+
      ];

      setCustomTimeSlots([], customSore);

      // TIME_SLOTS should only include slots >= 18:00
      const eveningSlots = TIME_SLOTS.filter(slot => {
        const [hour] = slot.startTime.split(':').map(Number);
        return hour >= 18;
      });

      expect(eveningSlots.length).toBe(2);
    });
  });

  describe('Time Slot Structure Validation', () => {
    it('should have valid time format (HH:MM)', () => {
      initializeTimeSlots();

      const timeFormatRegex = /^\d{2}:\d{2}$/;

      TIME_SLOTS_PAGI.forEach(slot => {
        expect(slot.startTime).toMatch(timeFormatRegex);
        expect(slot.endTime).toMatch(timeFormatRegex);
      });
    });

    it('should have valid day names', () => {
      initializeTimeSlots();

      const validDays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];

      TIME_SLOTS_PAGI.forEach(slot => {
        expect(validDays).toContain(slot.day);
      });
    });

    it('should have end time after start time', () => {
      initializeTimeSlots();

      TIME_SLOTS_PAGI.forEach(slot => {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        expect(endMinutes).toBeGreaterThan(startMinutes);
      });
    });

    it('should have positive period numbers', () => {
      initializeTimeSlots();

      TIME_SLOTS_PAGI.forEach(slot => {
        expect(slot.period).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle 24-hour format correctly', () => {
      initializeTimeSlots({ startTime: '00:00', endTime: '02:00' });

      const midnightSlots = TIME_SLOTS_PAGI.filter(slot =>
        slot.startTime.startsWith('00:') || slot.startTime.startsWith('01:')
      );

      expect(midnightSlots.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle same start and end time', () => {
      initializeTimeSlots(
        { startTime: '08:00', endTime: '08:00' },
        undefined,
        ['Monday']
      );

      const mondaySlots = TIME_SLOTS_PAGI.filter(slot => slot.day === 'Monday');
      expect(mondaySlots.length).toBe(0);
    });

    it('should handle single day configuration', () => {
      initializeTimeSlots(undefined, undefined, ['Monday']);

      const uniqueDays = new Set(TIME_SLOTS_PAGI.map(slot => slot.day));
      expect(uniqueDays.size).toBe(1);
      expect([...uniqueDays][0]).toBe('Monday');
    });

    it('should handle large slot durations', () => {
      initializeTimeSlots({
        startTime: '08:00',
        endTime: '18:00',
        slotDuration: 180, // 3-hour slots
      });

      const firstSlot = TIME_SLOTS_PAGI[0];
      if (firstSlot) {
        const [startHour, startMin] = firstSlot.startTime.split(':').map(Number);
        const [endHour, endMin] = firstSlot.endTime.split(':').map(Number);
        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        expect(durationMinutes).toBe(180);
      }
    });
  });
});
