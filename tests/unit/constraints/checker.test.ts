/**
 * Unit tests for ConstraintChecker
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConstraintChecker } from '../../../src/constraints/checker.js';
import type { Room, Lecturer, ScheduleEntry } from '../../../src/types/index.js';

describe('ConstraintChecker', () => {
  let checker: ConstraintChecker;
  let rooms: Room[];
  let lecturers: Lecturer[];
  let schedule: ScheduleEntry[];

  beforeEach(() => {
    rooms = [
      { Code: 'CM-101', Name: 'Classroom 101', Type: 'Regular', Capacity: 40 },
      { Code: 'CM-102', Name: 'Classroom 102', Type: 'Regular', Capacity: 30 },
      { Code: 'CM-Lab1', Name: 'Computer Lab 1', Type: 'Lab', Capacity: 35 },
      { Code: 'G5-LabAudioVisual', Name: 'AV Lab', Type: 'Lab', Capacity: 40 },
    ];

    lecturers = [
      {
        'Prodi Code': 'IF',
        Code: 'L001',
        Name: 'Dr. John Doe',
        Prefered_Time: '08.00 - 10.00 monday, 13.00 - 15.00 wednesday',
        Research_Day: 'Friday',
        Transit_Time: 15,
        Max_Daily_Periods: 8,
        Prefered_Room: 'CM-101',
      },
      {
        'Prodi Code': 'IF',
        Code: 'L002',
        Name: 'Dr. Jane Smith',
        Prefered_Time: '10.00 - 12.00 tuesday',
        Research_Day: 'Thursday',
        Transit_Time: 30,
        Max_Daily_Periods: 6,
        Prefered_Room: 'CM-102',
      },
    ];

    checker = new ConstraintChecker(rooms, lecturers);
    schedule = [];
  });

  describe('Hard Constraints', () => {
    describe('HC1: checkNoLecturerConflict', () => {
      it('should pass when lecturer has no conflicts', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkNoLecturerConflict(schedule, entry)).toBe(true);
      });

      it('should fail when lecturer has time conflict', () => {
        const existing: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        const conflicting: ScheduleEntry = {
          classId: 'IF102',
          className: 'Database',
          class: 'IF-1B',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-102',
          timeSlot: { day: 'Monday', startTime: '08:30', endTime: '10:10', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        schedule.push(existing);
        expect(checker.checkNoLecturerConflict(schedule, conflicting)).toBe(false);
      });

      it('should pass when same lecturer on different days', () => {
        const existing: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        const differentDay: ScheduleEntry = {
          ...existing,
          classId: 'IF102',
          timeSlot: { day: 'Tuesday', startTime: '08:00', endTime: '09:40', period: 1 },
        };

        schedule.push(existing);
        expect(checker.checkNoLecturerConflict(schedule, differentDay)).toBe(true);
      });
    });

    describe('HC2: checkNoRoomConflict', () => {
      it('should pass when room is available', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkNoRoomConflict(schedule, entry)).toBe(true);
      });

      it('should fail when room has time conflict', () => {
        const existing: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        const conflicting: ScheduleEntry = {
          ...existing,
          classId: 'IF102',
          lecturers: ['L002'],
          timeSlot: { day: 'Monday', startTime: '09:00', endTime: '10:40', period: 2 },
        };

        schedule.push(existing);
        expect(checker.checkNoRoomConflict(schedule, conflicting)).toBe(false);
      });
    });

    describe('HC3: checkRoomCapacity', () => {
      it('should pass when room capacity is sufficient', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkRoomCapacity(entry)).toBe(true);
      });

      it('should fail when room capacity is insufficient', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-102', // Capacity 30
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 35, // Exceeds capacity
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkRoomCapacity(entry)).toBe(false);
      });

      it('should fail when room does not exist', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'NONEXISTENT',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkRoomCapacity(entry)).toBe(false);
      });
    });

    describe('HC5: checkNoClassConflictSameProdi', () => {
      it('should pass when no same prodi conflict', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkNoClassConflictSameProdi(schedule, entry)).toBe(true);
      });

      it('should fail when same prodi has time conflict', () => {
        const existing: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        const conflicting: ScheduleEntry = {
          classId: 'IF102',
          className: 'Database',
          class: 'IF-1B',
          prodi: 'INFORMATIKA', // Same prodi
          lecturers: ['L002'],
          room: 'CM-102',
          timeSlot: { day: 'Monday', startTime: '08:30', endTime: '10:10', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        schedule.push(existing);
        expect(checker.checkNoClassConflictSameProdi(schedule, conflicting)).toBe(false);
      });

      it('should pass when different prodi at same time', () => {
        const existing: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        const differentProdi: ScheduleEntry = {
          ...existing,
          classId: 'EE101',
          prodi: 'TEKNIK ELEKTRO',
          lecturers: ['L002'],
          room: 'CM-102',
        };

        schedule.push(existing);
        expect(checker.checkNoClassConflictSameProdi(schedule, differentProdi)).toBe(true);
      });
    });

    describe('HC8: checkClassTypeTime', () => {
      it('should pass morning class starting before 18:30', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkClassTypeTime(entry)).toBe(true);
      });

      it('should fail morning class starting at or after 18:30', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '18:30', endTime: '20:10', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkClassTypeTime(entry)).toBe(false);
      });

      it('should pass evening class starting at or after 15:30', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '18:30', endTime: '20:10', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'sore',
          prayerTimeAdded: 0,
        };

        expect(checker.checkClassTypeTime(entry)).toBe(true);
      });

      it('should fail evening class starting before 15:30', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '14:00', endTime: '15:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'sore',
          prayerTimeAdded: 0,
        };

        expect(checker.checkClassTypeTime(entry)).toBe(false);
      });
    });

    describe('HC9: checkSaturdayRestriction', () => {
      it('should pass for any prodi on weekdays', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkSaturdayRestriction(entry)).toBe(true);
      });

      it('should pass for Magister Manajemen on Saturday', () => {
        const entry: ScheduleEntry = {
          classId: 'MM101',
          className: 'Management',
          class: 'MM-1A',
          prodi: 'MAGISTER MANAJEMEN',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Saturday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkSaturdayRestriction(entry)).toBe(true);
      });

      it('should fail for non-Magister Manajemen on Saturday', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Saturday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkSaturdayRestriction(entry)).toBe(false);
      });
    });

    describe('HC10: checkFridayTimeRestriction', () => {
      it('should pass for allowed Friday times', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Friday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkFridayTimeRestriction(entry)).toBe(true);
      });

      it('should fail for 11:00 start on Friday', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Friday', startTime: '11:00', endTime: '12:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkFridayTimeRestriction(entry)).toBe(false);
      });

      it('should pass for non-Friday days at any time', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '11:00', endTime: '12:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkFridayTimeRestriction(entry)).toBe(true);
      });
    });
  });

  describe('Soft Constraints', () => {
    describe('SC8: checkResearchDay', () => {
      it('should return 1.0 when not on research day', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'], // Research day: Friday
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkResearchDay(entry)).toBe(1);
      });

      it('should return 0.3 when on research day', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'], // Research day: Friday
          room: 'CM-101',
          timeSlot: { day: 'Friday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        };

        expect(checker.checkResearchDay(entry)).toBe(0.3);
      });
    });

    describe('SC7: checkOverflowPenalty', () => {
      it('should return 1.0 for non-overflow classes', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
          isOverflowToLab: false,
        };

        expect(checker.checkOverflowPenalty(entry)).toBe(1);
      });

      it('should return 0.7 for overflow classes', () => {
        const entry: ScheduleEntry = {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-Lab1',
          timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
          isOverflowToLab: true,
        };

        expect(checker.checkOverflowPenalty(entry)).toBe(0.7);
      });
    });
  });

  describe('Violation Tracking', () => {
    it('should track violations', () => {
      checker.resetViolations();

      const entry: ScheduleEntry = {
        classId: 'IF101',
        className: 'Programming',
        class: 'IF-1A',
        prodi: 'INFORMATIKA',
        lecturers: ['L001'],
        room: 'CM-102',
        timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
        sks: 2,
        needsLab: false,
        participants: 50, // Exceeds capacity
        classType: 'pagi',
        prayerTimeAdded: 0,
      };

      checker.checkRoomCapacity(entry);

      const violations = checker.getViolations();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.severity).toBe('hard');
    });

    it('should reset violations', () => {
      const entry: ScheduleEntry = {
        classId: 'IF101',
        className: 'Programming',
        class: 'IF-1A',
        prodi: 'INFORMATIKA',
        lecturers: ['L001'],
        room: 'NONEXISTENT',
        timeSlot: { day: 'Monday', startTime: '08:00', endTime: '09:40', period: 1 },
        sks: 2,
        needsLab: false,
        participants: 30,
        classType: 'pagi',
        prayerTimeAdded: 0,
      };

      checker.checkRoomCapacity(entry);
      expect(checker.getViolations().length).toBeGreaterThan(0);

      checker.resetViolations();
      expect(checker.getViolations().length).toBe(0);
    });
  });
});
