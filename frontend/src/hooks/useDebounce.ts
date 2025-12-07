import { useRef } from 'react';

/**
 * Hook personalizado para criar uma função debounced.
 *
 * @param callback A função a ser executada após o debounce.
 * @param delay O tempo de espera em milissegundos.
 * @returns Uma função que, quando chamada, executa o callback após o delay.
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
