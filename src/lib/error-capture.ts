let lastCapturedError: Error | null = null;

export function captureError(error: unknown) {
  lastCapturedError = error instanceof Error ? error : new Error(String(error));
}

export function consumeLastCapturedError(): Error | null {
  const error = lastCapturedError;
  lastCapturedError = null;
  return error;
}
