import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import FlashError, { FlashErrorType } from '../components/FlashError';

interface FlashErrorData {
  id: string;
  message: string;
  type: FlashErrorType;
  duration: number | undefined;
}

interface FlashErrorContextType {
  showError: (message: string, type?: FlashErrorType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
}

const FlashErrorContext = createContext<FlashErrorContextType | undefined>(undefined);

interface FlashErrorProviderProps {
  children: ReactNode;
}

export const FlashErrorProvider: React.FC<FlashErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<FlashErrorData[]>([]);

  const showError = useCallback((message: string, type: FlashErrorType = 'error', duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setErrors(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showError(message, 'success', duration);
  }, [showError]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showError(message, 'warning', duration);
  }, [showError]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showError(message, 'info', duration);
  }, [showError]);

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const value: FlashErrorContextType = {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearError,
    clearAllErrors,
  };

  return (
    <FlashErrorContext.Provider value={value}>
      {children}
      {/* Render all flash errors */}
      {errors.map((error, index) => (
        <FlashError
          key={error.id}
          message={error.message}
          type={error.type}
          duration={error.duration}
          onClose={() => clearError(error.id)}
          position={index === 0 ? 'bottom-right' : 'bottom-right'}
          show={true}
        />
      ))}
    </FlashErrorContext.Provider>
  );
};

export const useFlashError = (): FlashErrorContextType => {
  const context = useContext(FlashErrorContext);
  if (context === undefined) {
    throw new Error('useFlashError must be used within a FlashErrorProvider');
  }
  return context;
};
