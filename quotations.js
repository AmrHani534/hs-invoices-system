import { apiCall } from './api.js';
import { showToast, renderNavigation } from './ui.js';
import { checkAuth } from './auth.js';

let quotations = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    renderNavigation();

    window.convertToInvoice = convertToInvoice;
    window.deleteQuotation = deleteQuotation;

    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', render);
    }

    loadQuotations();
});

async function loadQuotations() {
    try {
        const res = await apiCall('/api/quotations');
        quotations = await res.json();
        render();
    } catch (e) {
        const grid = document.getElementById('grid');
        if (grid) grid.innerHTML = `<div class="col-span-full text-center text-red-400">Failed to load quotations.</div>`;
    }
}

function render() {
    const term = document.getElementById('search').value.toLowerCase();
    const filtered = quotations.filter(q =>
        (q.clientName && q.clientName.toLowerCase().includes(term)) ||
        (q.quotationNo && q.quotationNo.toLowerCase().includes(term))
    );

    const grid = document.getElementById('grid');
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 flex flex-col items-center gap-4">
            <svg class="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>No quotations found.</span>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(q => {
        const role = localStorage.getItem('role');
        const isConverted = q.status === 'converted';
        return `
        <div class="group bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-pink-500/50 hover:bg-white/10 transition-all duration-300 relative overflow-hidden flex flex-col">
            
            <div class="flex justify-between items-start mb-4">
                <div class="px-3 py-1 rounded-lg bg-pink-500/10 text-pink-400 font-mono text-sm border border-pink-500/20">
                    ${q.quotationNo}
                </div>
                <div class="text-xs text-slate-500 font-medium">
                    ${new Date(q.date).toLocaleDateString()}
                </div>
            </div>

            <div class="mb-6 flex-grow">
                <h3 class="text-xl font-bold text-white mb-1 line-clamp-1" title="${q.clientName}">${q.clientName || 'Unknown'}</h3>
                <div class="text-3xl font-bold text-emerald-400 tracking-tight">
                    ${(q.totalAmount || 0).toLocaleString()} <span class="text-lg text-emerald-400/60 font-medium">${q.currency || ''}</span>
                </div>
            </div>

            <div class="mb-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isConverted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
                    ${isConverted ? '✅ Converted' : '⏳ Draft / Offer'}
                </span>
            </div>

            <div class="grid grid-cols-${role === 'admin' ? '2' : '1'} gap-3 pt-4 border-t border-white/5">
                    ${!isConverted ? `
                    <button onclick="convertToInvoice('${q._id}')" class="col-span-${role === 'admin' ? '2' : '1'} flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all text-sm font-bold mb-2">
                        Convert to Invoice
                    </button>
                ` : `
                    <button disabled class="col-span-${role === 'admin' ? '2' : '1'} flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed text-sm font-medium mb-2">
                        Invoice Created
                    </button>
                `}
                
                <button onclick="window.location.href='/?mode=quotation&id=${q._id}'" class="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-pink-600 hover:text-white transition-all text-sm font-medium text-slate-300">
                    Edit
                </button>
                
                ${role === 'admin' ? `
                <button onclick="deleteQuotation('${q._id}')" class="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all text-sm font-medium text-slate-400">
                    Delete
                </button>
                ` : ''}
            </div>

        </div>
    `}).join('');
}

async function convertToInvoice(id) {
    if (!confirm("Convert this Offer to an Official Invoice? (This will create a new PO number)")) return;
    try {
        const res = await apiCall(`/api/quotations/${id}/convert`, 'POST');
        if (res.ok) {
            showToast("Converted Successfully!");
            setTimeout(() => window.location.href = '/history.html', 1000);
        } else {
            const err = await res.json();
            showToast("Error: " + err.error, 'error');
        }
    } catch (e) { showToast("Conversion failed", 'error'); }
}

async function deleteQuotation(id) {
    if (!confirm("Delete this quotation?")) return;
    try {
        await apiCall(`/api/quotations/${id}`, 'DELETE');
        showToast('Quotation deleted', 'warning');
        loadQuotations();
    } catch (e) { showToast('Delete failed', 'error'); }
}
