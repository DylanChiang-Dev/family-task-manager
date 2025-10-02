// Lunar Calendar Conversion
// Based on traditional Chinese calendar calculations

const LunarCalendar = {
    // Lunar month names
    monthNames: ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月'],

    // Lunar day names
    dayNames: ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
               '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
               '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'],

    // Lunar year data (1900-2100)
    // Each number represents the days in each month for that year
    lunarInfo: [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
        0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
        0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
        0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
        0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
        0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
        0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
        0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
        0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
        0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
        0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
        0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
    ],

    // Calculate days from 1900/1/31 to given date
    solarDays: function(year, month, day) {
        let offset = 0;
        for (let i = 1900; i < year; i++) {
            offset += this.isLeapYear(i) ? 366 : 365;
        }
        for (let i = 1; i < month; i++) {
            offset += this.solarDaysInMonth(year, i);
        }
        offset += day - 1;
        return offset;
    },

    // Check if solar year is leap year
    isLeapYear: function(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    },

    // Days in solar month
    solarDaysInMonth: function(year, month) {
        const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (month === 2 && this.isLeapYear(year)) {
            return 29;
        }
        return monthDays[month - 1];
    },

    // Get lunar year info
    lunarYearDays: function(year) {
        let sum = 348;
        for (let i = 0x8000; i > 0x8; i >>= 1) {
            sum += (this.lunarInfo[year - 1900] & i) ? 1 : 0;
        }
        return sum + this.leapDays(year);
    },

    // Get leap month days
    leapDays: function(year) {
        if (this.leapMonth(year)) {
            return (this.lunarInfo[year - 1900] & 0x10000) ? 30 : 29;
        }
        return 0;
    },

    // Get leap month (0 means no leap month)
    leapMonth: function(year) {
        return this.lunarInfo[year - 1900] & 0xf;
    },

    // Days in lunar month
    lunarMonthDays: function(year, month) {
        return (this.lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29;
    },

    // Convert solar date to lunar date
    solarToLunar: function(year, month, day) {
        if (year < 1900 || year > 2100) {
            return { month: '?', day: '?' };
        }

        // Calculate offset days from 1900/1/31
        const offset = this.solarDays(year, month, day) - this.solarDays(1900, 1, 31);

        let lunarYear = 1900;
        let daysInYear = this.lunarYearDays(lunarYear);
        let tempOffset = offset;

        // Find lunar year
        while (tempOffset >= daysInYear) {
            tempOffset -= daysInYear;
            lunarYear++;
            daysInYear = this.lunarYearDays(lunarYear);
        }

        // Find lunar month
        let lunarMonth = 1;
        let leap = this.leapMonth(lunarYear);
        let isLeap = false;

        for (let i = 1; i <= 12; i++) {
            let daysInMonth;

            if (leap > 0 && i === (leap + 1) && !isLeap) {
                i--;
                isLeap = true;
                daysInMonth = this.leapDays(lunarYear);
            } else {
                daysInMonth = this.lunarMonthDays(lunarYear, i);
            }

            if (tempOffset < daysInMonth) {
                break;
            }

            tempOffset -= daysInMonth;
            lunarMonth = i;

            if (isLeap && i === leap) {
                isLeap = false;
            }
        }

        const lunarDay = tempOffset + 1;

        return {
            year: lunarYear,
            month: this.monthNames[lunarMonth - 1],
            day: this.dayNames[lunarDay - 1],
            isLeap: isLeap
        };
    }
};

// Export for use in other scripts
window.LunarCalendar = LunarCalendar;
