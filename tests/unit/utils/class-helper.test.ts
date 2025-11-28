/**
 * Unit tests for class helper functions
 */

import { hasClassOverlap } from "../../../src/utils/class-helper.js";

describe("hasClassOverlap", () => {
  describe("String to String comparisons", () => {
    it("should return true for identical single classes", () => {
      expect(hasClassOverlap("MR-3A", "MR-3A")).toBe(true);
      expect(hasClassOverlap("MR-5A", "MR-5A")).toBe(true);
    });

    it("should return false for different single classes", () => {
      expect(hasClassOverlap("MR-3A", "MR-5A")).toBe(false);
      expect(hasClassOverlap("MR-7A", "MR-9A")).toBe(false);
    });

    it("should return true when comma-separated string contains matching class", () => {
      expect(hasClassOverlap("MR-3A,MR-5A,MR-7A", "MR-3A")).toBe(true);
      expect(hasClassOverlap("MR-3A,MR-5A,MR-7A", "MR-5A")).toBe(true);
      expect(hasClassOverlap("MR-3A,MR-5A,MR-7A", "MR-7A")).toBe(true);
    });

    it("should return false when comma-separated string has no matching class", () => {
      expect(hasClassOverlap("MR-3A,MR-5A,MR-7A", "MR-9A")).toBe(false);
      expect(hasClassOverlap("MR-3A,MR-5A", "MR-11A")).toBe(false);
    });

    it("should return true when both are comma-separated and have overlap", () => {
      expect(hasClassOverlap("MR-3A,MR-5A", "MR-5A,MR-7A")).toBe(true);
      expect(hasClassOverlap("MR-3A,MR-7A", "MR-7A,MR-9A")).toBe(true);
    });

    it("should return false when both are comma-separated with no overlap", () => {
      expect(hasClassOverlap("MR-3A,MR-5A", "MR-7A,MR-9A")).toBe(false);
      expect(hasClassOverlap("MR-1A,MR-3A", "MR-5A,MR-7A")).toBe(false);
    });

    it("should handle whitespace in comma-separated strings", () => {
      expect(hasClassOverlap("MR-3A, MR-5A, MR-7A", "MR-5A")).toBe(true);
      expect(hasClassOverlap("MR-3A , MR-5A", " MR-5A, MR-7A")).toBe(true);
    });
  });

  describe("Array to String comparisons", () => {
    it("should return true when array contains matching class", () => {
      expect(hasClassOverlap(["MR-3A", "MR-5A"], "MR-3A")).toBe(true);
      expect(hasClassOverlap(["MR-3A", "MR-5A"], "MR-5A")).toBe(true);
    });

    it("should return false when array has no matching class", () => {
      expect(hasClassOverlap(["MR-3A", "MR-5A"], "MR-7A")).toBe(false);
      expect(hasClassOverlap(["MR-3A", "MR-5A"], "MR-9A")).toBe(false);
    });

    it("should handle array to comma-separated string", () => {
      expect(hasClassOverlap(["MR-3A", "MR-5A"], "MR-5A,MR-7A")).toBe(true);
      expect(hasClassOverlap(["MR-3A", "MR-5A"], "MR-7A,MR-9A")).toBe(false);
    });
  });

  describe("Array to Array comparisons", () => {
    it("should return true when arrays have overlap", () => {
      expect(hasClassOverlap(["MR-3A", "MR-5A"], ["MR-5A", "MR-7A"])).toBe(true);
      expect(hasClassOverlap(["MR-3A", "MR-7A"], ["MR-7A", "MR-9A"])).toBe(true);
    });

    it("should return false when arrays have no overlap", () => {
      expect(hasClassOverlap(["MR-3A", "MR-5A"], ["MR-7A", "MR-9A"])).toBe(false);
      expect(hasClassOverlap(["MR-1A", "MR-3A"], ["MR-5A", "MR-7A"])).toBe(false);
    });

    it("should return true when arrays are identical", () => {
      expect(hasClassOverlap(["MR-3A", "MR-5A"], ["MR-3A", "MR-5A"])).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle single element arrays", () => {
      expect(hasClassOverlap(["MR-3A"], ["MR-3A"])).toBe(true);
      expect(hasClassOverlap(["MR-3A"], ["MR-5A"])).toBe(false);
    });

    it("should handle empty strings in arrays", () => {
      expect(hasClassOverlap(["MR-3A", ""], ["MR-3A"])).toBe(true);
    });

    it("should be case-sensitive", () => {
      expect(hasClassOverlap("MR-3A", "mr-3a")).toBe(false);
      expect(hasClassOverlap("MR-3A", "MR-3a")).toBe(false);
    });
  });
});
