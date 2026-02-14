export default class HttpBase {

    private static activeRequestCount = 0;
    private static loadingListeners = new Set<(loading: boolean, activeRequestCount: number) => void>();
    private static networkErrorListeners = new Set<(error: unknown) => void>();
    private static networkRecoveredListeners = new Set<() => void>();

    static subscribeNetworkLoading(listener: (loading: boolean, activeRequestCount: number) => void): () => void {
        HttpBase.loadingListeners.add(listener);
        listener(HttpBase.activeRequestCount > 0, HttpBase.activeRequestCount);
        return () => {
            HttpBase.loadingListeners.delete(listener);
        };
    }

    static subscribeNetworkErrors(listener: (error: unknown) => void): () => void {
        HttpBase.networkErrorListeners.add(listener);
        return () => {
            HttpBase.networkErrorListeners.delete(listener);
        };
    }

    static subscribeNetworkRecovered(listener: () => void): () => void {
        HttpBase.networkRecoveredListeners.add(listener);
        return () => {
            HttpBase.networkRecoveredListeners.delete(listener);
        };
    }

    private static notifyLoadingListeners() {
        const loading = HttpBase.activeRequestCount > 0;
        for (const listener of HttpBase.loadingListeners) {
            listener(loading, HttpBase.activeRequestCount);
        }
    }

    private static beginRequest() {
        HttpBase.activeRequestCount += 1;
        HttpBase.notifyLoadingListeners();
    }

    private static endRequest() {
        HttpBase.activeRequestCount = Math.max(0, HttpBase.activeRequestCount - 1);
        HttpBase.notifyLoadingListeners();
    }

    private static notifyNetworkError(error: unknown) {
        for (const listener of HttpBase.networkErrorListeners) {
            listener(error);
        }
    }

    private static notifyNetworkRecovered() {
        for (const listener of HttpBase.networkRecoveredListeners) {
            listener();
        }
    }

    private static isLikelyNetworkError(error: unknown): boolean {
        if (error instanceof TypeError) return true;
        const text = String((error as any)?.message || error || "").toLowerCase();
        return text.includes("failed to fetch") || text.includes("network") || text.includes("fetch");
    }

    get baseUrl() {
        return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    }

    requestOptions() {
        return { headers: {
            "Content-Type": "application/json"
        } };
    }

    async handleResponse(response: Promise<Response>): Promise<any> {
        return new Promise<any>(async (resolve,reject) => {
            try {
                let res = await response;
                let body = null;
                try { body = await res.json(); }
                catch (e) { body = null; }
                if (!res.status || res.status >= 400) {
                    let error = body?.error?.message || body?.message || body;
                    reject(JSON.stringify(error) || "HTTP error")
                }
                resolve(body);
            } catch (e) {
                reject(e);
            }
        })
    }

    private async request(path: string, options: RequestInit = {}): Promise<any> {
        HttpBase.beginRequest();
        try {
            const result = await this.handleResponse(fetch(this.baseUrl + path, {
                ...this.requestOptions(),
                ...options,
            }));
            HttpBase.notifyNetworkRecovered();
            return result;
        } catch (error) {
            if (HttpBase.isLikelyNetworkError(error)) {
                HttpBase.notifyNetworkError(error);
            }
            throw error;
        } finally {
            HttpBase.endRequest();
        }
    }

    async get(path: string): Promise<any> {
        return this.request(path);
    }

    async post(path: string, body: any): Promise<any> {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(path: string, body: any): Promise<any> {
        return this.request(path, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async delete(path: string): Promise<any> {
        return this.request(path, {
            method: 'DELETE'
        });
    }

}
