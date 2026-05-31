import { describe, expect, it } from 'vitest';
import { applyCalculationOption } from './format';

const makeData = (counts: number[]) =>
  counts.map((count, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    count,
  }));

describe('applyCalculationOption', () => {
  const data = makeData([10, 20, 30, 40, 50]);

  it('returns data unchanged when option is undefined', () => {
    expect(applyCalculationOption(data, undefined)).toBe(data);
  });

  describe('cumulative_sum', () => {
    it('computes running total', () => {
      const result = applyCalculationOption(data, 'cumulative_sum');
      expect(result.map((d) => d.count)).toEqual([10, 30, 60, 100, 150]);
    });

    it('preserves dates', () => {
      const result = applyCalculationOption(data, 'cumulative_sum');
      expect(result.map((d) => d.date)).toEqual(data.map((d) => d.date));
    });

    it('handles empty data', () => {
      expect(applyCalculationOption([], 'cumulative_sum')).toEqual([]);
    });

    it('handles single data point', () => {
      const result = applyCalculationOption(makeData([42]), 'cumulative_sum');
      expect(result.map((d) => d.count)).toEqual([42]);
    });
  });

  describe('rolling_average_7', () => {
    const tenDays = makeData([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    it('averages available points when window exceeds history', () => {
      const result = applyCalculationOption(tenDays, 'rolling_average_7');
      expect(result[0]!.count).toBe(10);
      expect(result[1]!.count).toBe(15);
      expect(result[2]!.count).toBe(20);
    });

    it('uses full window once enough data exists', () => {
      const result = applyCalculationOption(tenDays, 'rolling_average_7');
      // Index 6: avg of [10,20,30,40,50,60,70] = 280/7 = 40
      expect(result[6]!.count).toBe(40);
      // Index 7: avg of [20,30,40,50,60,70,80] = 350/7 = 50
      expect(result[7]!.count).toBe(50);
    });

    it('handles empty data', () => {
      expect(applyCalculationOption([], 'rolling_average_7')).toEqual([]);
    });
  });

  describe('rolling_average_14', () => {
    it('uses 14-point window', () => {
      const days = makeData(Array.from({ length: 20 }, (_, i) => i + 1));
      const result = applyCalculationOption(days, 'rolling_average_14');
      // Index 13: avg of [1..14] = 105/14 = 7.5
      expect(result[13]!.count).toBe(7.5);
    });
  });

  describe('rolling_average_28', () => {
    it('uses 28-point window', () => {
      const days = makeData(Array.from({ length: 30 }, (_, i) => i + 1));
      const result = applyCalculationOption(days, 'rolling_average_28');
      // Index 27: avg of [1..28] = 406/28 = 14.5
      expect(result[27]!.count).toBe(14.5);
    });
  });
});
