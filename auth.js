export function checkAuth() {
    const token = localStorage.getItem('token');
    const path = window.location.pathname;

    // If no token and not on login page, redirect
    if ((!token || token === 'undefined') && !path.includes('login.html')) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

export function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

export function getUserInfo() {
    return {
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email')
    };
}
