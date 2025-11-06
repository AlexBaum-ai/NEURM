import toast from 'react-hot-toast';
import { AppError, ErrorType, ErrorSeverity, handleError } from './errorHandling';

/**
 * Form field error structure
 */
export interface FieldError {
  field: string;
  message: string;
  type?: string;
}

/**
 * Form submission result
 */
export interface FormSubmissionResult<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  fieldErrors?: FieldError[];
}

/**
 * Form submission options
 */
export interface FormSubmissionOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  transformErrors?: (data: any) => FieldError[];
}

/**
 * Parse validation errors from API response
 */
export function parseValidationErrors(errorData: any): FieldError[] {
  const errors: FieldError[] = [];

  if (!errorData) return errors;

  // Handle different error response formats
  if (errorData.errors && Array.isArray(errorData.errors)) {
    // Format: { errors: [{ field: 'email', message: 'Invalid email' }] }
    return errorData.errors.map((err: any) => ({
      field: err.field || err.path || 'unknown',
      message: err.message || 'Validation error',
      type: err.type || 'validation',
    }));
  }

  if (errorData.errors && typeof errorData.errors === 'object') {
    // Format: { errors: { email: 'Invalid email', password: 'Too short' } }
    return Object.entries(errorData.errors).map(([field, message]) => ({
      field,
      message: typeof message === 'string' ? message : String(message),
      type: 'validation',
    }));
  }

  if (errorData.fieldErrors && Array.isArray(errorData.fieldErrors)) {
    // Format: { fieldErrors: [...] }
    return errorData.fieldErrors;
  }

  // Zod error format
  if (errorData.issues && Array.isArray(errorData.issues)) {
    return errorData.issues.map((issue: any) => ({
      field: issue.path?.join('.') || 'unknown',
      message: issue.message,
      type: issue.code || 'validation',
    }));
  }

  return errors;
}

/**
 * Apply field errors to React Hook Form
 */
export function applyFieldErrors(
  fieldErrors: FieldError[],
  setError: (name: string, error: { type: string; message: string }) => void
): void {
  fieldErrors.forEach((error) => {
    setError(error.field, {
      type: error.type || 'validation',
      message: error.message,
    });
  });
}

/**
 * Handle form submission with comprehensive error handling
 */
export async function handleFormSubmission<T = any>(
  submitFn: () => Promise<T>,
  options: FormSubmissionOptions = {}
): Promise<FormSubmissionResult<T>> {
  const {
    showSuccessToast = true,
    successMessage = 'Success!',
    showErrorToast = true,
    onSuccess,
    onError,
    transformErrors,
  } = options;

  try {
    const data = await submitFn();

    // Show success toast
    if (showSuccessToast) {
      toast.success(successMessage);
    }

    // Call success callback
    onSuccess?.(data);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    // Parse error
    const appError = handleError(error, 'Form submission');

    // Parse field errors
    let fieldErrors: FieldError[] = [];
    if (error.response?.data) {
      fieldErrors = transformErrors
        ? transformErrors(error.response.data)
        : parseValidationErrors(error.response.data);
    }

    // Show error toast if enabled and no field errors
    if (showErrorToast && fieldErrors.length === 0) {
      toast.error(appError.userMessage);
    } else if (showErrorToast && fieldErrors.length > 0) {
      // Show validation error toast with field count
      toast.error(`Please fix ${fieldErrors.length} validation error${fieldErrors.length > 1 ? 's' : ''}`);
    }

    // Call error callback
    onError?.(appError);

    return {
      success: false,
      error: appError,
      fieldErrors,
    };
  }
}

/**
 * Hook for form submission with error handling (React Hook Form)
 */
export function useFormSubmissionHandler<T = any>(
  options: FormSubmissionOptions = {}
) {
  return async (
    submitFn: () => Promise<T>,
    setError?: (name: string, error: { type: string; message: string }) => void
  ): Promise<FormSubmissionResult<T>> => {
    const result = await handleFormSubmission(submitFn, options);

    // Apply field errors if setError is provided
    if (!result.success && result.fieldErrors && setError) {
      applyFieldErrors(result.fieldErrors, setError);
    }

    return result;
  };
}

