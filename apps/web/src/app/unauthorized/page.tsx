'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <ShieldAlert className="h-16 w-16 text-red-500" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
          <h2 className="text-xl font-semibold text-gray-700">
            You don&apos;t have permission to access this page
          </h2>
          <p className="text-gray-600">
            This page is restricted to users with specific roles. If you believe you should have access, please contact your administrator.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
