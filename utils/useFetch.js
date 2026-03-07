import { useState, useRef, useCallback } from "react";


export default function useFetch() {
    const [data, setData] = useState([]);
    const abortControllerRef = useRef(null);

    const getRequest = useCallback(async (url, language) => {
        try {
            // Cancel previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`, {
                method: "GET",
                credentials: "include",
                signal: abortControllerRef.current.signal, // Add abort signal
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    'Accept-Language': language,
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const responseData = await res.json();
            setData(responseData);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.log('Fetch error:', err);
                setData([]); // Reset data on error
            }
        } finally {
            abortControllerRef.current = null;
        }
    }, []);

    // Cleanup function to cancel pending requests
    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return {
        getRequest,
        data,
        cleanup
    };
}