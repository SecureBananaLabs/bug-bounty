/**
 * Resolve a freelancer by exact username from a provided list.
 *
 * Keeping the lookup in a standalone helper lets the route and the test share
 * the same implementation instead of duplicating the search logic.
 */
export function findFreelancerByUsername(freelancers, username) {
  if (!Array.isArray(freelancers) || typeof username !== "string" || username.length === 0) {
    return null;
  }

  return freelancers.find((freelancer) => freelancer.username === username) || null;
}
