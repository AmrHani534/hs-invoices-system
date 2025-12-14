import { checkAuth, getUserInfo } from './auth.js';
import { renderNavigation } from './ui.js';
import { setupInvoiceEventListeners, addRow, resetRows, saveManual, exportPDF, importPDF, sendWhatsApp, setMode, currentMode, setupInvoiceNumber, calc, loadInvoiceFromURL, deleteCurrentInvoice } from './invoice.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    if (!checkAuth()) return;

    // 2. Render UI
    renderNavigation();

    // 3. Initialize Invoice/App Logic
    if (document.getElementById("itemsBody")) { // Only on main page
        setupInvoiceEventListeners();

        // set Creator Name
        const creatorEl = document.getElementById('creatorName');
        const { username } = getUserInfo();
        if (creatorEl && username) creatorEl.innerText = username;

        // Expose functions to GLOBAL window for HTML onclicks
        window.addRow = addRow;
        window.resetRows = resetRows;
        window.saveManual = saveManual;
        window.deleteCurrentInvoice = deleteCurrentInvoice;
        window.exportPDF = exportPDF;
        window.importPDF = importPDF;
        window.sendWhatsApp = sendWhatsApp;
        window.setMode = setMode;
        window.removeRow = (btn) => {
            // Needed because btn is passed, but module function expects it. 
            // We import removeRow from invoice.js? No I didn't export it in main import list initially.
            // Wait, removeRow IS exported in invoice.js but I forgot to import it here.
            // Actually I'm importing everything I need. I need to import removeRow too.
            // But I can also just call it.
            import('./invoice.js').then(m => m.removeRow(btn));
        };
        // Better way: import removeRow
    }

    // Set Today's Date
    const dateEl = document.getElementById("invoiceDate");
    if (dateEl) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateEl.value = `${yyyy} -${mm} -${dd} `;
    }

    // Initial Seed
    if (document.getElementById("itemsBody")) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('id')) {
            loadInvoiceFromURL();
        } else {
            addRow(); // Initial row
            setupInvoiceNumber(); // Load PO Number
            calc();
        }
    }
});
