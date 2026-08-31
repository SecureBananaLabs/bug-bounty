/**
 * Delay utility for async timing.
 * Returns a Promise that resolves after the specified number of milliseconds.
 */

/**
 * Delays execution for a given duration.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {*} [value] The value to resolve the Promise with.
 * @returns {Promise<*>} Returns a Promise resolving after the specified delay.
 */
export function delay(wait = 0, value = undefined) {
    const ms = Math.max(0, Number(wait) || 0);
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), ms);
    });
}