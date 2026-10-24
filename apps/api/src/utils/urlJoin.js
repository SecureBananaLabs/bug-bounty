/**
 * Safely joins URL path segments and normalizes duplicate slashes without breaking protocol schemes.
 * Optionally appends structured query parameters with RFC 3986 encoding.
 * 
 * @param {...(string|Object)} parts - URL path strings, optionally ending with a query params object.
 * @returns {string} Clean, normalized URL string.
 */
export function urlJoin(...parts) {
  if (parts.length === 0) {
    return '';
  }

  let params = null;
  const pathParts = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === parts.length - 1 && part !== null && typeof part === 'object' && !Array.isArray(part)) {
      params = part;
    } else if (typeof part === 'string') {
      const trimmed = part.trim();
      if (trimmed) {
        pathParts.push(trimmed);
      }
    }
  }

  if (pathParts.length === 0) {
    return '';
  }

  // Preserve protocol (e.g., "https://") if present on first part
  let url = pathParts[0];
  for (let i = 1; i < pathParts.length; i++) {
    const segment = pathParts[i];
    url = url.replace(/\/+$/, '') + '/' + segment.replace(/^\/+/, '');
  }

  // Normalize duplicate slashes inside the path (excluding protocol double slash)
  url = url.replace(/(https?:\/\/)|(\/)+/g, (match, protocol) => {
    return protocol ? protocol : '/';
  });

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== null && val !== undefined) {
        if (Array.isArray(val)) {
          for (const item of val) {
            if (item !== null && item !== undefined) {
              searchParams.append(key, String(item));
            }
          }
        } else {
          searchParams.append(key, String(val));
        }
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return url;
}

export default urlJoin;
