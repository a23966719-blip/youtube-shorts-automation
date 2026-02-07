/**
 * 한국 음력-양력 변환 모듈 (Korean Lunar-Solar Calendar Converter)
 *
 * 1900년~2100년 음력 데이터를 기반으로 양력↔음력 변환을 수행합니다.
 * 기준일: 1900년 1월 31일 (양력) = 1900년 1월 1일 (음력)
 *
 * 데이터 인코딩:
 *  - Bit 0~11: 각 월의 일수 (0=29일/소월, 1=30일/대월), 1월=Bit0
 *  - Bit 12~15: 윤달 번호 (0이면 윤달 없음)
 *  - Bit 16: 윤달의 일수 (0=29일, 1=30일)
 */

const LunarCalendar = (function () {
  'use strict';

  // 음력 데이터 테이블 (1900 ~ 2100)
  // 각 값은 해당 연도의 음력 월별 일수, 윤달 정보를 인코딩한 정수
  const LUNAR_DATA = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
    0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050-2059
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, // 2090-2099
    0x0d520  // 2100
  ];

  const BASE_YEAR = 1900;
  const MAX_YEAR = 2100;
  // 1900년 1월 31일 = 음력 1900년 1월 1일
  const BASE_DATE = new Date(1900, 0, 31);

  /**
   * 특정 음력 연도의 총 일수를 반환
   */
  function lunarYearDays(year) {
    let sum = 348; // 12개월 × 29일 = 348
    const data = LUNAR_DATA[year - BASE_YEAR];
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (data & i) ? 1 : 0;
    }
    return sum + leapMonthDays(year);
  }

  /**
   * 특정 음력 연도의 윤달 번호 반환 (0이면 윤달 없음)
   */
  function leapMonth(year) {
    return LUNAR_DATA[year - BASE_YEAR] & 0xf;
  }

  /**
   * 특정 음력 연도의 윤달 일수 반환
   */
  function leapMonthDays(year) {
    if (leapMonth(year)) {
      return (LUNAR_DATA[year - BASE_YEAR] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  /**
   * 특정 음력 연도, 월의 일수 반환
   */
  function lunarMonthDays(year, month) {
    return (LUNAR_DATA[year - BASE_YEAR] & (0x10000 >> month)) ? 30 : 29;
  }

  /**
   * 양력 → 음력 변환
   * @param {number} sYear 양력 연도
   * @param {number} sMonth 양력 월 (1~12)
   * @param {number} sDay 양력 일
   * @returns {{ year, month, day, isLeap, yearGanZhi, monthStr }}
   */
  function solarToLunar(sYear, sMonth, sDay) {
    if (sYear < BASE_YEAR || sYear > MAX_YEAR) {
      return null;
    }

    const targetDate = new Date(sYear, sMonth - 1, sDay);
    let offset = Math.floor((targetDate - BASE_DATE) / 86400000);

    if (offset < 0) return null;

    // 연도 계산
    let lunarYear = BASE_YEAR;
    let daysInYear;
    for (; lunarYear <= MAX_YEAR; lunarYear++) {
      daysInYear = lunarYearDays(lunarYear);
      if (offset < daysInYear) break;
      offset -= daysInYear;
    }

    // 월 계산
    let lunarMonth = 1;
    let isLeapMonth = false;
    const leap = leapMonth(lunarYear);
    let daysInMonth;

    for (; lunarMonth <= 12; lunarMonth++) {
      // 일반 월
      daysInMonth = lunarMonthDays(lunarYear, lunarMonth);
      if (offset < daysInMonth) {
        break;
      }
      offset -= daysInMonth;

      // 윤달 체크
      if (leap === lunarMonth) {
        daysInMonth = leapMonthDays(lunarYear);
        if (offset < daysInMonth) {
          isLeapMonth = true;
          break;
        }
        offset -= daysInMonth;
      }
    }

    const lunarDay = offset + 1;

    // 천간지지 (간지)
    const heavenlyStems = ['경', '신', '임', '계', '갑', '을', '병', '정', '무', '기'];
    const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
    const animals = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

    const stemIdx = (lunarYear - 4) % 10;
    const branchIdx = (lunarYear - 4) % 12;
    const yearGanZhi = heavenlyStems[stemIdx] + earthlyBranches[branchIdx] + '년 (' + animals[branchIdx] + '띠)';

    const monthStr = (isLeapMonth ? '윤' : '') + lunarMonth + '월 ' + lunarDay + '일';

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeapMonth,
      yearGanZhi: yearGanZhi,
      monthStr: monthStr,
      animal: animals[branchIdx]
    };
  }

  /**
   * 음력 → 양력 변환
   * @param {number} lYear 음력 연도
   * @param {number} lMonth 음력 월 (1~12)
   * @param {number} lDay 음력 일
   * @param {boolean} isLeap 윤달 여부
   * @returns {{ year, month, day } | null}
   */
  function lunarToSolar(lYear, lMonth, lDay, isLeap) {
    if (lYear < BASE_YEAR || lYear > MAX_YEAR) return null;

    let offset = 0;

    // 1900년부터 해당 연도까지의 일수
    for (let y = BASE_YEAR; y < lYear; y++) {
      offset += lunarYearDays(y);
    }

    // 해당 연도 1월부터 해당 월까지의 일수
    const leap = leapMonth(lYear);
    for (let m = 1; m < lMonth; m++) {
      offset += lunarMonthDays(lYear, m);
      if (m === leap) {
        offset += leapMonthDays(lYear);
      }
    }

    // 윤달인 경우 해당 월의 일수도 추가
    if (isLeap && leap === lMonth) {
      offset += lunarMonthDays(lYear, lMonth);
    }

    offset += lDay - 1;

    const resultDate = new Date(BASE_DATE.getTime() + offset * 86400000);

    return {
      year: resultDate.getFullYear(),
      month: resultDate.getMonth() + 1,
      day: resultDate.getDate()
    };
  }

  /**
   * 특정 양력 날짜의 음력 정보를 사람이 읽기 쉬운 문자열로 반환
   */
  function formatLunarDate(sYear, sMonth, sDay) {
    const lunar = solarToLunar(sYear, sMonth, sDay);
    if (!lunar) return '';
    return '음력 ' + lunar.year + '년 ' + lunar.monthStr;
  }

  /**
   * 올해 특정 음력 날짜가 양력으로 몇 월 며칠인지 반환
   * (생일 등 매년 반복되는 음력 날짜의 올해 양력 날짜 조회용)
   */
  function getThisYearSolarDate(lunarMonth, lunarDay, isLeap) {
    const thisYear = new Date().getFullYear();
    // 올해 먼저 시도
    let result = lunarToSolar(thisYear, lunarMonth, lunarDay, isLeap);
    if (!result) {
      // 올해 해당 음력 날짜가 없으면 (윤달 등) null 반환
      return null;
    }
    return result;
  }

  /**
   * 다가오는 음력 생일의 양력 날짜 반환
   * 올해 이미 지났으면 내년 날짜 반환
   */
  function getNextLunarBirthdaySolar(lunarMonth, lunarDay, isLeap) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();

    // 올해 먼저 확인
    let result = lunarToSolar(thisYear, lunarMonth, lunarDay, isLeap);
    if (result) {
      const resultDate = new Date(result.year, result.month - 1, result.day);
      if (resultDate >= today) return result;
    }

    // 내년 확인
    result = lunarToSolar(thisYear + 1, lunarMonth, lunarDay, isLeap);
    return result;
  }

  // Public API
  return {
    solarToLunar,
    lunarToSolar,
    formatLunarDate,
    getThisYearSolarDate,
    getNextLunarBirthdaySolar,
    leapMonth,
    lunarMonthDays,
    leapMonthDays,
    lunarYearDays
  };
})();

// Node.js 환경 지원 (테스트용)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LunarCalendar;
}
