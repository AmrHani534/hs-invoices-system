import { money, numberToWords, debounce } from './utils.js';
import { showToast } from './ui.js';
import { apiCall } from './api.js';

export function setupInvoiceEventListeners() {
    const currencyInput = document.getElementById("currency");
    const clientPhoneInput = document.getElementById("clientPhone");
    const creatorNameInput = document.getElementById("creatorName");

    if (currencyInput) currencyInput.addEventListener("input", calc);
    if (clientPhoneInput) clientPhoneInput.addEventListener("input", formatPhoneNumber);
    if (creatorNameInput) creatorNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            creatorNameInput.blur();
        }
    });

    loadClientAutocomplete();
}

// Global logic state
export let currentMode = 'invoice';

export function setMode(mode) {
    currentMode = mode;
    const docMode = document.getElementById('docMode');
    if (docMode) docMode.value = mode;

    // Update Buttons UI
    const btnInvoice = document.getElementById('btn-invoice');
    const btnQuote = document.getElementById('btn-quotation');

    if (mode === 'invoice') {
        if (btnInvoice) {
            btnInvoice.style.background = '#6366f1';
            btnInvoice.style.color = 'white';
        }
        if (btnQuote) {
            btnQuote.style.background = 'transparent';
            btnQuote.style.color = '#94a3b8';
        }
    } else {
        if (btnQuote) {
            btnQuote.style.background = '#6366f1';
            btnQuote.style.color = 'white';
        }
        if (btnInvoice) {
            btnInvoice.style.background = 'transparent';
            btnInvoice.style.color = '#94a3b8';
        }
    }

    // Update Interface
    const titleEl = document.getElementById('docTitle');
    const noInput = document.getElementById('invoiceNo');
    const saveBtn = document.querySelector('button[onclick="saveManual()"]');

    if (mode === 'quotation') {
        if (titleEl) {
            titleEl.textContent = 'QUOTATION (OFFER)';
            titleEl.style.color = 'inherit';
        }
        if (noInput) noInput.placeholder = 'QT-2412001';
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                Save Offer`;
            saveBtn.style.color = '#6366f1';
            saveBtn.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            saveBtn.style.background = 'rgba(99, 102, 241, 0.1)';
        }
    } else {
        if (titleEl) {
            titleEl.textContent = 'PURCHASE ORDER';
            titleEl.style.color = 'inherit';
        }
        if (noInput) noInput.placeholder = 'PO-2412001';
        if (saveBtn) {
            saveBtn.innerHTML = `
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                Save PO`;
            saveBtn.style.color = '#6366f1';
            saveBtn.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            saveBtn.style.background = 'rgba(99, 102, 241, 0.1)';
        }
    }

    setupInvoiceNumber();
}

export const calc = debounce(performCalc, 300);

function performCalc() {
    const rows = document.querySelectorAll("#itemsBody tr");
    let sum = 0;
    let totalTax = 0;
    const currencyInput = document.getElementById("currency");
    const currencyVal = currencyInput ? (currencyInput.value || "$") : "$";

    rows.forEach(tr => {
        const rowData = calculateRow(tr);
        if (rowData) {
            sum += rowData.amount;
            totalTax += rowData.taxAmount;
        }
    });

    updateSummary(sum, totalTax, currencyVal);
    updateCurrencySymbols(currencyVal);
}

function calculateRow(tr) {
    const amountInput = tr.querySelector(".amount");
    const taxInput = tr.querySelector(".tax");
    const feesInput = tr.querySelector(".fees");
    const vatInput = tr.querySelector(".vat-amount");
    const totalInput = tr.querySelector(".row-total");

    if (!amountInput || !taxInput) return null;

    const amount = Number(String(amountInput.value).replace(/,/g, ''));
    const taxRate = Number(taxInput.value);
    const fees = feesInput ? Number(feesInput.value) : 0;

    if (!isFinite(amount)) return null;

    let taxAmount = 0;
    if (isFinite(taxRate)) {
        taxAmount = (amount * (taxRate / 100)) + fees;

        if (vatInput) vatInput.value = money(taxAmount);
        if (totalInput) totalInput.value = money(amount + taxAmount);
    }

    return { amount, taxAmount };
}

function updateSummary(sum, totalTax, currencyVal) {
    const subtotalEl = document.getElementById("subtotal");
    const taxesEl = document.getElementById("taxes");
    const grandEl = document.getElementById("grandTotal");
    const wordsEl = document.getElementById("totalInWords");

    if (subtotalEl) subtotalEl.innerHTML = `${money(sum)} <span style="font-size:14px; opacity:0.7">${currencyVal}</span>`;
    if (taxesEl) taxesEl.innerHTML = `${money(totalTax)} <span style="font-size:14px; opacity:0.7">${currencyVal}</span>`;

    if (grandEl) {
        grandEl.style.transform = "scale(1.1)";
        grandEl.style.transition = "transform 0.1s";
        grandEl.innerHTML = `${money(sum + totalTax)} <span style="font-size:16px">${currencyVal}</span>`;
        setTimeout(() => {
            grandEl.style.transform = "scale(1)";
        }, 100);
    }

    if (wordsEl) wordsEl.textContent = numberToWords(sum + totalTax);
}

function updateCurrencySymbols(currencyVal) {
    document.querySelectorAll(".currency-symbol").forEach(el => {
        el.textContent = currencyVal;
    });
}

export function addRow(preset = {}) {
    const body = document.getElementById("itemsBody");
    if (!body) return;

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><input class="input-glass service-select" value="${preset.service ?? ""}" placeholder="e.g. Hosting" /></td>
        <td><input class="input-glass desc-input" value="${preset.desc ?? ""}" placeholder="e.g. Standard Plan" /></td>
        <td><input class="input-glass duration-input" value="${preset.duration ?? ""}" placeholder="e.g. 1 Year" style="text-align:center" dir="ltr" /></td>
        <td>
            <div style="display: flex; align-items: center; justify-content: center;">
                <input class="input-glass tax tax-input" type="number" value="${preset.tax ?? 0}" placeholder="0" style="text-align:center; width: 60px; padding: 8px;" />
                <span style="color: var(--text-muted); font-size: 14px; margin-inline-start: 4px;">%</span>
            </div>
        </td>
        <td>
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <input class="input-glass fees fees-input" type="number" value="${preset.fees ?? 0}" placeholder="0.00" dir="ltr" style="text-align:center; font-family:monospace; min-width: 0;" />
                <span class="currency-symbol" style="font-size: 12px; color: var(--text-muted);">$</span>
            </div>
        </td>
        <td>
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <input class="input-glass vat-amount" value="0.00" readonly placeholder="0.00" dir="ltr" style="text-align:center; font-family:monospace; opacity: 0.7; min-width: 0;" />
                <span class="currency-symbol" style="font-size: 12px; color: var(--text-muted);">$</span>
            </div>
        </td>
        <td>
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <input class="input-glass amount amount-display" value="${preset.amount ?? ""}" placeholder="0.00" dir="ltr" style="text-align:center; font-family:monospace; min-width: 0;" />
                <span class="currency-symbol" style="font-size: 12px; color: var(--text-muted);">$</span>
            </div>
        </td>
        <td>
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <input class="input-glass row-total" value="0.00" readonly placeholder="0.00" dir="ltr" style="text-align:center; font-family:monospace; font-weight:bold; min-width: 0;" />
                <span class="currency-symbol" style="font-size: 12px; color: var(--text-muted);">$</span>
            </div>
        </td>
        <td style="text-align:center">
            <button class="btn-remove text-red-400 hover:text-red-300 transition-colors" onclick="window.removeRow(this)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </td>
    `;

    body.appendChild(tr);

    // Attach listeners to new inputs
    tr.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("input", calc);
    });

    calc();
}

