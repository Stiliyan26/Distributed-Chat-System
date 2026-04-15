type MaybeApiError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};

export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const message = (error as MaybeApiError)?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return fallback;
}
