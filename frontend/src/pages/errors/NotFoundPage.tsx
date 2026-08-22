import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <h1 className="text-4xl font-bold text-slate-900">404</h1>

                <h2 className="mt-3 text-xl font-semibold text-slate-800">
                    Page Not Found
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    The page you are looking for does not exist.
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}