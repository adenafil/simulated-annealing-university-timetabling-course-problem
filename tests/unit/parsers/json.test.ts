/**
 * Unit tests for JSON parsers
 */

import { describe, it, expect } from '@jest/globals';
import { loadDataFromObject } from '../../../src/parsers/json.js';
import type { TimetableInput } from '../../../src/types/index.js';

describe('JSON Parsers', () => {
  describe('loadDataFromObject', () => {
    it('should accept valid timetable input', () => {
      const validInput: TimetableInput = {
        rooms: [
          { Code: 'CM-101', Name: 'Classroom 101', Type: 'Regular', Capacity: 40 },
        ],
        lecturers: [
          {
            'Prodi Code': 'IF',
            Code: 'L001',
            Name: 'Dr. John Doe',
            Prefered_Time: '08.00 - 10.00 monday',
            Research_Day: 'Friday',
            Transit_Time: 15,
            Max_Daily_Periods: 8,
            Prefered_Room: 'CM-101',
          },
        ],
        classes: [
          {
            Prodi: 'INFORMATIKA',
            Kelas: 'IF-1A',
            Kode_Matakuliah: 'IF101',
            Mata_Kuliah: 'Programming',
            SKS: 3,
            Jenis: 'Teori',
            Peserta: 30,
            Kode_Dosen1: 'L001',
            Kode_Dosen2: '',
            Kode_Dosen_Prodi_Lain1: '',
            Kode_Dosen_Prodi_Lain2: '',
            Class_Type: 'pagi',
            should_on_the_lab: 'no',
            rooms: '',
          },
        ],
      };

      const result = loadDataFromObject(validInput);
      expect(result.rooms).toHaveLength(1);
      expect(result.lecturers).toHaveLength(1);
      expect(result.classes).toHaveLength(1);
    });

    it('should throw error when rooms is missing', () => {
      const invalidInput = {
        lecturers: [],
        classes: [],
      } as any;

      expect(() => loadDataFromObject(invalidInput)).toThrow("Input data must contain a 'rooms' array");
    });

    it('should throw error when lecturers is missing', () => {
      const invalidInput = {
        rooms: [],
        classes: [],
      } as any;

      expect(() => loadDataFromObject(invalidInput)).toThrow("Input data must contain a 'lecturers' array");
    });

    it('should throw error when classes is missing', () => {
      const invalidInput = {
        rooms: [],
        lecturers: [],
      } as any;

      expect(() => loadDataFromObject(invalidInput)).toThrow("Input data must contain a 'classes' array");
    });

    it('should throw error when rooms is not an array', () => {
      const invalidInput = {
        rooms: 'not an array',
        lecturers: [],
        classes: [],
      } as any;

      expect(() => loadDataFromObject(invalidInput)).toThrow("Input data must contain a 'rooms' array");
    });

    it('should accept empty arrays', () => {
      const emptyInput: TimetableInput = {
        rooms: [],
        lecturers: [],
        classes: [],
      };

      const result = loadDataFromObject(emptyInput);
      expect(result.rooms).toHaveLength(0);
      expect(result.lecturers).toHaveLength(0);
      expect(result.classes).toHaveLength(0);
    });

    it('should preserve all data properties', () => {
      const input: TimetableInput = {
        rooms: [
          { Code: 'CM-101', Name: 'Classroom 101', Type: 'Regular', Capacity: 40 },
          { Code: 'CM-Lab1', Name: 'Lab 1', Type: 'Lab', Capacity: 30 },
        ],
        lecturers: [
          {
            'Prodi Code': 'IF',
            Code: 'L001',
            Name: 'Dr. John Doe',
            Prefered_Time: '08.00 - 10.00 monday',
            Research_Day: 'Friday',
            Transit_Time: 15,
            Max_Daily_Periods: 8,
            Prefered_Room: 'CM-101',
          },
        ],
        classes: [
          {
            Prodi: 'INFORMATIKA',
            Kelas: 'IF-1A',
            Kode_Matakuliah: 'IF101',
            Mata_Kuliah: 'Programming',
            SKS: 3,
            Jenis: 'Teori',
            Peserta: 30,
            Kode_Dosen1: 'L001',
            Kode_Dosen2: '',
            Kode_Dosen_Prodi_Lain1: '',
            Kode_Dosen_Prodi_Lain2: '',
            Class_Type: 'pagi',
            should_on_the_lab: 'yes',
            rooms: 'CM-Lab1',
          },
        ],
      };

      const result = loadDataFromObject(input);

      expect(result.rooms[0]?.Code).toBe('CM-101');
      expect(result.rooms[1]?.Code).toBe('CM-Lab1');
      expect(result.lecturers[0]?.Code).toBe('L001');
      expect(result.classes[0]?.Kode_Matakuliah).toBe('IF101');
      expect(result.classes[0]?.should_on_the_lab).toBe('yes');
    });
  });
});
