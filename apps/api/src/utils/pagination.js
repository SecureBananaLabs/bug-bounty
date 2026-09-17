export function parsePagination(query = {}, defaultTake = 20, maxTake = 50) {
  let take = defaultTake;
  let skip = 0;

  if (query.take !== undefined) {
    const parsedTake = parseInt(query.take, 10);
    if (!isNaN(parsedTake) && parsedTake > 0) {
      take = Math.min(parsedTake, maxTake);
    }
  } else if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      take = Math.min(parsedLimit, maxTake);
    }
  }

  if (query.skip !== undefined) {
    const parsedSkip = parseInt(query.skip, 10);
    if (!isNaN(parsedSkip) && parsedSkip >= 0) {
      skip = parsedSkip;
    }
  } else if (query.offset !== undefined) {
    const parsedOffset = parseInt(query.offset, 10);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      skip = parsedOffset;
    }
  }

  return { take, skip };
}
