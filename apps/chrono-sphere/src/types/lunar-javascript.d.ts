declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar;
    toYmd(): string;
    getLunar(): Lunar;
    getFestivals(): string[];
  }
  
  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    getSolar(): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInGanZhi(): string;
    getYearShengXiao(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getJieQi(): string;
    getFestivals(): string[];
    getDayYi(): string[];
    getDayJi(): string[];
    isLeap(): boolean;
    toString(): string;
  }
}
