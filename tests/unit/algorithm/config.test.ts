/**
 * Unit tests for algorithm configuration
 */

import { describe, it, expect } from '@jest/globals';
import { mergeConfig, DEFAULT_ALGORITHM_CONFIG } from '../../../src/algorithm/config.js';
import type { AlgorithmConfig } from '../../../src/types/index.js';

describe('Algorithm Configuration', () => {
  describe('DEFAULT_ALGORITHM_CONFIG', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_ALGORITHM_CONFIG.initialTemperature).toBeDefined();
      expect(DEFAULT_ALGORITHM_CONFIG.minTemperature).toBeDefined();
      expect(DEFAULT_ALGORITHM_CONFIG.coolingRate).toBeDefined();
      expect(DEFAULT_ALGORITHM_CONFIG.maxIterations).toBeDefined();
      expect(DEFAULT_ALGORITHM_CONFIG.hardConstraintWeight).toBeDefined();
      expect(DEFAULT_ALGORITHM_CONFIG.softConstraintWeights).toBeDefined();
    });

    it('should have sensible default values', () => {
      expect(DEFAULT_ALGORITHM_CONFIG.initialTemperature).toBe(10000);
      expect(DEFAULT_ALGORITHM_CONFIG.minTemperature).toBe(0.0000001);
      expect(DEFAULT_ALGORITHM_CONFIG.coolingRate).toBe(0.997);
      expect(DEFAULT_ALGORITHM_CONFIG.maxIterations).toBe(15000);
      expect(DEFAULT_ALGORITHM_CONFIG.hardConstraintWeight).toBe(100000);
    });
  });

  describe('mergeConfig', () => {
    it('should return default config when no user config provided', () => {
      const result = mergeConfig();
      expect(result).toEqual(DEFAULT_ALGORITHM_CONFIG);
    });

    it('should merge user config with defaults', () => {
      const userConfig: AlgorithmConfig = {
        maxIterations: 20000,
        coolingRate: 0.995,
      };

      const result = mergeConfig(userConfig);

      expect(result.maxIterations).toBe(20000);
      expect(result.coolingRate).toBe(0.995);
      expect(result.initialTemperature).toBe(DEFAULT_ALGORITHM_CONFIG.initialTemperature);
    });

    it('should merge soft constraint weights', () => {
      const userConfig: AlgorithmConfig = {
        softConstraintWeights: {
          preferredTime: 20,
          transitTime: 30,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.softConstraintWeights.preferredTime).toBe(20);
      expect(result.softConstraintWeights.transitTime).toBe(30);
      expect(result.softConstraintWeights.compactness).toBe(
        DEFAULT_ALGORITHM_CONFIG.softConstraintWeights.compactness
      );
    });

    it('should override all properties if provided', () => {
      const userConfig: AlgorithmConfig = {
        initialTemperature: 15000,
        minTemperature: 0.00001,
        coolingRate: 0.99,
        maxIterations: 25000,
        reheatingThreshold: 2000,
        reheatingFactor: 150,
        maxReheats: 10,
        hardConstraintWeight: 200000,
        softConstraintWeights: {
          preferredTime: 25,
          preferredRoom: 15,
          transitTime: 35,
          compactness: 20,
          prayerTimeOverlap: 30,
          eveningClassPriority: 40,
          labRequirement: 25,
          overflowPenalty: 15,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.initialTemperature).toBe(15000);
      expect(result.minTemperature).toBe(0.00001);
      expect(result.coolingRate).toBe(0.99);
      expect(result.maxIterations).toBe(25000);
      expect(result.hardConstraintWeight).toBe(200000);
      expect(result.softConstraintWeights.preferredTime).toBe(25);
    });

    it('should not mutate default config', () => {
      const originalDefault = { ...DEFAULT_ALGORITHM_CONFIG };

      mergeConfig({ maxIterations: 99999 });

      expect(DEFAULT_ALGORITHM_CONFIG).toEqual(originalDefault);
    });

    it('should handle partial soft constraint weights', () => {
      const userConfig: AlgorithmConfig = {
        softConstraintWeights: {
          preferredTime: 100,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.softConstraintWeights.preferredTime).toBe(100);
      expect(result.softConstraintWeights.preferredRoom).toBe(
        DEFAULT_ALGORITHM_CONFIG.softConstraintWeights.preferredRoom
      );
      expect(result.softConstraintWeights.transitTime).toBe(
        DEFAULT_ALGORITHM_CONFIG.softConstraintWeights.transitTime
      );
    });
  });

  describe('Time Slot Configuration Merge', () => {
    it('should include default time slot config', () => {
      const result = mergeConfig();

      expect(result.timeSlotConfig).toBeDefined();
      expect(result.timeSlotConfig.pagi).toBeDefined();
      expect(result.timeSlotConfig.sore).toBeDefined();
      expect(result.timeSlotConfig.days).toBeDefined();
    });

    it('should merge partial timeSlotConfig.pagi', () => {
      const userConfig: AlgorithmConfig = {
        timeSlotConfig: {
          pagi: {
            startTime: '08:00',
          },
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.timeSlotConfig.pagi.startTime).toBe('08:00');
      expect(result.timeSlotConfig.pagi.endTime).toBe('17:00'); // default
      expect(result.timeSlotConfig.pagi.slotDuration).toBe(50); // default
    });

    it('should merge partial timeSlotConfig.sore', () => {
      const userConfig: AlgorithmConfig = {
        timeSlotConfig: {
          sore: {
            startTime: '16:00',
            endTime: '20:00',
          },
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.timeSlotConfig.sore.startTime).toBe('16:00');
      expect(result.timeSlotConfig.sore.endTime).toBe('20:00');
      expect(result.timeSlotConfig.sore.slotDuration).toBe(50); // default
    });

    it('should override days in timeSlotConfig', () => {
      const customDays = ['Monday', 'Tuesday', 'Wednesday'];
      const userConfig: AlgorithmConfig = {
        timeSlotConfig: {
          days: customDays,
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.timeSlotConfig.days).toEqual(customDays);
    });

    it('should merge complete timeSlotConfig', () => {
      const userConfig: AlgorithmConfig = {
        timeSlotConfig: {
          pagi: {
            startTime: '08:00',
            endTime: '16:00',
            slotDuration: 60,
          },
          sore: {
            startTime: '16:00',
            endTime: '20:00',
            slotDuration: 50,
          },
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
      };

      const result = mergeConfig(userConfig);

      expect(result.timeSlotConfig.pagi.startTime).toBe('08:00');
      expect(result.timeSlotConfig.pagi.endTime).toBe('16:00');
      expect(result.timeSlotConfig.pagi.slotDuration).toBe(60);
      expect(result.timeSlotConfig.sore.startTime).toBe('16:00');
      expect(result.timeSlotConfig.sore.endTime).toBe('20:00');
      expect(result.timeSlotConfig.days).toHaveLength(5);
    });

    it('should preserve customTimeSlots when provided', () => {
      const customSlots = {
        pagi: [
          { day: 'Monday', startTime: '08:00', endTime: '10:00', period: 1 },
        ],
        sore: [
          { day: 'Monday', startTime: '18:00', endTime: '20:00', period: 1 },
        ],
      };

      const userConfig: AlgorithmConfig = {
        customTimeSlots: customSlots,
      };

      const result = mergeConfig(userConfig);

      expect(result.customTimeSlots).toEqual(customSlots);
    });

    it('should handle both timeSlotConfig and customTimeSlots', () => {
      const userConfig: AlgorithmConfig = {
        timeSlotConfig: {
          pagi: { startTime: '08:00' },
        },
        customTimeSlots: {
          pagi: [
            { day: 'Monday', startTime: '09:00', endTime: '11:00', period: 1 },
          ],
        },
      };

      const result = mergeConfig(userConfig);

      // Both should be present
      expect(result.timeSlotConfig.pagi.startTime).toBe('08:00');
      expect(result.customTimeSlots).toBeDefined();
      expect(result.customTimeSlots?.pagi).toHaveLength(1);
    });

    it('should not mutate default time slot config', () => {
      const originalDefault = JSON.parse(JSON.stringify(DEFAULT_ALGORITHM_CONFIG.timeSlotConfig));

      mergeConfig({
        timeSlotConfig: {
          pagi: { startTime: '99:99' },
        },
      });

      expect(DEFAULT_ALGORITHM_CONFIG.timeSlotConfig).toEqual(originalDefault);
    });
  });
});
