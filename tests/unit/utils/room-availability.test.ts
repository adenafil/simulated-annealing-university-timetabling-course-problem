/**
 * Unit tests for room availability functions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  canUseExclusiveRoom,
  isRoomAvailable,
  getAvailableRooms,
} from '../../../src/utils/room-availability.js';
import type { Room, ScheduleEntry, TimeSlot, ClassRequirement } from '../../../src/types/index.js';

describe('Room Availability Utilities', () => {
  describe('canUseExclusiveRoom', () => {
    it('should allow non-exclusive rooms for any course', () => {
      expect(canUseExclusiveRoom('CM-101', 'Mathematics', 'INFORMATIKA')).toBe(true);
      expect(canUseExclusiveRoom('CM-201', 'Physics', 'ENGINEERING')).toBe(true);
    });

    it('should allow exclusive room for matching course and prodi', () => {
      expect(canUseExclusiveRoom('G5-LabAudioVisual', 'Fotografi Dasar', 'DESAIN KOMUNIKASI VISUAL')).toBe(true);
    });

    it('should reject exclusive room for non-matching course', () => {
      expect(canUseExclusiveRoom('G5-LabAudioVisual', 'Mathematics', 'INFORMATIKA')).toBe(false);
    });

    it('should reject exclusive room for non-matching prodi', () => {
      expect(canUseExclusiveRoom('G5-LabAudioVisual', 'Fotografi Dasar', 'INFORMATIKA')).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      expect(canUseExclusiveRoom('G5-LabAudioVisual', 'fotografi dasar', 'desain komunikasi visual')).toBe(true);
      expect(canUseExclusiveRoom('G5-LabAudioVisual', 'FOTOGRAFI DASAR', 'DESAIN KOMUNIKASI VISUAL')).toBe(true);
    });
  });

  describe('isRoomAvailable', () => {
    let schedule: ScheduleEntry[];
    let timeSlot: TimeSlot;

    beforeEach(() => {
      timeSlot = {
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:40',
        period: 1,
      };

      schedule = [
        {
          classId: 'IF101',
          className: 'Programming',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: {
            day: 'Monday',
            startTime: '10:00',
            endTime: '11:40',
            period: 2,
          },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        },
      ];
    });

    it('should return true when room is available (different day)', () => {
      const tuesdaySlot: TimeSlot = { ...timeSlot, day: 'Tuesday' };
      expect(isRoomAvailable(schedule, 'CM-101', tuesdaySlot, 2)).toBe(true);
    });

    it('should return true when room is available (different time, same day)', () => {
      const earlySlot: TimeSlot = {
        day: 'Monday',
        startTime: '07:30',
        endTime: '09:10',
        period: 1,
      };
      expect(isRoomAvailable(schedule, 'CM-101', earlySlot, 2)).toBe(true);
    });

    it('should return true when room is different', () => {
      expect(isRoomAvailable(schedule, 'CM-102', timeSlot, 2)).toBe(true);
    });

    it('should return false when there is time overlap', () => {
      const overlappingSlot: TimeSlot = {
        day: 'Monday',
        startTime: '10:30',
        endTime: '12:10',
        period: 2,
      };
      expect(isRoomAvailable(schedule, 'CM-101', overlappingSlot, 2)).toBe(false);
    });

    it('should return false for exact same time', () => {
      const sameSlot: TimeSlot = {
        day: 'Monday',
        startTime: '10:00',
        endTime: '11:40',
        period: 2,
      };
      expect(isRoomAvailable(schedule, 'CM-101', sameSlot, 2)).toBe(false);
    });

    it('should handle prayer time correctly', () => {
      // Schedule has class from 11:00 with 2 SKS (ends at 12:50 with prayer)
      const scheduleWithPrayer: ScheduleEntry[] = [
        {
          classId: 'IF102',
          className: 'Database',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: {
            day: 'Monday',
            startTime: '11:00',
            endTime: '12:50',
            period: 3,
          },
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 50, // Dzuhur prayer
        },
      ];

      // Try to schedule at 12:00 (should conflict)
      const conflictSlot: TimeSlot = {
        day: 'Monday',
        startTime: '12:00',
        endTime: '13:40',
        period: 4,
      };
      expect(isRoomAvailable(scheduleWithPrayer, 'CM-101', conflictSlot, 2)).toBe(false);
    });
  });

  describe('getAvailableRooms', () => {
    let allRooms: Room[];
    let schedule: ScheduleEntry[];
    let classReq: ClassRequirement;
    let timeSlot: TimeSlot;

    beforeEach(() => {
      allRooms = [
        { Code: 'CM-101', Name: 'Classroom 101', Type: 'Regular', Capacity: 40 },
        { Code: 'CM-102', Name: 'Classroom 102', Type: 'Regular', Capacity: 30 },
        { Code: 'CM-Lab1', Name: 'Computer Lab 1', Type: 'Lab', Capacity: 35 },
        { Code: 'G5-LabAudioVisual', Name: 'Audio Visual Lab', Type: 'Lab', Capacity: 40 },
      ];

      schedule = [];

      classReq = {
        Prodi: 'INFORMATIKA',
        Kelas: 'IF-1A',
        Kode_Matakuliah: 'IF101',
        Mata_Kuliah: 'Programming',
        SKS: 2,
        Jenis: 'Teori',
        Peserta: 30,
        Kode_Dosen1: 'L001',
        Kode_Dosen2: '',
        Kode_Dosen_Prodi_Lain1: '',
        Kode_Dosen_Prodi_Lain2: '',
        Class_Type: 'pagi',
        should_on_the_lab: 'no',
        rooms: '',
      };

      timeSlot = {
        day: 'Monday',
        startTime: '08:00',
        endTime: '09:40',
        period: 1,
      };
    });

    it('should return non-lab rooms for non-lab classes', () => {
      const rooms = getAvailableRooms(
        allRooms,
        schedule,
        classReq,
        timeSlot,
        30,
        false,
        'Programming',
        'INFORMATIKA'
      );
      expect(rooms).toContain('CM-101');
      expect(rooms).toContain('CM-102');
      expect(rooms).not.toContain('G5-LabAudioVisual');
    });

    it('should return lab rooms for lab classes', () => {
      const rooms = getAvailableRooms(
        allRooms,
        schedule,
        classReq,
        timeSlot,
        30,
        true,
        'Programming Lab',
        'INFORMATIKA'
      );
      expect(rooms).toContain('CM-Lab1');
      // Note: The function also returns other rooms if lab rooms are not enough
      // This is by design for overflow handling
    });

    it('should respect room capacity', () => {
      // CM-102 has capacity 30, so shouldn't be available for 40 students
      const rooms = getAvailableRooms(
        allRooms,
        schedule,
        classReq,
        timeSlot,
        40,
        false,
        'Programming',
        'INFORMATIKA'
      );
      expect(rooms).toContain('CM-101'); // Capacity 40
      expect(rooms).not.toContain('CM-102'); // Capacity 30
    });

    it('should return only exclusive room for exclusive course', () => {
      const rooms = getAvailableRooms(
        allRooms,
        schedule,
        classReq,
        timeSlot,
        35,
        false,
        'Fotografi Dasar',
        'DESAIN KOMUNIKASI VISUAL'
      );
      expect(rooms).toEqual(['G5-LabAudioVisual']);
    });

    it('should return empty array if exclusive room is not available', () => {
      // Occupy the exclusive room
      const occupiedSchedule: ScheduleEntry[] = [
        {
          classId: 'DKV101',
          className: 'Fotografi Dasar',
          class: 'DKV-1A',
          prodi: 'DESAIN KOMUNIKASI VISUAL',
          lecturers: ['L002'],
          room: 'G5-LabAudioVisual',
          timeSlot: {
            day: 'Monday',
            startTime: '08:00',
            endTime: '09:40',
            period: 1,
          },
          sks: 2,
          needsLab: true,
          participants: 35,
          classType: 'pagi',
          prayerTimeAdded: 0,
        },
      ];

      const rooms = getAvailableRooms(
        allRooms,
        occupiedSchedule,
        classReq,
        timeSlot,
        35,
        false,
        'Fotografi Dasar',
        'DESAIN KOMUNIKASI VISUAL'
      );
      expect(rooms).toEqual([]);
    });

    it('should handle specific rooms from requirements', () => {
      const reqWithSpecificRoom = {
        ...classReq,
        rooms: 'CM-101',
      };

      const rooms = getAvailableRooms(
        allRooms,
        schedule,
        reqWithSpecificRoom,
        timeSlot,
        30,
        false,
        'Programming',
        'INFORMATIKA'
      );
      expect(rooms).toEqual(['CM-101']);
    });

    it('should return available rooms even when preferred type is busy', () => {
      // Occupy all non-lab rooms at different times
      const laterTimeSlot: TimeSlot = {
        day: 'Monday',
        startTime: '10:00',
        endTime: '11:40',
        period: 2,
      };

      const partialSchedule: ScheduleEntry[] = [
        {
          classId: 'IF101',
          className: 'Math',
          class: 'IF-1A',
          prodi: 'INFORMATIKA',
          lecturers: ['L001'],
          room: 'CM-101',
          timeSlot: laterTimeSlot,
          sks: 2,
          needsLab: false,
          participants: 30,
          classType: 'pagi',
          prayerTimeAdded: 0,
        },
      ];

      const rooms = getAvailableRooms(
        allRooms,
        partialSchedule,
        classReq,
        timeSlot, // Different time
        30,
        false,
        'Programming',
        'INFORMATIKA'
      );

      // Should still get regular rooms at different time
      expect(rooms.length).toBeGreaterThan(0);
    });
  });
});
