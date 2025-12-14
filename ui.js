import { getUserInfo, logout } from './auth.js';

export function showToast(message, type = 'success') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    if (type === 'error') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
    if (type === 'warning') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

export function renderNavigation() {
    // Don't render on Login page
    if (window.location.pathname.includes('login')) return;

    const path = window.location.pathname;
    const search = window.location.search;
    const { role, username } = getUserInfo();

    const sidebar = document.createElement('nav');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="brand mb-6 flex items-center gap-3 px-2">
            <img src="/assets/Helpers Logo (Dark).png" alt="HS Logo" class="w-10 h-10 object-contain" style="mix-blend-mode: screen;">
            <span class="font-bold text-lg tracking-tight text-white nav-text" style="opacity:0; transition: all 0.3s; transform: translateX(-10px);">Helpers System</span>
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-hide">
            
            <!-- 0. Overview (All Users) -->
            <a href="/admin.html?view=dashboard" class="nav-item ${path.includes('admin') && (!search.includes('view=') || search.includes('view=dashboard')) ? 'active' : ''}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                <span class="nav-text">Overview</span>
            </a>

            <!-- 1. Clients DB -->
            <a href="/clients.html" class="nav-item ${path.includes('clients') ? 'active' : ''}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span class="nav-text">Clients DB</span>
            </a>

            <!-- 2. Team Members (Admin Only) -->
            ${role === 'admin' ? `
            <a href="/admin.html?view=users" class="nav-item ${path.includes('admin') && search.includes('view=users') ? 'active' : ''}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                <span class="nav-text">Team Members</span>
            </a>` : ''}
            
            <!-- 3. Invoices Archive -->
            <a href="/history.html" class="nav-item ${path.includes('history') ? 'active' : ''}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                <span class="nav-text">Invoices Archive</span>
            </a>

            <!-- 4. Settings (Admin Only) -->
            ${role === 'admin' ? `
            <a href="/admin.html?view=settings" class="nav-item ${path.includes('admin') && search.includes('view=settings') ? 'active' : ''}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span class="nav-text">Settings</span>
            </a>` : ''}

            <!-- 5. App Mode / New Invoice -->
             <a href="/" class="nav-item ${path === '/' || path.includes('index') ? 'active' : ''}">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span class="nav-text">Create Invoice</span>
            </a>

        </div>

        <div class="user-mini border-t border-white/10 pt-4 mt-auto w-full">
            <div class="flex items-center gap-3 px-2">
                <div class="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30 shrink-0">
                    ${(username || 'U')[0].toUpperCase()}
                </div>
                <div class="overflow-hidden">
                    <div class="font-semibold text-white truncate text-sm">${username || 'User'}</div>
                    <div class="text-xs text-indigo-300 cursor-pointer hover:text-white transition-colors" id="logoutBtn">Sign Out</div>
                </div>
            </div>
        </div>
    `;
    document.body.prepend(sidebar);

    // Bind Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Wrap main content
    const exisitingWrap = document.querySelector('.wrap') || document.querySelector('.max-w-6xl') || document.body;
    if (exisitingWrap && exisitingWrap !== document.body) {
        exisitingWrap.classList.add('content-area');
    }
}
