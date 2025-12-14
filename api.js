export async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
        method,
        headers,
    };
    if (body) config.body = JSON.stringify(body);

    try {
        const res = await fetch(endpoint, config);

        if (res.status === 401) {
            // Unauthorized, redirect to login unless already there
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = '/login.html';
            }
            throw new Error('Unauthorized');
        }

        return res;
    } catch (e) {
        throw e;
    }
}
