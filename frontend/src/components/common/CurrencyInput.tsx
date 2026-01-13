import { forwardRef } from "react";
import type { ChangeEvent, InputHTMLAttributes } from "react";
import { Input } from "./Input";

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  currency?: "BRL" | "USD" | "EUR";
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, currency = "BRL", onChange, value, ...props }, ref) => {
    const symbols = { BRL: "R$", USD: "$", EUR: "€" };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      const numberValue = parseInt(rawValue || "0") / 100;
      onChange?.(numberValue);
    };

    const formatValue = (
      val: string | number | readonly string[] | undefined
    ) => {
      if (val === undefined || val === null) return "";
      const raw = Array.isArray(val) ? val[0] : val;
      const num =
        typeof raw === "string" ? Number(raw.replace(",", ".")) : Number(raw);
      if (!Number.isFinite(num)) {
        return "";
      }
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {symbols[currency]}
          </span>
          <Input
            ref={ref}
            type="text"
            value={formatValue(value)}
            onChange={handleChange}
            className="pl-12"
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
