(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.vueAirbnbStyleDatepicker = factory());
}(this, (function () { 'use strict';

  /* eslint-disable */
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector || Element.prototype.webkitMatchesSelector || function (s) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(s);
      var i = matches.length;

      while (--i >= 0 && matches.item(i) !== this) {}

      return i > -1;
    };
  }

  if (typeof Object.assign !== 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, 'assign', {
      value: function assign(target, varArgs) {
        var arguments$1 = arguments;


        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments$1[index];

          if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }

        return to;
      },
      writable: true,
      configurable: true
    });
  } // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex


  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function (predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

        var len = o.length >>> 0; // 3. If IsCallable(predicate) is false, throw a TypeError exception.

        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        } // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.


        var thisArg = arguments[1]; // 5. Let k be 0.

        var k = 0; // 6. Repeat, while k < len

        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
          // d. If testResult is true, return k.
          var kValue = o[k];

          if (predicate.call(thisArg, kValue, k, o)) {
            return k;
          } // e. Increase k by 1.


          k++;
        } // 7. Return -1.


        return -1;
      }
    });
  }

  function toInteger (dirtyNumber) {
    if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
      return NaN
    }

    var number = Number(dirtyNumber);

    if (isNaN(number)) {
      return number
    }

    return number < 0 ? Math.ceil(number) : Math.floor(number)
  }

  var MILLISECONDS_IN_MINUTE = 60000;

  /**
   * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
   * They usually appear for dates that denote time before the timezones were introduced
   * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
   * and GMT+01:00:00 after that date)
   *
   * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
   * which would lead to incorrect calculations.
   *
   * This function returns the timezone offset in milliseconds that takes seconds in account.
   */
  function getTimezoneOffsetInMilliseconds (dirtyDate) {
    var date = new Date(dirtyDate.getTime());
    var baseTimezoneOffset = date.getTimezoneOffset();
    date.setSeconds(0, 0);
    var millisecondsPartOfTimezoneOffset = date.getTime() % MILLISECONDS_IN_MINUTE;

    return baseTimezoneOffset * MILLISECONDS_IN_MINUTE + millisecondsPartOfTimezoneOffset
  }

  var MILLISECONDS_IN_HOUR = 3600000;
  var MILLISECONDS_IN_MINUTE$1 = 60000;
  var DEFAULT_ADDITIONAL_DIGITS = 2;

  var patterns = {
    dateTimeDelimeter: /[T ]/,
    plainTime: /:/,
    timeZoneDelimeter: /[Z ]/i,

    // year tokens
    YY: /^(\d{2})$/,
    YYY: [
      /^([+-]\d{2})$/, // 0 additional digits
      /^([+-]\d{3})$/, // 1 additional digit
      /^([+-]\d{4})$/ // 2 additional digits
    ],
    YYYY: /^(\d{4})/,
    YYYYY: [
      /^([+-]\d{4})/, // 0 additional digits
      /^([+-]\d{5})/, // 1 additional digit
      /^([+-]\d{6})/ // 2 additional digits
    ],

    // date tokens
    MM: /^-(\d{2})$/,
    DDD: /^-?(\d{3})$/,
    MMDD: /^-?(\d{2})-?(\d{2})$/,
    Www: /^-?W(\d{2})$/,
    WwwD: /^-?W(\d{2})-?(\d{1})$/,

    HH: /^(\d{2}([.,]\d*)?)$/,
    HHMM: /^(\d{2}):?(\d{2}([.,]\d*)?)$/,
    HHMMSS: /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/,

    // timezone tokens
    timezone: /([Z+-].*)$/,
    timezoneZ: /^(Z)$/,
    timezoneHH: /^([+-])(\d{2})$/,
    timezoneHHMM: /^([+-])(\d{2}):?(\d{2})$/
  };

  /**
   * @name toDate
   * @category Common Helpers
   * @summary Convert the given argument to an instance of Date.
   *
   * @description
   * Convert the given argument to an instance of Date.
   *
   * If the argument is an instance of Date, the function returns its clone.
   *
   * If the argument is a number, it is treated as a timestamp.
   *
   * If an argument is a string, the function tries to parse it.
   * Function accepts complete ISO 8601 formats as well as partial implementations.
   * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
   * If the function cannot parse the string or the values are invalid, it returns Invalid Date.
   *
   * If the argument is none of the above, the function returns Invalid Date.
   *
   * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
   * All *date-fns* functions will throw `RangeError` if `options.additionalDigits` is not 0, 1, 2 or undefined.
   *
   * @param {Date|String|Number} argument - the value to convert
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - the additional number of digits in the extended year format
   * @returns {Date} the parsed date in the local time zone
   * @throws {TypeError} 1 argument required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Convert string '2014-02-11T11:30:30' to date:
   * var result = toDate('2014-02-11T11:30:30')
   * //=> Tue Feb 11 2014 11:30:30
   *
   * @example
   * // Convert string '+02014101' to date,
   * // if the additional number of digits in the extended year format is 1:
   * var result = toDate('+02014101', {additionalDigits: 1})
   * //=> Fri Apr 11 2014 00:00:00
   */
  function toDate (argument, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    if (argument === null) {
      return new Date(NaN)
    }

    var options = dirtyOptions || {};

    var additionalDigits = options.additionalDigits == null ? DEFAULT_ADDITIONAL_DIGITS : toInteger(options.additionalDigits);
    if (additionalDigits !== 2 && additionalDigits !== 1 && additionalDigits !== 0) {
      throw new RangeError('additionalDigits must be 0, 1 or 2')
    }

    // Clone the date
    if (argument instanceof Date ||
      (typeof argument === 'object' && Object.prototype.toString.call(argument) === '[object Date]')
    ) {
      // Prevent the date to lose the milliseconds when passed to new Date() in IE10
      return new Date(argument.getTime())
    } else if (typeof argument === 'number' || Object.prototype.toString.call(argument) === '[object Number]') {
      return new Date(argument)
    } else if (!(typeof argument === 'string' || Object.prototype.toString.call(argument) === '[object String]')) {
      return new Date(NaN)
    }

    var dateStrings = splitDateString(argument);

    var parseYearResult = parseYear(dateStrings.date, additionalDigits);
    var year = parseYearResult.year;
    var restDateString = parseYearResult.restDateString;

    var date = parseDate(restDateString, year);

    if (isNaN(date)) {
      return new Date(NaN)
    }

    if (date) {
      var timestamp = date.getTime();
      var time = 0;
      var offset;

      if (dateStrings.time) {
        time = parseTime(dateStrings.time);

        if (isNaN(time)) {
          return new Date(NaN)
        }
      }

      if (dateStrings.timezone) {
        offset = parseTimezone(dateStrings.timezone);
        if (isNaN(offset)) {
          return new Date(NaN)
        }
      } else {
        // get offset accurate to hour in timezones that change offset
        offset = getTimezoneOffsetInMilliseconds(new Date(timestamp + time));
        offset = getTimezoneOffsetInMilliseconds(new Date(timestamp + time + offset));
      }

      return new Date(timestamp + time + offset)
    } else {
      return new Date(NaN)
    }
  }

  function splitDateString (dateString) {
    var dateStrings = {};
    var array = dateString.split(patterns.dateTimeDelimeter);
    var timeString;

    if (patterns.plainTime.test(array[0])) {
      dateStrings.date = null;
      timeString = array[0];
    } else {
      dateStrings.date = array[0];
      timeString = array[1];
      if (patterns.timeZoneDelimeter.test(dateStrings.date)) {
        dateStrings.date = dateString.split(patterns.timeZoneDelimeter)[0];
        timeString = dateString.substr(dateStrings.date.length, dateString.length);
      }
    }

    if (timeString) {
      var token = patterns.timezone.exec(timeString);
      if (token) {
        dateStrings.time = timeString.replace(token[1], '');
        dateStrings.timezone = token[1];
      } else {
        dateStrings.time = timeString;
      }
    }

    return dateStrings
  }

  function parseYear (dateString, additionalDigits) {
    var patternYYY = patterns.YYY[additionalDigits];
    var patternYYYYY = patterns.YYYYY[additionalDigits];

    var token;

    // YYYY or ±YYYYY
    token = patterns.YYYY.exec(dateString) || patternYYYYY.exec(dateString);
    if (token) {
      var yearString = token[1];
      return {
        year: parseInt(yearString, 10),
        restDateString: dateString.slice(yearString.length)
      }
    }

    // YY or ±YYY
    token = patterns.YY.exec(dateString) || patternYYY.exec(dateString);
    if (token) {
      var centuryString = token[1];
      return {
        year: parseInt(centuryString, 10) * 100,
        restDateString: dateString.slice(centuryString.length)
      }
    }

    // Invalid ISO-formatted year
    return {
      year: null
    }
  }

  function parseDate (dateString, year) {
    // Invalid ISO-formatted year
    if (year === null) {
      return null
    }

    var token;
    var date;
    var month;
    var week;

    // YYYY
    if (dateString.length === 0) {
      date = new Date(0);
      date.setUTCFullYear(year);
      return date
    }

    // YYYY-MM
    token = patterns.MM.exec(dateString);
    if (token) {
      date = new Date(0);
      month = parseInt(token[1], 10) - 1;

      if (!validateDate(year, month)) {
        return new Date(NaN)
      }

      date.setUTCFullYear(year, month);
      return date
    }

    // YYYY-DDD or YYYYDDD
    token = patterns.DDD.exec(dateString);
    if (token) {
      date = new Date(0);
      var dayOfYear = parseInt(token[1], 10);

      if (!validateDayOfYearDate(year, dayOfYear)) {
        return new Date(NaN)
      }

      date.setUTCFullYear(year, 0, dayOfYear);
      return date
    }

    // YYYY-MM-DD or YYYYMMDD
    token = patterns.MMDD.exec(dateString);
    if (token) {
      date = new Date(0);
      month = parseInt(token[1], 10) - 1;
      var day = parseInt(token[2], 10);

      if (!validateDate(year, month, day)) {
        return new Date(NaN)
      }

      date.setUTCFullYear(year, month, day);
      return date
    }

    // YYYY-Www or YYYYWww
    token = patterns.Www.exec(dateString);
    if (token) {
      week = parseInt(token[1], 10) - 1;

      if (!validateWeekDate(year, week)) {
        return new Date(NaN)
      }

      return dayOfISOWeekYear(year, week)
    }

    // YYYY-Www-D or YYYYWwwD
    token = patterns.WwwD.exec(dateString);
    if (token) {
      week = parseInt(token[1], 10) - 1;
      var dayOfWeek = parseInt(token[2], 10) - 1;

      if (!validateWeekDate(year, week, dayOfWeek)) {
        return new Date(NaN)
      }

      return dayOfISOWeekYear(year, week, dayOfWeek)
    }

    // Invalid ISO-formatted date
    return null
  }

  function parseTime (timeString) {
    var token;
    var hours;
    var minutes;

    // hh
    token = patterns.HH.exec(timeString);
    if (token) {
      hours = parseFloat(token[1].replace(',', '.'));

      if (!validateTime(hours)) {
        return NaN
      }

      return (hours % 24) * MILLISECONDS_IN_HOUR
    }

    // hh:mm or hhmm
    token = patterns.HHMM.exec(timeString);
    if (token) {
      hours = parseInt(token[1], 10);
      minutes = parseFloat(token[2].replace(',', '.'));

      if (!validateTime(hours, minutes)) {
        return NaN
      }

      return (hours % 24) * MILLISECONDS_IN_HOUR +
        minutes * MILLISECONDS_IN_MINUTE$1
    }

    // hh:mm:ss or hhmmss
    token = patterns.HHMMSS.exec(timeString);
    if (token) {
      hours = parseInt(token[1], 10);
      minutes = parseInt(token[2], 10);
      var seconds = parseFloat(token[3].replace(',', '.'));

      if (!validateTime(hours, minutes, seconds)) {
        return NaN
      }

      return (hours % 24) * MILLISECONDS_IN_HOUR +
        minutes * MILLISECONDS_IN_MINUTE$1 +
        seconds * 1000
    }

    // Invalid ISO-formatted time
    return null
  }

  function parseTimezone (timezoneString) {
    var token;
    var absoluteOffset;

    // Z
    token = patterns.timezoneZ.exec(timezoneString);
    if (token) {
      return 0
    }

    var hours;

    // ±hh
    token = patterns.timezoneHH.exec(timezoneString);
    if (token) {
      hours = parseInt(token[2], 10);

      if (!validateTimezone(hours)) {
        return NaN
      }

      absoluteOffset = hours * MILLISECONDS_IN_HOUR;
      return (token[1] === '+') ? -absoluteOffset : absoluteOffset
    }

    // ±hh:mm or ±hhmm
    token = patterns.timezoneHHMM.exec(timezoneString);
    if (token) {
      hours = parseInt(token[2], 10);
      var minutes = parseInt(token[3], 10);

      if (!validateTimezone(hours, minutes)) {
        return NaN
      }

      absoluteOffset = hours * MILLISECONDS_IN_HOUR + minutes * MILLISECONDS_IN_MINUTE$1;
      return (token[1] === '+') ? -absoluteOffset : absoluteOffset
    }

    return 0
  }

  function dayOfISOWeekYear (isoWeekYear, week, day) {
    week = week || 0;
    day = day || 0;
    var date = new Date(0);
    date.setUTCFullYear(isoWeekYear, 0, 4);
    var fourthOfJanuaryDay = date.getUTCDay() || 7;
    var diff = week * 7 + day + 1 - fourthOfJanuaryDay;
    date.setUTCDate(date.getUTCDate() + diff);
    return date
  }

  // Validation functions

  var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var DAYS_IN_MONTH_LEAP_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function isLeapYearIndex (year) {
    return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
  }

  function validateDate (year, month, date) {
    if (month < 0 || month > 11) {
      return false
    }

    if (date != null) {
      if (date < 1) {
        return false
      }

      var isLeapYear = isLeapYearIndex(year);
      if (isLeapYear && date > DAYS_IN_MONTH_LEAP_YEAR[month]) {
        return false
      }
      if (!isLeapYear && date > DAYS_IN_MONTH[month]) {
        return false
      }
    }

    return true
  }

  function validateDayOfYearDate (year, dayOfYear) {
    if (dayOfYear < 1) {
      return false
    }

    var isLeapYear = isLeapYearIndex(year);
    if (isLeapYear && dayOfYear > 366) {
      return false
    }
    if (!isLeapYear && dayOfYear > 365) {
      return false
    }

    return true
  }

  function validateWeekDate (year, week, day) {
    if (week < 0 || week > 52) {
      return false
    }

    if (day != null && (day < 0 || day > 6)) {
      return false
    }

    return true
  }

  function validateTime (hours, minutes, seconds) {
    if (hours != null && (hours < 0 || hours >= 25)) {
      return false
    }

    if (minutes != null && (minutes < 0 || minutes >= 60)) {
      return false
    }

    if (seconds != null && (seconds < 0 || seconds >= 60)) {
      return false
    }

    return true
  }

  function validateTimezone (hours, minutes) {
    if (minutes != null && (minutes < 0 || minutes > 59)) {
      return false
    }

    return true
  }

  /**
   * @name addMilliseconds
   * @category Millisecond Helpers
   * @summary Add the specified number of milliseconds to the given date.
   *
   * @description
   * Add the specified number of milliseconds to the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of milliseconds to be added
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the milliseconds added
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
   * var result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
   * //=> Thu Jul 10 2014 12:45:30.750
   */
  function addMilliseconds (dirtyDate, dirtyAmount, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var timestamp = toDate(dirtyDate, dirtyOptions).getTime();
    var amount = toInteger(dirtyAmount);
    return new Date(timestamp + amount)
  }

  /**
   * @name getDaysInMonth
   * @category Month Helpers
   * @summary Get the number of days in a month of the given date.
   *
   * @description
   * Get the number of days in a month of the given date.
   *
   * @param {Date|String|Number} date - the given date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the number of days in a month
   * @throws {TypeError} 1 argument required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // How many days are in February 2000?
   * var result = getDaysInMonth(new Date(2000, 1))
   * //=> 29
   */
  function getDaysInMonth (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var year = date.getFullYear();
    var monthIndex = date.getMonth();
    var lastDayOfMonth = new Date(0);
    lastDayOfMonth.setFullYear(year, monthIndex + 1, 0);
    lastDayOfMonth.setHours(0, 0, 0, 0);
    return lastDayOfMonth.getDate()
  }

  /**
   * @name addMonths
   * @category Month Helpers
   * @summary Add the specified number of months to the given date.
   *
   * @description
   * Add the specified number of months to the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of months to be added
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the months added
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Add 5 months to 1 September 2014:
   * var result = addMonths(new Date(2014, 8, 1), 5)
   * //=> Sun Feb 01 2015 00:00:00
   */
  function addMonths (dirtyDate, dirtyAmount, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var amount = toInteger(dirtyAmount);
    var desiredMonth = date.getMonth() + amount;
    var dateWithDesiredMonth = new Date(0);
    dateWithDesiredMonth.setFullYear(date.getFullYear(), desiredMonth, 1);
    dateWithDesiredMonth.setHours(0, 0, 0, 0);
    var daysInMonth = getDaysInMonth(dateWithDesiredMonth, dirtyOptions);
    // Set the last day of the new month
    // if the original date was the last day of the longer month
    date.setMonth(desiredMonth, Math.min(daysInMonth, date.getDate()));
    return date
  }

  /**
   * @name isValid
   * @category Common Helpers
   * @summary Is the given date valid?
   *
   * @description
   * Returns false if argument is Invalid Date and true otherwise.
   * Argument is converted to Date using `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * Invalid Date is a Date, whose time value is NaN.
   *
   * Time value of Date: http://es5.github.io/#x15.9.1.1
   *
   * @param {*} date - the date to check
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the date is valid
   * @throws {TypeError} 1 argument required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // For the valid date:
   * var result = isValid(new Date(2014, 1, 31))
   * //=> true
   *
   * @example
   * // For the value, convertable into a date:
   * var result = isValid('2014-02-31')
   * //=> true
   *
   * @example
   * // For the invalid date:
   * var result = isValid(new Date(''))
   * //=> false
   */
  function isValid (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    return !isNaN(date)
  }

  var formatDistanceLocale = {
    lessThanXSeconds: {
      one: 'less than a second',
      other: 'less than {{count}} seconds'
    },

    xSeconds: {
      one: '1 second',
      other: '{{count}} seconds'
    },

    halfAMinute: 'half a minute',

    lessThanXMinutes: {
      one: 'less than a minute',
      other: 'less than {{count}} minutes'
    },

    xMinutes: {
      one: '1 minute',
      other: '{{count}} minutes'
    },

    aboutXHours: {
      one: 'about 1 hour',
      other: 'about {{count}} hours'
    },

    xHours: {
      one: '1 hour',
      other: '{{count}} hours'
    },

    xDays: {
      one: '1 day',
      other: '{{count}} days'
    },

    aboutXMonths: {
      one: 'about 1 month',
      other: 'about {{count}} months'
    },

    xMonths: {
      one: '1 month',
      other: '{{count}} months'
    },

    aboutXYears: {
      one: 'about 1 year',
      other: 'about {{count}} years'
    },

    xYears: {
      one: '1 year',
      other: '{{count}} years'
    },

    overXYears: {
      one: 'over 1 year',
      other: 'over {{count}} years'
    },

    almostXYears: {
      one: 'almost 1 year',
      other: 'almost {{count}} years'
    }
  };

  function formatDistance (token, count, options) {
    options = options || {};

    var result;
    if (typeof formatDistanceLocale[token] === 'string') {
      result = formatDistanceLocale[token];
    } else if (count === 1) {
      result = formatDistanceLocale[token].one;
    } else {
      result = formatDistanceLocale[token].other.replace('{{count}}', count);
    }

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result
      } else {
        return result + ' ago'
      }
    }

    return result
  }

  function buildFormatLongFn (args) {
    return function (dirtyOptions) {
      var options = dirtyOptions || {};
      var width = options.width ? String(options.width) : args.defaultWidth;
      var format = args.formats[width] || args.formats[args.defaultWidth];
      return format
    }
  }

  var dateFormats = {
    full: 'EEEE, MMMM do, y',
    long: 'MMMM do, y',
    medium: 'MMM d, y',
    short: 'MM/dd/yyyy'
  };

  var timeFormats = {
    full: 'h:mm:ss a zzzz',
    long: 'h:mm:ss a z',
    medium: 'h:mm:ss a',
    short: 'h:mm a'
  };

  var dateTimeFormats = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}'
  };

  var formatLong = {
    date: buildFormatLongFn({
      formats: dateFormats,
      defaultWidth: 'full'
    }),

    time: buildFormatLongFn({
      formats: timeFormats,
      defaultWidth: 'full'
    }),

    dateTime: buildFormatLongFn({
      formats: dateTimeFormats,
      defaultWidth: 'full'
    })
  };

  var formatRelativeLocale = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P'
  };

  function formatRelative (token, date, baseDate, options) {
    return formatRelativeLocale[token]
  }

  function buildLocalizeFn (args) {
    return function (dirtyIndex, dirtyOptions) {
      var options = dirtyOptions || {};
      var width = options.width ? String(options.width) : args.defaultWidth;
      var context = options.context ? String(options.context) : 'standalone';

      var valuesArray;
      if (context === 'formatting' && args.formattingValues) {
        valuesArray = args.formattingValues[width] || args.formattingValues[args.defaultFormattingWidth];
      } else {
        valuesArray = args.values[width] || args.values[args.defaultWidth];
      }
      var index = args.argumentCallback ? args.argumentCallback(dirtyIndex) : dirtyIndex;
      return valuesArray[index]
    }
  }

  var eraValues = {
    narrow: ['B', 'A'],
    abbreviated: ['BC', 'AD'],
    wide: ['Before Christ', 'Anno Domini']
  };

  var quarterValues = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter']
  };

  // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  var monthValues = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    wide: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  var dayValues = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };

  var dayPeriodValues = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night'
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night'
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night'
    }
  };
  var formattingDayPeriodValues = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night'
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night'
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night'
    }
  };

  function ordinalNumber (dirtyNumber, dirtyOptions) {
    var number = Number(dirtyNumber);

    // If ordinal numbers depend on context, for example,
    // if they are different for different grammatical genders,
    // use `options.unit`:
    //
    //   var options = dirtyOptions || {}
    //   var unit = String(options.unit)
    //
    // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
    // 'day', 'hour', 'minute', 'second'

    var rem100 = number % 100;
    if (rem100 > 20 || rem100 < 10) {
      switch (rem100 % 10) {
        case 1:
          return number + 'st'
        case 2:
          return number + 'nd'
        case 3:
          return number + 'rd'
      }
    }
    return number + 'th'
  }

  var localize = {
    ordinalNumber: ordinalNumber,

    era: buildLocalizeFn({
      values: eraValues,
      defaultWidth: 'wide'
    }),

    quarter: buildLocalizeFn({
      values: quarterValues,
      defaultWidth: 'wide',
      argumentCallback: function (quarter) {
        return Number(quarter) - 1
      }
    }),

    month: buildLocalizeFn({
      values: monthValues,
      defaultWidth: 'wide'
    }),

    day: buildLocalizeFn({
      values: dayValues,
      defaultWidth: 'wide'
    }),

    dayPeriod: buildLocalizeFn({
      values: dayPeriodValues,
      defaultWidth: 'wide',
      formattingValues: formattingDayPeriodValues,
      defaulFormattingWidth: 'wide'
    })
  };

  function buildMatchPatternFn (args) {
    return function (dirtyString, dirtyOptions) {
      var string = String(dirtyString);
      var options = dirtyOptions || {};

      var matchResult = string.match(args.matchPattern);
      if (!matchResult) {
        return null
      }
      var matchedString = matchResult[0];

      var parseResult = string.match(args.parsePattern);
      if (!parseResult) {
        return null
      }
      var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
      value = options.valueCallback ? options.valueCallback(value) : value;

      return {
        value: value,
        rest: string.slice(matchedString.length)
      }
    }
  }

  function buildMatchFn (args) {
    return function (dirtyString, dirtyOptions) {
      var string = String(dirtyString);
      var options = dirtyOptions || {};
      var width = options.width;

      var matchPattern = (width && args.matchPatterns[width]) || args.matchPatterns[args.defaultMatchWidth];
      var matchResult = string.match(matchPattern);

      if (!matchResult) {
        return null
      }
      var matchedString = matchResult[0];

      var parsePatterns = (width && args.parsePatterns[width]) || args.parsePatterns[args.defaultParseWidth];

      var value;
      if (Object.prototype.toString.call(parsePatterns) === '[object Array]') {
        value = parsePatterns.findIndex(function (pattern) {
          return pattern.test(string)
        });
      } else {
        value = findKey(parsePatterns, function (pattern) {
          return pattern.test(string)
        });
      }

      value = args.valueCallback ? args.valueCallback(value) : value;
      value = options.valueCallback ? options.valueCallback(value) : value;

      return {
        value: value,
        rest: string.slice(matchedString.length)
      }
    }
  }

  function findKey (object, predicate) {
    for (var key in object) {
      if (object.hasOwnProperty(key) && predicate(object[key])) {
        return key
      }
    }
  }

  var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
  var parseOrdinalNumberPattern = /\d+/i;

  var matchEraPatterns = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i
  };
  var parseEraPatterns = {
    any: [/^b/i, /^(a|c)/i]
  };

  var matchQuarterPatterns = {
    narrow: /^[1234]/i,
    abbreviated: /^q[1234]/i,
    wide: /^[1234](th|st|nd|rd)? quarter/i
  };
  var parseQuarterPatterns = {
    any: [/1/i, /2/i, /3/i, /4/i]
  };

  var matchMonthPatterns = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
  };
  var parseMonthPatterns = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
  };

  var matchDayPatterns = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
  };
  var parseDayPatterns = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
  };

  var matchDayPeriodPatterns = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
  };
  var parseDayPeriodPatterns = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i
    }
  };

  var match = {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: matchOrdinalNumberPattern,
      parsePattern: parseOrdinalNumberPattern,
      valueCallback: function (value) {
        return parseInt(value, 10)
      }
    }),

    era: buildMatchFn({
      matchPatterns: matchEraPatterns,
      defaultMatchWidth: 'wide',
      parsePatterns: parseEraPatterns,
      defaultParseWidth: 'any'
    }),

    quarter: buildMatchFn({
      matchPatterns: matchQuarterPatterns,
      defaultMatchWidth: 'wide',
      parsePatterns: parseQuarterPatterns,
      defaultParseWidth: 'any',
      valueCallback: function (index) {
        return index + 1
      }
    }),

    month: buildMatchFn({
      matchPatterns: matchMonthPatterns,
      defaultMatchWidth: 'wide',
      parsePatterns: parseMonthPatterns,
      defaultParseWidth: 'any'
    }),

    day: buildMatchFn({
      matchPatterns: matchDayPatterns,
      defaultMatchWidth: 'wide',
      parsePatterns: parseDayPatterns,
      defaultParseWidth: 'any'
    }),

    dayPeriod: buildMatchFn({
      matchPatterns: matchDayPeriodPatterns,
      defaultMatchWidth: 'any',
      parsePatterns: parseDayPeriodPatterns,
      defaultParseWidth: 'any'
    })
  };

  /**
   * @type {Locale}
   * @category Locales
   * @summary English locale (United States).
   * @language English
   * @iso-639-2 eng
   * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
   * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
   */
  var locale = {
    formatDistance: formatDistance,
    formatLong: formatLong,
    formatRelative: formatRelative,
    localize: localize,
    match: match,
    options: {
      weekStartsOn: 0 /* Sunday */,
      firstWeekContainsDate: 1
    }
  };

  var MILLISECONDS_IN_DAY$1 = 86400000;

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCDayOfYear (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var timestamp = date.getTime();
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
    var startOfYearTimestamp = date.getTime();
    var difference = timestamp - startOfYearTimestamp;
    return Math.floor(difference / MILLISECONDS_IN_DAY$1) + 1
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function startOfUTCISOWeek (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var weekStartsOn = 1;

    var date = toDate(dirtyDate, dirtyOptions);
    var day = date.getUTCDay();
    var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    date.setUTCDate(date.getUTCDate() - diff);
    date.setUTCHours(0, 0, 0, 0);
    return date
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCISOWeekYear (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var year = date.getUTCFullYear();

    var fourthOfJanuaryOfNextYear = new Date(0);
    fourthOfJanuaryOfNextYear.setUTCFullYear(year + 1, 0, 4);
    fourthOfJanuaryOfNextYear.setUTCHours(0, 0, 0, 0);
    var startOfNextYear = startOfUTCISOWeek(fourthOfJanuaryOfNextYear, dirtyOptions);

    var fourthOfJanuaryOfThisYear = new Date(0);
    fourthOfJanuaryOfThisYear.setUTCFullYear(year, 0, 4);
    fourthOfJanuaryOfThisYear.setUTCHours(0, 0, 0, 0);
    var startOfThisYear = startOfUTCISOWeek(fourthOfJanuaryOfThisYear, dirtyOptions);

    if (date.getTime() >= startOfNextYear.getTime()) {
      return year + 1
    } else if (date.getTime() >= startOfThisYear.getTime()) {
      return year
    } else {
      return year - 1
    }
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function startOfUTCISOWeekYear (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var year = getUTCISOWeekYear(dirtyDate, dirtyOptions);
    var fourthOfJanuary = new Date(0);
    fourthOfJanuary.setUTCFullYear(year, 0, 4);
    fourthOfJanuary.setUTCHours(0, 0, 0, 0);
    var date = startOfUTCISOWeek(fourthOfJanuary, dirtyOptions);
    return date
  }

  var MILLISECONDS_IN_WEEK$2 = 604800000;

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCISOWeek (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var diff = startOfUTCISOWeek(date, dirtyOptions).getTime() - startOfUTCISOWeekYear(date, dirtyOptions).getTime();

    // Round the number of days to the nearest integer
    // because the number of milliseconds in a week is not constant
    // (e.g. it's different in the week of the daylight saving time clock shift)
    return Math.round(diff / MILLISECONDS_IN_WEEK$2) + 1
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function startOfUTCWeek (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var options = dirtyOptions || {};
    var locale = options.locale;
    var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
    var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
    var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn);

    // Test if weekStartsOn is between 0 and 6 _and_ is not NaN
    if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
      throw new RangeError('weekStartsOn must be between 0 and 6 inclusively')
    }

    var date = toDate(dirtyDate, options);
    var day = date.getUTCDay();
    var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    date.setUTCDate(date.getUTCDate() - diff);
    date.setUTCHours(0, 0, 0, 0);
    return date
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCWeekYear (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var year = date.getUTCFullYear();

    var options = dirtyOptions || {};
    var locale = options.locale;
    var localeFirstWeekContainsDate = locale &&
      locale.options &&
      locale.options.firstWeekContainsDate;
    var defaultFirstWeekContainsDate =
      localeFirstWeekContainsDate == null
        ? 1
        : toInteger(localeFirstWeekContainsDate);
    var firstWeekContainsDate =
      options.firstWeekContainsDate == null
        ? defaultFirstWeekContainsDate
        : toInteger(options.firstWeekContainsDate);

    // Test if weekStartsOn is between 1 and 7 _and_ is not NaN
    if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
      throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively')
    }

    var firstWeekOfNextYear = new Date(0);
    firstWeekOfNextYear.setUTCFullYear(year + 1, 0, firstWeekContainsDate);
    firstWeekOfNextYear.setUTCHours(0, 0, 0, 0);
    var startOfNextYear = startOfUTCWeek(firstWeekOfNextYear, dirtyOptions);

    var firstWeekOfThisYear = new Date(0);
    firstWeekOfThisYear.setUTCFullYear(year, 0, firstWeekContainsDate);
    firstWeekOfThisYear.setUTCHours(0, 0, 0, 0);
    var startOfThisYear = startOfUTCWeek(firstWeekOfThisYear, dirtyOptions);

    if (date.getTime() >= startOfNextYear.getTime()) {
      return year + 1
    } else if (date.getTime() >= startOfThisYear.getTime()) {
      return year
    } else {
      return year - 1
    }
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function startOfUTCWeekYear (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var options = dirtyOptions || {};
    var locale = options.locale;
    var localeFirstWeekContainsDate = locale &&
      locale.options &&
      locale.options.firstWeekContainsDate;
    var defaultFirstWeekContainsDate =
      localeFirstWeekContainsDate == null
        ? 1
        : toInteger(localeFirstWeekContainsDate);
    var firstWeekContainsDate =
      options.firstWeekContainsDate == null
        ? defaultFirstWeekContainsDate
        : toInteger(options.firstWeekContainsDate);

    var year = getUTCWeekYear(dirtyDate, dirtyOptions);
    var firstWeek = new Date(0);
    firstWeek.setUTCFullYear(year, 0, firstWeekContainsDate);
    firstWeek.setUTCHours(0, 0, 0, 0);
    var date = startOfUTCWeek(firstWeek, dirtyOptions);
    return date
  }

  var MILLISECONDS_IN_WEEK$3 = 604800000;

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCWeek (dirtyDate, dirtyOptions) {
    if (arguments.length < 1) {
      throw new TypeError('1 argument required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var diff = startOfUTCWeek(date, dirtyOptions).getTime() - startOfUTCWeekYear(date, dirtyOptions).getTime();

    // Round the number of days to the nearest integer
    // because the number of milliseconds in a week is not constant
    // (e.g. it's different in the week of the daylight saving time clock shift)
    return Math.round(diff / MILLISECONDS_IN_WEEK$3) + 1
  }

  var dayPeriodEnum = {
    am: 'am',
    pm: 'pm',
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night'
  };

  /*
   * |     | Unit                           |     | Unit                           |
   * |-----|--------------------------------|-----|--------------------------------|
   * |  a  | AM, PM                         |  A* | Milliseconds in day            |
   * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
   * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
   * |  d  | Day of month                   |  D  | Day of year                    |
   * |  e  | Local day of week              |  E  | Day of week                    |
   * |  f  |                                |  F* | Day of week in month           |
   * |  g* | Modified Julian day            |  G  | Era                            |
   * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
   * |  i! | ISO day of week                |  I! | ISO week of year               |
   * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
   * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
   * |  l* | (deprecated)                   |  L  | Stand-alone month              |
   * |  m  | Minute                         |  M  | Month                          |
   * |  n  |                                |  N  |                                |
   * |  o! | Ordinal number modifier        |  O  | Timezone (GMT)                 |
   * |  p! | Long localized time            |  P! | Long localized date            |
   * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
   * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
   * |  s  | Second                         |  S  | Fraction of second             |
   * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
   * |  u  | Extended year                  |  U* | Cyclic year                    |
   * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
   * |  w  | Local week of year             |  W* | Week of month                  |
   * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
   * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
   * |  z  | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
   *
   * Letters marked by * are not implemented but reserved by Unicode standard.
   *
   * Letters marked by ! are non-standard, but implemented by date-fns:
   * - `o` modifies the previous token to turn it into an ordinal (see `format` docs)
   * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
   *   i.e. 7 for Sunday, 1 for Monday, etc.
   * - `I` is ISO week of year, as opposed to `w` which is local week of year.
   * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
   *   `R` is supposed to be used in conjunction with `I` and `i`
   *   for universal ISO week-numbering date, whereas
   *   `Y` is supposed to be used in conjunction with `w` and `e`
   *   for week-numbering date specific to the locale.
   * - `P` is long localized date format
   * - `p` is long localized time format
   */

  var formatters = {
    // Era
    G: function (date, token, localize) {
      var era = date.getUTCFullYear() > 0 ? 1 : 0;
      switch (token) {
        // AD, BC
        case 'G':
        case 'GG':
        case 'GGG':
          return localize.era(era, {width: 'abbreviated'})
        // A, B
        case 'GGGGG':
          return localize.era(era, {width: 'narrow'})
        // Anno Domini, Before Christ
        case 'GGGG':
        default:
          return localize.era(era, {width: 'wide'})
      }
    },

    // Year
    y: function (date, token, localize, options) {
      // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_tokens
      // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
      // |----------|-------|----|-------|-------|-------|
      // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
      // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
      // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
      // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
      // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |

      var signedYear = date.getUTCFullYear();

      // Returns 1 for 1 BC (which is year 0 in JavaScript)
      var year = signedYear > 0 ? signedYear : 1 - signedYear;

      // Two digit year
      if (token === 'yy') {
        var twoDigitYear = year % 100;
        return addLeadingZeros(twoDigitYear, 2)
      }

      // Ordinal number
      if (token === 'yo') {
        return localize.ordinalNumber(year, {unit: 'year'})
      }

      // Padding
      return addLeadingZeros(year, token.length)
    },

    // Local week-numbering year
    Y: function (date, token, localize, options) {
      var signedWeekYear = getUTCWeekYear(date, options);
      var weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;

      // Two digit year
      if (token === 'YY') {
        var twoDigitYear = weekYear % 100;
        return addLeadingZeros(twoDigitYear, 2)
      }

      // Ordinal number
      if (token === 'Yo') {
        return localize.ordinalNumber(weekYear, {unit: 'year'})
      }

      // Padding
      return addLeadingZeros(weekYear, token.length)
    },

    // ISO week-numbering year
    R: function (date, token, localize, options) {
      var isoWeekYear = getUTCISOWeekYear(date, options);

      // Padding
      return addLeadingZeros(isoWeekYear, token.length)
    },

    // Extended year. This is a single number designating the year of this calendar system.
    // The main difference between `y` and `u` localizers are B.C. years:
    // | Year | `y` | `u` |
    // |------|-----|-----|
    // | AC 1 |   1 |   1 |
    // | BC 1 |   1 |   0 |
    // | BC 2 |   2 |  -1 |
    // Also `yy` always returns the last two digits of a year,
    // while `uu` pads single digit years to 2 characters and returns other years unchanged.
    u: function (date, token, localize, options) {
      var year = date.getUTCFullYear();
      return addLeadingZeros(year, token.length)
    },

    // Quarter
    Q: function (date, token, localize, options) {
      var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);
      switch (token) {
        // 1, 2, 3, 4
        case 'Q':
          return String(quarter)
        // 01, 02, 03, 04
        case 'QQ':
          return addLeadingZeros(quarter, 2)
        // 1st, 2nd, 3rd, 4th
        case 'Qo':
          return localize.ordinalNumber(quarter, {unit: 'quarter'})
        // Q1, Q2, Q3, Q4
        case 'QQQ':
          return localize.quarter(quarter, {width: 'abbreviated', context: 'formatting'})
        // 1, 2, 3, 4 (narrow quarter; could be not numerical)
        case 'QQQQQ':
          return localize.quarter(quarter, {width: 'narrow', context: 'formatting'})
        // 1st quarter, 2nd quarter, ...
        case 'QQQQ':
        default:
          return localize.quarter(quarter, {width: 'wide', context: 'formatting'})
      }
    },

    // Stand-alone quarter
    q: function (date, token, localize, options) {
      var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);
      switch (token) {
        // 1, 2, 3, 4
        case 'q':
          return String(quarter)
        // 01, 02, 03, 04
        case 'qq':
          return addLeadingZeros(quarter, 2)
        // 1st, 2nd, 3rd, 4th
        case 'qo':
          return localize.ordinalNumber(quarter, {unit: 'quarter'})
        // Q1, Q2, Q3, Q4
        case 'qqq':
          return localize.quarter(quarter, {width: 'abbreviated', context: 'standalone'})
        // 1, 2, 3, 4 (narrow quarter; could be not numerical)
        case 'qqqqq':
          return localize.quarter(quarter, {width: 'narrow', context: 'standalone'})
        // 1st quarter, 2nd quarter, ...
        case 'qqqq':
        default:
          return localize.quarter(quarter, {width: 'wide', context: 'standalone'})
      }
    },

    // Month
    M: function (date, token, localize, options) {
      var month = date.getUTCMonth();
      switch (token) {
        // 1, 2, ..., 12
        case 'M':
          return String(month + 1)
        // 01, 02, ..., 12
        case 'MM':
          return addLeadingZeros(month + 1, 2)
        // 1st, 2nd, ..., 12th
        case 'Mo':
          return localize.ordinalNumber(month + 1, {unit: 'month'})
        // Jan, Feb, ..., Dec
        case 'MMM':
          return localize.month(month, {width: 'abbreviated', context: 'formatting'})
        // J, F, ..., D
        case 'MMMMM':
          return localize.month(month, {width: 'narrow', context: 'formatting'})
        // January, February, ..., December
        case 'MMMM':
        default:
          return localize.month(month, {width: 'wide', context: 'formatting'})
      }
    },

    // Stand-alone month
    L: function (date, token, localize, options) {
      var month = date.getUTCMonth();
      switch (token) {
        // 1, 2, ..., 12
        case 'L':
          return String(month + 1)
        // 01, 02, ..., 12
        case 'LL':
          return addLeadingZeros(month + 1, 2)
        // 1st, 2nd, ..., 12th
        case 'Lo':
          return localize.ordinalNumber(month + 1, {unit: 'month'})
        // Jan, Feb, ..., Dec
        case 'LLL':
          return localize.month(month, {width: 'abbreviated', context: 'standalone'})
        // J, F, ..., D
        case 'LLLLL':
          return localize.month(month, {width: 'narrow', context: 'standalone'})
        // January, February, ..., December
        case 'LLLL':
        default:
          return localize.month(month, {width: 'wide', context: 'standalone'})
      }
    },

    // Local week of year
    w: function (date, token, localize, options) {
      var week = getUTCWeek(date, options);

      if (token === 'wo') {
        return localize.ordinalNumber(week, {unit: 'week'})
      }

      return addLeadingZeros(week, token.length)
    },

    // ISO week of year
    I: function (date, token, localize, options) {
      var isoWeek = getUTCISOWeek(date, options);

      if (token === 'Io') {
        return localize.ordinalNumber(isoWeek, {unit: 'week'})
      }

      return addLeadingZeros(isoWeek, token.length)
    },

    // Day of the month
    d: function (date, token, localize, options) {
      var dayOfMonth = date.getUTCDate();

      if (token === 'do') {
        return localize.ordinalNumber(dayOfMonth, {unit: 'date'})
      }

      return addLeadingZeros(dayOfMonth, token.length)
    },

    // Day of year
    D: function (date, token, localize, options) {
      var dayOfYear = getUTCDayOfYear(date, options);

      if (token === 'Do') {
        return localize.ordinalNumber(dayOfYear, {unit: 'dayOfYear'})
      }

      return addLeadingZeros(dayOfYear, token.length)
    },

    // Day of week
    E: function (date, token, localize, options) {
      var dayOfWeek = date.getUTCDay();
      switch (token) {
        // Tue
        case 'E':
        case 'EE':
        case 'EEE':
          return localize.day(dayOfWeek, {width: 'abbreviated', context: 'formatting'})
        // T
        case 'EEEEE':
          return localize.day(dayOfWeek, {width: 'narrow', context: 'formatting'})
        // Tu
        case 'EEEEEE':
          return localize.day(dayOfWeek, {width: 'short', context: 'formatting'})
        // Tuesday
        case 'EEEE':
        default:
          return localize.day(dayOfWeek, {width: 'wide', context: 'formatting'})
      }
    },

    // Local day of week
    e: function (date, token, localize, options) {
      var dayOfWeek = date.getUTCDay();
      var localDayOfWeek = ((dayOfWeek - options.weekStartsOn + 8) % 7) || 7;
      switch (token) {
        // Numerical value (Nth day of week with current locale or weekStartsOn)
        case 'e':
          return String(localDayOfWeek)
        // Padded numerical value
        case 'ee':
          return addLeadingZeros(localDayOfWeek, 2)
        // 1st, 2nd, ..., 7th
        case 'eo':
          return localize.ordinalNumber(localDayOfWeek, {unit: 'day'})
        case 'eee':
          return localize.day(dayOfWeek, {width: 'abbreviated', context: 'formatting'})
        // T
        case 'eeeee':
          return localize.day(dayOfWeek, {width: 'narrow', context: 'formatting'})
        // Tu
        case 'eeeeee':
          return localize.day(dayOfWeek, {width: 'short', context: 'formatting'})
        // Tuesday
        case 'eeee':
        default:
          return localize.day(dayOfWeek, {width: 'wide', context: 'formatting'})
      }
    },

    // Stand-alone local day of week
    c: function (date, token, localize, options) {
      var dayOfWeek = date.getUTCDay();
      var localDayOfWeek = ((dayOfWeek - options.weekStartsOn + 8) % 7) || 7;
      switch (token) {
        // Numerical value (same as in `e`)
        case 'c':
          return String(localDayOfWeek)
        // Padded numberical value
        case 'cc':
          return addLeadingZeros(localDayOfWeek, token.length)
        // 1st, 2nd, ..., 7th
        case 'co':
          return localize.ordinalNumber(localDayOfWeek, {unit: 'day'})
        case 'ccc':
          return localize.day(dayOfWeek, {width: 'abbreviated', context: 'standalone'})
        // T
        case 'ccccc':
          return localize.day(dayOfWeek, {width: 'narrow', context: 'standalone'})
        // Tu
        case 'cccccc':
          return localize.day(dayOfWeek, {width: 'short', context: 'standalone'})
        // Tuesday
        case 'cccc':
        default:
          return localize.day(dayOfWeek, {width: 'wide', context: 'standalone'})
      }
    },

    // ISO day of week
    i: function (date, token, localize, options) {
      var dayOfWeek = date.getUTCDay();
      var isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      switch (token) {
        // 2
        case 'i':
          return String(isoDayOfWeek)
        // 02
        case 'ii':
          return addLeadingZeros(isoDayOfWeek, token.length)
        // 2nd
        case 'io':
          return localize.ordinalNumber(isoDayOfWeek, {unit: 'day'})
        // Tue
        case 'iii':
          return localize.day(dayOfWeek, {width: 'abbreviated', context: 'formatting'})
        // T
        case 'iiiii':
          return localize.day(dayOfWeek, {width: 'narrow', context: 'formatting'})
        // Tu
        case 'iiiiii':
          return localize.day(dayOfWeek, {width: 'short', context: 'formatting'})
        // Tuesday
        case 'iiii':
        default:
          return localize.day(dayOfWeek, {width: 'wide', context: 'formatting'})
      }
    },

    // AM or PM
    a: function (date, token, localize) {
      var hours = date.getUTCHours();
      var dayPeriodEnumValue = (hours / 12) >= 1 ? 'pm' : 'am';

      switch (token) {
        case 'a':
        case 'aa':
        case 'aaa':
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'abbreviated', context: 'formatting'})
        case 'aaaaa':
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'narrow', context: 'formatting'})
        case 'aaaa':
        default:
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'wide', context: 'formatting'})
      }
    },

    // AM, PM, midnight, noon
    b: function (date, token, localize) {
      var hours = date.getUTCHours();
      var dayPeriodEnumValue;
      if (hours === 12) {
        dayPeriodEnumValue = dayPeriodEnum.noon;
      } else if (hours === 0) {
        dayPeriodEnumValue = dayPeriodEnum.midnight;
      } else {
        dayPeriodEnumValue = (hours / 12) >= 1 ? 'pm' : 'am';
      }

      switch (token) {
        case 'b':
        case 'bb':
        case 'bbb':
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'abbreviated', context: 'formatting'})
        case 'bbbbb':
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'narrow', context: 'formatting'})
        case 'bbbb':
        default:
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'wide', context: 'formatting'})
      }
    },

    // in the morning, in the afternoon, in the evening, at night
    B: function (date, token, localize) {
      var hours = date.getUTCHours();
      var dayPeriodEnumValue;
      if (hours >= 17) {
        dayPeriodEnumValue = dayPeriodEnum.evening;
      } else if (hours >= 12) {
        dayPeriodEnumValue = dayPeriodEnum.afternoon;
      } else if (hours >= 4) {
        dayPeriodEnumValue = dayPeriodEnum.morning;
      } else {
        dayPeriodEnumValue = dayPeriodEnum.night;
      }

      switch (token) {
        case 'B':
        case 'BB':
        case 'BBB':
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'abbreviated', context: 'formatting'})
        case 'BBBBB':
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'narrow', context: 'formatting'})
        case 'BBBB':
        default:
          return localize.dayPeriod(dayPeriodEnumValue, {width: 'wide', context: 'formatting'})
      }
    },

    // Hour [1-12]
    h: function (date, token, localize, options) {
      var hours = date.getUTCHours() % 12;

      if (hours === 0) {
        hours = 12;
      }

      if (token === 'ho') {
        return localize.ordinalNumber(hours, {unit: 'hour'})
      }

      return addLeadingZeros(hours, token.length)
    },

    // Hour [0-23]
    H: function (date, token, localize, options) {
      var hours = date.getUTCHours();

      if (token === 'Ho') {
        return localize.ordinalNumber(hours, {unit: 'hour'})
      }

      return addLeadingZeros(hours, token.length)
    },

    // Hour [0-11]
    K: function (date, token, localize, options) {
      var hours = date.getUTCHours() % 12;

      if (token === 'Ko') {
        return localize.ordinalNumber(hours, {unit: 'hour'})
      }

      return addLeadingZeros(hours, token.length)
    },

    // Hour [1-24]
    k: function (date, token, localize, options) {
      var hours = date.getUTCHours();

      if (hours === 0) {
        hours = 24;
      }

      if (token === 'ko') {
        return localize.ordinalNumber(hours, {unit: 'hour'})
      }

      return addLeadingZeros(hours, token.length)
    },

    // Minute
    m: function (date, token, localize, options) {
      var minutes = date.getUTCMinutes();

      if (token === 'mo') {
        return localize.ordinalNumber(minutes, {unit: 'minute'})
      }

      return addLeadingZeros(minutes, token.length)
    },

    // Second
    s: function (date, token, localize, options) {
      var seconds = date.getUTCSeconds();

      if (token === 'so') {
        return localize.ordinalNumber(seconds, {unit: 'second'})
      }

      return addLeadingZeros(seconds, token.length)
    },

    // Fraction of second
    S: function (date, token, localize, options) {
      var numberOfDigits = token.length;
      var milliseconds = date.getUTCMilliseconds();
      var fractionalSeconds = Math.floor(milliseconds * Math.pow(10, numberOfDigits - 3));
      return addLeadingZeros(fractionalSeconds, numberOfDigits)
    },

    // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
    X: function (date, token, localize, options) {
      var originalDate = options._originalDate || date;
      var timezoneOffset = originalDate.getTimezoneOffset();

      if (timezoneOffset === 0) {
        return 'Z'
      }

      switch (token) {
        // Hours and optional minutes
        case 'X':
          return formatTimezoneWithOptionalMinutes(timezoneOffset)

        // Hours, minutes and optional seconds without `:` delimeter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `XX`
        case 'XXXX':
        case 'XX': // Hours and minutes without `:` delimeter
          return formatTimezone(timezoneOffset)

        // Hours, minutes and optional seconds with `:` delimeter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `XXX`
        case 'XXXXX':
        case 'XXX': // Hours and minutes with `:` delimeter
        default:
          return formatTimezone(timezoneOffset, ':')
      }
    },

    // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
    x: function (date, token, localize, options) {
      var originalDate = options._originalDate || date;
      var timezoneOffset = originalDate.getTimezoneOffset();

      switch (token) {
        // Hours and optional minutes
        case 'x':
          return formatTimezoneWithOptionalMinutes(timezoneOffset)

        // Hours, minutes and optional seconds without `:` delimeter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `xx`
        case 'xxxx':
        case 'xx': // Hours and minutes without `:` delimeter
          return formatTimezone(timezoneOffset)

        // Hours, minutes and optional seconds with `:` delimeter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `xxx`
        case 'xxxxx':
        case 'xxx': // Hours and minutes with `:` delimeter
        default:
          return formatTimezone(timezoneOffset, ':')
      }
    },

    // Timezone (GMT)
    O: function (date, token, localize, options) {
      var originalDate = options._originalDate || date;
      var timezoneOffset = originalDate.getTimezoneOffset();

      switch (token) {
        // Short
        case 'O':
        case 'OO':
        case 'OOO':
          return 'GMT' + formatTimezoneShort(timezoneOffset, ':')
        // Long
        case 'OOOO':
        default:
          return 'GMT' + formatTimezone(timezoneOffset, ':')
      }
    },

    // Timezone (specific non-location)
    z: function (date, token, localize, options) {
      var originalDate = options._originalDate || date;
      var timezoneOffset = originalDate.getTimezoneOffset();

      switch (token) {
        // Short
        case 'z':
        case 'zz':
        case 'zzz':
          return 'GMT' + formatTimezoneShort(timezoneOffset, ':')
        // Long
        case 'zzzz':
        default:
          return 'GMT' + formatTimezone(timezoneOffset, ':')
      }
    },

    // Seconds timestamp
    t: function (date, token, localize, options) {
      var originalDate = options._originalDate || date;
      var timestamp = Math.floor(originalDate.getTime() / 1000);
      return addLeadingZeros(timestamp, token.length)
    },

    // Milliseconds timestamp
    T: function (date, token, localize, options) {
      var originalDate = options._originalDate || date;
      var timestamp = originalDate.getTime();
      return addLeadingZeros(timestamp, token.length)
    }
  };

  function addLeadingZeros (number, targetLength) {
    var sign = number < 0 ? '-' : '';
    var output = Math.abs(number).toString();
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return sign + output
  }

  function formatTimezone (offset, dirtyDelimeter) {
    var delimeter = dirtyDelimeter || '';
    var sign = offset > 0 ? '-' : '+';
    var absOffset = Math.abs(offset);
    var hours = addLeadingZeros(Math.floor(absOffset / 60), 2);
    var minutes = addLeadingZeros(absOffset % 60, 2);
    return sign + hours + delimeter + minutes
  }

  function formatTimezoneWithOptionalMinutes (offset, dirtyDelimeter) {
    if (offset % 60 === 0) {
      var sign = offset > 0 ? '-' : '+';
      return sign + addLeadingZeros(Math.abs(offset) / 60, 2)
    }
    return formatTimezone(offset, dirtyDelimeter)
  }

  function formatTimezoneShort (offset, dirtyDelimeter) {
    var sign = offset > 0 ? '-' : '+';
    var absOffset = Math.abs(offset);
    var hours = Math.floor(absOffset / 60);
    var minutes = absOffset % 60;
    if (minutes === 0) {
      return sign + String(hours)
    }
    var delimeter = dirtyDelimeter || '';
    return sign + String(hours) + delimeter + addLeadingZeros(minutes, 2)
  }

  function dateLongFormatter (pattern, formatLong, options) {
    switch (pattern) {
      case 'P':
        return formatLong.date({width: 'short'})
      case 'PP':
        return formatLong.date({width: 'medium'})
      case 'PPP':
        return formatLong.date({width: 'long'})
      case 'PPPP':
      default:
        return formatLong.date({width: 'full'})
    }
  }

  function timeLongFormatter (pattern, formatLong, options) {
    switch (pattern) {
      case 'p':
        return formatLong.time({width: 'short'})
      case 'pp':
        return formatLong.time({width: 'medium'})
      case 'ppp':
        return formatLong.time({width: 'long'})
      case 'pppp':
      default:
        return formatLong.time({width: 'full'})
    }
  }

  function dateTimeLongFormatter (pattern, formatLong, options) {
    var matchResult = pattern.match(/(P+)(p+)?/);
    var datePattern = matchResult[1];
    var timePattern = matchResult[2];

    if (!timePattern) {
      return dateLongFormatter(pattern, formatLong, options)
    }

    var dateTimeFormat;

    switch (datePattern) {
      case 'P':
        dateTimeFormat = formatLong.dateTime({width: 'short'});
        break
      case 'PP':
        dateTimeFormat = formatLong.dateTime({width: 'medium'});
        break
      case 'PPP':
        dateTimeFormat = formatLong.dateTime({width: 'long'});
        break
      case 'PPPP':
      default:
        dateTimeFormat = formatLong.dateTime({width: 'full'});
        break
    }

    return dateTimeFormat
      .replace('{{date}}', dateLongFormatter(datePattern, formatLong, options))
      .replace('{{time}}', timeLongFormatter(timePattern, formatLong, options))
  }

  var longFormatters = {
    p: timeLongFormatter,
    P: dateTimeLongFormatter
  };

  /**
   * @name subMilliseconds
   * @category Millisecond Helpers
   * @summary Subtract the specified number of milliseconds from the given date.
   *
   * @description
   * Subtract the specified number of milliseconds from the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of milliseconds to be subtracted
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the milliseconds subtracted
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Subtract 750 milliseconds from 10 July 2014 12:45:30.000:
   * var result = subMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
   * //=> Thu Jul 10 2014 12:45:29.250
   */
  function subMilliseconds (dirtyDate, dirtyAmount, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var amount = toInteger(dirtyAmount);
    return addMilliseconds(dirtyDate, -amount, dirtyOptions)
  }

  // This RegExp consists of three parts separated by `|`:
  // - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
  //   (one of the certain letters followed by `o`)
  // - (\w)\1* matches any sequences of the same letter
  // - '' matches two quote characters in a row
  // - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
  //   except a single quote symbol, which ends the sequence.
  //   Two quote characters do not end the sequence.
  //   If there is no matching single quote
  //   then the sequence will continue until the end of the string.
  // - . matches any single character unmatched by previous parts of the RegExps
  var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

  // This RegExp catches symbols escaped by quotes, and also
  // sequences of symbols P, p, and the combinations like `PPPPPPPppppp`
  var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

  var escapedStringRegExp = /^'(.*?)'?$/;
  var doubleQuoteRegExp = /''/g;

  /**
   * @name format
   * @category Common Helpers
   * @summary Format the date.
   *
   * @description
   * Return the formatted date string in the given format. The result may vary by locale.
   *
   * The characters wrapped between two single quotes characters (') are escaped.
   * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
   * (see the last example)
   *
   * Format of the string is based on Unicode Technical Standard #35:
   * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
   * with a few additions (see note 7 below the table).
   *
   * Accepted patterns:
   * | Unit                            | Pattern | Result examples                   | Notes |
   * |---------------------------------|---------|-----------------------------------|-------|
   * | Era                             | G..GGG  | AD, BC                            |       |
   * |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
   * |                                 | GGGGG   | A, B                              |       |
   * | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
   * |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
   * |                                 | yy      | 44, 01, 00, 17                    | 5     |
   * |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
   * |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
   * |                                 | yyyyy   | ...                               | 3,5   |
   * | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
   * |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
   * |                                 | YY      | 44, 01, 00, 17                    | 5     |
   * |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
   * |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5     |
   * |                                 | YYYYY   | ...                               | 3,5   |
   * | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
   * |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
   * |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
   * |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
   * |                                 | RRRRR   | ...                               | 3,5,7 |
   * | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
   * |                                 | uu      | -43, 01, 1900, 2017               | 5     |
   * |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
   * |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
   * |                                 | uuuuu   | ...                               | 3,5   |
   * | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
   * |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
   * |                                 | QQ      | 01, 02, 03, 04                    |       |
   * |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
   * |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
   * |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
   * | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
   * |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
   * |                                 | qq      | 01, 02, 03, 04                    |       |
   * |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
   * |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
   * |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
   * | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
   * |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
   * |                                 | MM      | 01, 02, ..., 12                   |       |
   * |                                 | MMM     | Jan, Feb, ..., Dec                |       |
   * |                                 | MMMM    | January, February, ..., December  | 2     |
   * |                                 | MMMMM   | J, F, ..., D                      |       |
   * | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
   * |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
   * |                                 | LL      | 01, 02, ..., 12                   |       |
   * |                                 | LLL     | Jan, Feb, ..., Dec                |       |
   * |                                 | LLLL    | January, February, ..., December  | 2     |
   * |                                 | LLLLL   | J, F, ..., D                      |       |
   * | Local week of year              | w       | 1, 2, ..., 53                     |       |
   * |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
   * |                                 | ww      | 01, 02, ..., 53                   |       |
   * | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
   * |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
   * |                                 | II      | 01, 02, ..., 53                   | 7     |
   * | Day of month                    | d       | 1, 2, ..., 31                     |       |
   * |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
   * |                                 | dd      | 01, 02, ..., 31                   |       |
   * | Day of year                     | D       | 1, 2, ..., 365, 366               |       |
   * |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
   * |                                 | DD      | 01, 02, ..., 365, 366             |       |
   * |                                 | DDD     | 001, 002, ..., 365, 366           |       |
   * |                                 | DDDD    | ...                               | 3     |
   * | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Su            |       |
   * |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
   * |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
   * |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Su, Sa        |       |
   * | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
   * |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
   * |                                 | ii      | 01, 02, ..., 07                   | 7     |
   * |                                 | iii     | Mon, Tue, Wed, ..., Su            | 7     |
   * |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
   * |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
   * |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Su, Sa        | 7     |
   * | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
   * |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
   * |                                 | ee      | 02, 03, ..., 01                   |       |
   * |                                 | eee     | Mon, Tue, Wed, ..., Su            |       |
   * |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
   * |                                 | eeeee   | M, T, W, T, F, S, S               |       |
   * |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Su, Sa        |       |
   * | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
   * |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
   * |                                 | cc      | 02, 03, ..., 01                   |       |
   * |                                 | ccc     | Mon, Tue, Wed, ..., Su            |       |
   * |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
   * |                                 | ccccc   | M, T, W, T, F, S, S               |       |
   * |                                 | cccccc  | Mo, Tu, We, Th, Fr, Su, Sa        |       |
   * | AM, PM                          | a..aaa  | AM, PM                            |       |
   * |                                 | aaaa    | a.m., p.m.                        | 2     |
   * |                                 | aaaaa   | a, p                              |       |
   * | AM, PM, noon, midnight          | b..bbb  | AM, PM, noon, midnight            |       |
   * |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
   * |                                 | bbbbb   | a, p, n, mi                       |       |
   * | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
   * |                                 | BBBB    | at night, in the morning, ...     | 2     |
   * |                                 | BBBBB   | at night, in the morning, ...     |       |
   * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
   * |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
   * |                                 | hh      | 01, 02, ..., 11, 12               |       |
   * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
   * |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
   * |                                 | HH      | 00, 01, 02, ..., 23               |       |
   * | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
   * |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
   * |                                 | KK      | 1, 2, ..., 11, 0                  |       |
   * | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
   * |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
   * |                                 | kk      | 24, 01, 02, ..., 23               |       |
   * | Minute                          | m       | 0, 1, ..., 59                     |       |
   * |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
   * |                                 | mm      | 00, 01, ..., 59                   |       |
   * | Second                          | s       | 0, 1, ..., 59                     |       |
   * |                                 | so      | 0th, 1st, ..., 59th               | 7     |
   * |                                 | ss      | 00, 01, ..., 59                   |       |
   * | Fraction of second              | S       | 0, 1, ..., 9                      |       |
   * |                                 | SS      | 00, 01, ..., 99                   |       |
   * |                                 | SSS     | 000, 0001, ..., 999               |       |
   * |                                 | SSSS    | ...                               | 3     |
   * | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
   * |                                 | XX      | -0800, +0530, Z                   |       |
   * |                                 | XXX     | -08:00, +05:30, Z                 |       |
   * |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
   * |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
   * | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
   * |                                 | xx      | -0800, +0530, +0000               |       |
   * |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
   * |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
   * |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
   * | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
   * |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
   * | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
   * |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
   * | Seconds timestamp               | t       | 512969520                         | 7     |
   * |                                 | tt      | ...                               | 3,7   |
   * | Milliseconds timestamp          | T       | 512969520900                      | 7     |
   * |                                 | TT      | ...                               | 3,7   |
   * | Long localized date             | P       | 05/29/1453                        | 7     |
   * |                                 | PP      | May 29, 1453                      | 7     |
   * |                                 | PPP     | May 29th, 1453                    | 7     |
   * |                                 | PPPP    | Sunday, May 29th, 1453            | 2,7   |
   * | Long localized time             | p       | 12:00 AM                          | 7     |
   * |                                 | pp      | 12:00:00 AM                       | 7     |
   * |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
   * |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
   * | Combination of date and time    | Pp      | 05/29/1453, 12:00 AM              | 7     |
   * |                                 | PPpp    | May 29, 1453, 12:00:00 AM         | 7     |
   * |                                 | PPPppp  | May 29th, 1453 at ...             | 7     |
   * |                                 | PPPPpppp| Sunday, May 29th, 1453 at ...     | 2,7   |
   * Notes:
   * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
   *    are the same as "stand-alone" units, but are different in some languages.
   *    "Formatting" units are declined according to the rules of the language
   *    in the context of a date. "Stand-alone" units are always nominative singular:
   *
   *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
   *
   *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
   *
   * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
   *    the single quote characters (see below).
   *    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
   *    the output will be the same as default pattern for this unit, usually
   *    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
   *    are marked with "2" in the last column of the table.
   *
   *    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
   *
   * 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
   *    The output will be padded with zeros to match the length of the pattern.
   *
   *    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
   *
   * 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
   *    These tokens represent the shortest form of the quarter.
   *
   * 5. The main difference between `y` and `u` patterns are B.C. years:
   *
   *    | Year | `y` | `u` |
   *    |------|-----|-----|
   *    | AC 1 |   1 |   1 |
   *    | BC 1 |   1 |   0 |
   *    | BC 2 |   2 |  -1 |
   *
   *    Also `yy` always returns the last two digits of a year,
   *    while `uu` pads single digit years to 2 characters and returns other years unchanged:
   *
   *    | Year | `yy` | `uu` |
   *    |------|------|------|
   *    | 1    |   01 |   01 |
   *    | 14   |   14 |   14 |
   *    | 376  |   76 |  376 |
   *    | 1453 |   53 | 1453 |
   *
   *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
   *    except local week-numbering years are dependent on `options.weekStartsOn`
   *    and `options.firstWeekContainsDate` (compare [getISOWeekYear]{@link https://date-fns.org/docs/getISOWeekYear}
   *    and [getWeekYear]{@link https://date-fns.org/docs/getWeekYear}).
   *
   * 6. Specific non-location timezones are currently unavailable in `date-fns`,
   *    so right now these tokens fall back to GMT timezones.
   *
   * 7. These patterns are not in the Unicode Technical Standard #35:
   *    - `i`: ISO day of week
   *    - `I`: ISO week of year
   *    - `R`: ISO week-numbering year
   *    - `t`: seconds timestamp
   *    - `T`: milliseconds timestamp
   *    - `o`: ordinal number modifier
   *    - `P`: long localized date
   *    - `p`: long localized time
   *
   * @param {Date|String|Number} date - the original date
   * @param {String} format - the string of tokens
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
   * @param {Number} [options.firstWeekContainsDate=1] - the day of January, which is
   * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
   * @returns {String} the formatted date string
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   * @throws {RangeError} `options.locale` must contain `localize` property
   * @throws {RangeError} `options.locale` must contain `formatLong` property
   * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
   * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
   *
   * @example
   * // Represent 11 February 2014 in middle-endian format:
   * var result = format(
   *   new Date(2014, 1, 11),
   *   'MM/dd/yyyy'
   * )
   * //=> '02/11/2014'
   *
   * @example
   * // Represent 2 July 2014 in Esperanto:
   * import { eoLocale } from 'date-fns/locale/eo'
   * var result = format(
   *   new Date(2014, 6, 2),
   *   "do 'de' MMMM yyyy",
   *   {locale: eoLocale}
   * )
   * //=> '2-a de julio 2014'
   *
   * @example
   * // Escape string by single quote characters:
   * var result = format(
   *   new Date(2014, 6, 2, 15),
   *   "h 'o''clock'"
   * )
   * //=> "3 o'clock"
   */
  function format (dirtyDate, dirtyFormatStr, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var formatStr = String(dirtyFormatStr);
    var options = dirtyOptions || {};

    var locale$$1 = options.locale || locale;

    var localeFirstWeekContainsDate =
      locale$$1.options &&
      locale$$1.options.firstWeekContainsDate;
    var defaultFirstWeekContainsDate =
      localeFirstWeekContainsDate == null
        ? 1
        : toInteger(localeFirstWeekContainsDate);
    var firstWeekContainsDate =
      options.firstWeekContainsDate == null
        ? defaultFirstWeekContainsDate
        : toInteger(options.firstWeekContainsDate);

    // Test if weekStartsOn is between 1 and 7 _and_ is not NaN
    if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
      throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively')
    }

    var localeWeekStartsOn = locale$$1.options && locale$$1.options.weekStartsOn;
    var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
    var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn);

    // Test if weekStartsOn is between 0 and 6 _and_ is not NaN
    if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
      throw new RangeError('weekStartsOn must be between 0 and 6 inclusively')
    }

    if (!locale$$1.localize) {
      throw new RangeError('locale must contain localize property')
    }

    if (!locale$$1.formatLong) {
      throw new RangeError('locale must contain formatLong property')
    }

    var originalDate = toDate(dirtyDate, options);

    if (!isValid(originalDate, options)) {
      return 'Invalid Date'
    }

    // Convert the date in system timezone to the same date in UTC+00:00 timezone.
    // This ensures that when UTC functions will be implemented, locales will be compatible with them.
    // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/376
    var timezoneOffset = getTimezoneOffsetInMilliseconds(originalDate);
    var utcDate = subMilliseconds(originalDate, timezoneOffset, options);

    var formatterOptions = {
      firstWeekContainsDate: firstWeekContainsDate,
      weekStartsOn: weekStartsOn,
      locale: locale$$1,
      _originalDate: originalDate
    };

    var result = formatStr
      .match(longFormattingTokensRegExp)
      .map(function (substring) {
        var firstCharacter = substring[0];
        if (firstCharacter === 'p' || firstCharacter === 'P') {
          var longFormatter = longFormatters[firstCharacter];
          return longFormatter(substring, locale$$1.formatLong, formatterOptions)
        }
        return substring
      })
      .join('')
      .match(formattingTokensRegExp)
      .map(function (substring) {
        // Replace two single quote characters with one single quote character
        if (substring === "''") {
          return "'"
        }

        var firstCharacter = substring[0];
        if (firstCharacter === "'") {
          return cleanEscapedString(substring)
        }

        var formatter = formatters[firstCharacter];
        if (formatter) {
          return formatter(utcDate, substring, locale$$1.localize, formatterOptions)
        }

        return substring
      })
      .join('');

    return result
  }

  function cleanEscapedString (input) {
    return input.match(escapedStringRegExp)[1].replace(doubleQuoteRegExp, "'")
  }

  /**
   * @name isAfter
   * @category Common Helpers
   * @summary Is the first date after the second one?
   *
   * @description
   * Is the first date after the second one?
   *
   * @param {Date|String|Number} date - the date that should be after the other one to return true
   * @param {Date|String|Number} dateToCompare - the date to compare with
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the first date is after the second date
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Is 10 July 1989 after 11 February 1987?
   * var result = isAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))
   * //=> true
   */
  function isAfter (dirtyDate, dirtyDateToCompare, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var dateToCompare = toDate(dirtyDateToCompare, dirtyOptions);
    return date.getTime() > dateToCompare.getTime()
  }

  /**
   * @name isBefore
   * @category Common Helpers
   * @summary Is the first date before the second one?
   *
   * @description
   * Is the first date before the second one?
   *
   * @param {Date|String|Number} date - the date that should be before the other one to return true
   * @param {Date|String|Number} dateToCompare - the date to compare with
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the first date is before the second date
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Is 10 July 1989 before 11 February 1987?
   * var result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
   * //=> false
   */
  function isBefore (dirtyDate, dirtyDateToCompare, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var date = toDate(dirtyDate, dirtyOptions);
    var dateToCompare = toDate(dirtyDateToCompare, dirtyOptions);
    return date.getTime() < dateToCompare.getTime()
  }

  /**
   * @name isDate
   * @category Common Helpers
   * @summary Is the given value a date?
   *
   * @description
   * Returns true if the given value is an instance of Date. The function works for dates transferred across iframes.
   *
   * @param {*} value - the value to check
   * @param {Options} [options] - the object with options. Unused; present for FP submodule compatibility sake. See [Options]{@link https://date-fns.org/docs/Options}
   * @returns {boolean} true if the given value is a date
   * @throws {TypeError} 1 arguments required
   *
   * @example
   * // For a valid date:
   * var result = isDate(new Date())
   * //=> true
   *
   * @example
   * // For an invalid date:
   * var result = isDate(new Date(NaN))
   * //=> true
   *
   * @example
   * // For some value:
   * var result = isDate('2014-02-31')
   * //=> false
   *
   * @example
   * // For an object:
   * var result = isDate({})
   * //=> false
   */

  /**
   * @name subMonths
   * @category Month Helpers
   * @summary Subtract the specified number of months from the given date.
   *
   * @description
   * Subtract the specified number of months from the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of months to be subtracted
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the months subtracted
   * @throws {TypeError} 2 arguments required
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Subtract 5 months from 1 February 2015:
   * var result = subMonths(new Date(2015, 1, 1), 5)
   * //=> Mon Sep 01 2014 00:00:00
   */
  function subMonths (dirtyDate, dirtyAmount, dirtyOptions) {
    if (arguments.length < 2) {
      throw new TypeError('2 arguments required, but only ' + arguments.length + ' present')
    }

    var amount = toInteger(dirtyAmount);
    return addMonths(dirtyDate, -amount, dirtyOptions)
  }

  // This file is generated automatically by `scripts/build/indices.js`. Please, don't change it.

  /* eslint-disable */
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  var debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
          args = arguments;

      var later = function () {
        timeout = null;
        if (!immediate) { func.apply(context, args); }
      };

      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) { func.apply(context, args); }
    };
  };
  var copyObject = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };
  var findAncestor = function (element, selector) {
    if (!element) {
      return null;
    }

    if (typeof element.closest === 'function') {
      return element.closest(selector) || null;
    }

    while (element) {
      if (element.matches(selector)) {
        return element;
      }

      element = element.parentElement;
    }

    return null;
  };
  var randomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  };

  var AirbnbStyleDatepicker = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('transition',{attrs:{"name":"asd__fade"}},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.showDatepicker),expression:"showDatepicker"},{name:"click-outside",rawName:"v-click-outside",value:(_vm.handleClickOutside),expression:"handleClickOutside"}],staticClass:"asd__wrapper",class:_vm.wrapperClasses,style:(_vm.showFullscreen ? undefined : _vm.wrapperStyles),attrs:{"id":_vm.wrapperId}},[(_vm.showFullscreen)?_c('div',{staticClass:"asd__mobile-header asd__mobile-only"},[_c('div',{staticClass:"asd__mobile-close",on:{"click":_vm.closeDatepicker}},[_c('div',{staticClass:"asd__mobile-close-icon"},[_vm._v("X")])]),_vm._v(" "),_c('h3',[_vm._v(_vm._s(_vm.mobileHeader || _vm.mobileHeaderFallback))])]):_vm._e(),_vm._v(" "),_c('div',{staticClass:"asd__datepicker-header"},[_c('div',{staticClass:"asd__change-month-button asd__change-month-button--previous"},[_c('button',{attrs:{"type":"button"},on:{"click":_vm.previousMonth}},[_c('svg',{attrs:{"viewBox":"0 0 1000 1000"}},[_c('path',{attrs:{"d":"M336.2 274.5l-210.1 210h805.4c13 0 23 10 23 23s-10 23-23 23H126.1l210.1 210.1c11 11 11 21 0 32-5 5-10 7-16 7s-11-2-16-7l-249.1-249c-11-11-11-21 0-32l249.1-249.1c21-21.1 53 10.9 32 32z"}})])])]),_vm._v(" "),_c('div',{staticClass:"asd__change-month-button asd__change-month-button--next"},[_c('button',{attrs:{"type":"button"},on:{"click":_vm.nextMonth}},[_c('svg',{attrs:{"viewBox":"0 0 1000 1000"}},[_c('path',{attrs:{"d":"M694.4 242.4l249.1 249.1c11 11 11 21 0 32L694.4 772.7c-5 5-10 7-16 7s-11-2-16-7c-11-11-11-21 0-32l210.1-210.1H67.1c-13 0-23-10-23-23s10-23 23-23h805.4L662.4 274.5c-21-21.1 11-53.1 32-32.1z"}})])])]),_vm._v(" "),_vm._l((_vm.showMonths),function(month,index){return _c('div',{key:index,staticClass:"asd__days-legend",style:([_vm.monthWidthStyles, {left: (_vm.width * index) + 'px'}])},_vm._l((_vm.daysShort),function(day,indx){return _c('div',{key:indx,staticClass:"asd__day-title"},[_vm._v(_vm._s(day))])}))})],2),_vm._v(" "),_c('div',{staticClass:"asd__inner-wrapper",style:(_vm.innerStyles)},[_c('transition-group',{attrs:{"name":"asd__list-complete","tag":"div"}},_vm._l((_vm.months),function(month,monthIndex){return _c('div',{key:monthIndex,staticClass:"asd__month",class:{hidden: monthIndex === 0 || monthIndex > _vm.showMonths},style:(_vm.monthWidthStyles)},[_c('div',{staticClass:"asd__month-name"},[_vm._v(_vm._s(month.monthName)+" "+_vm._s(month.year))]),_vm._v(" "),_c('table',{staticClass:"asd__month-table",attrs:{"role":"presentation"}},[_c('tbody',_vm._l((month.weeks),function(week,index){return _c('tr',{key:index,staticClass:"asd__week"},_vm._l((week),function(ref,index){
  var fullDate = ref.fullDate;
  var dayNumber = ref.dayNumber;
  return _c('td',{key:index + '_' + dayNumber,staticClass:"asd__day",class:{ 'asd__day--enabled': dayNumber !== 0, 'asd__day--empty': dayNumber === 0, 'asd__day--disabled': _vm.isDisabled(fullDate), 'asd__day--selected': _vm.selectedDate1 === fullDate || _vm.selectedDate2 === fullDate, 'asd__day--in-range': _vm.isInRange(fullDate), 'asd__day--today': fullDate && _vm.isToday(fullDate), 'asd__selected-date-one': fullDate && fullDate === _vm.selectedDate1, 'asd__selected-date-two': fullDate && fullDate === _vm.selectedDate2, },style:(_vm.getDayStyles(fullDate)),attrs:{"data-date":fullDate},on:{"mouseover":function () { _vm.setHoverDate(fullDate); }}},[(dayNumber)?_c('button',{staticClass:"asd__day-button",attrs:{"type":"button","date":fullDate,"disabled":_vm.isDisabled(fullDate)},on:{"click":function () { _vm.selectDate(fullDate); }}},[_vm._v(_vm._s(dayNumber))]):_vm._e()])}))}))])])}))],1),_vm._v(" "),(_vm.mode !== 'single' && _vm.showActionButtons)?_c('div',{staticClass:"asd__action-buttons"},[_c('button',{attrs:{"type":"button"},on:{"click":_vm.closeDatepickerCancel}},[_vm._v(_vm._s(_vm.texts.cancel))]),_vm._v(" "),_c('button',{style:({color: _vm.colors.selected}),attrs:{"type":"button"},on:{"click":_vm.apply}},[_vm._v(_vm._s(_vm.texts.apply))])]):_vm._e()])])},staticRenderFns: [],
    name: 'AirbnbStyleDatepicker',
    props: {
      triggerElementId: { type: String },
      dateOne: { type: [String, Date] },
      dateTwo: { type: [String, Date] },
      minDate: { type: [String, Date] },
      endDate: { type: [String, Date] },
      mode: { type: String, default: 'range' },
      offsetY: { type: Number, default: 0 },
      offsetX: { type: Number, default: 0 },
      monthsToShow: { type: Number, default: 2 },
      startOpen: { type: Boolean },
      fullscreenMobile: { type: Boolean },
      inline: { type: Boolean },
      mobileHeader: { type: String },
      disabledDates: { type: Array, default: function () { return []; } },
      showActionButtons: { type: Boolean, default: true },
      isTest: {
        type: Boolean,
        default: function () { return "development" === 'test'; },
      },
      trigger: { type: Boolean, default: false },
    },
    data: function data() {
      return {
        wrapperId: 'airbnb-style-datepicker-wrapper-' + randomString(5),
        dateFormat: 'YYYY-MM-DD',
        showDatepicker: false,
        showMonths: 2,
        colors: {
          selected: '#00a699',
          inRange: '#66e2da',
          selectedText: '#fff',
          text: '#565a5c',
          inRangeBorder: '#33dacd',
          disabled: '#fff',
        },
        sundayFirst: false,
        monthNames: [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December' ],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        daysShort: ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'],
        texts: {
          apply: 'Apply',
          cancel: 'Cancel',
        },
        startingDate: '',
        months: [],
        width: 300,
        selectedDate1: '',
        selectedDate2: '',
        isSelectingDate1: true,
        hoverDate: '',
        alignRight: false,
        triggerPosition: {},
        triggerWrapperPosition: {},
        viewportWidth: window.innerWidth + 'px',
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth <= 1024,
        triggerElement: undefined,
      }
    },
    computed: {
      wrapperClasses: function wrapperClasses() {
        return {
          'asd__wrapper--datepicker-open': this.showDatepicker,
          'asd__wrapper--full-screen': this.showFullscreen,
          'asd__wrapper--inline': this.inline,
        }
      },
      wrapperStyles: function wrapperStyles() {
        return {
          position: this.inline ? 'static' : 'absolute',
          top: this.inline ? '0' : this.triggerPosition.height + this.offsetY + 'px',
          left: !this.alignRight
            ? this.triggerPosition.left - this.triggerWrapperPosition.left + this.offsetX + 'px'
            : '',
          right: this.alignRight
            ? this.triggerWrapperPosition.right - this.triggerPosition.right + this.offsetX + 'px'
            : '',
          width: this.width * this.showMonths + 'px',
          zIndex: this.inline ? '0' : '100',
        }
      },
      innerStyles: function innerStyles() {
        return {
          'margin-left': this.showFullscreen ? '-' + this.viewportWidth : ("-" + (this.width) + "px"),
        }
      },
      monthWidthStyles: function monthWidthStyles() {
        return {
          width: this.showFullscreen ? this.viewportWidth : this.width + 'px',
        }
      },
      mobileHeaderFallback: function mobileHeaderFallback() {
        return this.mode === 'range' ? 'Select dates' : 'Select date'
      },
      showFullscreen: function showFullscreen() {
        return this.isMobile && this.fullscreenMobile
      },
      datesSelected: function datesSelected() {
        return !!(
          (this.selectedDate1 && this.selectedDate1 !== '') ||
          (this.selectedDate2 && this.selectedDate2 !== '')
        )
      },
      allDatesSelected: function allDatesSelected() {
        return !!(
          this.selectedDate1 &&
          this.selectedDate1 !== '' &&
          this.selectedDate2 &&
          this.selectedDate2 !== ''
        )
      },
      hasMinDate: function hasMinDate() {
        return !!(this.minDate && this.minDate !== '')
      },
      isRangeMode: function isRangeMode() {
        return this.mode === 'range'
      },
      isSingleMode: function isSingleMode() {
        return this.mode === 'single'
      },
      datepickerWidth: function datepickerWidth() {
        return this.width * this.showMonths
      },
      datePropsCompound: function datePropsCompound() {
        // used to watch for changes in props, and update GUI accordingly
        return this.dateOne + this.dateTwo
      },
      isDateTwoBeforeDateOne: function isDateTwoBeforeDateOne() {
        if (!this.dateTwo) {
          return false
        }
        return isBefore(this.dateTwo, this.dateOne)
      },
      visibleMonths: function visibleMonths() {
        var firstMonthArray = this.months.filter(function (m, index) { return index > 0; });
        var numberOfMonthsArray = [];
        for (var i = 0; i < this.showMonths; i++) {
          numberOfMonthsArray.push(i);
        }
        return numberOfMonthsArray.map(function (_, index) { return firstMonthArray[index].firstDateOfMonth; })
      },
    },
    watch: {
      selectedDate1: function selectedDate1(newValue, oldValue) {
        var newDate = !newValue || newValue === '' ? '' : format(newValue, this.dateFormat);
        this.$emit('date-one-selected', newDate);
      },
      selectedDate2: function selectedDate2(newValue, oldValue) {
        var newDate = !newValue || newValue === '' ? '' : format(newValue, this.dateFormat);
        this.$emit('date-two-selected', newDate);
      },
      mode: function mode(newValue, oldValue) {
        this.setStartDates();
      },
      minDate: function minDate() {
        this.setStartDates();
        this.generateMonths();
      },
      datePropsCompound: function datePropsCompound(newValue) {
        if (this.dateOne !== this.selectedDate1) {
          this.startingDate = this.dateOne;
          this.setStartDates();
          this.generateMonths();
        }
        if (this.isDateTwoBeforeDateOne) {
          this.selectedDate2 = '';
          this.$emit('date-two-selected', '');
        }
      },
      trigger: function trigger(newValue, oldValue) {
        if (newValue) {
          this.openDatepicker();
        }
      },
    },
    created: function created() {
      var this$1 = this;

      this.setupDatepicker();

      if (this.sundayFirst) {
        this.setSundayToFirstDayInWeek();
      }

      this._handleWindowResizeEvent = debounce(function () {
        this$1.positionDatepicker();
        this$1.setStartDates();
      }, 200);
      this._handleWindowClickEvent = function (event) {
        if (event.target.id === this$1.triggerElementId) {
          event.stopPropagation();
          event.preventDefault();
          this$1.toggleDatepicker();
        }
      };
      window.addEventListener('resize', this._handleWindowResizeEvent);
      window.addEventListener('click', this._handleWindowClickEvent);
    },
    mounted: function mounted() {
      this.triggerElement = this.isTest
        ? document.createElement('input')
        : document.getElementById(this.triggerElementId);

      this.setStartDates();
      this.generateMonths();

      if (this.startOpen || this.inline) {
        this.openDatepicker();
      }

      this.triggerElement.addEventListener('keyup', this.handleTriggerInput);
    },
    destroyed: function destroyed() {
      window.removeEventListener('resize', this._handleWindowResizeEvent);
      window.removeEventListener('click', this._handleWindowClickEvent);

      this.triggerElement.removeEventListener('keyup', this.handleTriggerInput);
    },
    methods: {
      getDayStyles: function getDayStyles(date) {
        var isSelected = this.isSelected(date);
        var isInRange = this.isInRange(date);
        var isDisabled = this.isDisabled(date);

        var styles = {
          width: (this.width - 30) / 7 + 'px',
          background: isSelected ? this.colors.selected : isInRange ? this.colors.inRange : '',
          color: isSelected
            ? this.colors.selectedText
            : isInRange ? this.colors.selectedText : this.colors.text,
          border: isSelected
            ? '1px double ' + this.colors.selected
            : isInRange && this.allDatesSelected ? '1px double ' + this.colors.inRangeBorder : '',
        };

        if (isDisabled) {
          styles.background = this.colors.disabled;
        }
        return styles
      },
      handleClickOutside: function handleClickOutside(event) {
        if (event.target.id === this.triggerElementId || !this.showDatepicker || this.inline) {
          return
        }
        this.closeDatepicker();
      },
      handleTriggerInput: function handleTriggerInput(event) {
        var keys = {
          arrowDown: 40,
          arrowUp: 38,
          arrowRight: 39,
          arrowLeft: 37,
        };
        if (event.keyCode === keys.arrowDown && !event.shiftKey && !this.showDatepicker) {
          this.openDatepicker();
        } else if (event.keyCode === keys.arrowUp && !event.shiftKey && this.showDatepicker) {
          this.closeDatepicker();
        } else if (event.keyCode === keys.arrowRight && !event.shiftKey && this.showDatepicker) {
          this.nextMonth();
        } else if (event.keyCode === keys.arrowLeft && !event.shiftKey && this.showDatepicker) {
          this.previousMonth();
        } else {
          if (this.mode === 'single') {
            this.setDateFromText(event.target.value);
          }
        }
      },
      setDateFromText: function setDateFromText(value) {
        if (value.length < 10) {
          return
        }
        // make sure format is either 'YYYY-MM-DD' or 'DD.MM.YYYY'
        var isFormatYearFirst = value.match(
          /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/
        );
        var isFormatDayFirst = value.match(
          /^(0[1-9]|1[0-9]|2[0-9]|3[0-1])[.](0[1-9]|1[0-2])[.](\d{4})$/
        );

        if (!isFormatYearFirst && !isFormatDayFirst) {
          return
        }
        if (isFormatDayFirst) {
          //convert to YYYY-MM-DD
          value = (value.substring(6, 10)) + "-" + (value.substring(3, 5)) + "-" + (value.substring(0, 2));
        }

        var valueAsDateObject = new Date(value);
        if (!isValid(valueAsDateObject)) {
          return
        }
        var formattedDate = format(valueAsDateObject, this.dateFormat);
        if (
          this.isDateDisabled(formattedDate) ||
          this.isBeforeMinDate(formattedDate) ||
          this.isAfterEndDate(formattedDate)
        ) {
          return
        }
        this.startingDate = subMonths(formattedDate, 1);
        this.generateMonths();
        this.selectDate(formattedDate);
      },
      generateMonths: function generateMonths() {
        var this$1 = this;

        this.months = [];
        for (var i = 0; i < this.showMonths + 2; i++) {
          this$1.months.push(this$1.getMonth(this$1.startingDate));
          this$1.startingDate = this$1.addMonths(this$1.startingDate);
        }
      },
      setupDatepicker: function setupDatepicker() {
        if (this.$options.sundayFirst) {
          this.sundayFirst = copyObject(this.$options.sundayFirst);
        }
        if (this.$options.colors) {
          var colors = copyObject(this.$options.colors);
          this.colors.selected = colors.selected || this.colors.selected;
          this.colors.inRange = colors.inRange || this.colors.inRange;
          this.colors.selectedText = colors.selectedText || this.colors.selectedText;
          this.colors.text = colors.text || this.colors.text;
          this.colors.inRangeBorder = colors.inRangeBorder || this.colors.inRangeBorder;
          this.colors.disabled = colors.disabled || this.colors.disabled;
        }
        if (this.$options.monthNames && this.$options.monthNames.length === 12) {
          this.monthNames = copyObject(this.$options.monthNames);
        }
        if (this.$options.days && this.$options.days.length === 7) {
          this.days = copyObject(this.$options.days);
        }
        if (this.$options.daysShort && this.$options.daysShort.length === 7) {
          this.daysShort = copyObject(this.$options.daysShort);
        }
        if (this.$options.texts) {
          var texts = copyObject(this.$options.texts);
          this.texts.apply = texts.apply || this.texts.apply;
          this.texts.cancel = texts.cancel || this.texts.cancel;
        }
      },
      setStartDates: function setStartDates() {
        var startDate = this.dateOne || new Date();
        if (this.hasMinDate && isBefore(startDate, this.minDate)) {
          startDate = this.minDate;
        }
        this.startingDate = this.subtractMonths(startDate);
        this.selectedDate1 = this.dateOne;
        this.selectedDate2 = this.dateTwo;
      },
      setSundayToFirstDayInWeek: function setSundayToFirstDayInWeek() {
        var lastDay = this.days.pop();
        this.days.unshift(lastDay);
        var lastDayShort = this.daysShort.pop();
        this.daysShort.unshift(lastDayShort);
      },
      getMonth: function getMonth$$1(date) {
        var firstDateOfMonth = format(date, 'YYYY-MM-01');
        var year = format(date, 'YYYY');
        var monthNumber = parseInt(format(date, 'M'));
        var monthName = this.monthNames[monthNumber - 1];

        return {
          year: year,
          firstDateOfMonth: firstDateOfMonth,
          monthName: monthName,
          monthNumber: monthNumber,
          weeks: this.getWeeks(firstDateOfMonth),
        }
      },
      getWeeks: function getWeeks(date) {
        var weekDayNotInMonth = { dayNumber: 0 };
        var daysInMonth = getDaysInMonth(date);
        var year = format(date, 'YYYY');
        var month = format(date, 'MM');
        var firstDayInWeek = parseInt(format(date, this.sundayFirst ? 'd' : 'E'));
        if (this.sundayFirst) {
          firstDayInWeek++;
        }
        var weeks = [];
        var week = [];

        // add empty days to get first day in correct position
        for (var s = 1; s < firstDayInWeek; s++) {
          week.push(weekDayNotInMonth);
        }
        for (var d = 0; d < daysInMonth; d++) {
          var isLastDayInMonth = d >= daysInMonth - 1;
          var dayNumber = d + 1;
          var dayNumberFull = dayNumber < 10 ? '0' + dayNumber : dayNumber;
          week.push({
            dayNumber: dayNumber,
            dayNumberFull: dayNumberFull,
            fullDate: year + '-' + month + '-' + dayNumberFull,
          });

          if (week.length === 7) {
            weeks.push(week);
            week = [];
          } else if (isLastDayInMonth) {
            for (var i = 0; i < 7 - week.length; i++) {
              week.push(weekDayNotInMonth);
            }
            weeks.push(week);
            week = [];
          }
        }
        return weeks
      },
      selectDate: function selectDate(date) {
        if (this.isBeforeMinDate(date) || this.isAfterEndDate(date) || this.isDateDisabled(date)) {
          return
        }

        if (this.mode === 'single') {
          this.selectedDate1 = date;
          this.closeDatepicker();
          return
        }

        if (this.isSelectingDate1 || isBefore(date, this.selectedDate1)) {
          this.selectedDate1 = date;
          this.isSelectingDate1 = false;

          if (isBefore(this.selectedDate2, date)) {
            this.selectedDate2 = '';
          }
        } else {
          this.selectedDate2 = date;
          this.isSelectingDate1 = true;

          if (isAfter(this.selectedDate1, date)) {
            this.selectedDate1 = '';
          }
        }
      },
      setHoverDate: function setHoverDate(date) {
        this.hoverDate = date;
      },
      isToday: function isToday(date) {
        return format(new Date(), this.dateFormat) === date
      },
      isSelected: function isSelected(date) {
        if (!date) {
          return
        }
        return this.selectedDate1 === date || this.selectedDate2 === date
      },
      isInRange: function isInRange(date) {
        if (!this.allDatesSelected || this.isSingleMode) {
          return false
        }

        return (
          (isAfter(date, this.selectedDate1) && isBefore(date, this.selectedDate2)) ||
          (isAfter(date, this.selectedDate1) &&
            isBefore(date, this.hoverDate) &&
            !this.allDatesSelected)
        )
      },
      isBeforeMinDate: function isBeforeMinDate(date) {
        if (!this.minDate) {
          return false
        }
        return isBefore(date, this.minDate)
      },
      isAfterEndDate: function isAfterEndDate(date) {
        if (!this.endDate) {
          return false
        }
        return isAfter(date, this.endDate)
      },
      isDateDisabled: function isDateDisabled(date) {
        var isDisabled = this.disabledDates.indexOf(date) > -1;
        return isDisabled
      },
      isDisabled: function isDisabled(date) {
        return this.isDateDisabled(date) || this.isBeforeMinDate(date) || this.isAfterEndDate(date)
      },
      previousMonth: function previousMonth() {
        this.startingDate = this.subtractMonths(this.months[0].firstDateOfMonth);

        this.months.unshift(this.getMonth(this.startingDate));
        this.months.splice(this.months.length - 1, 1);
        this.$emit('previous-month', this.visibleMonths);
      },
      nextMonth: function nextMonth() {
        var this$1 = this;

        this.startingDate = this.addMonths(this.months[this.months.length - 1].firstDateOfMonth);
        this.months.push(this.getMonth(this.startingDate));

        setTimeout(function () {
          this$1.months.splice(0, 1);
          this$1.$emit('next-month', this$1.visibleMonths);
        }, 100);
      },
      subtractMonths: function subtractMonths(date) {
        return format(subMonths(date, 1), this.dateFormat)
      },
      addMonths: function addMonths$1(date) {
        return format(addMonths(date, 1), this.dateFormat)
      },
      toggleDatepicker: function toggleDatepicker() {
        if (this.showDatepicker) {
          this.closeDatepicker();
        } else {
          this.openDatepicker();
        }
      },
      openDatepicker: function openDatepicker() {
        this.positionDatepicker();
        this.setStartDates();
        this.triggerElement.classList.add('datepicker-open');
        this.showDatepicker = true;
        this.initialDate1 = this.dateOne;
        this.initialDate2 = this.dateTwo;
        this.$emit('opened');
      },
      closeDatepickerCancel: function closeDatepickerCancel() {
        if (this.showDatepicker) {
          this.selectedDate1 = this.initialDate1;
          this.selectedDate2 = this.initialDate2;
          this.$emit('cancelled');
          this.closeDatepicker();
        }
      },
      closeDatepicker: function closeDatepicker() {
        if (this.inline) {
          return
        }
        this.showDatepicker = false;
        this.triggerElement.classList.remove('datepicker-open');
        this.$emit('closed');
      },
      apply: function apply() {
        this.$emit('apply');
        this.closeDatepicker();
      },
      positionDatepicker: function positionDatepicker() {
        var triggerWrapperElement = findAncestor(this.triggerElement, '.datepicker-trigger');
        this.triggerPosition = this.triggerElement.getBoundingClientRect();
        if (triggerWrapperElement) {
          this.triggerWrapperPosition = triggerWrapperElement.getBoundingClientRect();
        } else {
          this.triggerWrapperPosition = { left: 0, right: 0 };
        }

        var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
        this.viewportWidth = viewportWidth + 'px';
        this.isMobile = viewportWidth < 768;
        this.isTablet = viewportWidth >= 768 && viewportWidth <= 1024;
        this.showMonths = this.isMobile
          ? 1
          : this.isTablet && this.monthsToShow > 2 ? 2 : this.monthsToShow;

        this.$nextTick(function() {
          var datepickerWrapper = document.getElementById(this.wrapperId);
          if (!this.triggerElement || !datepickerWrapper) {
            return
          }

          var rightPosition =
            this.triggerElement.getBoundingClientRect().left +
            datepickerWrapper.getBoundingClientRect().width;
          this.alignRight = rightPosition > viewportWidth;
        });
      },
    },
  }

  var ClickOutside = {
    bind: function (el, binding, vnode) {
      el.event = function (event) {
        if (!(el === event.target || el.contains(event.target))) {
          vnode.context[binding.expression](event);
        }
      };

      document.body.addEventListener('click', el.event);
      document.body.addEventListener('touchstart', el.event);
    },
    unbind: function (el) {
      document.body.removeEventListener('click', el.event);
      document.body.removeEventListener('touchstart', el.event);
    }
  };

  var AirbnbStyleDatepickerPlugin = {
    install: function install(Vue, options) {
      Vue.directive('click-outside', ClickOutside);
      Vue.component(AirbnbStyleDatepicker.name, Object.assign({}, options, AirbnbStyleDatepicker));
    }

  }; // User has to install the component by themselves, to allow to pass options

  if (typeof window !== 'undefined' && window.Vue) {
    window.AirbnbStyleDatepicker = AirbnbStyleDatepickerPlugin;
  }

  return AirbnbStyleDatepickerPlugin;

})));
