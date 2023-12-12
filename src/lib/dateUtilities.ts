export function formatShortFinnishTime(date: string) {
  try {
    return new Date(date).toLocaleTimeString("fi-FI", {
      timeZone: "Europe/Helsinki",
      timeStyle: "short",
    });
  } catch (e) {
    return date;
  }
}