/**
 * Display field error summary
 */
export function showFieldErrorsSummary(fieldErrors: FieldError[]): void {
  if (fieldErrors.length === 0) return;

  const errorMessage = fieldErrors
    .map((err) => `${err.field}: ${err.message}`)
    .slice(0, 3) // Show first 3 errors
    .join(', ');

  toast.error(`Validation Errors: ${errorMessage}${fieldErrors.length > 3 ? '...' : ''}`, {
    duration: 5000,
  });
}

/**
 * Get first error for a field
 */
export function getFieldError(
  fieldErrors: FieldError[],
  fieldName: string
): string | undefined {
  return fieldErrors.find((err) => err.field === fieldName)?.message;
}

/**
 * Check if field has error
 */
export function hasFieldError(fieldErrors: FieldError[], fieldName: string): boolean {
  return fieldErrors.some((err) => err.field === fieldName);
}

/**
 * Get all errors for a field (in case of multiple)
 */
export function getFieldErrors(
  fieldErrors: FieldError[],
  fieldName: string
): FieldError[] {
  return fieldErrors.filter((err) => err.field === fieldName);
}

/**
 * Create form error from validation error
 */
export function createValidationError(
  field: string,
  message: string
): AppError {
  return new AppError(
    `Validation error: ${field}`,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    false,
    message,
    400,
    { field }
  );
}

/**
 * Validate form before submission
 */
export async function validateBeforeSubmit<T>(
  validateFn: () => Promise<boolean>,
  submitFn: () => Promise<T>,
  onValidationError?: () => void
): Promise<T | null> {
  try {
    const isValid = await validateFn();

    if (!isValid) {
      onValidationError?.();
      toast.error('Please fix validation errors before submitting');
      return null;
    }

    return await submitFn();
  } catch (error) {
    handleError(error, 'Form validation');
    return null;
  }
}

/**
 * Debounced form submission (prevent double-submit)
 */
export function createDebouncedSubmit<T>(
  submitFn: () => Promise<T>,
  delay = 300
): () => Promise<T | null> {
  let timeoutId: number | null = null;
  let isSubmitting = false;

  return async (): Promise<T | null> => {
    // Prevent double submission
    if (isSubmitting) {
      toast('Please wait, your request is being processed...', { icon: '⏳' });
      return null;
    }

    // Clear existing timeout
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    // Debounce
    return new Promise((resolve) => {
      timeoutId = window.setTimeout(async () => {
        isSubmitting = true;
        try {
          const result = await submitFn();
          resolve(result);
        } catch (error) {
          handleError(error, 'Form submission');
          resolve(null);
        } finally {
          isSubmitting = false;
        }
      }, delay);
    });
  };
}

/**
 * Form submission with optimistic updates
 */
export async function submitWithOptimisticUpdate<T>(
  optimisticUpdateFn: () => void,
  submitFn: () => Promise<T>,
  rollbackFn: () => void,
  options: FormSubmissionOptions = {}
): Promise<FormSubmissionResult<T>> {
  // Apply optimistic update
  optimisticUpdateFn();

  try {
    const data = await submitFn();

    // Show success toast
    if (options.showSuccessToast !== false) {
      toast.success(options.successMessage || 'Success!');
    }

    // Call success callback
    options.onSuccess?.(data);

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    // Rollback optimistic update
    rollbackFn();

    // Handle error
    const appError = handleError(error, 'Form submission');

    // Call error callback
    options.onError?.(appError);

    return {
      success: false,
      error: appError,
    };
  }
}

/**
 * Auto-save form handler
 */
export function createAutoSaveHandler<T>(
  saveFn: (data: T) => Promise<void>,
  delay = 2000
): (data: T) => void {
  let timeoutId: number | null = null;
  let isSaving = false;

  return (data: T): void => {
    // Clear existing timeout
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    // Debounce save
    timeoutId = window.setTimeout(async () => {
      if (isSaving) return;

      isSaving = true;
      try {
        await saveFn(data);
        toast.success('Auto-saved', { duration: 1000 });
      } catch (error) {
        handleError(error, 'Auto-save');
      } finally {
        isSaving = false;
      }
    }, delay);
  };
}
