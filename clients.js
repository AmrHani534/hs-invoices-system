import { apiCall } from './api.js';
import { showToast, renderNavigation } from './ui.js';
import { checkAuth } from './auth.js';

let clients = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    renderNavigation();

    // Bind Global Functions
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.saveClient = saveClient;
    window.deleteClient = deleteClient;
    window.renderClients = renderClients; // Explicit expose if needed, though mostly internal

    // Search Listener
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', renderClients);
    }

    loadClients();
});

async function loadClients() {
    const listEl = document.getElementById('clientList');
    try {
        const res = await apiCall('/api/clients');
        clients = await res.json();
        renderClients();
    } catch (e) {
        if (listEl) listEl.innerHTML = `<div class="col-span-full text-center text-red-400">Failed to load clients.</div>`;
    }
}

function renderClients() {
    const listEl = document.getElementById('clientList');
    const term = document.getElementById('search').value.toLowerCase();
    const filtered = clients.filter(c => c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term)));

    if (filtered.length === 0) {
        listEl.innerHTML = `
        <div class="col-span-full text-center text-slate-500 py-10 flex flex-col items-center gap-4">
            <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span>No clients found.</span>
        </div>`;
        return;
    }

    listEl.innerHTML = filtered.map(c => `
        <div class="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 relative">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                    ${c.name.charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-base text-white group-hover:text-indigo-400 transition-colors truncate">${c.name}</h3>
                    <div class="text-slate-400 text-xs font-mono truncate">${c.phone || '-'}</div>
                </div>
                
                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onclick="openModal('${c._id}')" class="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-500 rounded-md transition-colors" title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onclick="deleteClient('${c._id}')" class="p-1.5 text-red-300 hover:text-white hover:bg-red-500 rounded-md transition-colors" title="Delete">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
            
            <div class="space-y-1.5 border-t border-white/5 pt-3">
                    ${c.email ? `
                    <div class="text-xs text-slate-500 flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        <span class="truncate" title="${c.email}">${c.email}</span>
                    </div>
                ` : ''}
                    ${c.address ? `
                    <div class="text-xs text-slate-500 flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 opacity-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span class="truncate" title="${c.address}">${c.address}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function saveClient(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('cId').value;
    const data = {
        name: document.getElementById('cName').value,
        phone: document.getElementById('cPhone').value,
        email: document.getElementById('cEmail').value,
        address: document.getElementById('cAddress').value
    };

    const url = id ? `/api/clients/${id}` : '/api/clients';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await apiCall(url, method, data);
        if (res.ok) {
            closeModal();
            loadClients();
            showToast('Client saved successfully');
        } else {
            showToast('Failed to save client', 'error');
        }
    } catch (e) { showToast('Error saving client', 'error'); }
}

async function deleteClient(id) {
    if (!confirm('Delete this client?')) return;
    try {
        await apiCall(`/api/clients/${id}`, 'DELETE');
        loadClients();
        showToast('Client deleted', 'warning');
    } catch (e) { showToast('Delete failed', 'error'); }
}

function openModal(id = null) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    document.getElementById('cId').value = '';

    if (id) {
        const client = clients.find(c => c._id === id);
        if (client) {
            document.getElementById('cId').value = client._id;
            document.getElementById('cName').value = client.name;
            document.getElementById('cPhone').value = client.phone || '';
            document.getElementById('cEmail').value = client.email || '';
            document.getElementById('cAddress').value = client.address || '';
        }
    } else {
        const form = document.querySelector('form');
        if (form) form.reset();
    }
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}
