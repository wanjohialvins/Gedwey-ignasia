const weekdaysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthsLong = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const monthsShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function toDate(d: Date | string | number | undefined | null): Date | null {
  if (!d) return null;
  const dateObj = typeof d === 'object' ? d : new Date(d);
  return isNaN(dateObj.getTime()) ? null : dateObj;
}

export function formatLongDate(d: Date | string | number | undefined | null): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const w = weekdaysLong[dateObj.getDay()];
  const m = monthsLong[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${w}, ${m} ${day}, ${year}`;
}

export function formatShortDate(d: Date | string | number | undefined | null): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const m = monthsShort[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${m} ${day}, ${year}`;
}

export function formatMediumDate(d: Date | string | number | undefined | null): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const w = weekdaysLong[dateObj.getDay()];
  const m = monthsShort[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${w}, ${m} ${day}, ${year}`;
}

export function formatMonthDay(d: Date | string | number | undefined | null, monthStyle: 'long' | 'short' = 'long'): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const m = monthStyle === 'long' ? monthsLong[dateObj.getMonth()] : monthsShort[dateObj.getMonth()];
  const day = dateObj.getDate();
  return `${m} ${day}`;
}

export function formatMonthYear(d: Date | string | number | undefined | null): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const m = monthsLong[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${m} ${year}`;
}

export function formatWeekdayMonthDay(d: Date | string | number | undefined | null, monthStyle: 'long' | 'short' = 'long'): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const w = weekdaysLong[dateObj.getDay()];
  const m = monthStyle === 'long' ? monthsLong[dateObj.getMonth()] : monthsShort[dateObj.getMonth()];
  const day = dateObj.getDate();
  return `${w}, ${m} ${day}`;
}

export function formatDateTime(d: Date | string | number | undefined | null): string {
  const dateObj = toDate(d);
  if (!dateObj) return '';
  const m = monthsLong[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${m} ${day}, ${year} at ${hours12}:${minutesStr} ${ampm}`;
}
