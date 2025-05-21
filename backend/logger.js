export const formatDate = (date) => {
  return date
    .toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "");
};

export const log = (operation, message) => {
  const timestamp = formatDate(new Date());
  console.log(`[${timestamp}] [${operation}] ${message}`);
};