export function removeRow(btn) {
    const tr = btn.closest("tr");
    tr.style.opacity = '0';
    tr.style.transform = 'translateX(20px)';
    setTimeout(() => {
        tr.remove();
        calc();
    }, 200);
}

export function resetRows() {
    const body = document.getElementById("itemsBody");
    if (body) {
        body.innerHTML = "";
        addRow();
        calc();
    }
}

export async function setupInvoiceNumber() {
    try {
        const res = await apiCall('/api/next-invoice');
        if (!res) return;
        const data = await res.json();
        const invoiceNo = document.getElementById("invoiceNo");
        if (invoiceNo && data.invoiceNo) {
            invoiceNo.value = data.invoiceNo;
        }
    } catch (err) {
        console.error("Failed to fetch invoice number", err);
    }
}

async function loadClientAutocomplete() {
    try {
        const res = await apiCall('/api/clients');
        if (!res) return;
        const clients = await res.json();

        const dl = document.getElementById('clientList');
        if (!dl) return;
        dl.innerHTML = clients.map(c => `<option value="${c.name}">${c.phone || ''}</option>`).join('');

        // Auto-fill phone on selection
        const input = document.getElementById('clientName');
        const phoneInput = document.getElementById('clientPhone');
        if (input && phoneInput) {
            input.addEventListener('input', () => {
                const val = input.value;
                const match = clients.find(c => c.name === val);
                if (match && match.phone) {
                    phoneInput.value = match.phone;
                    formatPhoneNumber({ target: phoneInput }); // trigger format
                }
            });
        }

    } catch (e) { console.error("Auto-complete failed", e); }
}

