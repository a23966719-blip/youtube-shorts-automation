/**
 * 인생 시계 & 인맥 장부 (Senior Life Manager) - 테스트
 *
 * Jest + JSDOM 환경에서 lunar.js의 음력 변환 로직을 테스트합니다.
 */

const LunarCalendar = require('../js/lunar.js');

// =========================================================================
// 음력 달력 변환 테스트
// =========================================================================
describe('LunarCalendar', () => {

  describe('solarToLunar - 양력→음력 변환', () => {
    test('2024년 1월 1일 → 음력 2023년 11월 20일', () => {
      const result = LunarCalendar.solarToLunar(2024, 1, 1);
      expect(result).not.toBeNull();
      expect(result.year).toBe(2023);
      expect(result.month).toBe(11);
      expect(result.day).toBe(20);
    });

    test('2024년 2월 10일 (설날) → 음력 2024년 1월 1일', () => {
      const result = LunarCalendar.solarToLunar(2024, 2, 10);
      expect(result).not.toBeNull();
      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    test('2023년 1월 22일 (설날) → 음력 2023년 1월 1일', () => {
      const result = LunarCalendar.solarToLunar(2023, 1, 22);
      expect(result).not.toBeNull();
      expect(result.year).toBe(2023);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    test('범위 밖의 연도는 null 반환', () => {
      expect(LunarCalendar.solarToLunar(1899, 1, 1)).toBeNull();
      expect(LunarCalendar.solarToLunar(2200, 1, 1)).toBeNull();
    });

    test('결과에 간지 정보 포함', () => {
      const result = LunarCalendar.solarToLunar(2024, 2, 10);
      expect(result).not.toBeNull();
      expect(result.yearGanZhi).toBeDefined();
      expect(result.animal).toBeDefined();
      expect(result.monthStr).toBeDefined();
    });

    test('2024년은 용띠', () => {
      const result = LunarCalendar.solarToLunar(2024, 3, 1);
      expect(result.animal).toBe('용');
    });
  });

  describe('lunarToSolar - 음력→양력 변환', () => {
    test('음력 2024년 1월 1일 → 양력 2024년 2월 10일', () => {
      const result = LunarCalendar.lunarToSolar(2024, 1, 1, false);
      expect(result).not.toBeNull();
      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(10);
    });

    test('음력 2023년 1월 1일 → 양력 2023년 1월 22일', () => {
      const result = LunarCalendar.lunarToSolar(2023, 1, 1, false);
      expect(result).not.toBeNull();
      expect(result.year).toBe(2023);
      expect(result.month).toBe(1);
      expect(result.day).toBe(22);
    });

    test('범위 밖의 연도는 null 반환', () => {
      expect(LunarCalendar.lunarToSolar(1899, 1, 1, false)).toBeNull();
    });
  });

  describe('양력↔음력 왕복 변환 일관성', () => {
    test('양력→음력→양력 왕복 변환 시 원래 날짜로 돌아옴', () => {
      const testDates = [
        [2020, 5, 15],
        [2023, 9, 29],
        [2024, 6, 1],
        [2025, 1, 1],
        [2000, 12, 31]
      ];

      testDates.forEach(([y, m, d]) => {
        const lunar = LunarCalendar.solarToLunar(y, m, d);
        expect(lunar).not.toBeNull();
        const solar = LunarCalendar.lunarToSolar(lunar.year, lunar.month, lunar.day, lunar.isLeap);
        expect(solar).not.toBeNull();
        expect(solar.year).toBe(y);
        expect(solar.month).toBe(m);
        expect(solar.day).toBe(d);
      });
    });
  });

  describe('윤달 관련', () => {
    test('leapMonth로 윤달 확인 가능', () => {
      // 2023년에는 윤2월이 있음
      const leap2023 = LunarCalendar.leapMonth(2023);
      expect(leap2023).toBe(2);
    });

    test('윤달 없는 해', () => {
      // 2024년에는 윤달 없음
      const leap2024 = LunarCalendar.leapMonth(2024);
      expect(leap2024).toBe(0);
    });
  });

  describe('월 일수 관련', () => {
    test('음력 월의 일수는 29일 또는 30일', () => {
      for (let m = 1; m <= 12; m++) {
        const days = LunarCalendar.lunarMonthDays(2024, m);
        expect(days === 29 || days === 30).toBe(true);
      }
    });

    test('음력 1년의 총 일수는 353~385일 범위', () => {
      for (let y = 1950; y <= 2050; y++) {
        const days = LunarCalendar.lunarYearDays(y);
        expect(days).toBeGreaterThanOrEqual(353);
        expect(days).toBeLessThanOrEqual(385);
      }
    });
  });

  describe('formatLunarDate', () => {
    test('양력 날짜의 음력 표기 문자열 반환', () => {
      const result = LunarCalendar.formatLunarDate(2024, 2, 10);
      expect(result).toContain('음력');
      expect(result).toContain('2024');
      expect(result).toContain('1월');
      expect(result).toContain('1일');
    });

    test('범위 밖 날짜는 빈 문자열 반환', () => {
      expect(LunarCalendar.formatLunarDate(1800, 1, 1)).toBe('');
    });
  });

  describe('getNextLunarBirthdaySolar', () => {
    test('음력 생일의 올해/내년 양력 날짜 반환', () => {
      const result = LunarCalendar.getNextLunarBirthdaySolar(1, 1, false);
      expect(result).not.toBeNull();
      expect(result.year).toBeDefined();
      expect(result.month).toBeDefined();
      expect(result.day).toBeDefined();
    });
  });

  describe('getThisYearSolarDate', () => {
    test('올해 특정 음력 날짜의 양력 변환', () => {
      const result = LunarCalendar.getThisYearSolarDate(8, 15, false);
      expect(result).not.toBeNull();
      // 추석(음력 8월 15일)의 양력 날짜
      expect(result.year).toBe(new Date().getFullYear());
    });
  });
});
