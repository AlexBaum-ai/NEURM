# Error Handling Quick Reference

## Error Pages

### Navigate to Error Pages

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Server Error (500)
navigate('/error');

// Maintenance (503)
navigate('/maintenance');

// Offline
navigate('/offline');

// Not Found (404) - automatic for invalid routes
navigate('/invalid-route');
```

### Custom Error Page Props

```tsx
import ServerErrorPage from '@/pages/ServerErrorPage';

<ServerErrorPage
  errorCode={503}
  errorMessage="Service temporarily unavailable"
  showRetry={true}
  onRetry={async () => {
    // Custom retry logic
  }}
/>
```

---

## Error Boundaries

### Basic Usage

```tsx
import { ErrorBoundaryWithRetry } from '@/components/common/ErrorBoundary';

<ErrorBoundaryWithRetry maxRetries={3}>
  <YourComponent />
</ErrorBoundaryWithRetry>
```

### With Custom Fallback

```tsx
import { ErrorBoundaryWithRetry, ErrorFallbackProps } from '@/components/common/ErrorBoundary';

const CustomFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div>
    <h1>Custom Error UI</h1>
    <p>{error.message}</p>
    <button onClick={resetError}>Retry</button>
  </div>
);

<ErrorBoundaryWithRetry
  maxRetries={2}
  fallback={CustomFallback}
  onReset={() => console.log('Boundary reset')}
>
  <YourComponent />
</ErrorBoundaryWithRetry>
```

---

## Network Error Handling

### Handle API Errors

```tsx
import { handleError } from '@/utils/errorHandling';

try {
  const response = await fetch('/api/data');
  const data = await response.json();
} catch (error) {
  const appError = handleError(error, 'Fetching data');
  // Error is automatically:
  // - Parsed and categorized
  // - Reported to Sentry
  // - Shown as toast notification
}
```

### Retry with Exponential Backoff

```tsx
import { retryWithBackoff } from '@/utils/errorHandling';

