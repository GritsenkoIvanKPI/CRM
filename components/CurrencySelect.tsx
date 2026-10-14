import { CURRENCIES, CURRENCY_SYMBOLS, Currency } from "@/lib/currency";

export function CurrencySelect({
  value,
  onChange,
  label,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      title={label}
      className="input w-20 shrink-0"
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {CURRENCY_SYMBOLS[c]} {c}
        </option>
      ))}
    </select>
  );
}
