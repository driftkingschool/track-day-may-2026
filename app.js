/* =====================================================
   DKS Track Days May 2026 , Landing Page Logic
   - Multi-step form navigation
   - Live price calculator
   - Validation
   - Google Form submission + CardCom redirect
   ===================================================== */

'use strict';

/* ====== CONFIG ====== */
/*
 * הקמה:
 * 1. יוצרים Apps Script לפי ההוראות בקובץ 05_apps_script_create_form.js
 * 2. מפעילים createDksTrackDayForm() פעם אחת (Run בדף ה-Apps Script)
 * 3. Deploy as Web App > Anyone, ומעתיקים את ה-URL
 * 4. מעדכנים CONFIG.appsScriptUrl למטה
 * 5. Push update ל-GitHub
 */
const CONFIG = {
  // Apps Script Web App URL , מעבד הכל (שמירה ל-Form + יצירת LP CardCom)
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbyX80BdKV6fdp7ylZwmIKVSQOGWLQugqnoEs57EiViBZNdN5zI0U08qsVyo1iebB6N7ow/exec',

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

/* ====== SUBMIT: Apps Script proxy (saves to Form + creates CardCom LP) ====== */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!validateStep(3)) return;

  const submitBtn = form.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'שולח...';

  const data = collectFormData();
  const priceResult = calculatePrice(data);
  const formData = new FormData(form);

  if (!CONFIG.appsScriptUrl || CONFIG.appsScriptUrl.includes('PLACEHOLDER')) {
    alert('שגיאה: ה-Backend עוד לא הוגדר. צור קשר ב-053-775-7323 להשלמת ההרשמה.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'שלח ועבור לתשלום ←';
    return;
  }

  // Build single payload for Apps Script (saves to Form + creates LP)
  const payload = {
    fullName: formData.get('fullName') || '',
    idNumber: formData.get('idNumber') || '',
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
    racingLicense: formData.get('racingLicense') || '',
    eventDate: formData.get('eventDate') || '',
    carClass: formData.get('carClass') || '',
    additionalDriver: formData.get('additionalDriver') || '',
    additionalName: formData.get('additionalName') || '',
    additionalId: formData.get('additionalId') || '',
    additionalLicense: formData.get('additionalLicense') || '',
    helmetPrimary: formData.get('helmetPrimary') || '',
    helmetSecondary: formData.get('helmetSecondary') || '',
    paymentOption: formData.get('paymentOption') || 'deposit',
    notes: formData.get('notes') || '',
    calculatedTotal: priceResult.total
  };

  try {
    const response = await fetch(CONFIG.appsScriptUrl, {
      method: 'POST',
      // Apps Script Web Apps prefer text/plain for cross-origin POSTs to avoid CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'שגיאה בעיבוד ההרשמה');
    }

    // Redirect to CardCom payment page
    window.location.href = result.lpUrl;

  } catch (err) {
    console.error('Submission error:', err);
    alert('שגיאה: ' + (err.message || 'לא הצלחנו לעבד את הרישום') + '\nצור קשר 053-775-7323');
    submitBtn.disabled = false;
    submitBtn.textContent = 'שלח ועבור לתשלום ←';
  }
});

/* ====== STATUS BANNER (post-CardCom redirect) ====== */
function showStatusBanner() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if (!status) return;

  const banner = document.getElementById('status-banner');
  const icon = document.getElementById('status-icon');
  const title = document.getElementById('status-title');
  const msg = document.getElementById('status-msg');
  const closeBtn = document.getElementById('status-close');
  if (!banner) return;

  const states = {
    success: {
      icon: '✅',
      title: 'תשלום בוצע. ההרשמה אושרה.',
      msg: 'תקבלי אישור באימייל. נתראה במסלול. בלי גבולות, רק עשן.'
    },
    failed: {
      icon: '⚠️',
      title: 'התשלום לא הצליח.',
      msg: 'נסה שוב או צור קשר 053-775-7323. ההרשמה לא נקלטה.'
    },
    cancel: {
      icon: 'ℹ️',
      title: 'התשלום בוטל.',
      msg: 'אפשר לחזור ולמלא טופס שוב. אם יש שאלה, 053-775-7323.'
    }
  };
  const s = states[status];
  if (!s) return;

  banner.classList.add(status);
  icon.textContent = s.icon;
  title.textContent = s.title;
  msg.textContent = s.msg;
  banner.hidden = false;

  closeBtn.addEventListener('click', () => { banner.hidden = true; });
}

/* ====== INIT ====== */
syncConditionalFields();
updatePriceDisplay();
showStatusBanner();
