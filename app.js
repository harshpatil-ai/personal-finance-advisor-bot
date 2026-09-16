document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    document.getElementById("tx-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            kind: document.getElementById("kind").value,
            category: document.getElementById("category").value.trim(),
            amount: document.getElementById("amount").value,
            note: document.getElementById("note").value.trim()
        };
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            document.getElementById("tx-form").reset();
            loadDashboard();
        } else {
            alert("Error adding transaction!");
        }
    });
});

async function loadDashboard() {
    const summary = await (await fetch("/api/summary")).json();
    document.getElementById("income-val").innerText = `₹${summary.income}`;
    document.getElementById("expense-val").innerText = `₹${summary.expense}`;
    document.getElementById("balance-val").innerText = `₹${summary.balance}`;

    const advice = await (await fetch("/api/advice")).json();
    document.getElementById("insight-title").innerText = advice.title;
    document.getElementById("insight-text").innerText = advice.text;

    const txs = await (await fetch("/api/transactions")).json();
    document.getElementById("tx-list").innerHTML = txs.map(t => `
        <li>
            <span><strong>[${t.kind.toUpperCase()}]</strong> ${t.category} ${t.note ? '(' + t.note + ')' : ''}</span>
            <span class="${t.kind}">₹${t.amount}</span>
        </li>
    `).join("");
}