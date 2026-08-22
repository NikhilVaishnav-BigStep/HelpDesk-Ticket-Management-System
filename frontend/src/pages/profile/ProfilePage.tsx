import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900">
                Profile
            </h1>

            <p className="mt-2 text-slate-600">
                {user?.name}
            </p>
        </div>
    );
}