export async function globalSearch(params) {
  const query = typeof params === "string" ? params : params?.q ?? "";
  const page = typeof params === "object" ? params.page ?? 1 : 1;
  const limit = typeof params === "object" ? params.limit ?? 10 : 10;

  return {
    query,
    page,
    limit,
    users: [],
    jobs: [],
    freelancers: []
  };
}
