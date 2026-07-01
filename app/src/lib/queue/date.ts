export const toDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getTodayValue = () => toDateValue(new Date());

export const getTomorrowValue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateValue(date);
};

export const getDayBounds = (dateValue = getTodayValue()) => {
  const start = new Date(`${dateValue}T00:00:00+07:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const createDateTime = (dateValue: string, timeValue: string) =>
  new Date(`${dateValue}T${timeValue}:00+07:00`);

export const formatThaiTime = (date: Date) =>
  new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(date);
