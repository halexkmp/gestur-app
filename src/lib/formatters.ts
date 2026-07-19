/**
 * Converts a "HH:MM:SS" (optionally with a trailing "Z") UTC wall-clock time
 * into the browser's local wall-clock time, for display in a plain
 * <input type="time">.
 */
export const utcTimeStringToLocal = (time: string): string => {
  const [hours, minutes, seconds = 0] = time.replace(/Z$/, '').split(':').map(Number);
  const reference = new Date();
  reference.setUTCHours(hours, minutes, seconds, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(reference.getHours())}:${pad(reference.getMinutes())}:${pad(reference.getSeconds())}`;
};

/**
 * Appends the browser's current UTC offset (e.g. "-03:00") to a local
 * "HH:MM:SS" wall-clock time, per specs/api/employees.md's PUT
 * /employees/lateness-config offset format.
 */
export const localTimeStringWithUtcOffset = (time: string): string => {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${time}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
};
