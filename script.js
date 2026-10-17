(function () {
  const form = document.getElementById('feedback-form');
  const conditionals = Array.from(form.querySelectorAll('.conditional'));

  // A block is visible when its own rule matches AND every enclosing
  // conditional block is visible too. Rules: name=value (that option is
  // checked), name=* (anything checked), name= (nothing checked).
  function ruleMatches(el) {
    const [name, expected] = el.dataset.showWhen.split('=');
    const anyChecked = form.querySelector(`input[name="${name}"]:checked`);
    if (expected === '*') return !!anyChecked;
    if (expected === '') return !anyChecked;
    return !!form.querySelector(`input[name="${name}"][value="${expected}"]:checked`);
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
    if (e.target.type === 'radio' || e.target.type === 'checkbox') updateVisibility();
    clearError(e.target);
  });
  form.addEventListener('input', (e) => clearError(e.target));

  // Custom dropdowns (styled after shadcn/ui Select). The native <select>
  // stays in the form, hidden, so validation and submission are unchanged.
  const CHEVRON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function enhanceSelect(select) {
    const label = form.querySelector(`label[for="${select.id}"]`);
    const wrap = document.createElement('div');
    wrap.className = 'select';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = `${select.id}-trigger`;
    trigger.className = 'select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${select.id}-listbox`);
    trigger.innerHTML = `<span class="select-value"></span>${CHEVRON}`;
    const valueEl = trigger.firstElementChild;
    if (label) {
      label.id = label.id || `${select.id}-label`;
      label.htmlFor = trigger.id;
      trigger.setAttribute('aria-labelledby', `${label.id} ${trigger.id}`);
    }

    const list = document.createElement('div');
    list.id = `${select.id}-listbox`;
    list.className = 'select-content';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    list.hidden = true;
    if (label) list.setAttribute('aria-labelledby', label.id);

    const options = Array.from(select.options).filter((o) => !o.disabled);
    const items = options.map((opt, i) => {
      const item = document.createElement('div');
      item.id = `${select.id}-option-${i}`;
      item.className = 'select-item';
      item.setAttribute('role', 'option');
      item.innerHTML = `<span class="select-item-text"></span><span class="select-item-indicator">${CHECK}</span>`;
      item.firstElementChild.textContent = opt.textContent;
      item.addEventListener('pointermove', () => highlight(i));
      item.addEventListener('click', () => choose(i));
      list.appendChild(item);
      return item;
    });
    wrap.append(trigger, list);

    const placeholder = select.querySelector('option[value=""]')?.textContent || 'Select…';
    let active = -1;
    let typed = '';
    let typedTimer;

    function render() {
      const i = options.findIndex((o) => o.selected && o.value !== '');
      valueEl.textContent = i >= 0 ? options[i].textContent : placeholder;
      trigger.toggleAttribute('data-placeholder', i < 0);
      items.forEach((item, j) => item.setAttribute('aria-selected', String(j === i)));
      trigger.disabled = select.disabled;
    }

    function highlight(i) {
      active = i;
      items.forEach((item, j) => item.toggleAttribute('data-highlighted', j === i));
      if (i >= 0) {
        list.setAttribute('aria-activedescendant', items[i].id);
        items[i].scrollIntoView({ block: 'nearest' });
      }
    }

    function open() {
      if (select.disabled || !list.hidden) return;
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      // Open upwards when there isn't room below.
      const below = window.innerHeight - trigger.getBoundingClientRect().bottom;
      list.dataset.side = below < list.offsetHeight + 8 && trigger.getBoundingClientRect().top > below ? 'top' : 'bottom';
      const selected = options.findIndex((o) => o.selected && o.value !== '');
      highlight(selected >= 0 ? selected : 0);
      list.focus({ preventScroll: true });
    }

    function close(focusTrigger) {
      if (list.hidden) return;
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      highlight(-1);
      if (focusTrigger) trigger.focus();
    }

    function choose(i) {
      if (!options[i].selected) {
        options[i].selected = true;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      render();
      close(true);
    }

    function typeahead(char) {
      clearTimeout(typedTimer);
      typed += char.toLowerCase();
      typedTimer = setTimeout(() => { typed = ''; }, 600);
      const i = options.findIndex((o) => o.textContent.toLowerCase().startsWith(typed));
      if (i >= 0) highlight(i);
    }

    trigger.addEventListener('click', () => (list.hidden ? open() : close(true)));
    trigger.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        open();
      } else if (e.key.length === 1 && /\S/.test(e.key)) {
        open();
        typeahead(e.key);
      }
    });

    list.addEventListener('keydown', (e) => {
      const last = items.length - 1;
      if (e.key === 'ArrowDown') highlight(Math.min(active + 1, last));
      else if (e.key === 'ArrowUp') highlight(Math.max(active - 1, 0));
      else if (e.key === 'Home') highlight(0);
      else if (e.key === 'End') highlight(last);
      else if (e.key === ' ' && typed) typeahead(' ');
      else if (e.key === 'Enter' || e.key === ' ') { if (active >= 0) choose(active); }
      else if (e.key === 'Escape') close(true);
      else if (e.key === 'Tab') { close(false); return; }
      else if (e.key.length === 1 && /\S/.test(e.key)) typeahead(e.key);
      else return;
      e.preventDefault();
    });

    list.addEventListener('focusout', (e) => {
      if (!wrap.contains(e.relatedTarget)) close(false);
    });
    document.addEventListener('pointerdown', (e) => {
      if (!wrap.contains(e.target)) close(false);
    });

    // Keep in sync when the field is shown/hidden (disabled) or reset.
    new MutationObserver(render).observe(select, { attributes: true, attributeFilter: ['disabled'] });
    select.addEventListener('change', render);
    select.selectTrigger = trigger;
    render();
  }

  form.querySelectorAll('select').forEach(enhanceSelect);

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
    return input.type === 'radio' || input.type === 'checkbox' ? input.closest('fieldset') : input.closest('.field, .nested') || input.parentElement;
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

    form.querySelectorAll('[data-required-group]:not([hidden])').forEach((group) => {
      const boxes = group.querySelectorAll(`input[name="${group.dataset.requiredGroup}"]`);
      if (!boxes.length || boxes[0].disabled) return;
      clearError(boxes[0]);
      if (Array.from(boxes).some((b) => b.checked)) return;
      showError(boxes[0], 'Please select at least one product.');
      if (!firstInvalid || boxes[0].compareDocumentPosition(firstInvalid) & Node.DOCUMENT_POSITION_FOLLOWING) {
        firstInvalid = boxes[0];
      }
    });

    if (firstInvalid) (firstInvalid.selectTrigger || firstInvalid).focus();
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

    const data = new FormData(form);
    const fields = {};
    data.forEach((value, key) => {
      if (typeof value === 'string') fields[key] = value;
    });
    // Each campus has its own product list and several products can be
    // ticked; the sheet gets them in one Product cell, e.g. "SNS Belt, Other: Cap".
    const products = [...data.getAll('product_sns'), ...data.getAll('product_tkh')]
      .map((p) => (p === 'Other' && fields.product_other ? `Other: ${fields.product_other}` : p));
    delete fields.product_sns;
    delete fields.product_tkh;
    delete fields.product_other;
    if (products.length) fields.product = products.join(', ');

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