const data = await retryWithBackoff(
  () => fetchData(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}`, error);
    },
  }
);
```

### Check Network Status

```tsx
import { isOnline, waitForOnline } from '@/utils/errorHandling';

// Check if online
if (isOnline()) {
  // Proceed with request
}

// Wait for connection
try {
  await waitForOnline(30000); // Wait up to 30 seconds
  // Connection restored, retry request
} catch (error) {
  // Timeout - still offline
}
```

---

## Form Error Handling

### Handle Form Submission

```tsx
import { handleFormSubmission } from '@/utils/formErrorHandling';

const onSubmit = async (data: FormData) => {
  const result = await handleFormSubmission(
    () => api.submitForm(data),
    {
      successMessage: 'Form submitted successfully!',
      showSuccessToast: true,
      onSuccess: (responseData) => {
        navigate('/success');
      },
      onError: (error) => {
        console.error('Submission failed:', error);
      },
    }
  );

  // Check result
  if (!result.success) {
    console.log('Error:', result.error);
    console.log('Field errors:', result.fieldErrors);
  }
};
```

### Apply Field Errors to React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { handleFormSubmission, applyFieldErrors } from '@/utils/formErrorHandling';

const { setError } = useForm();

const onSubmit = async (data: FormData) => {
  const result = await handleFormSubmission(
    () => api.submitForm(data),
    { successMessage: 'Success!' }
  );

  // Apply field errors
  if (!result.success && result.fieldErrors) {
    applyFieldErrors(result.fieldErrors, setError);
  }
};
```

### Prevent Double Submit

```tsx
import { createDebouncedSubmit } from '@/utils/formErrorHandling';

const debouncedSubmit = createDebouncedSubmit(
  () => api.submitForm(data),
  300 // 300ms delay
);

// Use in your form
const handleSubmit = async () => {
  const result = await debouncedSubmit();
  if (result) {
    // Success
  }
};
```

### Auto-Save Form

```tsx
import { createAutoSaveHandler } from '@/utils/formErrorHandling';

const autoSave = createAutoSaveHandler(
  (data) => api.saveDraft(data),
  2000 // Save after 2 seconds of inactivity
);

// Use with form watch
const formData = watch();
useEffect(() => {
  autoSave(formData);
}, [formData]);
```

---

## Error Types & Severity

### Error Types

```tsx
import { ErrorType } from '@/utils/errorHandling';

ErrorType.NETWORK        // Connection issues
ErrorType.VALIDATION     // Form validation errors
ErrorType.AUTHENTICATION // Login/session errors
ErrorType.AUTHORIZATION  // Permission errors
ErrorType.NOT_FOUND      // 404 errors
ErrorType.SERVER         // 5xx server errors
ErrorType.CLIENT         // 4xx client errors
ErrorType.UNKNOWN        // Unclassified errors
```

### Error Severity

```tsx
import { ErrorSeverity } from '@/utils/errorHandling';

ErrorSeverity.LOW       // Minor issues, warnings
ErrorSeverity.MEDIUM    // Standard errors
ErrorSeverity.HIGH      // Significant functionality issues
ErrorSeverity.CRITICAL  // System-breaking errors
```

### Create Custom Error

```tsx
import { AppError, ErrorType, ErrorSeverity } from '@/utils/errorHandling';

const error = new AppError(
  'Failed to load user data',
  ErrorType.NETWORK,
  ErrorSeverity.HIGH,
  true, // isRetryable
  'Unable to load your profile. Please try again.',
  0, // statusCode
  { userId: 123 } // metadata
);

throw error;
```

---

## Toast Notifications

### Manual Error Toast

```tsx
import { showErrorToast } from '@/utils/errorHandling';
import { AppError, ErrorType, ErrorSeverity } from '@/utils/errorHandling';

const error = new AppError(
  'Operation failed',
  ErrorType.CLIENT,
  ErrorSeverity.MEDIUM,
  false,
  'Could not complete the operation. Please try again.'
);

showErrorToast(error);
```

### Manual Success Toast

```tsx
import { toast } from 'sonner';

toast.success('Operation completed successfully!');
toast.success('Saved!', { duration: 2000 });
```

---

## Testing Error Handling

### Trigger Error Boundary

```tsx
// Create a component that throws
const BrokenComponent = () => {
  throw new Error('Test error boundary');
  return <div>Never rendered</div>;
};

// Wrap with error boundary
<ErrorBoundaryWithRetry>
  <BrokenComponent />
</ErrorBoundaryWithRetry>
```

### Simulate Network Error

```tsx
// Force offline status
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false,
});

// Navigate to offline page
navigate('/offline');

// Restore online
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});
```

### Test Retry Logic

```tsx
import { retryWithBackoff } from '@/utils/errorHandling';

let attempts = 0;
const mockFetch = async () => {
  attempts++;
  if (attempts < 3) {
    throw new Error('Network error');
  }
  return { success: true };
};

const result = await retryWithBackoff(mockFetch, {
  maxRetries: 3,
  initialDelay: 100,
});

console.log('Attempts:', attempts); // Should be 3
console.log('Result:', result); // { success: true }
```

---

## Best Practices

### 1. Always Handle Errors

```tsx
// ❌ Bad: Unhandled errors
const data = await fetchData();

// ✅ Good: Properly handled
try {
  const data = await fetchData();
} catch (error) {
  handleError(error, 'Fetching data');
}
```

### 2. Use Appropriate Error Boundaries

```tsx
// ❌ Bad: No error boundary
<ComplexComponent />

// ✅ Good: Protected with boundary
<ErrorBoundaryWithRetry maxRetries={2}>
  <ComplexComponent />
</ErrorBoundaryWithRetry>
```

### 3. Provide User-Friendly Messages

```tsx
// ❌ Bad: Technical error message
throw new Error('ERR_NETWORK_CONNECTION_FAILED');

