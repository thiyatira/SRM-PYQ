import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-neutral-900 px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Page not found</h1>
      <p className="max-w-md text-gray-600 dark:text-gray-400">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
      >
        Back to SRM StudyHub
      </Link>
    </main>
  );
}
