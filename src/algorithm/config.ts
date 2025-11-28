/**
 * Default configuration for Simulated Annealing algorithm
 */

import type {
  AlgorithmConfig,
  SoftConstraintWeights,
  TimeSlotConfig,
  CustomTimeSlots,
} from "../types/index.js";
import { DEFAULT_PAGI_CONFIG, DEFAULT_SORE_CONFIG, DEFAULT_DAYS } from "../constants/time-slots.js";

export const DEFAULT_SOFT_CONSTRAINT_WEIGHTS: Required<SoftConstraintWeights> = {
  preferredTime: 10,
  preferredRoom: 5,
  transitTime: 20,
  compactness: 8,
  prayerTimeOverlap: 15,
  eveningClassPriority: 25,
  labRequirement: 10,
  overflowPenalty: 5,
};

export const DEFAULT_TIME_SLOT_CONFIG: Required<TimeSlotConfig> = {
  pagi: DEFAULT_PAGI_CONFIG,
  sore: DEFAULT_SORE_CONFIG,
  days: DEFAULT_DAYS,
};

export const DEFAULT_ALGORITHM_CONFIG = {
  initialTemperature: 10000,
  minTemperature: 0.0000001,
  coolingRate: 0.997,
  maxIterations: 15000,
  reheatingThreshold: 1200,
  reheatingFactor: 100,
  maxReheats: 7,
  hardConstraintWeight: 100000,
  softConstraintWeights: DEFAULT_SOFT_CONSTRAINT_WEIGHTS,
  timeSlotConfig: DEFAULT_TIME_SLOT_CONFIG,
  customTimeSlots: undefined as CustomTimeSlots | undefined,
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig?: AlgorithmConfig): typeof DEFAULT_ALGORITHM_CONFIG {
  // Deep merge timeSlotConfig
  const mergedTimeSlotConfig: Required<TimeSlotConfig> = {
    pagi: {
      ...DEFAULT_TIME_SLOT_CONFIG.pagi,
      ...userConfig?.timeSlotConfig?.pagi,
    },
    sore: {
      ...DEFAULT_TIME_SLOT_CONFIG.sore,
      ...userConfig?.timeSlotConfig?.sore,
    },
    days: userConfig?.timeSlotConfig?.days || DEFAULT_TIME_SLOT_CONFIG.days,
  };

  return {
    ...DEFAULT_ALGORITHM_CONFIG,
    ...userConfig,
    softConstraintWeights: {
      ...DEFAULT_SOFT_CONSTRAINT_WEIGHTS,
      ...userConfig?.softConstraintWeights,
    },
    timeSlotConfig: mergedTimeSlotConfig,
    // customTimeSlots will override everything if provided
    customTimeSlots: userConfig?.customTimeSlots,
  };
}
