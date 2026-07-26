const MENU = [
  { id: "scnd", name: "Smoked Chicken N' Dumplings", category: "Entrée", price: 12.00 },
  { id: "brunswick", name: "Brunswick Stew", category: "Entrée", price: 15.00 },
  { id: "french-onion", name: "French Onion Soup", category: "Starter", price: 6.00 },
  { id: "blossom", name: "Premium Smokehouse Blossom", category: "Appetizer", price: 8.00 },
  { id: "meat-sweats", name: "Meat Sweats Burger", category: "Signature Burger", price: 10.00 },
  { id: "honey-rolls", name: "Honey Rolls", category: "Side", price: 1.00 },
  { id: "lemonade", name: "Fresh-Squeezed Lemonade", category: "Drink", price: 3.00 },
  { id: "sweet-tea", name: "Southern Sweet Tea", category: "Drink", price: 3.00 },
  { id: "collard-greens", name: "Southern Collard Greens", category: "Side", price: 6.00 },
  { id: "burnt-ends", name: "Pitmaster's Burnt Ends", category: "Smokehouse Signature", price: 6.00 },
  { id: "ranch-water", name: "Ranch Water", category: "Alcoholic Drink", price: 21.00 }
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
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

      <div class="quantity-control" aria-label="${escapeHtml(item.name)} quantity">
        <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Remove one ${escapeHtml(item.name)}">−</button>
        <input class="quantity-input" id="qty-${item.id}" data-id="${item.id}" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="${escapeHtml(item.name)} quantity">
        <button type="button" data-action="increase" data-id="${item.id}" aria-label="Add one ${escapeHtml(item.name)}">+</button>
      </div>
    </article>
  `).join("");
}

function updateQuantity(id, change) {
  const current = state.quantities[id] ?? 0;
  state.quantities[id] = Math.max(0, current + change);
  document.querySelector(`#qty-${CSS.escape(id)}`).value = state.quantities[id];
  renderSummary();
}

function getOrderLines() {
  return MENU
    .map(item => ({
      ...item,
      quantity: state.quantities[item.id],
      lineTotal: state.quantities[item.id] * item.price
    }))
    .filter(item => item.quantity > 0);
}

function renderSummary() {
  const lines = getOrderLines();
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  itemCountEl.textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
  subtotalEl.textContent = money(subtotal);
  grandTotalEl.textContent = money(subtotal);

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

function buildReceiptText() {
  const lines = getOrderLines();
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const output = [
    "THE SMOKEHOUSE",
    "BBQ & SOUTHERN KITCHEN",
    "------------------------------"
  ];

  lines.forEach(line => {
    output.push(`${line.quantity}x ${line.name} — ${money(line.lineTotal)}`);
  });

  output.push(
    "------------------------------",
    `TOTAL: ${money(total)}`
  );

  return output.join("\n");
}

async function copyOrder() {
  if (!getOrderLines().length) {
    copyStatusEl.textContent = "Add at least one item first.";
    return;
  }

  const receipt = buildReceiptText();

  try {
    await navigator.clipboard.writeText(receipt);
    copyStatusEl.textContent = "Order copied to clipboard.";
  } catch {
    const temp = document.createElement("textarea");
    temp.value = receipt;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    copyStatusEl.textContent = "Order copied to clipboard.";
  }

  window.setTimeout(() => {
    copyStatusEl.textContent = "";
  }, 2500);
}

function clearOrder() {
  MENU.forEach(item => {
    state.quantities[item.id] = 0;
    document.querySelector(`#qty-${CSS.escape(item.id)}`).value = "0";
  });

  copyStatusEl.textContent = "";
  renderSummary();
}

menuGrid.addEventListener("input", event => {
  const input = event.target.closest(".quantity-input");
  if (!input) return;

  const parsed = Number.parseInt(input.value, 10);
  const safeQuantity = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

  state.quantities[input.dataset.id] = safeQuantity;
  input.value = safeQuantity;
  renderSummary();
});

menuGrid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const change = button.dataset.action === "increase" ? 1 : -1;
  updateQuantity(button.dataset.id, change);
});

document.querySelector("#clearOrder").addEventListener("click", clearOrder);
document.querySelector("#copyOrder").addEventListener("click", copyOrder);
document.querySelector("#printOrder").addEventListener("click", () => window.print());

renderMenu();
renderSummary();
