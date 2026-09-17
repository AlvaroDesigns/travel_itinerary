// Dynamic Currency & Price Formatters
export const getCurrencySymbol = (currency: string = "EUR"): string => {
  switch (currency) {
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "EUR":
    default:
      return "€";
  }
};

export const formatPrice = (
  amount?: number | string | null,
  currency: string = "EUR"
): string => {
  if (amount === undefined || amount === null || amount === "") return "";
  const num = Number(amount);
  const displayNum = isNaN(num) ? amount : num.toLocaleString();
  if (currency === "USD") return `$ ${displayNum}`;
  if (currency === "GBP") return `£ ${displayNum}`;
  return `${displayNum} €`;
};
