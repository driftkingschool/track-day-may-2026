/* =====================================================
   DKS Track Days May 2026 , Landing Page Logic
   - Multi-step form navigation
   - Live price calculator
   - Validation
   - Google Form submission + CardCom redirect
   ===================================================== */

'use strict';

/* ====== CONFIG (לעדכון אחרי יצירת Google Form ו-CardCom) ====== */
const CONFIG = {
  // Google Form: לעדכן אחרי שפול יוצר את הטופס
  googleForm: {
    formId: 'PLACEHOLDER_FORM_ID',
    actionUrl: 'https://docs.google.com/forms/d/e/PLACEHOLDER_FORM_ID/formResponse',
    entries: {
      fullName: 'entry.PLACEHOLDER_NAME',
      idNumber: 'entry.PLACEHOLDER_ID',
      phone: 'entry.PLACEHOLDER_PHONE',
      email: 'entry.PLACEHOLDER_EMAIL',
      eventDate: 'entry.PLACEHOLDER_DATE',
      carClass: 'entry.PLACEHOLDER_CARCLASS',
      racingLicense: 'entry.PLACEHOLDER_LICENSE',
      additionalDriver: 'entry.PLACEHOLDER_ADDDRIVER',
      additionalName: 'entry.PLACEHOLDER_ADDNAME',
      additionalId: 'entry.PLACEHOLDER_ADDID',
      additionalLicense: 'entry.PLACEHOLDER_ADDLICENSE',
      helmetPrimary: 'entry.PLACEHOLDER_HELMET1',
      helmetSecondary: 'entry.PLACEHOLDER_HELMET2',
      paymentOption: 'entry.PLACEHOLDER_PAYOPT',
      notes: 'entry.PLACEHOLDER_NOTES',
      calculatedTotal: 'entry.PLACEHOLDER_TOTAL'
    }
  },

  // CardCom: לעדכן אחרי שAria מקימה את הדפים
  cardcom: {
    deposit: 'https://secure.cardcom.solutions/PLACEHOLDER_DEPOSIT',
    400: 'https://secure.cardcom.solutions/PLACEHOLDER_400',
    450: 'https://secure.cardcom.solutions/PLACEHOLDER_450',
    500: 'https://secure.cardcom.solutions/PLACEHOLDER_500',
    550: 'https://secure.cardcom.solutions/PLACEHOLDER_550',
    650: 'https://secure.cardcom.solutions/PLACEHOLDER_650',
    700: 'https://secure.cardcom.solutions/PLACEHOLDER_700',
    750: 'https://secure.cardcom.solutions/PLACEHOLDER_750',
    800: 'https://secure.cardcom.solutions/PLACEHOLDER_800',
    850: 'https://secure.cardcom.solutions/PLACEHOLDER_850'
  },

  pricing: {
    base: { regular: 400, highHP: 500 },
    addons: { additionalDriver: 250, helmetRental: 50 },
    deposit: 50
  },

  validMatrixPrices: [400, 450, 500, 550, 650, 700, 750, 800, 850]
};

/* ====== DOM REFERENCES ====== */
const form = document.getElementById('registration-form');
const steps = document.querySelectorAll('.form-step');
const progressSteps = document.querySelectorAll('.progress-step');

/* ====== MULTI-STEP NAVIGATION ====== */
function showStep(stepNumber) {
  steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === stepNumber));
  progressSteps.forEach(p => {
    const num = Number(p.dataset.step);
    p.classList.toggle('active', num === stepNumber);
    p.classList.toggle('done', num < stepNumber);
  });
  // Scroll to top of form section smoothly
  document.getElementById('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.btn-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const currentStep = Number(btn.closest('.form-step').dataset.step);
    if (validateStep(currentStep)) {
      showStep(Number(btn.dataset.target));
    }
  });
});
document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', () => showStep(Number(btn.dataset.target)));
});

/* ====== VALIDATION ====== */
function validateStep(stepNumber) {
  const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
  const inputs = step.querySelectorAll('input[required], select[required]');
  let valid = true;
  const errors = new Set();

  inputs.forEach(input => {
    // For radio groups, check if any in the group is checked
    if (input.type === 'radio') {
      const groupChecked = step.querySelector(`input[name="${input.name}"]:checked`);
      if (!groupChecked) {
        errors.add(input.name);
        valid = false;
      }
      return;
    }

    if (!input.checkValidity()) {
      input.classList.add('invalid');
      errors.add(input.name);
      const errEl = step.querySelector(`[data-error="${input.name}"]`);
      if (errEl) errEl.classList.add('show');
      valid = false;
    } else {
      input.classList.remove('invalid');
      const errEl = step.querySelector(`[data-error="${input.name}"]`);
      if (errEl) errEl.classList.remove('show');
    }
  });

  if (!valid) {
    const firstInvalid = step.querySelector('.invalid, input[required]:not(:checked)');
    if (firstInvalid && firstInvalid.scrollIntoView) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  return valid;
}

// Live validation feedback
form.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('input, select, textarea') && t.classList.contains('invalid') && t.checkValidity()) {
    t.classList.remove('invalid');
    const errEl = t.closest('label')?.querySelector('.error-msg');
    if (errEl) errEl.classList.remove('show');
  }
});

/* ====== CONDITIONAL FIELDS (Progressive Disclosure) ====== */
function syncConditionalFields() {
  const additionalDriver = form.querySelector('input[name="additionalDriver"]:checked')?.value;
  const isYes = additionalDriver === 'yes';
  document.getElementById('additional-driver-fields').hidden = !isYes;
  document.getElementById('helmet-secondary-group').hidden = !isYes;
}
form.addEventListener('change', syncConditionalFields);