// ✅ Good: User-friendly message
throw new AppError(
  'ERR_NETWORK_CONNECTION_FAILED',
  ErrorType.NETWORK,
  ErrorSeverity.HIGH,
  true,
  'Unable to connect. Please check your internet connection.'
);
```

### 4. Apply Field Errors to Forms

```tsx
// ❌ Bad: Generic error message
toast.error('Validation failed');

// ✅ Good: Field-specific errors
if (result.fieldErrors) {
  applyFieldErrors(result.fieldErrors, setError);
}
```

### 5. Retry Retryable Errors

```tsx
// ❌ Bad: No retry for network errors
try {
  await fetchData();
} catch (error) {
  throw error;
}

// ✅ Good: Retry with backoff
const data = await retryWithBackoff(
  () => fetchData(),
  { maxRetries: 3 }
);
```

---

## Common Patterns

### Loading State with Error Handling

```tsx
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<AppError | null>(null);

const fetchData = async () => {
  setIsLoading(true);
  setError(null);

  try {
    const data = await retryWithBackoff(() => api.getData());
    // Success
  } catch (err) {
    const appError = handleError(err, 'Fetching data');
    setError(appError);
  } finally {
    setIsLoading(false);
  }
};
```

### Form with Validation

```tsx
const { register, handleSubmit, setError, formState: { errors } } = useForm();

const onSubmit = async (data: FormData) => {
  const result = await handleFormSubmission(
    () => api.submitForm(data),
    { successMessage: 'Form submitted!' }
  );

  if (!result.success && result.fieldErrors) {
    applyFieldErrors(result.fieldErrors, setError);
  } else if (result.success) {
    navigate('/success');
  }
};
```

### Optimistic Update

```tsx
import { submitWithOptimisticUpdate } from '@/utils/formErrorHandling';

const handleUpdate = async (newData: Data) => {
  const oldData = data;

  const result = await submitWithOptimisticUpdate(
    () => setData(newData),           // Optimistic update
    () => api.updateData(newData),     // API call
    () => setData(oldData),            // Rollback
    { successMessage: 'Updated!' }
  );

  if (!result.success) {
    // Handle error (rollback already done)
  }
};
```

---

## Troubleshooting

### Error Not Caught by Boundary

**Problem**: Error not caught by ErrorBoundary
**Solution**: Ensure error is thrown during render, not in event handlers

```tsx
// ❌ Won't be caught by boundary
const handleClick = () => {
  throw new Error('Error in handler');
};

// ✅ Will be caught by boundary
const Component = () => {
  throw new Error('Error in render');
  return <div>...</div>;
};

// ✅ For event handlers, use try-catch
const handleClick = () => {
  try {
    // Your code
  } catch (error) {
    handleError(error);
  }
};
```

### Toast Not Showing

**Problem**: Toast notification not appearing
**Solution**: Ensure sonner Toaster is mounted

```tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <YourApp />
    </>
  );
}
```

### Infinite Retry Loop

**Problem**: Retry mechanism never stops
**Solution**: Check shouldRetry function

```tsx
// ❌ Bad: Always retries
const data = await retryWithBackoff(
  () => fetchData(),
  {
    shouldRetry: () => true, // Will retry forever!
  }
);

// ✅ Good: Limited retries
const data = await retryWithBackoff(
  () => fetchData(),
  {
    maxRetries: 3,
    shouldRetry: (error, attempt) => {
      // Only retry network errors
      return isRetryableError(error) && attempt < 3;
    },
  }
);
```

---

## Additional Resources

- **Full Documentation**: `/frontend/SPRINT-14-009-ERROR-PAGES-SUMMARY.md`
- **Error Handling Utilities**: `/frontend/src/utils/errorHandling.ts`
- **Form Error Utilities**: `/frontend/src/utils/formErrorHandling.ts`
- **Error Boundary**: `/frontend/src/components/common/ErrorBoundary/`
- **Error Pages**: `/frontend/src/pages/`

---

**Last Updated**: November 6, 2025
**Sprint**: SPRINT-14-009
