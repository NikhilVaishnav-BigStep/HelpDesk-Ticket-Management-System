import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { authApi } from "../api/authApi";
import type { User } from "../types/user.types";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);

interface AuthProviderProps {
    children: ReactNode;
}

const TOKEN_KEY = "helpdesk_token";
const USER_KEY = "helpdesk_user";

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem(TOKEN_KEY),
    );

    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem(USER_KEY);

        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser) as User;
        } catch {
            localStorage.removeItem(USER_KEY);
            return null;
        }
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            const result = await authApi.login({
                email,
                password,
            });

            localStorage.setItem(TOKEN_KEY, result.token);
            localStorage.setItem(USER_KEY, JSON.stringify(result.user));

            setToken(result.token);
            setUser(result.user);
        },
        [],
    );

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        setToken(null);
        setUser(null);
    }, []);

    const refreshUser = useCallback(() => {
        const storedUser = localStorage.getItem(USER_KEY);

        if (!storedUser) {
            setUser(null);
            return;
        }

        try {
            setUser(JSON.parse(storedUser) as User);
        } catch {
            localStorage.removeItem(USER_KEY);
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: Boolean(token && user),
            isLoading,
            login,
            logout,
            refreshUser,
        }),
        [user, token, isLoading, login, logout, refreshUser],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}