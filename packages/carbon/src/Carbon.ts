
export type CarbonInput = Carbon | Date | string | number;
export type DiffUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DiffForHumansOptions {
    /** Return short form e.g. "3h ago" instead of "3 hours ago" */
    short?: boolean;
    /** Return absolute form e.g. "3 hours" (no ago/in) */
    absolute?: boolean;
}

const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ------------------------------------------------------------------
// Locale definitions for diffForHumans
// ------------------------------------------------------------------
type LocaleDef = {
    ago: string;
    fromNow: string;
    justNow: string;
    before: string;
    after: string;
    units: { s: string; m: string; h: string; d: string; w: string; mo: string; y: string };
    shortUnits: { s: string; m: string; h: string; d: string; w: string; mo: string; y: string };
};

const LOCALES: Record<string, LocaleDef> = {
    en: {
        ago: 'ago', fromNow: 'in', justNow: 'just now', before: 'before', after: 'after',
        units:      { s: 'second', m: 'minute', h: 'hour', d: 'day', w: 'week', mo: 'month', y: 'year' },
        shortUnits: { s: 's',      m: 'min',   h: 'h',    d: 'd',   w: 'w',    mo: 'mo',    y: 'y' },
    },
    fr: {
        ago: 'il y a', fromNow: 'dans', justNow: "à l'instant", before: 'avant', after: 'après',
        units:      { s: 'seconde', m: 'minute', h: 'heure', d: 'jour', w: 'semaine', mo: 'mois', y: 'an' },
        shortUnits: { s: 's',       m: 'min',    h: 'h',     d: 'j',    w: 'sem',     mo: 'mois', y: 'a' },
    },
    de: {
        ago: 'vor', fromNow: 'in', justNow: 'gerade eben', before: 'vor', after: 'nach',
        units:      { s: 'Sekunde', m: 'Minute', h: 'Stunde', d: 'Tag', w: 'Woche', mo: 'Monat', y: 'Jahr' },
        shortUnits: { s: 's',       m: 'min',    h: 'Std',    d: 'T',   w: 'W',     mo: 'Mo',    y: 'J' },
    },
    es: {
        ago: 'hace', fromNow: 'en', justNow: 'justo ahora', before: 'antes', after: 'después',
        units:      { s: 'segundo', m: 'minuto', h: 'hora', d: 'día', w: 'semana', mo: 'mes', y: 'año' },
        shortUnits: { s: 's',       m: 'min',    h: 'h',    d: 'd',   w: 'sem',   mo: 'mes', y: 'a' },
    },
    hi: {
        ago: 'पहले', fromNow: 'में', justNow: 'अभी', before: 'पहले', after: 'बाद',
        units:      { s: 'सेकंड', m: 'मिनट', h: 'घंटे', d: 'दिन', w: 'सप्ताह', mo: 'महीने', y: 'साल' },
        shortUnits: { s: 'से', m: 'मिनट', h: 'घं', d: 'दिन', w: 'सप्त', mo: 'माह', y: 'वर्ष' },
    },
    ja: {
        ago: '前', fromNow: '後', justNow: 'たった今', before: '前', after: '後',
        units:      { s: '秒', m: '分', h: '時間', d: '日', w: '週間', mo: 'ヶ月', y: '年' },
        shortUnits: { s: '秒', m: '分', h: '時', d: '日', w: '週', mo: '月', y: '年' },
    },
    zh: {
        ago: '前', fromNow: '后', justNow: '刚才', before: '前', after: '后',
        units:      { s: '秒', m: '分钟', h: '小时', d: '天', w: '周', mo: '个月', y: '年' },
        shortUnits: { s: '秒', m: '分', h: '时', d: '天', w: '周', mo: '月', y: '年' },
    },
};

let _globalLocale = 'en';

// ------------------------------------------------------------------
// Carbon Class
// ------------------------------------------------------------------
export class Carbon {
    private readonly _date: Date;
    private readonly _tz: string | undefined;
    private _locale: string;

    // ------------------------------------------------------------------
    // Constructor (private — use static factories)
    // ------------------------------------------------------------------
    private constructor(date: Date, tz?: string, locale?: string) {
        this._date   = new Date(date.getTime());
        this._tz     = tz;
        this._locale = locale ?? _globalLocale;
    }

