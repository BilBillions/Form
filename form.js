// form.js
const FORMSPREE_ENDPOINT = "https://formspree.io/f/movlblkl";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("pickupForm");
  const statusEl = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");
  const alertSuccess = document.getElementById("alertSuccess");
  const alertError = document.getElementById("alertError");
  const thankYouModal = document.getElementById("thankYouModal");
  const closeModalBtn = document.getElementById("closeModalBtn");

  if (!form || !btn || !statusEl) return; // safety

  const setStatus = (msg, isError = false) => {
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (isError ? " status-error" : "");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset UI
    alertSuccess.classList.add("is-hidden");
    alertError.classList.add("is-hidden");
    setStatus("");
    btn.disabled = true;
    btn.classList.add("is-loading");

    // Validate required fields
    const required = ["fullName","street","city","state","postal","country","email","phone"];
    for (const name of required) {
      const el = form.elements[name];
      if (!el || !el.value.trim()) {
        setStatus("Please complete all required fields.", true);
        el?.focus();
        btn.disabled = false;
        btn.classList.remove("is-loading");
        return;
      }
    }
    // Checkbox consent
    const consentCheckbox = form.querySelector('input[type="checkbox"][required]');
    if (consentCheckbox && !consentCheckbox.checked) {
      setStatus("Please confirm your details are correct.", true);
      consentCheckbox.focus();
      btn.disabled = false;
      btn.classList.remove("is-loading");
      return;
    }

    // Build FormData (preferred by Formspree)
    const fd = new FormData(form);
    // Optional: add a human-friendly subject seen in Formspree inbox
    fd.append("_subject", "New Pickup Request");
    // Optional: where to redirect if you want (we’re using JS UI, so skip)
    // fd.append("_redirect", "https://your-site/thanks");

    setStatus("Submitting…");

    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" }, // don't set Content-Type for FormData
        body: fd
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        form.reset();
        setStatus("");
        alertSuccess.innerHTML = "<strong>Thank you:</strong> your pickup information was submitted.";
        alertSuccess.classList.remove("is-hidden");

        const original = btn.textContent;
        btn.textContent = "Thank you";
        setTimeout(() => (btn.textContent = original), 2000);

        thankYouModal?.classList.remove("is-hidden");
        closeModalBtn?.focus();
      } else {
        // Surface helpful errors from Formspree
        let msg = "Error: Please try again.";
        if (data?.errors?.length) msg = data.errors.map(e => e.message).join(" ");
        if (data?.error) msg = data.error;
        alertError.textContent = msg;
        alertError.classList.remove("is-hidden");
        setStatus("", true);
      }
    } catch {
      alertError.textContent = "Network error. Please try again.";
      alertError.classList.remove("is-hidden");
      setStatus("", true);
    } finally {
      btn.disabled = false;
      btn.classList.remove("is-loading");
    }
  });

  // Modal handlers
  closeModalBtn?.addEventListener("click", () => {
    thankYouModal?.classList.add("is-hidden");
  });
  thankYouModal?.addEventListener("click", (e) => {
    if (e.target === thankYouModal) thankYouModal.classList.add("is-hidden");
  });
});