function formatPhoneNumber(e) {
    let raw = e.target.value.replace(/[^\d+]/g, "");
    if (!raw.startsWith("+")) raw = "+" + raw;

    let v = raw.replace(/\s+/g, '').replace(/[^0-9+]/gi, '');
    if (v.startsWith("+20")) {
        let parts = [];
        parts.push(v.substring(0, 3)); // +20
        if (v.length > 3) parts.push(v.substring(3, 6)); // 1xx
        if (v.length > 6) parts.push(v.substring(6, 9)); // xxx
        if (v.length > 9) parts.push(v.substring(9, 13)); // xxxx
        e.target.value = parts.join(" ");
    }
}

export async function saveManual() {
    const invoiceNo = document.getElementById("invoiceNo").value;
    const clientName = document.getElementById("clientName").value;
    const phone = document.getElementById("clientPhone").value;
    const dateEl = document.getElementById("invoiceDate");
    const subtotalEl = document.getElementById("subtotal");
    const taxesEl = document.getElementById("taxes");
    const grandEl = document.getElementById("grandTotal");
    const currencyInput = document.getElementById("currency");

    if (!clientName) return showToast("Please enter Client Name", "warning");

    const rows = Array.from(document.querySelectorAll("#itemsBody tr"));
    const items = rows.map(row => {
        return {
            service: row.querySelector(".service-select").value,
            desc: row.querySelector(".desc-input").value,
            duration: row.querySelector(".duration-input").value,
            tax: parseFloat(row.querySelector(".tax-input").value) || 0,
            vatRate: parseFloat(row.querySelector(".tax-input").value) || 0,
            fees: parseFloat(row.querySelector(".fees-input").value) || 0,
            amount: parseFloat(row.querySelector(".amount-display").value.replace(/[^0-9.]/g, '')) || 0
        };
    });

    const data = {
        date: dateEl.value,
        clientName,
        clientPhone: phone,
        items,
        subtotal: parseFloat(subtotalEl.innerText.replace(/[^0-9.]/g, '')),
        vatAmount: parseFloat(taxesEl.innerText.replace(/[^0-9.]/g, '')),
        totalAmount: parseFloat(grandEl.innerText.replace(/[^0-9.]/g, '')),
        currency: currencyInput.value
    };

    const isQuotation = currentMode === 'quotation';

    if (isQuotation) {
        data.quotationNo = invoiceNo;
        data.status = 'pending';
    } else {
        data.invoiceNo = invoiceNo;
        data.status = 'pending';
    }

    // Check for ID parameter to determine Create vs Update
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    let endpoint = isQuotation ? '/api/quotations' : '/api/invoices';
    let method = 'POST';

    if (id) {
        endpoint += `/${id}`;
        method = 'PUT';
    }

    try {
        const res = await apiCall(endpoint, method, data);
        if (res && res.ok) {
            showToast(`${isQuotation ? 'Quotation' : 'Invoice'} ${id ? 'Updated' : 'Saved'} Successfully!`);

            // If created new, reload to clear. If updated, maybe stay or reload?
            // Reloading is safer to reset state, but if updating, user might want to see it.
            // For now, reload as per original behavior.
            setTimeout(() => window.location.href = '/', 1000);
        } else {
            const err = await res.json();
            showToast("Error: " + err.message, "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Save failed: " + e.message, "error");
    }
}

export async function exportPDF() {
    const originalTitle = document.title;
    const docTitleEl = document.getElementById("docTitle");
    const originalDocTitle = docTitleEl ? docTitleEl.textContent : "";

    const client = document.getElementById("clientName").value || "Client";
    const poNo = document.getElementById("invoiceNo").value || "PO";
    const date = document.getElementById("invoiceDate").value || "Date";

    document.title = `${client} - ${poNo} - ${date}`;

    // Temporary print change: Remove (OFFER) from title if in quotation mode
    if (currentMode === 'quotation' && docTitleEl) {
        docTitleEl.textContent = 'QUOTATION';
    }

    // Increment logic
    try {
        await apiCall('/api/confirm-invoice', 'POST');
    } catch (e) { console.error(e); }

    window.print();

    // Fetch next number
    await setupInvoiceNumber();

    setTimeout(() => {
        document.title = originalTitle;
        // Revert title
        if (currentMode === 'quotation' && docTitleEl) {
            docTitleEl.textContent = originalDocTitle;
        }
    }, 1000);
}

export async function importPDF(input) {
    const file = input.files[0];
    if (!file) return;

    if (typeof pdfjsLib === 'undefined') {
        showToast("PDF Library not loaded.", "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function () {
        try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += pageText + " ";
            }



            // 1. PO Number
            const poPatterns = [/PO\s*[:#-]?\s*([A-Z0-9-]+)/i, /Invoice\s*No\.?\s*[:#-]?\s*([A-Z0-9-]+)/i, /#\s?([0-9]{4,})/];
            for (let p of poPatterns) {
                const m = fullText.match(p);
                if (m && m[1]) {
                    document.getElementById("invoiceNo").value = "PO-" + m[1].replace(/[:#]/g, '').replace('PO-', '').trim();
                    break;
                }
            }

            // 2. Client Phone
            const phonePatterns = [/(\+20\s?1[0-2,5]\d{8})/, /(01[0-2,5]\d{8})/];
            const clientPhoneInput = document.getElementById("clientPhone");
            for (let p of phonePatterns) {
                const m = fullText.match(p);
                if (m && m[1]) {
                    clientPhoneInput.value = m[1];
                    // Trigger input event
                    formatPhoneNumber({ target: clientPhoneInput });
                    break;
                }
            }

            // 3. Currency
            const currencyInput = document.getElementById("currency");
            if (fullText.includes('$') || fullText.toLowerCase().includes('usd')) currencyInput.value = '$';
            else if (fullText.includes('€') || fullText.toLowerCase().includes('eur')) currencyInput.value = '€';
            else if (fullText.includes('EGP') || fullText.includes('ج.م')) currencyInput.value = 'EGP';
            currencyInput.dispatchEvent(new Event('input')); // Calc loop triggers here

            showToast("Scanning complete! Please review fields.");

        } catch (e) {
            console.error(e);
            showToast("Error reading PDF.", "error");
        }
    };
    reader.readAsArrayBuffer(file);
}

export function sendWhatsApp() {
    const clientName = document.getElementById("clientName").value || "Valued Client";
    const invoiceNo = document.getElementById("invoiceNo").value || "PO-XXXXXX";
    const dateVal = document.getElementById("invoiceDate").value;

    let formattedDate = dateVal;
    if (dateVal) {
        const [y, m, d] = dateVal.split('-');
        formattedDate = `${d}/${m}/${y}`;
    }

    const firstRow = document.querySelector("#itemsBody tr");
    let service = "Service";
    let desc = "";
    let duration = "";

    if (firstRow) {
        // Better selector:
        service = firstRow.querySelector('.service-select').value || "Service";
        desc = firstRow.querySelector('.desc-input').value || "";
        const dur = firstRow.querySelector('.duration-input').value;
        if (dur) duration = `(${dur})`;
    }

    const message = `Hello Mr. ${clientName},
I hope you are doing well.

Please find attached the Purchase Order ${invoiceNo} dated ${formattedDate} for ${service} ${duration} for ${desc}.

Kindly review and confirm receipt.
If you need any clarification, please let us know.

Thank you for your cooperation.

Best regards,
Helpers Technologies`;

    const encodedMsg = encodeURIComponent(message);
    let phone = document.getElementById("clientPhone").value.replace(/\s+/g, '').replace('+', '');

    let url = `https://wa.me/?text=${encodedMsg}`;
    if (phone && phone.length >= 10) {
        url = `https://wa.me/${phone}?text=${encodedMsg}`;
    }

    window.open(url, '_blank');
}

export async function loadInvoiceFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const mode = params.get('mode'); // 'quotation' or empty (invoice)

    if (!id) return;

    if (mode === 'quotation') {
        currentMode = 'quotation';
        setMode('quotation');
    }

    try {
        const endpoint = mode === 'quotation' ? `/api/quotations/${id}` : `/api/invoices/${id}`;
        const res = await apiCall(endpoint);
        if (!res) throw new Error('Failed to load');

        const data = await res.json();
        const doc = data.invoice || data.quotation || data; // Handle wrapper or direct object

        if (!doc || (!doc.invoiceNo && !doc.quotationNo)) throw new Error('Invalid document data');

        // Populate Fields
        if (doc.invoiceNo) {
            document.getElementById("invoiceNo").value = doc.invoiceNo;
        } else if (doc.quotationNo) {
            document.getElementById("invoiceNo").value = doc.quotationNo;
        }

        if (doc.date) {
            document.getElementById("invoiceDate").value = (new Date(doc.date)).toISOString().split('T')[0];
        }

        if (doc.clientName) document.getElementById("clientName").value = doc.clientName;
        if (doc.clientPhone) document.getElementById("clientPhone").value = doc.clientPhone;
        if (doc.currency) document.getElementById("currency").value = doc.currency;

        // Populate Rows
        const body = document.getElementById("itemsBody");
        body.innerHTML = "";

        if (doc.items && doc.items.length > 0) {
            doc.items.forEach(item => {
                // Map DB item to addRow preset
                // DB: service, desc, duration, rate (tax), fees, amount
                // addRow expects: { service, desc, duration, tax, fees, amount }
                addRow({
                    service: item.service,
                    desc: item.desc,
                    duration: item.duration,
                    tax: item.tax || item.vatRate || 0,
                    fees: item.fees,
                    amount: item.amount
                });
            });
        } else {
            addRow();
        }

        calc();

        // Show Delete Button if ID exists (Editing mode)
        const deleteBtn = document.getElementById('btn-delete');
        if (deleteBtn) {
            deleteBtn.classList.remove('hidden');
        }

        // Change Save Button to Update
        const saveText = document.getElementById('btn-save-text');
        if (saveText) {
            saveText.textContent = (mode === 'quotation' || currentMode === 'quotation') ? 'Update Quotation' : 'Update PO';
        }

        showToast("Invoice loaded successfully");

    } catch (e) {
        console.error(e);
        showToast("Failed to load document", "error");
    }
}

export async function deleteCurrentInvoice() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const mode = params.get('mode'); // 'quotation' or empty (invoice)

    if (!id) return showToast("No document selected to delete", "warning");

    if (!confirm("Are you sure you want to PERMANENTLY delete this document?")) return;

    try {
        const endpoint = (mode === 'quotation' || currentMode === 'quotation') ? `/api/quotations/${id}` : `/api/invoices/${id}`;

        const res = await apiCall(endpoint, 'DELETE');
        if (res && res.ok) {
            showToast("Document Deleted Successfully", "warning");
            setTimeout(() => window.location.href = '/', 1000);
        } else {
            const err = await res.json();
            showToast("Error: " + err.message, "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Failed to delete", "error");
    }
}
