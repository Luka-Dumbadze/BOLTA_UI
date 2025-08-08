// hooks/index.ts
// Custom hooks collection for improved functionality and performance

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus, Keyboard, KeyboardEvent } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  debounce, 
  throttle, 
  checkNetworkConnectivity, 
  safeJsonParse,
  MemoryCache,
  logger 
} from '../utils';
import { CACHE_CONFIG, NETWORK_CONFIG } from '../constants/Config';

// Re-export performance monitoring hooks
export { 
  usePerformanceMonitor, 
  useAsyncPerformanceMonitor, 
  useMemoryMonitor 
} from './usePerformanceMonitor';

// ========================================
// NETWORK & CONNECTIVITY HOOKS
// ========================================

/**
 * Hook for monitoring network connectivity
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckRef = useRef<number>(0);

  const checkConnection = useCallback(async () => {
    const now = Date.now();
    if (now - lastCheckRef.current < 5000) return; // Throttle checks to every 5 seconds
    
    setIsChecking(true);
    lastCheckRef.current = now;
    
    try {
      const online = await checkNetworkConnectivity();
      setIsOnline(online);
      logger.debug('Network status checked', { isOnline: online });
    } catch (error) {
      setIsOnline(false);
      logger.warn('Network check failed', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Throttled version for frequent calls
  const throttledCheck = useMemo(
    () => throttle(checkConnection, 5000),
    [checkConnection]
  );

  useEffect(() => {
    // Check immediately on mount
    checkConnection();

    // Set up periodic checks
    const interval = setInterval(checkConnection, NETWORK_CONFIG.OFFLINE_RETRY_INTERVAL);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isOnline,
    isChecking,
    checkConnection: throttledCheck,
  };
}

// ========================================
// APP STATE HOOKS
// ========================================

/**
 * Hook for monitoring app state changes
 */
export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');
  const lastStateChangeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const now = Date.now();
      const timeSinceLastChange = now - lastStateChangeRef.current;
      
      logger.debug('App state changed', {
        from: appState,
        to: nextAppState,
        timeSinceLastChange: `${timeSinceLastChange}ms`,
      });

      setAppState(nextAppState);
      setIsActive(nextAppState === 'active');
      lastStateChangeRef.current = now;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  return {
    appState,
    isActive,
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

/**
 * Hook for keyboard visibility
 */
export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      setIsVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  return {
    isVisible,
    keyboardHeight,
  };
}

// ========================================
// STORAGE HOOKS
// ========================================

/**
 * Hook for persistent storage with AsyncStorage
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = (value: string) => safeJsonParse(value, defaultValue),
  } = options;

  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        setIsLoading(true);
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          const value = deserialize(stored);
          setState(value);
        }
      } catch (err) {
        setError(err as Error);
        logger.error(`Failed to load persistent state for key: ${key}`, err);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, deserialize]);

  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce(async (value: T) => {
      try {
        await AsyncStorage.setItem(key, serialize(value));
        setError(null);
      } catch (err) {
        setError(err as Error);
        logger.error(`Failed to save persistent state for key: ${key}`, err);
      }
    }, 500),
    [key, serialize]
  );

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      debouncedSave(newValue);
      return newValue;
    });
  }, [debouncedSave]);

  const clearValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setState(defaultValue);
      setError(null);
    } catch (err) {
      setError(err as Error);
      logger.error(`Failed to clear persistent state for key: ${key}`, err);
    }
  }, [key, defaultValue]);

  return {
    value: state,
    setValue,
    clearValue,
    isLoading,
    error,
  };
}

// ========================================
// CACHING HOOKS
// ========================================

/**
 * Hook for in-memory caching with TTL
 */
export function useCache<T>(defaultTTL: number = CACHE_CONFIG.USER_CACHE_DURATION) {
  const cacheRef = useRef<MemoryCache<T>>(new MemoryCache<T>());

  const set = useCallback((key: string, data: T, ttl?: number) => {
    cacheRef.current.set(key, data, ttl || defaultTTL);
  }, [defaultTTL]);

  const get = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const has = useCallback((key: string) => {
    return cacheRef.current.has(key);
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const size = useCallback(() => {
    return cacheRef.current.size();
  }, []);

  return {
    set,
    get,
    has,
    clear,
    size,
  };
}

// ========================================
// FORM HOOKS
// ========================================

/**
 * Hook for form state management with validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validate = useCallback(() => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const [field, rule] of Object.entries(validationRules)) {
      const error = rule(values[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouched(allTouched);

    if (validate()) {
      try {
        await onSubmit(values);
      } catch (error) {
        logger.error('Form submission failed', error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validate]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setTouched,
    validate,
    reset,
    handleSubmit,
  };
}

// ========================================
// TIMER HOOKS
// ========================================

/**
 * Hook for countdown timer
 */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    setSeconds(newSeconds || initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, seconds]);

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    seconds,
    isActive,
    isFinished: seconds === 0,
    formattedTime: formatTime(seconds),
    start,
    pause,
    reset,
  };
}

// ========================================
// ASYNC HOOKS
// ========================================

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsync<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (...args: Args) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      logger.error('Async operation failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}