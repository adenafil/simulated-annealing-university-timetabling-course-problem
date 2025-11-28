# Release Notes - Version 1.1.0

## 🎉 New Feature: Configurable Time Slots

Version 1.1.0 introduces flexible time slot configuration, allowing users to customize class schedules according to their institution's specific needs.

---

## 📦 What's New

### Two Configuration Modes

#### 1. **Merge Mode** - Partial Override
Override specific settings while keeping defaults for the rest:

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: {
      startTime: "08:00"  // Only change this
    }
    // Other settings use defaults
  }
});
```

#### 2. **Full Custom Mode** - Complete Control
Provide your own time slots entirely:

```typescript
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  customTimeSlots: {
    pagi: [
      { day: "Monday", startTime: "08:00", endTime: "10:00", period: 1 },
      // ... your custom slots
    ]
  }
});
```

---

## 🔧 Use Cases

### Academic Institutions
- **8 AM Start Universities**: Change morning start time from 07:30 to 08:00
- **4-Day Work Week**: Exclude Friday and Saturday
- **Block Scheduling**: Create 2-hour blocks instead of 50-minute slots
- **Evening Programs**: Customize evening class times (MBA, executive programs)

### Example Scenarios

#### Scenario 1: University with 8 AM Start
```typescript
timeSlotConfig: {
  pagi: { startTime: "08:00" }
}
```

#### Scenario 2: 4-Day Week
```typescript
timeSlotConfig: {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday"]
}
```

#### Scenario 3: Block Schedule
```typescript
customTimeSlots: {
  pagi: generateCustomSlots(
    ["Monday", "Wednesday", "Friday"],
    "09:00", "17:00",
    120,  // 2-hour blocks
    30    // 30-min breaks
  )
}
```

---

## 📚 Technical Details

### New Interfaces

```typescript
interface TimeSlotGenerationConfig {
  startTime?: string;      // "HH:MM"
  endTime?: string;        // "HH:MM"
  slotDuration?: number;   // minutes
}

interface TimeSlotConfig {
  pagi?: TimeSlotGenerationConfig;
  sore?: TimeSlotGenerationConfig;
  days?: string[];
}

interface CustomTimeSlots {
  pagi?: TimeSlot[];
  sore?: TimeSlot[];
}
```

### Priority Order

1. **`customTimeSlots`** (highest) - Full override
2. **`timeSlotConfig`** - Merge with defaults
3. **Default configuration** (lowest) - Package defaults

### Default Values

```typescript
{
  pagi: {
    startTime: "07:30",
    endTime: "17:00",
    slotDuration: 50
  },
  sore: {
    startTime: "15:30",
    endTime: "21:00",
    slotDuration: 50
  },
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}
```

---

## ✅ Backward Compatibility

**100% Backward Compatible** - All existing code works without changes:

```typescript
// v1.0.0 code - still works perfectly in v1.1.0
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  maxIterations: 10000
});
```

---

## 🧪 Testing

- **124 total tests** (all passing)
- **27 new tests** for time slot configuration
- **8 new tests** for config merging
- **Coverage**: Time slot generation, merging, validation, edge cases

---

## 📖 Documentation

- **Complete Guide**: `docs/TIMESLOT_CONFIG.md`
- **Code Examples**: `examples/custom-timeslots.ts`
- **API Reference**: Included in guide
- **Changelog**: `CHANGELOG.md`

---

## 🚀 Getting Started

### Installation

```bash
npm install timetable-sa@1.1.0
```

### Quick Example

```typescript
import { SimulatedAnnealing } from "timetable-sa";

// Simple: Change morning start time
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: { startTime: "08:00" }
  }
});

const solution = solver.solve();
```

### Full Example

See `examples/custom-timeslots.ts` for complete working examples.

---

## 🔄 Migration Guide

### From v1.0.0 to v1.1.0

**No migration needed!** Your existing code continues to work.

**Optional**: Add time slot configuration to customize schedules:

```typescript
// Before (v1.0.0)
const solver = new SimulatedAnnealing(rooms, lecturers, classes);

// After (v1.1.0) - add optional config
const solver = new SimulatedAnnealing(rooms, lecturers, classes, {
  timeSlotConfig: {
    pagi: { startTime: "08:00" }
  }
});
```

---

## 📊 Version Information

- **Version**: 1.1.0
- **Release Date**: 2025-01-27
- **Type**: Minor Update (Backward Compatible)
- **Previous Version**: 1.0.0

---

## 🐛 Bug Fixes

None in this release (feature-only update)

---

## 🔮 What's Next

Potential features for future releases:
- Room configuration customization
- Constraint weight presets
- More scheduling patterns
- Performance optimizations

---

## 💬 Support

- **Documentation**: See `docs/` folder
- **Examples**: See `examples/` folder
- **Issues**: [GitHub Issues](https://github.com/albertabayor/simulated-annealing-university-timetabling-course-problem/issues)

---

## 👏 Contributors

- Albert A Bayor ([@albertabayor](https://github.com/albertabayor))

---

**Enjoy the new features! 🎉**
