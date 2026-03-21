export function formatShortFinnishTime(date: string | number) {
  try {
    return new Date(date).toLocaleTimeString("fi-FI", {
      timeZone: "Europe/Helsinki",
      timeStyle: "short",
    });
  } catch (e) {
    return date;
  }
}
