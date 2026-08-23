import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("helpdesk_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("helpdesk_token");
            localStorage.removeItem("helpdesk_user");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login?session_expired=true";
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;