import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/errorHelpers";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const sessionExpired =
        searchParams.get("session_expired") === "true";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError("");

        if (!email.trim() || !password) {
            setError("Email and password are required.");
            return;
        }

        setIsSubmitting(true);

        try {
            await login(email.trim(), password);
            navigate("/", { replace: true });
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                    Welcome back
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Sign in to manage your helpdesk account.
                </p>
            </div>
            {sessionExpired && !error && (
                <Alert variant="warning" className="mb-5">
                    Your session has expired. Please sign in again.
                </Alert>
            )}
            {error && (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                />

                <Input
                    id="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                />

                <Button
                    type="submit"
                    className="w-full"
                    loading={isSubmitting}
                >
                    Sign In
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-700"
                >
                    Create one
                </Link>
            </p>
        </AuthLayout>
    );
}