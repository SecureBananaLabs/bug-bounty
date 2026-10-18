function throttle(fn, wait = 0, options = {}) {
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;
  let result = null;
  let lastCallTime = 0;

  const leading = options.leading !== false;
  const trailing = options.trailing !== false;

  function invoke() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    result = fn.apply(thisArg, args);
    return result;
  }

  function throttled(...args) {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = wait - (now - lastCallTime);

    if (remaining <= 0 || remaining > wait) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      return invoke();
    }

    if (!timerId && trailing) {
      timerId = setTimeout(() => {
        timerId = null;
        if (trailing && lastArgs) {
          invoke();
        }
      }, remaining);
    }

    return result;
  }

  throttled.cancel = function () {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  throttled.flush = function () {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
      if (lastArgs) {
        return invoke();
      }
    }
    return result;
  };

  throttled.pending = function () {
    return timerId !== null;
  };

  return throttled;
}

module.exports = { throttle };
