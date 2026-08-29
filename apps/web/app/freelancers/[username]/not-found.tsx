import Link from 'next/link';

export default function FreelancerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Freelancer Not Found</h1>
      <p className="text-gray-600 mb-6">
        The freelancer you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/freelancers"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Browse Freelancers
      </Link>
    </div>
  );
}
