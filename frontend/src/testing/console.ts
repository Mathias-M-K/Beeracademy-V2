/**
 * Mutes console output for the current test; restored by `vi.restoreAllMocks()`.
 * Returns the spies so a test can still assert on what was logged.
 */
export function silenceConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
  };
}
