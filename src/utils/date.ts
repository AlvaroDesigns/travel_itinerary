// Local date parser to avoid UTC timezone offsets
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 12, 0, 0);
  }
  return new Date(dateStr);
};

// Generate Date Range Days without timezone shifts
export const getDatesBetween = (startDate: string, endDate: string): string[] => {
  if (!startDate) return [];
  const dates: string[] = [];
  const curr = parseLocalDate(startDate);
  const last = parseLocalDate(endDate || startDate);
  if (isNaN(curr.getTime()) || isNaN(last.getTime())) return [startDate];
  while (curr <= last) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, "0");
    const day = String(curr.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates.length > 0 ? dates : [startDate];
};

export const getNextDateStr = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  const nextDate = new Date(Date.UTC(y, m - 1, d + 1));
  const ny = nextDate.getUTCFullYear();
  const nm = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
  const nd = String(nextDate.getUTCDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
};

export const getLanguageLocale = (language?: string): string => {
  switch (language) {
    case "en":
      return "en-US";
    case "fr":
      return "fr-FR";
    case "de":
      return "de-DE";
    case "it":
      return "it-IT";
    case "pt":
      return "pt-PT";
    case "es":
    default:
      return "es-ES";
  }
};

export const formatDayDate = (dateStr: string, dateFormat: string = "DD/MM/YYYY"): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  if (dateFormat === "MM/DD/YYYY") {
    return `${m}/${d}`;
  }
  if (dateFormat === "YYYY-MM-DD") {
    return `${m}-${d}`;
  }
  return `${d}/${m}`;
};

export const formatFullDate = (dateStr: string, dateFormat: string = "DD/MM/YYYY"): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  if (dateFormat === "MM/DD/YYYY") {
    return `${m}/${d}/${y}`;
  }
  if (dateFormat === "YYYY-MM-DD") {
    return `${y}-${m}-${d}`;
  }
  return `${d}/${m}/${y}`;
};

export const formatDayFullLabel = (
  dateStr: string,
  options?: { language?: string; dateFormat?: string }
): string => {
  try {
    const d = parseLocalDate(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const locale = getLanguageLocale(options?.language);
    const weekday = new Intl.DateTimeFormat(locale, {
      weekday: "long",
    }).format(d);
    const capitalizedWd = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const formattedDate = formatDayDate(dateStr, options?.dateFormat);
    return `${capitalizedWd}, ${formattedDate}`;
  } catch {
    return dateStr;
  }
};

export const getDayIndex = (dateStr: string, tripDates: string[]): number => {
  const idx = tripDates.indexOf(dateStr);
  return idx >= 0 ? idx + 1 : 1;
};
