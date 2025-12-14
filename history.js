import { apiCall } from './api.js';
import { showToast, renderNavigation } from './ui.js';
import { checkAuth } from './auth.js';

let allInvoices = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    renderNavigation();

    window.updateStatus = updateStatus;
    window.deleteInvoice = deleteInvoice;
    window.openInvoice = openInvoice;

    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allInvoices.filter(inv =>
                (inv.clientName && inv.clientName.toLowerCase().includes(term)) ||
                (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(term))
            );
            render(filtered);
        });
    }

    loadArchive();
});

async function loadArchive() {
    try {
        const res = await apiCall('/api/invoices');
        allInvoices = await res.json();
        render(allInvoices);
    } catch (e) {
        const grid = document.getElementById('grid');
        if (grid) grid.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Failed to load archive. Please try again.</div>`;
    }
}

function render(list) {
    const grid = document.getElementById('grid');
    if (list.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 flex flex-col items-center gap-4">
            <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>No invoices found.</span>
        </div>`;
        return;
    }

    grid.innerHTML = list.map(inv => {
        const role = localStorage.getItem('role');
        const isPaid = inv.status === 'paid';
        const isCancelled = inv.status === 'cancelled';

        return `
        <div class="group bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 relative overflow-hidden flex flex-col">
            
            <div class="flex justify-between items-start mb-4">
                <div class="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-sm border border-indigo-500/20">
                    ${inv.invoiceNo}
                </div>
                <div class="text-xs text-slate-500 font-medium">
                    ${new Date(inv.date).toLocaleDateString()}
                </div>
            </div>

            <div class="mb-6 flex-grow">
                <h3 class="text-xl font-bold text-white mb-1 line-clamp-1" title="${inv.clientName}">${inv.clientName || 'Unknown Client'}</h3>
                <div class="text-3xl font-bold text-emerald-400 tracking-tight">
                    ${(inv.totalAmount || 0).toLocaleString()} <span class="text-lg text-emerald-400/60 font-medium">${inv.currency || ''}</span>
                </div>
            </div>

            <!-- Status Dropdown -->
            <div class="mb-4 relative">
                <select onchange="updateStatus('${inv._id}', this.value)" 
                    class="w-full appearance-none bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors
                    ${isPaid ? 'text-emerald-400 border-emerald-500/30' : (isCancelled ? 'text-red-400 border-red-500/30' : 'text-amber-400 border-amber-500/30')}">
                    <option value="pending" ${!isPaid && !isCancelled ? 'selected' : ''}>Pending</option>
                    <option value="paid" ${isPaid ? 'selected' : ''}>Paid</option>
                    <option value="cancelled" ${isCancelled ? 'selected' : ''}>Cancelled</option>
                </select>
                <div class="absolute right-3 top-2.5 pointer-events-none text-slate-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                <button onclick="openInvoice('${inv._id}')" class="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-indigo-600 hover:text-white transition-all text-sm font-medium text-slate-300">
                    Edit / View
                </button>
                <button onclick="deleteInvoice('${inv._id}')" class="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all text-sm font-medium text-slate-400">
                    Delete
                </button>
            </div>

        </div>
    `}).join('');
}

async function updateStatus(id, newStatus) {
    try {
        await apiCall(`/api/invoices/${id}/status`, 'PUT', { status: newStatus });
        allInvoices = allInvoices.map(i => i._id === id ? { ...i, status: newStatus } : i);
        render(allInvoices);
        showToast('Status updated successfully');
    } catch (e) { showToast('Failed to update status', 'error'); }
}

async function deleteInvoice(id) {
    if (!confirm("Are you sure you want to permanently delete this PO?")) return;
    try {
        await apiCall(`/api/invoices/${id}`, 'DELETE');
        allInvoices = allInvoices.filter(i => i._id !== id);
        render(allInvoices);
        showToast('Invoice deleted', 'warning');
    } catch (e) { showToast('Delete failed', 'error'); }
}

function openInvoice(id) {
    window.location.href = `/?id=${id}`;
}
