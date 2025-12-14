export function money(n) {
    const x = Number(n);
    return (isFinite(x) ? x : 0).toFixed(2);
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

export function numberToWords(n) {
    if (n < 0) return "Minus " + numberToWords(-n);
    if (n === 0) return "Zero Dollars Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const num = parseFloat(n).toFixed(2);
    const wholePart = Math.floor(n);

    let str = "";

    function convertChunk(num) {
        if (num < 20) return ones[num];
        const t = Math.floor(num / 10);
        const o = num % 10;
        return tens[t] + (o > 0 ? " " + ones[o] : "");
    }

    function convertHundreds(num) {
        if (num > 99) {
            return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 > 0 ? " " + convertChunk(num % 100) : "");
        }
        return convertChunk(num);
    }

    if (wholePart >= 1000000) {
        str += convertHundreds(Math.floor(wholePart / 1000000)) + " Million ";
    }
    if ((wholePart % 1000000) >= 1000) {
        str += convertHundreds(Math.floor((wholePart % 1000000) / 1000)) + " Thousand ";
    }
    const hundreds = wholePart % 1000;
    if (hundreds > 0) {
        str += convertHundreds(hundreds);
    }

    return str + " Dollars Only";
}

export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
