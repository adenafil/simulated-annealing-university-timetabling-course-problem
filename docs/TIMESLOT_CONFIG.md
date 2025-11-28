# Time Slot Configuration Guide

This package supports flexible time slot configuration with **two modes**: partial override (merge mode) and full custom override.

## 📋 Table of Contents

- [Default Configuration](#default-configuration)
- [Mode 1: Merge with Defaults](#mode-1-merge-with-defaults-partial-override)
- [Mode 2: Full Custom Override](#mode-2-full-custom-override)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Default Configuration

If no configuration is provided, the package uses these defaults:

```typescript
{
  pagi: {
    startTime: "07:30",
    endTime: "17:00",
    slotDuration: 50  // minutes
  },
  sore: {
    startTime: "15:30",
    endTime: "21:00",
    slotDuration: 50  // minutes
  },
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}
```

---

## Mode 1: Merge with Defaults (Partial Override)

Use `timeSlotConfig` to override specific settings while keeping others as defaults.

### Example 1: Change Only Morning Start Time

```typescript
import { SimulatedAnnealing } from "timetable-sa";

const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: {
      startTime: "08:00"  // Only override start time
      // endTime: "17:00" (uses default)
      // slotDuration: 50 (uses default)
    }
  }
});
```

### Example 2: Change Multiple Settings

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: {
      startTime: "08:00",
      endTime: "16:00",
      slotDuration: 60  // 60-minute slots
    },
    sore: {
      startTime: "16:00",
      endTime: "20:00"
      // slotDuration: 50 (uses default)
    },
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]  // No Saturday
  }
});
```

### Example 3: Change Only Days

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday"]  // 4-day week
    // pagi and sore use defaults
  }
});
```

---

## Mode 2: Full Custom Override

Use `customTimeSlots` to provide completely custom time slots, **ignoring all defaults**.

### Example 1: Manual Custom Slots

```typescript
import type { TimeSlot } from "timetable-sa";

const customPagiSlots: TimeSlot[] = [
  { day: "Monday", startTime: "08:00", endTime: "09:30", period: 1 },
  { day: "Monday", startTime: "09:45", endTime: "11:15", period: 2 },
  { day: "Monday", startTime: "11:30", endTime: "13:00", period: 3 },
  { day: "Monday", startTime: "13:30", endTime: "15:00", period: 4 },
  // ... add more days
];

const customSoreSlots: TimeSlot[] = [
  { day: "Monday", startTime: "18:00", endTime: "19:30", period: 1 },
  { day: "Monday", startTime: "19:45", endTime: "21:15", period: 2 },
  // ... add more days
];

const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: {
    pagi: customPagiSlots,
    sore: customSoreSlots
  }
});
```

### Example 2: Programmatically Generated Slots

```typescript
function generateCustomSlots(
  days: string[],
  startTime: string,
  endTime: string,
  slotDuration: number,
  breakDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (const day of days) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;
    let period = 1;

    const endMinutes = endHour * 60 + endMin;

    while (true) {
      const currentMinutes = currentHour * 60 + currentMin;
      if (currentMinutes >= endMinutes) break;

      const startTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;

      const endSlotMin = currentMinutes + slotDuration;
      if (endSlotMin > endMinutes) break;

      const endSlotHour = Math.floor(endSlotMin / 60);
      const endSlotMinute = endSlotMin % 60;
      const endTimeStr = `${endSlotHour.toString().padStart(2, "0")}:${endSlotMinute.toString().padStart(2, "0")}`;

      slots.push({
        day,
        startTime: startTimeStr,
        endTime: endTimeStr,
        period,
      });

      const nextSlotMin = endSlotMin + breakDuration;
      currentHour = Math.floor(nextSlotMin / 60);
      currentMin = nextSlotMin % 60;
      period++;
    }
  }

  return slots;
}

// Generate 90-minute slots with 15-minute breaks
const customSlots = generateCustomSlots(
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "08:00",
  "17:00",
  90,   // 90-minute slots
  15    // 15-minute breaks
);

const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: {
    pagi: customSlots
  }
});
```

---

## API Reference

### TypeScript Interfaces

```typescript
/**
 * Time slot generation configuration (for merge mode)
 */
export interface TimeSlotGenerationConfig {
  startTime?: string;      // Format: "HH:MM" (e.g., "08:00")
  endTime?: string;        // Format: "HH:MM" (e.g., "17:00")
  slotDuration?: number;   // Minutes per slot (e.g., 50, 60, 90)
}

/**
 * Time slot configuration (merge with defaults)
 */
export interface TimeSlotConfig {
  pagi?: TimeSlotGenerationConfig;
  sore?: TimeSlotGenerationConfig;
  days?: string[];  // e.g., ["Monday", "Tuesday", "Wednesday"]
}

/**
 * Custom time slots (full override mode)
 */
export interface CustomTimeSlots {
  pagi?: TimeSlot[];
  sore?: TimeSlot[];
}

/**
 * Time slot structure
 */
export interface TimeSlot {
  day: string;        // "Monday", "Tuesday", etc.
  startTime: string;  // Format: "HH:MM"
  endTime: string;    // Format: "HH:MM"
  period: number;     // Period number (1, 2, 3, ...)
}

/**
 * Algorithm configuration
 */
export interface AlgorithmConfig {
  // ... other config options

  // Mode 1: Merge with defaults (partial override)
  timeSlotConfig?: TimeSlotConfig;

  // Mode 2: Full custom (100% override, ignore defaults)
  customTimeSlots?: CustomTimeSlots;
}
```

### Priority Order

The package applies configurations in this priority order:

1. **`customTimeSlots`** (highest priority) - Full override, ignores everything else
2. **`timeSlotConfig`** - Merge with defaults
3. **Default configuration** (lowest priority) - Used if nothing is specified

```typescript
// Priority example:
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: { pagi: { startTime: "08:00" } },  // ❌ Ignored
  customTimeSlots: { pagi: myCustomSlots }           // ✅ This is used
});
```

---

## Examples

### Use Case 1: University with 8 AM Start

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: { startTime: "08:00" }
  }
});
```

### Use Case 2: 4-Day Work Week

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday"]
  }
});
```

### Use Case 3: Evening Classes Only

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    sore: {
      startTime: "17:00",
      endTime: "22:00",
      slotDuration: 90  // Longer slots for evening
    }
  }
});
```

### Use Case 4: Custom Block Schedule

```typescript
// 2-hour blocks with 30-minute breaks
const customSlots = generateCustomSlots(
  ["Monday", "Wednesday", "Friday"],
  "09:00",
  "17:00",
  120,  // 2-hour slots
  30    // 30-minute breaks
);

const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: { pagi: customSlots }
});
```

---

## Notes

- Time format must be `"HH:MM"` (24-hour format)
- `slotDuration` is in minutes
- The package preserves prayer time adjustments in the generation logic
- Custom slots give you full control but require manual creation
- Merge mode is recommended for simple adjustments
- See `examples/custom-timeslots.ts` for complete working examples

---

## Questions?

For more examples and advanced usage, check:
- `examples/custom-timeslots.ts` - Comprehensive examples
- `src/types/index.ts` - Full type definitions
- `src/constants/time-slots.ts` - Default configurations
