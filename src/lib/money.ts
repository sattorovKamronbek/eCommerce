import { storeConfig } from "./config";
const formatter = new Intl.NumberFormat(storeConfig.locale, {
  maximumFractionDigits: 0,
});
export function formatMoney(amount: number) {
  return `${formatter.format(amount)} so‘m`;
}