    // ------------------------------------------------------------------
    // Static Factories
    // ------------------------------------------------------------------

    /** Current date and time */
    public static now(tz?: string): Carbon {
        return new Carbon(new Date(), tz);
    }

    /** Today at 00:00:00 */
    public static today(tz?: string): Carbon {
        return Carbon.now(tz).startOfDay();
    }

    /** Yesterday at 00:00:00 */
    public static yesterday(tz?: string): Carbon {
        return Carbon.today(tz).subDays(1);
    }

    /** Tomorrow at 00:00:00 */
    public static tomorrow(tz?: string): Carbon {
        return Carbon.today(tz).addDays(1);
    }

    /** Parse a string, JS Date, unix ms number, or Carbon instance */
    public static parse(value: CarbonInput, tz?: string): Carbon {
        if (value instanceof Carbon) return new Carbon(value._date, tz ?? value._tz);
        if (value instanceof Date)   return new Carbon(new Date(value.getTime()), tz);
        if (typeof value === 'number') return new Carbon(new Date(value), tz);
        const d = new Date(value as string);
        if (isNaN(d.getTime())) throw new Error(`Carbon: Cannot parse "${value}"`);
        return new Carbon(d, tz);
    }

    /** Explicit date/time construction */
    public static create(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, tz?: string): Carbon {
        const d = new Date(year, month - 1, day, hour, minute, second, 0);
        return new Carbon(d, tz);
    }

    /** From Unix seconds */
    public static fromTimestamp(seconds: number, tz?: string): Carbon {
        return new Carbon(new Date(seconds * 1000), tz);
    }

    /** From Unix milliseconds */
    public static fromMillis(ms: number, tz?: string): Carbon {
        return new Carbon(new Date(ms), tz);
    }

    /** Type guard */
    public static isCarbon(value: unknown): value is Carbon {
        return value instanceof Carbon;
    }

    /** Generate a range of Carbon instances between two dates */
    public static range(from: CarbonInput, to: CarbonInput, unit: DiffUnit = 'day'): Carbon[] {
        const start  = Carbon.parse(from);
        const end    = Carbon.parse(to);
        const result: Carbon[] = [];
        let   current = start;

        while (!current.isAfter(end)) {
            result.push(current);
            switch (unit) {
                case 'second':  current = current.addSeconds(1); break;
                case 'minute':  current = current.addMinutes(1); break;
                case 'hour':    current = current.addHours(1);   break;
                case 'day':     current = current.addDays(1);    break;
                case 'week':    current = current.addWeeks(1);   break;
                case 'month':   current = current.addMonths(1);  break;
                case 'quarter': current = current.addQuarters(1);break;
                case 'year':    current = current.addYears(1);   break;
            }
        }
        return result;
    }

    /** Set global locale for all new Carbon instances */
    public static setLocale(locale: string): void {
        _globalLocale = locale;
    }

    /** Get current global locale */
    public static getLocale(): string {
        return _globalLocale;
    }

    // ------------------------------------------------------------------
    // Instance: Locale
    // ------------------------------------------------------------------
    public locale(locale: string): Carbon {
        const c = this._clone();
        c._locale = locale;
        return c;
    }

    // ------------------------------------------------------------------
    // Getters
    // ------------------------------------------------------------------
    get year():         number { return this._date.getFullYear(); }
    get month():        number { return this._date.getMonth() + 1; }
    get day():          number { return this._date.getDate(); }
    get hour():         number { return this._date.getHours(); }
    get minute():       number { return this._date.getMinutes(); }
    get second():       number { return this._date.getSeconds(); }
    get millisecond():  number { return this._date.getMilliseconds(); }
    get dayOfWeek():    number { return this._date.getDay(); }           // 0=Sun, 6=Sat
    get dayOfWeekISO(): number { return this._date.getDay() === 0 ? 7 : this._date.getDay(); } // 1=Mon, 7=Sun
    get timestamp():    number { return Math.floor(this._date.getTime() / 1000); }
    get milliseconds(): number { return this._date.getTime(); }
    get timezone():     string { return this._tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone; }
    get offsetHours():  number { return -this._date.getTimezoneOffset() / 60; }

