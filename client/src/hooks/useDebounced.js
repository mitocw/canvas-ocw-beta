import { useDebouncedCallback } from 'use-debounce';

export default function useDebounced(func: any) {
    const debounceDelay = 10;

    return useDebouncedCallback(func, debounceDelay);
}
