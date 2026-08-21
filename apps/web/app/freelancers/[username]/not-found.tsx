import Link from "next/link";

export default function FreelancerNotFound() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Freelancer Not Found</h1>
      <p className="text-gray-600 mb-6">We couldn&apos;t find a freelancer with that username.</p>
      <Link href="/freelancers" className="text-blue-600 hover:underline">
        Browse all freelancers
      </Link>
    </div>
  );
}