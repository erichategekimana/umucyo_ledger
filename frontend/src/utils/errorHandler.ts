import { AxiosError } from 'axios';

/**
 * Parses an error object (typically an AxiosError) and returns a clean, 
 * user-friendly error string.
 * 
 * Handles:
 * 1. Network Errors (no response)
 * 2. Generic string errors (e.g. { "detail": "Incorrect login" })
 * 3. Field-level DRF validation errors (e.g. { "phone_number": ["User already exists."] })
 * 4. Fallback messages for unknown errors.
 */
export const handleApiError = (error: unknown, fallbackMessage: string = 'An unexpected error occurred.'): string => {
  if (!error) return fallbackMessage;

  // Type narrow to AxiosError if it is one
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<any>;

    // 1. Network error (backend is unreachable)
    if (!axiosError.response) {
      if (axiosError.request) {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      return axiosError.message || fallbackMessage;
    }

    const { data, status } = axiosError.response;

    // 500+ Internal Server Errors
    if (status >= 500) {
      return 'The server encountered an internal error. Please try again later.';
    }

    // Attempt to parse the response data
    if (data) {
      // 2. Generic string error provided by API (e.g., detail, error, message)
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;

      // 3. Field-level validation errors (usually an object with arrays of strings)
      if (typeof data === 'object' && !Array.isArray(data)) {
        const errorMessages: string[] = [];
        
        for (const [field, messages] of Object.entries(data)) {
          // Format field name: 'phone_number' -> 'Phone Number'
          const formattedField = field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());

          if (Array.isArray(messages)) {
            errorMessages.push(`${formattedField}: ${messages.join(' ')}`);
          } else if (typeof messages === 'string') {
            errorMessages.push(`${formattedField}: ${messages}`);
          }
        }

        if (errorMessages.length > 0) {
          return errorMessages.join(' | ');
        }
      }
    }
  } else if (error instanceof Error) {
    return error.message;
  }

  // 4. Fallback
  return fallbackMessage;
};
