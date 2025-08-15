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

  // --- NEW: robust required-field validator ---
  const requiredNames = ["fullName","street","city","state","postal","country","email","phone"];
  const pretty = {
    fullName: "Full name",
    street: "Street address",
    city: "City",
    state: "State/Region",
    postal: "Postal/ZIP code",
    country: "Country",
    email: "Email",
    phone: "Phone"
  };

  function isFilled(nodeOrList) {
    if (!nodeOrList) return false;

    // RadioNodeList / HTMLCollection / NodeList
    if (typeof nodeOrList.length === "number" && nodeOrList.tagName === undefined) {
      const list = Array.from(nodeOrList);
      if (list.length === 0) return false;
      if (list.length === 1) return isFilled(list[0]);
      // For groups, consider "filled" if any is checked or has a non-empty value (covers radios/checkboxes)
      return list.some(el => el.disabled ? false :
        el.type === "checkbox" || el.type === "radio" ? el.checked :
        (el.value ?? "").trim() !== ""
      );
    }

    const el = nodeOrList;
    if (el.disabled) return true; // ignore disabled fields

    if (el.type === "checkbox") return el.checked;
    if (el.type === "radio")   return el.checked;

    if (el.tagName === "SELECT") {
      return (el.value ?? "").trim() !== "";
    }

    return (el.value ?? "").trim() !== "";
  }

  function markInvalid(elOrList, invalid = true) {
    const set = (el) => el && el.setAttribute && (invalid
      ? el.setAttribute("aria-invalid","true")
      : el.removeAttribute("aria-invalid"));

    if (typeof elOrList?.length === "number" && elOrList.tagName === undefined) {
      Array.from(elOrList).forEach(set);
    } else {
      set(elOrList);
    }
  }
  // --- end validator helpers ---

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset UI
    alertSuccess.classList.add("is-hidden");
    alertError.classList.add("is-hidden");
    setStatus("");
    btn.disabled = true;
    btn.classList.add("is-loading");

    // Validate required fields (REPLACED LOOP)
    let firstInvalidControl = null;
    for (const name of requiredNames) {
      const control = form.elements.namedItem(name); // safer than elements[name]
      const ok = isFilled(control);
      if (!ok) {
        // mark invalid & focus the first offending control
        markInvalid(control, true);
        firstInvalidControl = control?.length ? control[0] : control;
        const label = pretty[name] || name;
        setStatus(`Please complete: ${label}.`, true);
        firstInvalidControl?.focus?.();
        btn.disabled = false;
        btn.classList.remove("is-loading");
        return;
      } else {
        markInvalid(control, false);
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
    fd.append("_subject", "New Pickup Request");
    // If you want a redirect after success, uncomment and set:
    // fd.append("_redirect", "https://dbdoorstep.com/thanks");

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