    get daysInMonth(): number {
        return new Date(this.year, this.month, 0).getDate();
    }

    get dayOfYear(): number {
        const start = new Date(this.year, 0, 0);
        return Math.floor((this._date.getTime() - start.getTime()) / 86400000);
    }

    get weekOfYear(): number {
        const d = new Date(Date.UTC(this.year, this._date.getMonth(), this.day));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    get weekOfMonth(): number {
        return Math.ceil((this.day + new Date(this.year, this.month - 1, 1).getDay()) / 7);
    }

    get quarter(): number {
        return Math.ceil(this.month / 3);
    }

    /** Return the underlying JS Date */
    public toDate(): Date {
        return new Date(this._date.getTime());
    }

    // ------------------------------------------------------------------
    // Formatting
    // ------------------------------------------------------------------
    public format(fmt: string): string {
        const d   = this._date;
        const pad = (n: number) => String(n).padStart(2, '0');
        const isLeap = this.isLeapYear();

        return fmt
            .replace(/\\(.)/g, '\x00$1')     // handle escaped chars first
            .replace('Y', String(d.getFullYear()))
            .replace('y', String(d.getFullYear()).slice(-2))
            .replace('F', MONTHS_LONG[d.getMonth()])
            .replace('M', MONTHS_SHORT[d.getMonth()])
            .replace('m', pad(d.getMonth() + 1))
            .replace('n', String(d.getMonth() + 1))
            .replace('t', String(this.daysInMonth))
            .replace('d', pad(d.getDate()))
            .replace('j', String(d.getDate()))
            .replace('l', DAYS_LONG[d.getDay()])
            .replace('D', DAYS_SHORT[d.getDay()])
            .replace('N', String(this.dayOfWeekISO))
            .replace('w', String(d.getDay()))
            .replace('W', String(this.weekOfYear))
            .replace('H', pad(d.getHours()))
            .replace('h', pad(d.getHours() % 12 || 12))
            .replace('G', String(d.getHours()))
            .replace('g', String(d.getHours() % 12 || 12))
            .replace('i', pad(d.getMinutes()))
            .replace('s', pad(d.getSeconds()))
            .replace('A', d.getHours() < 12 ? 'AM' : 'PM')
            .replace('a', d.getHours() < 12 ? 'am' : 'pm')
            .replace('U', String(this.timestamp))
            .replace('L', isLeap ? '1' : '0')
            .replace(/\x00(.)/g, '$1');      // restore escaped chars
    }

    public toDateString():      string { return this.format('Y-m-d'); }
    public toDateTimeString():  string { return this.format('Y-m-d H:i:s'); }
    public toTimeString():      string { return this.format('H:i:s'); }
    public toHumanString():     string { return this.format('F j, Y'); }
    public toShortDateString(): string { return this.format('M j, Y'); }
    public toISOString():       string { return this._date.toISOString(); }
    public toSlug():            string { return this.format('Y-m-d'); }
    public toString():          string { return this.toDateTimeString(); }
    public toRFC2822String():   string {
        return this._date.toUTCString().replace('GMT', '+0000');
    }

    // ------------------------------------------------------------------
    // Manipulation (all immutable — returns new Carbon)
    // ------------------------------------------------------------------
    private _clone(): Carbon { return new Carbon(new Date(this._date.getTime()), this._tz, this._locale); }

    private _mutate(fn: (d: Date) => void): Carbon {
        const d = new Date(this._date.getTime());
        fn(d);
        return new Carbon(d, this._tz, this._locale);
    }

    public addSeconds(n: number):  Carbon { return this._mutate(d => d.setSeconds(d.getSeconds() + n)); }
    public addMinutes(n: number):  Carbon { return this._mutate(d => d.setMinutes(d.getMinutes() + n)); }
    public addHours(n: number):    Carbon { return this._mutate(d => d.setHours(d.getHours() + n)); }
    public addDays(n: number):     Carbon { return this._mutate(d => d.setDate(d.getDate() + n)); }
    public addWeeks(n: number):    Carbon { return this.addDays(n * 7); }
    public addMonths(n: number):   Carbon {
        return this._mutate(d => {
            const day = d.getDate();
            d.setMonth(d.getMonth() + n);
            // Clamp day if month overflowed (e.g. Jan 31 + 1 month)
            if (d.getDate() !== day) d.setDate(0);
        });
    }
    public addQuarters(n: number): Carbon { return this.addMonths(n * 3); }
    public addYears(n: number):    Carbon {
        return this._mutate(d => {
            const day = d.getDate();
            d.setFullYear(d.getFullYear() + n);
            if (d.getDate() !== day) d.setDate(0);
        });
    }

    public subSeconds(n: number):  Carbon { return this.addSeconds(-n); }
    public subMinutes(n: number):  Carbon { return this.addMinutes(-n); }
    public subHours(n: number):    Carbon { return this.addHours(-n); }
    public subDays(n: number):     Carbon { return this.addDays(-n); }
    public subWeeks(n: number):    Carbon { return this.addWeeks(-n); }
    public subMonths(n: number):   Carbon { return this.addMonths(-n); }
    public subQuarters(n: number): Carbon { return this.addQuarters(-n); }
    public subYears(n: number):    Carbon { return this.addYears(-n); }

    /** Set a specific time unit */
    public setYear(n: number):    Carbon { return this._mutate(d => d.setFullYear(n)); }
    public setMonth(n: number):   Carbon { return this._mutate(d => d.setMonth(n - 1)); }
    public setDay(n: number):     Carbon { return this._mutate(d => d.setDate(n)); }
    public setHour(n: number):    Carbon { return this._mutate(d => d.setHours(n)); }
    public setMinute(n: number):  Carbon { return this._mutate(d => d.setMinutes(n)); }
    public setSecond(n: number):  Carbon { return this._mutate(d => d.setSeconds(n)); }

    /** Change timezone (shifts display, same instant in time) */
    public setTimezone(tz: string): Carbon {
        return new Carbon(this._date, tz, this._locale);
    }

    /** Convert to UTC */
    public toUTC(): Carbon {
        return new Carbon(this._date, 'UTC', this._locale);
    }

    // ------------------------------------------------------------------
    // Start / End of Period
    // ------------------------------------------------------------------
    public startOfMinute():  Carbon { return this._mutate(d => { d.setSeconds(0, 0); }); }
    public endOfMinute():    Carbon { return this._mutate(d => { d.setSeconds(59, 999); }); }
    public startOfHour():    Carbon { return this._mutate(d => { d.setMinutes(0, 0, 0); }); }
    public endOfHour():      Carbon { return this._mutate(d => { d.setMinutes(59, 59, 999); }); }
    public startOfDay():     Carbon { return this._mutate(d => { d.setHours(0, 0, 0, 0); }); }
    public endOfDay():       Carbon { return this._mutate(d => { d.setHours(23, 59, 59, 999); }); }

    public startOfWeek(startDay = 1): Carbon {
        // startDay: 0=Sun, 1=Mon (default)
        return this._mutate(d => {
            const diff = (d.getDay() - startDay + 7) % 7;
            d.setDate(d.getDate() - diff);
            d.setHours(0, 0, 0, 0);
        });
    }

    public endOfWeek(startDay = 1): Carbon {
        return this.startOfWeek(startDay).addDays(6).endOfDay();
    }

    public startOfMonth():   Carbon { return this._mutate(d => { d.setDate(1); d.setHours(0, 0, 0, 0); }); }
    public endOfMonth():     Carbon { return this._mutate(d => { d.setMonth(d.getMonth() + 1, 0); d.setHours(23, 59, 59, 999); }); }

    public startOfQuarter(): Carbon {
        const firstMonthOfQuarter = (this.quarter - 1) * 3 + 1;
        return this.setMonth(firstMonthOfQuarter).startOfMonth();
    }

    public endOfQuarter(): Carbon {
        return this.startOfQuarter().addMonths(3).subDays(1).endOfDay();
    }

    public startOfYear():    Carbon { return this._mutate(d => { d.setMonth(0, 1); d.setHours(0, 0, 0, 0); }); }
    public endOfYear():      Carbon { return this._mutate(d => { d.setMonth(11, 31); d.setHours(23, 59, 59, 999); }); }

    // ------------------------------------------------------------------
    // Comparison
    // ------------------------------------------------------------------
    private _ms(other?: CarbonInput): number {
        return other === undefined ? Date.now() : Carbon.parse(other).milliseconds;
    }

    public isBefore(other: CarbonInput):        boolean { return this.milliseconds < this._ms(other); }
    public isAfter(other: CarbonInput):          boolean { return this.milliseconds > this._ms(other); }
    public isSame(other: CarbonInput):           boolean { return this.milliseconds === this._ms(other); }
    public isSameOrBefore(other: CarbonInput):   boolean { return this.milliseconds <= this._ms(other); }
    public isSameOrAfter(other: CarbonInput):    boolean { return this.milliseconds >= this._ms(other); }

    public isBetween(from: CarbonInput, to: CarbonInput): boolean {
        return this.milliseconds >= this._ms(from) && this.milliseconds <= this._ms(to);
    }

    public isSameDay(other: CarbonInput):   boolean { const o = Carbon.parse(other); return this.year === o.year && this.month === o.month && this.day === o.day; }
    public isSameMonth(other: CarbonInput): boolean { const o = Carbon.parse(other); return this.year === o.year && this.month === o.month; }
    public isSameYear(other: CarbonInput):  boolean { return this.year === Carbon.parse(other).year; }

    public isToday():     boolean { return this.isSameDay(Carbon.today()); }
    public isYesterday(): boolean { return this.isSameDay(Carbon.yesterday()); }
    public isTomorrow():  boolean { return this.isSameDay(Carbon.tomorrow()); }
    public isFuture():    boolean { return this.isAfter(new Date()); }
    public isPast():      boolean { return this.isBefore(new Date()); }

    public isThisWeek():  boolean { return this.isBetween(Carbon.today().startOfWeek(), Carbon.today().endOfWeek()); }
    public isThisMonth(): boolean { return this.isSameMonth(Carbon.now()); }
    public isThisYear():  boolean { return this.isSameYear(Carbon.now()); }

    public isSunday():    boolean { return this.dayOfWeek === 0; }
    public isMonday():    boolean { return this.dayOfWeek === 1; }
    public isTuesday():   boolean { return this.dayOfWeek === 2; }
    public isWednesday(): boolean { return this.dayOfWeek === 3; }
    public isThursday():  boolean { return this.dayOfWeek === 4; }
    public isFriday():    boolean { return this.dayOfWeek === 5; }
    public isSaturday():  boolean { return this.dayOfWeek === 6; }
    public isWeekend():   boolean { return this.dayOfWeek === 0 || this.dayOfWeek === 6; }
    public isWeekday():   boolean { return !this.isWeekend(); }

    public isLeapYear(): boolean {
        const y = this.year;
        return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    }

    /** Returns the Carbon closest to `this` */
    public closest(...others: CarbonInput[]): Carbon {
        return others.map(v => Carbon.parse(v)).reduce((best, c) =>
            Math.abs(c.milliseconds - this.milliseconds) < Math.abs(best.milliseconds - this.milliseconds) ? c : best
        );
    }

    /** Returns the Carbon farthest from `this` */
    public farthest(...others: CarbonInput[]): Carbon {
        return others.map(v => Carbon.parse(v)).reduce((best, c) =>
            Math.abs(c.milliseconds - this.milliseconds) > Math.abs(best.milliseconds - this.milliseconds) ? c : best
        );
    }

    // ------------------------------------------------------------------
    // Diffing
    // ------------------------------------------------------------------
    private _diffMs(other?: CarbonInput): number {
        return this.milliseconds - (other !== undefined ? Carbon.parse(other).milliseconds : Date.now());
    }

    public diffInSeconds(other?: CarbonInput):  number { return Math.trunc(this._diffMs(other) / 1000); }
    public diffInMinutes(other?: CarbonInput):  number { return Math.trunc(this._diffMs(other) / 60000); }
    public diffInHours(other?: CarbonInput):    number { return Math.trunc(this._diffMs(other) / 3600000); }
    public diffInDays(other?: CarbonInput):     number { return Math.trunc(this._diffMs(other) / 86400000); }
    public diffInWeeks(other?: CarbonInput):    number { return Math.trunc(this.diffInDays(other) / 7); }
    public diffInMonths(other?: CarbonInput):   number {
        const o = other !== undefined ? Carbon.parse(other) : Carbon.now();
        return (this.year - o.year) * 12 + (this.month - o.month);
    }
    public diffInYears(other?: CarbonInput):    number {
        return Math.trunc(this.diffInMonths(other) / 12);
    }

    /** Float precision diffs */
    public diffInDaysFloat(other?: CarbonInput):  number { return this._diffMs(other) / 86400000; }
    public diffInHoursFloat(other?: CarbonInput): number { return this._diffMs(other) / 3600000; }

    /** Generate a range from this Carbon to another */
    public daysUntil(other: CarbonInput): Carbon[] {
        return Carbon.range(this, Carbon.parse(other), 'day');
    }

    // ------------------------------------------------------------------
    // Human-Readable Diffs
    // ------------------------------------------------------------------
    public diffForHumans(other?: CarbonInput, opts: DiffForHumansOptions = {}): string {
        const locale   = LOCALES[this._locale] ?? LOCALES.en;
        const diffMs   = other !== undefined
            ? this.milliseconds - Carbon.parse(other).milliseconds
            : this.milliseconds - Date.now();
        const abs      = Math.abs(diffMs);
        const isPast   = diffMs < 0;
        const relative = other !== undefined;

        if (abs < 5000 && !relative) return locale.justNow;

        const units = opts.short ? locale.shortUnits : locale.units;

        let amount: number;
        let unit: string;

        if      (abs < 60000)           { amount = Math.round(abs / 1000);         unit = units.s;  }
        else if (abs < 3600000)         { amount = Math.round(abs / 60000);        unit = units.m;  }
        else if (abs < 86400000)        { amount = Math.round(abs / 3600000);      unit = units.h;  }
        else if (abs < 604800000)       { amount = Math.round(abs / 86400000);     unit = units.d;  }
        else if (abs < 2629800000)      { amount = Math.round(abs / 604800000);    unit = units.w;  }
        else if (abs < 31557600000)     { amount = Math.round(abs / 2629800000);   unit = units.mo; }
        else                            { amount = Math.round(abs / 31557600000);  unit = units.y;  }

        // Pluralize English only
        let unitStr = unit;
        if ((this._locale === 'en' || this._locale === 'fr' || this._locale === 'de' || this._locale === 'es') && amount !== 1 && !opts.short) {
            unitStr = unit + 's';
        }

        if (opts.absolute) return `${amount} ${unitStr}`;

        if (relative) {
            return isPast
                ? `${amount} ${unitStr} ${locale.after}`
                : `${amount} ${unitStr} ${locale.before}`;
        }

        if (opts.short) {
            return isPast ? `${amount}${unitStr} ago` : `in ${amount}${unitStr}`;
        }

        if (this._locale === 'hi') {
            return isPast ? `${amount} ${unitStr} ${locale.ago}` : `${locale.fromNow} ${amount} ${unitStr}`;
        }
        if (['ja', 'zh'].includes(this._locale)) {
            return isPast ? `${amount}${unitStr}${locale.ago}` : `${amount}${unitStr}${locale.fromNow}`;
        }

        return isPast
            ? `${locale.ago} ${amount} ${unitStr}`    // fallback — English decorates around
                .replace(/^ago /, '')                  // English: "3 hours ago"
                + (this._locale === 'en' ? ` ${locale.ago}` : '')
            : `${locale.fromNow} ${amount} ${unitStr}`;
    }
}

// ------------------------------------------------------------------
// Convenience function (callable without `new` or `Carbon.parse()`)
// ------------------------------------------------------------------
export function carbon(value?: CarbonInput, tz?: string): Carbon {
    return value === undefined ? Carbon.now(tz) : Carbon.parse(value, tz);
}
