/**
 * A utility function that conditionally exposes functions for testing.
 * This function automatically handles TypeScript typing by returning an object
 * with the same interface as the input, but only in test environments.
 */
export function exposeForTesting<T extends Record<string, any>>(
    testFunctions: T
): T {
    // In test environment, return the actual functions
    if (Bun.env.BUN_ENV === 'test') {
        return { ...testFunctions };
    }

    // In non-test environments, return a proxy that throws helpful errors
    return new Proxy({} as T, {
        get(_, prop) {
            if (typeof prop === 'string') {
                return function testOnlyFunction() {
                    throw new Error(
                        `Function ${String(prop)} is only available in test environments.`
                    );
                };
            }
            return undefined;
        }
    });
}
