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
    if (expected === '*') return value !== null;
    if (expected === '') return value === null;
    return value === expected;
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

  // Uploads
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_IMAGES = 5;

  function enabledFiles() {
    return Array.from(form.querySelectorAll('input[type="file"]:not(:disabled)'))
      .flatMap((input) => Array.from(input.files));
  }

  function encodeFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: reader.result.split(',')[1],
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = document.getElementById('form-error');
    formError.hidden = true;
    if (!validate()) return;

    const files = enabledFiles();
    const tooBig = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      formError.textContent = `"${tooBig.name}" is larger than 5 MB. Please choose a smaller image.`;
      formError.hidden = false;
      return;
    }
    if (files.length > MAX_IMAGES) {
      formError.textContent = `Please upload at most ${MAX_IMAGES} images.`;
      formError.hidden = false;
      return;
    }

    const fields = {};
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string') fields[key] = value;
    });
    // Each campus has its own product list; the sheet gets a single Product.
    const product = fields.product_sns || fields.product_tkh;
    delete fields.product_sns;
    delete fields.product_tkh;
    if (product) fields.product = product;

    const endpoint = form.dataset.endpoint;
    const button = document.getElementById('submit-btn');

    if (endpoint) {
      button.disabled = true;
      button.textContent = 'Submitting…';
      try {
        const payload = { fields, files: await Promise.all(files.map(encodeFile)) };
        // text/plain keeps this a "simple" request, which Google Apps Script
        // web apps accept without a CORS preflight.
        const res = await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const result = await res.json();
        if (!res.ok || !result.ok) throw new Error(result.error || `HTTP ${res.status}`);
      } catch (err) {
        console.error(err);
        formError.textContent = 'Something went wrong while submitting. Please try again.';
        const detail = document.createElement('small');
        detail.className = 'form-error-detail';
        detail.textContent = err instanceof TypeError
          ? `Details: could not reach the server (${err.message}).`
          : `Details: ${err.message}`;
        formError.append(document.createElement('br'), detail);
        formError.hidden = false;
        button.disabled = false;
        button.textContent = 'Submit Feedback';
        return;
      }
    } else {
      console.log('Form submission (no endpoint configured):', fields, files);
    }

    form.hidden = true;
    document.getElementById('thank-you').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  updateVisibility();
})();
