import { apiCall } from './api.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    // Button Loading State
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    btn.disabled = true;

    try {
        // Direct fetch since apiCall handles token auth which we don't have yet.
        // But apiCall also handles errors.
        // Actually, for login, we don't need token headers.
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', data.email);
            localStorage.setItem('role', data.role);
            window.location.href = data.role === 'admin' ? '/admin.html' : '/';
        } else {
            errorMsg.querySelector('span').textContent = data.message;
            errorMsg.classList.remove('hidden');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        errorMsg.querySelector('span').textContent = 'Connection error';
        errorMsg.classList.remove('hidden');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
