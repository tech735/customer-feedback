(function () {
  const form = document.getElementById('feedback-form');
  const conditionals = Array.from(form.querySelectorAll('.conditional'));

  function radioValue(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }

  // A block is visible when its own rule matches AND every enclosing
  // conditional block is visible too.
  function ruleMatches(el) {
    const [name, expected] = el.dataset.showWhen.split('=');
    const value = radioValue(name);
    return expected === '*' ? value !== null : value === expected;
  }

  function isVisible(el) {
    for (let node = el; node && node !== form; node = node.parentElement) {
      if (node.classList.contains('conditional') && !ruleMatches(node)) return false;
    }
    return true;
  }

  function updateVisibility() {
    conditionals.forEach((el) => {
      const show = isVisible(el);
      el.hidden = !show;
      // Disabled controls are skipped by validation and not submitted.
      el.querySelectorAll('input, select, textarea').forEach((input) => {
        const owner = input.closest('.conditional');
        input.disabled = !isVisible(owner);
      });
    });
  }

  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') updateVisibility();
    clearError(e.target);
  });
  form.addEventListener('input', (e) => clearError(e.target));

  // Image previews
  form.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const box = form.querySelector(`.previews[data-for="${input.id}"]`);
      box.innerHTML = '';
      Array.from(input.files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        img.onload = () => URL.revokeObjectURL(img.src);
        box.appendChild(img);
      });
    });
  });

  // Validation
  function errorHost(input) {
    return input.type === 'radio' ? input.closest('fieldset') : input.closest('.field, .nested') || input.parentElement;
  }

  function clearError(input) {
    const host = errorHost(input);
    if (!host) return;
    host.classList.remove('invalid');
    input.classList.remove('invalid');
    const msg = host.querySelector(':scope > .field-error');
    if (msg) msg.remove();
  }

  function showError(input, message) {
    const host = errorHost(input);
    if (host.querySelector(':scope > .field-error')) return;
    host.classList.add('invalid');
    const msg = document.createElement('div');
    msg.className = 'field-error';
    msg.textContent = message;
    host.appendChild(msg);
  }

  function validate() {
    let firstInvalid = null;
    const seenRadioGroups = new Set();

    form.querySelectorAll('input, select, textarea').forEach((input) => {
      if (input.disabled) return;
      if (input.type === 'radio') {
        if (seenRadioGroups.has(input.name)) return;
        seenRadioGroups.add(input.name);
      }
      clearError(input);
      if (input.checkValidity()) return;

      let message = 'This field is required.';
      if (input.type === 'radio') message = 'Please select an option.';
      else if (input.validity.patternMismatch) message = 'Please enter a valid phone number.';
      showError(input, message);
      firstInvalid = firstInvalid || input;
    });

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = document.getElementById('form-error');
    formError.hidden = true;
    if (!validate()) return;

    const data = new FormData(form);
    const endpoint = form.dataset.endpoint;
    const button = document.getElementById('submit-btn');

    if (endpoint) {
      button.disabled = true;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        formError.textContent = 'Something went wrong while submitting. Please try again.';
        formError.hidden = false;
        button.disabled = false;
        return;
      }
    } else {
      console.log('Form submission (no endpoint configured):', Object.fromEntries(data));
    }

    form.hidden = true;
    document.getElementById('thank-you').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  updateVisibility();
})();
