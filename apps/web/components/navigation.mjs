export const navigationLinks = [
  { href: "/", label: "Home", activePrefixes: ["/"] },
  { href: "/jobs", label: "Jobs", activePrefixes: ["/jobs"] },
  { href: "/freelancers/search", label: "Find Freelancers", activePrefixes: ["/freelancers"] },
  { href: "/dashboard/client", label: "Client Dashboard", activePrefixes: ["/dashboard/client"] },
  { href: "/dashboard/freelancer", label: "Freelancer Dashboard", activePrefixes: ["/dashboard/freelancer"] },
  { href: "/messaging", label: "Messaging", activePrefixes: ["/messaging"] },
  { href: "/admin", label: "Admin", activePrefixes: ["/admin"] }
];

export function isActiveNavigationLink(pathname, link) {
  if (link.href === "/") {
    return pathname === "/";
  }

  return pathname === link.href || link.activePrefixes.some((prefix) => pathname.startsWith(`${prefix}/`));
}
