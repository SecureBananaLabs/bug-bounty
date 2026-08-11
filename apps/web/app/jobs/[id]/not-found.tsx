import Link from 'next/link';

export default function JobNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Job Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        The job you are looking for does not exist or has been removed.
      </p>
      <Link
        href="/jobs"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Browse All Jobs
      </Link>
    </div>
  );
}
