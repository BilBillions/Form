// 👇 Replace with your real Formspree endpoint
const FORMSPREE_ENDPOINT = "https://formspree.io/f/movlblkl";

const form = document.getElementById("pickupForm");
const statusEl = document.getElementById("formStatus");
const btn = document.getElementById("submitBtn");

const cashFields = document.getElementById("cashFields");
const cashAmount = document.getElementById("cashAmount");
const currencySel = document.getElementById("currency");

const otherFields = document.getElementById("otherFields");
const otherDescription = document.getElementById("otherDescription");

const thankYouModal = document.getElementById("thankYouModal");
const closeModalBtn = document.getElementById("closeModalBtn");

// Toggle helpers
function setRequired(el, isRequired) {
  if (!el) return;
  if (isRequired) {
    el.setAttribute("required", "required");
  } else {
    el.removeAttribute("required");
  }
}

function show(el) { el && el.classList.remove("is-hidden"); }
function hide(el) { el && el.classList.add("is-hidden"); }

// Handle pickup type change
function handlePickupTypeChange(value) {
  if (value === "cash") {
    show(cashFields);
    setRequired(cashAmount, true);
  } else {
    hide(cashFields);
    setRequired(cashAmount, false);
    if (cashAmount) cashAmount.value = "";
  }

  if (value === "other") {
    show(otherFields);
    setRequired(otherDescription, true);
  } else {
    hide(otherFields);
    setRequired(otherDescription, false);
    if (otherDescription) otherDescription.value = "";
  }
}

// Init radio listeners
document.querySelectorAll('input[name="pickupType"]').forEach(r => {
  r.addEventListener("change", (e) => handlePickupTypeChange(e.target.value));
});

// Default state based on the checked radio
const initialType = (document.querySelector('input[name="pickupType"]:checked') || {}).value || "package";
handlePickupTypeChange(initialType);

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  btn.disabled = true;
  btn.classList.add("is-loading");

  // Required base fields
  const required = ["fullName","street","city","state","postal","country","phone","consent"];
  for (const name of required) {
    const el = form.elements[name];
    if (!el || (el.type === "checkbox" ? !el.checked : !String(el.value).trim())) {
      statusEl.textContent = "Please complete all required fields.";
      statusEl.className = "status status-error";
      if (el && el.focus) el.focus();
      btn.disabled = false;
      btn.classList.remove("is-loading");
      return;
    }
  }

  // Pickup type specifics
  const pickupType = (form.querySelector('input[name="pickupType"]:checked') || {}).value || "package";
  if (pickupType === "cash") {
    const amt = parseFloat(cashAmount.value);
    if (!(amt >= 0)) {
      statusEl.textContent = "Please enter a valid cash amount.";
      statusEl.className = "status status-error";
      cashAmount.focus();
      btn.disabled = false;
      btn.classList.remove("is-loading");
      return;
    }
  }
  if (pickupType === "other" && !otherDescription.value.trim()) {
    statusEl.textContent = "Please describe the item for pickup.";
    statusEl.className = "status status-error";
    otherDescription.focus();
    btn.disabled = false;
    btn.classList.remove("is-loading");
    return;
  }

  // Build payload for Formspree
  const payload = {
    fullName: form.fullName.value.trim(),
    street: form.street.value.trim(),
    city: form.city.value.trim(),
    state: form.state.value.trim(),
    postal: form.postal.value.trim(),
    country: form.country.value.trim(),
    phone: form.phone.value.trim(),
    pickupType,
    currency: pickupType === "cash" ? currencySel.value : "",
    cashAmount: pickupType === "cash" ? cashAmount.value : "",
    otherDescription: pickupType === "other" ? otherDescription.value.trim() : "",
    weight: form.weight.value.trim(),
    preferredTime: form.preferredTime.value.trim(),
    notes: form.notes.value.trim(),
    _gotcha: form._gotcha.value || ""
  };

  try {
    const resp = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      form.reset();
      // Reset dynamic sections after reset
      handlePickupTypeChange("package");
      statusEl.textContent = "";
      statusEl.className = "status";
      // Show thank-you modal
      thankYouModal.classList.remove("is-hidden");
    } else {
      statusEl.textContent = "Something went wrong. Please try again.";
      statusEl.className = "status status-error";
    }
  } catch (err) {
    statusEl.textContent = "Network error. Please try again.";
    statusEl.className = "status status-error";
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-loading");
  }
});

// Close modal
closeModalBtn.addEventListener("click", () => {
  thankYouModal.classList.add("is-hidden");
});

// Also close modal when clicking outside the dialog
thankYouModal.addEventListener("click", (e) => {
  if (e.target === thankYouModal) thankYouModal.classList.add("is-hidden");
});
