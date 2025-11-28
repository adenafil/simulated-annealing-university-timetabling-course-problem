# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-27

### Added
- **Configurable Time Slots** - Two new modes for customizing class schedules:
  - **Mode 1: Merge with Defaults** - Partial override using `timeSlotConfig`
    - Override only specific settings (e.g., start time, end time, slot duration)
    - Remaining settings use package defaults
    - Perfect for simple adjustments
  - **Mode 2: Full Custom Override** - Complete control using `customTimeSlots`
    - Provide custom time slots directly
    - 100% control over schedule structure
    - Ignores all defaults
- New interfaces for type safety:
  - `TimeSlotGenerationConfig` - Configuration for time slot generation
  - `TimeSlotConfig` - Merge mode configuration
  - `CustomTimeSlots` - Full override mode
- Exported default configurations for easy reference:
  - `DEFAULT_PAGI_CONFIG` - Default morning class configuration
  - `DEFAULT_SORE_CONFIG` - Default evening class configuration
  - `DEFAULT_DAYS` - Default days of the week
- New utility functions:
  - `initializeTimeSlots()` - Initialize with custom configuration (merge mode)
  - `setCustomTimeSlots()` - Set completely custom time slots (full override)
- Comprehensive unit tests:
  - 27 new tests for time slot configuration
  - 8 new tests for config merging
  - Total: 124 tests passing
- Documentation:
  - `docs/TIMESLOT_CONFIG.md` - Complete guide with examples
  - `examples/custom-timeslots.ts` - Working code examples

### Changed
- `AlgorithmConfig` interface extended with optional fields:
  - `timeSlotConfig?: TimeSlotConfig` - For merge mode
  - `customTimeSlots?: CustomTimeSlots` - For full override mode
- `mergeConfig()` function now deep merges time slot configurations
- Time slot constants (`TIME_SLOTS_PAGI`, `TIME_SLOTS_SORE`) are now mutable to support runtime configuration

### Technical Details
- **Backward Compatible**: All existing code continues to work without changes
- **Priority Order**: `customTimeSlots` > `timeSlotConfig` > defaults
- **Default Behavior**: Unchanged when no configuration is provided

### Examples

#### Merge Mode (Partial Override)
```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: { startTime: "08:00" },  // Only override start time
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }
});
```

#### Full Custom Mode
```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: {
    pagi: myCustomSlots,  // 100% custom
    sore: myCustomEveningSlots
  }
});
```

## [1.0.0] - 2025-01-XX

### Initial Release
- Simulated Annealing algorithm for University Course Timetabling Problem
- Two-phase optimization (hard constraints → soft constraints)
- Comprehensive constraint checking
- JSON and XLSX input support
- TypeScript implementation with full type safety

---

## Version Format

Given a version number MAJOR.MINOR.PATCH:

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

[1.1.0]: https://github.com/albertabayor/simulated-annealing-university-timetabling-course-problem/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/albertabayor/simulated-annealing-university-timetabling-course-problem/releases/tag/v1.0.0
