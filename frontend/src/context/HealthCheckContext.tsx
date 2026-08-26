import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

interface HealthCheckContextValue {
    isBackendUp: boolean;
}

const HealthCheckContext = createContext<HealthCheckContextValue>({
    isBackendUp: true,
});

export function useHealthCheck() {
    return useContext(HealthCheckContext);
}

const HEALTH_URL = `${import.meta.env.VITE_API_BASE_URL}/health`;
const RETRY_INTERVAL = 10; // seconds

export function HealthCheckProvider({ children }: { children: ReactNode }) {
    const [isBackendUp, setIsBackendUp] = useState(true);
    const [initialChecking, setInitialChecking] = useState(true);
    const [countdown, setCountdown] = useState(RETRY_INTERVAL);
    const location = useLocation();
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
    }, []);

    const checkHealth = useCallback(async () => {
        try {
            const res = await axios.get(HEALTH_URL, { timeout: 5000 });
            if (res.status === 200) {
                setIsBackendUp(true);
                setInitialChecking(false);
                clearTimers();
                return true;
            }
        } catch {
            // backend unreachable
        }
        setIsBackendUp(false);
        setInitialChecking(false);
        return false;
    }, [clearTimers]);

    const startRetryCountdown = useCallback(() => {
        clearTimers();
        setCountdown(RETRY_INTERVAL);

        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        retryTimerRef.current = setTimeout(async () => {
            const ok = await checkHealth();
            if (!ok) {
                startRetryCountdown();
            }
        }, RETRY_INTERVAL * 1000);
    }, [checkHealth, clearTimers]);

    // Check health on every route change
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const ok = await checkHealth();
            if (!cancelled && !ok) {
                startRetryCountdown();
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Clean up timers on unmount
    useEffect(() => {
        return () => clearTimers();
    }, [clearTimers]);

    const handleRetryNow = async () => {
        clearTimers();
        setCountdown(RETRY_INTERVAL);
        const ok = await checkHealth();
        if (!ok) {
            startRetryCountdown();
        }
    };

    // Don't block render on first load while checking
    if (initialChecking) {
        return (
            <div style={overlayStyles}>
                <div style={cardStyles}>
                    <div style={spinnerContainerStyles}>
                        <div style={spinnerStyles} />
                    </div>
                    <h2 style={titleStyles}>Connecting to Server</h2>
                    <p style={subtitleStyles}>Checking backend availability…</p>
                </div>
            </div>
        );
    }

    return (
        <HealthCheckContext.Provider value={{ isBackendUp }}>
            {!isBackendUp && (
                <div style={overlayStyles}>
                    <div style={cardStyles}>
                        <div style={iconContainerStyles}>
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 style={titleStyles}>Connecting to Backend</h2>
                        <p style={subtitleStyles}>
                            The server is currently unreachable. Retrying
                            automatically…
                        </p>
                        <div style={countdownContainerStyles}>
                            <div style={countdownCircleStyles}>
                                <svg
                                    width="80"
                                    height="80"
                                    viewBox="0 0 80 80"
                                >
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="34"
                                        fill="none"
                                        stroke="#e2e8f0"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="34"
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 34}`}
                                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdown / RETRY_INTERVAL)}`}
                                        style={{
                                            transition:
                                                "stroke-dashoffset 1s linear",
                                            transform: "rotate(-90deg)",
                                            transformOrigin: "center",
                                        }}
                                    />
                                </svg>
                                <span style={countdownNumberStyles}>
                                    {countdown}
                                </span>
                            </div>
                            <p style={countdownLabelStyles}>
                                Retrying in {countdown}s
                            </p>
                        </div>
                        <button
                            onClick={handleRetryNow}
                            style={retryButtonStyles}
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.background =
                                    "#4f46e5";
                                (e.target as HTMLButtonElement).style.transform =
                                    "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.background =
                                    "#6366f1";
                                (e.target as HTMLButtonElement).style.transform =
                                    "translateY(0)";
                            }}
                        >
                            Retry Now
                        </button>
                    </div>
                </div>
            )}
            {children}
        </HealthCheckContext.Provider>
    );
}

/* ── Inline styles ── */

const overlayStyles: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
};

const cardStyles: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "40px 48px",
    textAlign: "center",
    boxShadow:
        "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
    maxWidth: "420px",
    width: "90%",
    animation: "healthFadeIn 0.3s ease-out",
};

const iconContainerStyles: React.CSSProperties = {
    marginBottom: "16px",
};

const spinnerContainerStyles: React.CSSProperties = {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
};

const spinnerStyles: React.CSSProperties = {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "healthSpin 0.8s linear infinite",
};

const titleStyles: React.CSSProperties = {
    margin: "0 0 8px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f172a",
};

const subtitleStyles: React.CSSProperties = {
    margin: "0 0 24px",
    fontSize: "14px",
    color: "#64748b",
    lineHeight: 1.5,
};

const countdownContainerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "24px",
};

const countdownCircleStyles: React.CSSProperties = {
    position: "relative",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const countdownNumberStyles: React.CSSProperties = {
    position: "absolute",
    fontSize: "24px",
    fontWeight: 700,
    color: "#6366f1",
};

const countdownLabelStyles: React.CSSProperties = {
    marginTop: "8px",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: 500,
};

const retryButtonStyles: React.CSSProperties = {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 28px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
};

/* Inject keyframe animations */
if (typeof document !== "undefined") {
    const styleId = "health-check-keyframes";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            @keyframes healthSpin {
                to { transform: rotate(360deg); }
            }
            @keyframes healthFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}
