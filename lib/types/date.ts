const DATE_UNITS = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const relativeTime = (d1: Date, d2 = new Date()) => {
  var elapsed = d1 - d2;

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (let u in DATE_UNITS)
    if (Math.abs(elapsed) > DATE_UNITS[u] || u == "second")
      return rtf.format(Math.round(elapsed / DATE_UNITS[u]), u);
};
