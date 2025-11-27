/**
 * Default configuration for Simulated Annealing algorithm
 */

import type { AlgorithmConfig, SoftConstraintWeights } from "../types/index.js";

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

export const DEFAULT_ALGORITHM_CONFIG: Required<AlgorithmConfig> = {
  initialTemperature: 10000,
  minTemperature: 0.0000001,
  coolingRate: 0.997,
  maxIterations: 15000,
  reheatingThreshold: 1200,
  reheatingFactor: 100,
  maxReheats: 7,
  hardConstraintWeight: 100000,
  softConstraintWeights: DEFAULT_SOFT_CONSTRAINT_WEIGHTS,
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig?: AlgorithmConfig): Required<AlgorithmConfig> {
  return {
    ...DEFAULT_ALGORITHM_CONFIG,
    ...userConfig,
    softConstraintWeights: {
      ...DEFAULT_SOFT_CONSTRAINT_WEIGHTS,
      ...userConfig?.softConstraintWeights,
    },
  };
}