/* ====== LIVE PRICE CALCULATOR ====== */
function collectFormData() {
  const data = {};
  ['carClass', 'additionalDriver', 'helmetPrimary', 'helmetSecondary', 'paymentOption']
    .forEach(name => {
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      data[name] = checked ? checked.value : null;
    });
  return data;
}

function calculatePrice(d) {
  const breakdown = [];
  let total = d.carClass === 'highHP' ? CONFIG.pricing.base.highHP : CONFIG.pricing.base.regular;
  breakdown.push({
    label: d.carClass === 'highHP' ? 'רכב דריפט 300+ כ"ס' : 'רכב רגיל',
    amount: total
  });

  if (d.additionalDriver === 'yes') {
    const addAmount = CONFIG.pricing.addons.additionalDriver;
    total += addAmount;
    breakdown.push({ label: 'נהג נוסף', amount: addAmount });

    if (d.helmetSecondary === 'yes') {
      total += CONFIG.pricing.addons.helmetRental;
      breakdown.push({ label: 'השכרת קסדה לנהג נוסף', amount: CONFIG.pricing.addons.helmetRental });
    }
  }

  if (d.helmetPrimary === 'yes') {
    total += CONFIG.pricing.addons.helmetRental;
    breakdown.push({ label: 'השכרת קסדה לנהג ראשי', amount: CONFIG.pricing.addons.helmetRental });
  }

  const payNow = d.paymentOption === 'full' ? total : CONFIG.pricing.deposit;
  const payLater = d.paymentOption === 'full' ? 0 : Math.max(0, total - CONFIG.pricing.deposit);
  const validPrice = CONFIG.validMatrixPrices.includes(total);

  return { total, payNow, payLater, breakdown, validPrice };
}

function updatePriceDisplay() {
  const data = collectFormData();
  const result = calculatePrice(data);

  document.getElementById('total-price').textContent = `${result.total} ₪`;
  document.getElementById('pay-now').textContent = `${result.payNow} ₪`;
  document.getElementById('pay-later').textContent = `${result.payLater} ₪`;

  // Full price label on payment-tile
  const fullDisp = document.getElementById('full-price-display');
  if (fullDisp) fullDisp.textContent = `${result.total} ₪`;

  // Breakdown list
  const list = document.getElementById('breakdown-list');
  list.innerHTML = result.breakdown
    .map(item => `<li><span>${item.label}</span><span>${item.amount} ₪</span></li>`)
    .join('');

  // Warning if not in matrix
  const warn = document.getElementById('warning');
  if (!result.validPrice) {
    warn.hidden = false;
    warn.textContent = `שים לב, סכום ${result.total} ₪ לא תואם למטריצת המחירים. צור קשר 053-775-7323`;
  } else {
    warn.hidden = true;
  }
}

// Recalculate on every form change
form.addEventListener('change', updatePriceDisplay);
form.addEventListener('input', updatePriceDisplay);

/* ====== SUBMIT: Google Form + CardCom Redirect ====== */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateStep(3)) return;

  // Disable submit button
  const submitBtn = form.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'שולח...';

  const data = collectFormData();
  const priceResult = calculatePrice(data);
  const formData = new FormData(form);

  // Build Google Form submission payload
  const params = new URLSearchParams();
  const E = CONFIG.googleForm.entries;
  params.append(E.fullName, formData.get('fullName') || '');
  params.append(E.idNumber, formData.get('idNumber') || '');
  params.append(E.phone, formData.get('phone') || '');
  params.append(E.email, formData.get('email') || '');
  params.append(E.eventDate, formData.get('eventDate') || '');
  params.append(E.carClass, formData.get('carClass') || '');
  params.append(E.racingLicense, formData.get('racingLicense') || '');
  params.append(E.additionalDriver, formData.get('additionalDriver') || '');
  params.append(E.additionalName, formData.get('additionalName') || '');
  params.append(E.additionalId, formData.get('additionalId') || '');
  params.append(E.additionalLicense, formData.get('additionalLicense') || '');
  params.append(E.helmetPrimary, formData.get('helmetPrimary') || '');
  params.append(E.helmetSecondary, formData.get('helmetSecondary') || '');
  params.append(E.paymentOption, formData.get('paymentOption') || '');
  params.append(E.notes, formData.get('notes') || '');
  params.append(E.calculatedTotal, String(priceResult.total));

  // Submit to Google Form (no-cors fire-and-forget)
  try {
    await fetch(CONFIG.googleForm.actionUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
  } catch (err) {
    console.warn('Google Form submission warning:', err);
    // Continue regardless, since no-cors means we cannot read the response anyway
  }

  // Redirect to CardCom checkout
  let cardcomUrl;
  if (data.paymentOption === 'deposit') {
    cardcomUrl = CONFIG.cardcom.deposit;
  } else {
    cardcomUrl = CONFIG.cardcom[priceResult.total];
  }

  if (!cardcomUrl || cardcomUrl.includes('PLACEHOLDER')) {
    alert('שגיאה: דף הסליקה עוד לא הוקם. צור קשר ב-053-775-7323 להשלמת ההרשמה.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'שלח ועבור לתשלום ←';
    return;
  }

  // Pass tracking info via URL params (CardCom v11 supports ReturnValue)
  const trackingValue = encodeURIComponent(
    `${formData.get('eventDate')}|${data.carClass}|driver=${data.additionalDriver}|h1=${data.helmetPrimary}|h2=${data.helmetSecondary || 'none'}|total=${priceResult.total}`
  );
  const finalUrl = cardcomUrl + (cardcomUrl.includes('?') ? '&' : '?') + 'ReturnValue=' + trackingValue;

  // Redirect
  window.location.href = finalUrl;
});

/* ====== INIT ====== */
syncConditionalFields();
updatePriceDisplay();
