/**
 * Debounce utility for rate limiting.
 * Delays invoking a function until after wait milliseconds have elapsed since the last time it was invoked.
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed since the last time the debounced function was invoked.
 * @param {Function} func The function to debounce
 * @param {number} wait The number of milliseconds to delay
 * @param {Object} [options] The options object
 * @param {boolean} [options.leading=false] Specify invoking on the leading edge of the timeout
 * @param {boolean} [options.trailing=true] Specify invoking on the trailing edge of the timeout
 * @returns {Function} The new debounced function
 */
export function debounce(func, wait, options = {}) {
    let timeoutId;
    let lastArgs;
    let lastThis;
    let lastCallTime;
    let lastInvokeTime = 0;

    const leading = !!options.leading;
    const trailing = "trailing" in options ? !!options.trailing : true;

    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        return func.apply(thisArg, args);
    }

    function leadingEdge(time) {
        lastInvokeTime = time;
        timeoutId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : undefined;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return timeWaiting;
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0
        );
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timeoutId = undefined;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return undefined;
    }

    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeoutId === undefined) {
                return leadingEdge(lastCallTime);
            }
        }
        if (timeoutId === undefined) {
            timeoutId = setTimeout(timerExpired, wait);
        }
        return undefined;
    }

    debounced.cancel = function () {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timeoutId = undefined;
    };

    debounced.flush = function () {
        return timeoutId === undefined ? undefined : trailingEdge(Date.now());
    };

    return debounced;
}