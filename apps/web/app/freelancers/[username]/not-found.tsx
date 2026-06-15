import Link from 'next/link';

export default function FreelancerNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Freelancer Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          The freelancer you are looking for does not exist or may have been removed.
          Please check the URL or browse our available freelancers.
        </p>
        <Link
          href="/freelancers"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse Freelancers
        </Link>
      </div>
    </div>
  );
}
