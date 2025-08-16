window.addEventListener('load', () => {
      document.getElementById('page-loader').classList.add('hide');
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const siteNav = document.getElementById('siteNav');
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('open');
    });

    // Tracking demo (replace with real API later)
    const trackForm = document.getElementById('trackForm');
    const trackStatus = document.getElementById('trackStatus');
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('trackingId').value.trim();
      if (!id) {
        trackStatus.textContent = 'Please enter a tracking number.';
        trackStatus.className = 'status status-error mt-8';
        return;
      }
      trackStatus.textContent = 'Checking status…';
      trackStatus.className = 'status mt-8';

      // Simulate lookup
      setTimeout(() => {
        trackStatus.textContent = `Tracking #${id}: In transit — arriving in 1–3 business days.`;
        trackStatus.className = 'status status-success mt-8';
      }, 800);
    });

    // Contact form (AJAX to Formspree)
    const contactForm = document.getElementById('contactForm');
    const contactBtn = document.getElementById('contactBtn');
    const contactStatus = document.getElementById('contactStatus');

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      contactStatus.textContent = '';
      contactBtn.disabled = true;
      contactBtn.classList.add('is-loading');

      const payload = {
        name: contactForm.name.value.trim(),
        email: contactForm.email.value.trim(),
        message: contactForm.message.value.trim(),
        _gotcha: contactForm._gotcha.value || ''
      };

      if (!payload.name || !payload.email || !payload.message) {
        contactStatus.textContent = 'Please complete all fields.';
        contactStatus.className = 'status status-error';
        contactBtn.disabled = false;
        contactBtn.classList.remove('is-loading');
        return;
      }

      try {
        const resp = await fetch(contactForm.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          contactForm.reset();
          contactStatus.textContent = 'Thanks! Your message has been sent.';
          contactStatus.className = 'status status-success';
        } else {
          contactStatus.textContent = 'Something went wrong. Please try again.';
          contactStatus.className = 'status status-error';
        }
      } catch (err) {
        contactStatus.textContent = 'Network error. Please try again.';
        contactStatus.className = 'status status-error';
      } finally {
        contactBtn.disabled = false;
        contactBtn.classList.remove('is-loading');
      }
    });