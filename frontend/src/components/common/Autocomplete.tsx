// src/components/common/Autocomplete.tsx

import { useState, useRef, useEffect } from "react";
import { Input } from "./Input";
import { Text } from "./Text";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

interface AutocompleteOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface AutocompleteProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  isLoading?: boolean;
  error?: string;
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  emptyMessage?: string;
}

export function Autocomplete({
  label,
  required,
  placeholder,
  value,
  searchValue,
  onSearchChange,
  onChange,
  options,
  isLoading,
  error,
  renderOption,
  emptyMessage = "Nenhum resultado encontrado",
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll automático para o item focado
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[
        focusedIndex
      ] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [focusedIndex]);

  const handleInputChange = (value: string) => {
    onSearchChange(value);
    setIsOpen(true);
    setFocusedIndex(-1);
  };

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    const selectedOption = options.find((opt) => opt.value === optionValue);
    // CORREÇÃO: Apenas limpa se for uma seleção real (não quando usado para adicionar à lista)
    if (value) {
      onSearchChange(selectedOption?.label || "");
    } else {
      // Para casos de adicionar à lista (value vazio), limpa o input
      onSearchChange("");
    }
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && options[focusedIndex]) {
          handleSelectOption(options[focusedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const displayValue = searchValue;

  return (
    <div ref={containerRef} className="relative">
      <Input
        label={label}
        required={required}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        error={error}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : options.length === 0 ? (
            <div className="p-4 text-center">
              <Text variant="caption" className="text-gray-500">
                {emptyMessage}
              </Text>
            </div>
          ) : (
            <ul ref={listRef} role="listbox" className="py-1">
              {options.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={cn(
                    "px-4 py-2 cursor-pointer transition-colors",
                    "hover:bg-blue-50",
                    focusedIndex === index && "bg-blue-50",
                    value === option.value && "bg-blue-100 font-semibold"
                  )}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <div>
                      <Text variant="caption">{option.label}</Text>
                      {option.description && (
                        <Text className="text-xs text-gray-500">
                          {option.description}
                        </Text>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
