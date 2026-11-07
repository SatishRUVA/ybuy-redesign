export function todayIso(date = new Date()): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function calendarDays(year: number, month: number): (string | null)[] {
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= count ? new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10) : null;
  });
}
