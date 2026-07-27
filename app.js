const MENU = [
  { id: "scnd", name: "Smoked Chicken N' Dumplings", category: "Entrée", price: 20.00 },
  { id: "brunswick", name: "Brunswick Stew", category: "Entrée", price: 20.00 },
  { id: "french-onion", name: "French Onion Soup", category: "Starter", price: 30.00 },
  { id: "blossom", name: "Premium Smokehouse Blossom", category: "Appetizer", price: 30.00 },
  { id: "meat-sweats", name: "Meat Sweats Burger", category: "Signature Burger", price: 20.00 },
  { id: "collard-greens", name: "Southern Collard Greens", category: "Side", price: 20.00 },
  { id: "burnt-ends", name: "Pitmaster's Burnt Ends", category: "Smokehouse Signature", price: 10.00 },
  { id: "lemonade", name: "Fresh-Squeezed Lemonade", category: "Drink", price: 10.00 },
  { id: "ranch-water", name: "Ranch Water", category: "Alcoholic Drink", price: 36.00 }
];

const state = {
  quantities: Object.fromEntries(MENU.map(item => [item.id, 0]))
};

const menuGrid = document.querySelector("#menuGrid");
const summaryLines = document.querySelector("#summaryLines");
const subtotalEl = document.querySelector("#subtotal");
const grandTotalEl = document.querySelector("#grandTotal");
const itemCountEl = document.querySelector("#itemCount");
const copyStatusEl = document.querySelector("#copyStatus");

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMenu() {
  menuGrid.innerHTML = MENU.map(item => `
    <article class="menu-item">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="menu-meta">
          <span>${escapeHtml(item.category)}</span>
          <span aria-hidden="true">•</span>
          <span class="menu-price">${money(item.price)}</span>
        </div>
      </div>
      <div class="quantity-control">
        <button type="button" data-action="decrease" data-id="${item.id}">−</button>
        <input class="quantity-input" id="qty-${item.id}" data-id="${item.id}"
          type="number" min="0" step="1" value="0" inputmode="numeric">
        <button type="button" data-action="increase" data-id="${item.id}">+</button>
      </div>
    </article>
  `).join("");
}

function getOrderLines() {
  return MENU.map(item => ({
    ...item,
    quantity: state.quantities[item.id],
    lineTotal: state.quantities[item.id] * item.price
  })).filter(item => item.quantity > 0);
}

function renderSummary() {
  const lines = getOrderLines();
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  itemCountEl.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  subtotalEl.textContent = money(total);
  grandTotalEl.textContent = money(total);

  summaryLines.innerHTML = lines.length
    ? lines.map(line => `
        <div class="summary-line">
          <div>
            <strong>${line.quantity} × ${escapeHtml(line.name)}</strong>
            <small>${money(line.price)} each</small>
          </div>
          <strong>${money(line.lineTotal)}</strong>
        </div>
      `).join("")
    : '<p class="empty-message">No items have been added yet.</p>';
}

function updateQuantity(id, change) {
  state.quantities[id] = Math.max(0, (state.quantities[id] || 0) + change);
  document.querySelector(`#qty-${CSS.escape(id)}`).value = state.quantities[id];
  renderSummary();
}

function buildReceiptText() {
  const lines = getOrderLines();
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const output = [
    "THE SMOKEHOUSE",
    "BBQ & SOUTHERN KITCHEN",
    "------------------------------"
  ];

  for (const line of lines) {
    output.push(`${line.quantity}x ${line.name} @ ${money(line.price)} — ${money(line.lineTotal)}`);
  }

  output.push("------------------------------", `TOTAL: ${money(total)}`);
  return output.join("\n");
}

menuGrid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  updateQuantity(button.dataset.id, button.dataset.action === "increase" ? 1 : -1);
});

menuGrid.addEventListener("input", event => {
  const input = event.target.closest(".quantity-input");
  if (!input) return;

  const parsed = Number.parseInt(input.value, 10);
  const safeQty = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  state.quantities[input.dataset.id] = safeQty;
  input.value = safeQty;
  renderSummary();
});

document.querySelector("#clearOrder").addEventListener("click", () => {
  for (const item of MENU) {
    state.quantities[item.id] = 0;
    document.querySelector(`#qty-${CSS.escape(item.id)}`).value = 0;
  }
  copyStatusEl.textContent = "";
  renderSummary();
});

document.querySelector("#copyOrder").addEventListener("click", async () => {
  if (!getOrderLines().length) {
    copyStatusEl.textContent = "Add at least one item first.";
    return;
  }

  const text = buildReceiptText();

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }

  copyStatusEl.textContent = "Order copied.";
  window.setTimeout(() => copyStatusEl.textContent = "", 2500);
});

document.querySelector("#printOrder").addEventListener("click", () => window.print());

renderMenu();
renderSummary();
