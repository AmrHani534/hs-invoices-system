import { apiCall } from './api.js';
import { showToast, renderNavigation } from './ui.js';
import { checkAuth, logout } from './auth.js';

const ADMIN_EMAIL = "amuhamed@helpers-tech.com";

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    renderNavigation();

    // Bind Global Functions for HTML interactions
    window.switchView = switchView;
    window.deleteUser = deleteUser;
    window.filterUsers = filterUsers;
    window.exportData = exportData;
    window.logout = logout;

    // Load Initial Data
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'dashboard';
    switchView(view);

    if (view === 'dashboard') loadDashboard();
    if (view === 'users') loadUsers();

    // Event Listeners
    setupEventListeners();

    // Init Profile
    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');
    const pEmail = document.getElementById('profileEmail');
    const pName = document.getElementById('profileName');
    if (pEmail) pEmail.value = email || '';
    if (pName) pName.value = username || '';
});

function setupEventListeners() {
    // Add User
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newEmail').value;
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;

            try {
                const res = await apiCall('/api/auth/register', 'POST', { email, username, password, role });
                if (res.ok) {
                    showToast("User created successfully");
                    e.target.reset();
                    loadUsers();
                    loadDashboard();
                } else {
                    const data = await res.json();
                    showToast(data.message || "Failed to create user", "error");
                }
            } catch (e) { showToast("Error creating user", "error"); }
        });
    }

    // Change Password
    const changePassForm = document.getElementById('changePassForm');
    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('oldPass').value;
            const newPassword = document.getElementById('newPass').value;

            try {
                const res = await apiCall('/api/auth/change-password', 'PUT', { oldPassword, newPassword });
                const data = await res.json();
                if (res.ok) {
                    showToast("Password updated");
                    e.target.reset();
                } else {
                    showToast(data.message || "Failed", "error");
                }
            } catch (err) {
                showToast("Request failed", "error");
            }
        });
    }

    // Invoice Config
    const invoiceConfigForm = document.getElementById('invoiceConfigForm');
    if (invoiceConfigForm) {
        invoiceConfigForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const yearMonth = document.getElementById('configYearMonth').value;
            const nextSeq = document.getElementById('configSeq').value;

            if (!confirm(`Are you sure you want to set the counter for ${yearMonth} to start at ${nextSeq}?`)) return;

            try {
                const res = await apiCall('/api/settings/counter', 'PUT', { yearMonth, nextSeq });
                const data = await res.json();
                showToast(data.message);
            } catch (e) { showToast("Failed to update counter", "error"); }
        });
    }

    // Profile Update
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;

            try {
                const res = await apiCall('/api/auth/profile', 'PUT', { username, email });
                const data = await res.json();

                if (res.ok) {
                    showToast("Profile updated");
                    localStorage.setItem('email', data.user.email);
                    localStorage.setItem('username', data.user.username);
                } else {
                    showToast(data.message || "Update failed", "error");
                }
            } catch (e) {
                showToast("Update failed", "error");
            }
        });
    }
}

// Navigation
function switchView(viewId) {
    const validViews = ['dashboard', 'users', 'settings'];
    if (!validViews.includes(viewId)) viewId = 'dashboard';

    let targetId = viewId;
    if (viewId === 'users') targetId = 'usersSection';

    document.querySelectorAll('.view-section').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('active');
    });

    const el = document.getElementById(targetId);
    if (el) {
        el.classList.remove('hidden');
        el.classList.add('active');
    }

    const url = new URL(window.location);
    if (url.searchParams.get('view') !== viewId) {
        url.searchParams.set('view', viewId);
        window.history.pushState({}, '', url);
    }
}

// Dashboard Data
async function loadDashboard() {
    try {
        const res = await apiCall('/api/stats');
        const data = await res.json();

        animateValue("statRevenue", 0, data.totalRevenue, 2000, "$");
        animateValue("statInvoices", 0, data.invoicesCount, 1500, "");
        animateValue("statUsers", 0, data.usersCount, 1000, "");

        const tbody = document.querySelector('#recentTable tbody');
        if (data.recentInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-500">No recent activity</td></tr>';
            return;
        }

        tbody.innerHTML = data.recentInvoices.map(inv => {
            const statusColorClass = inv.status === 'paid' ? 'text-emerald-400 bg-emerald-500/10' : (inv.status === 'cancelled' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10');
            return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-3 pl-2 font-mono text-indigo-400">${inv.invoiceNo}</td>
                <td class="py-3 text-slate-200">${inv.clientName || 'Unknown'}</td>
                <td class="py-3 text-slate-500 text-xs">${new Date(inv.date).toLocaleDateString()}</td>
                <td class="py-3"><span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${statusColorClass}">${inv.status || 'Pending'}</span></td>
                <td class="py-3 pr-2 text-right font-bold text-slate-200">${(inv.totalAmount || 0).toLocaleString()} <span class="text-xs text-slate-500 font-normal">${inv.currency || ''}</span></td>
            </tr>
        `}).join('');
    } catch (e) { showToast("Failed to load dashboard data", "error"); }
}

function animateValue(id, start, end, duration, prefix) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        obj.innerHTML = `${prefix}${value.toLocaleString()}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// User Management
async function loadUsers() {
    try {
        const res = await apiCall('/api/users');
        const users = await res.json();
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = users.map(u => {
            const isSuper = u.email === ADMIN_EMAIL;
            return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-3 pl-2">
                    <div class="font-medium text-white">${u.email}</div>
                    <div class="text-xs text-slate-500">${u.username || '-'}</div>
                </td>
                <td class="py-3"><span class="px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}">${u.role}</span></td>
                <td class="py-3 text-right pr-2">
                    ${!isSuper ? `<button onclick="deleteUser('${u._id}')" class="text-xs text-red-400 hover:text-red-300 hover:underline">Delete</button>` : '<span class="text-xs text-slate-600 italic">Protected</span>'}
                </td>
            </tr>
        `}).join('');
    } catch (e) { }
}

async function deleteUser(id) {
    if (!confirm("Delete user?")) return;
    try {
        const res = await apiCall(`/api/users/${id}`, 'DELETE');
        if (res.ok) {
            loadUsers();
            loadDashboard();
            showToast("User deleted");
        }
    } catch (e) { showToast("Delete failed", "error"); }
}

function filterUsers() {
    const input = document.getElementById('userSearch');
    const filter = input.value.toLowerCase();
    const table = document.getElementById('usersTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const nav = tr[i].getElementsByTagName('td')[0];
        if (nav) {
            const txtValue = nav.textContent || nav.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

async function exportData() {
    try {
        const res = await apiCall('/api/export');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("Export download started");
    } catch (e) { showToast("Export failed", "error"); }
}
