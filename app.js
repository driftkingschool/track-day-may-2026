/* =====================================================
   DKS Track Days May 2026 , Landing Page Logic
   - Multi-step form navigation
   - Live price calculator
   - Validation
   - Google Form submission + CardCom redirect
   ===================================================== */

'use strict';

/* ====== I18N ====== */
const LANG_CYCLE = ['he', 'en', 'ru', 'ar'];
const LANG_LABELS = { he: 'HE', en: 'EN', ru: 'RU', ar: 'AR' };
const RTL_LANGS = new Set(['he', 'ar']);
const STORAGE_KEY = 'dks-tdm26-lang';

const I18N_BREAKDOWN = {
  carRegular: { he: 'רכב רגיל', en: 'Standard car', ru: 'Обычный авто', ar: 'سيارة عادية' },
  carHighHP:  { he: 'רכב דריפט 300+ כ"ס', en: 'Drift car 300+ HP', ru: 'Дрифт-кар 300+ л.с.', ar: 'سيارة دريفت +300 حصان' },
  addDriver:  { he: 'נהג נוסף', en: 'Additional driver', ru: 'Доп. водитель', ar: 'سائق إضافي' },
  helmet1:    { he: 'השכרת קסדה לנהג ראשי', en: 'Helmet rental (primary)', ru: 'Аренда шлема (осн.)', ar: 'استئجار خوذة (رئيسي)' },
  helmet2:    { he: 'השכרת קסדה לנהג נוסף', en: 'Helmet rental (additional)', ru: 'Аренда шлема (доп.)', ar: 'استئجار خوذة (إضافي)' }
};

const I18N_STATUS = {
  success: {
    he: { icon: '✅', title: 'תשלום בוצע. ההרשמה אושרה.', msg: 'תקבל אישור באימייל. נתראה במסלול. בלי גבולות, רק עשן.' },
    en: { icon: '✅', title: 'Payment successful. Registration confirmed.', msg: 'You\'ll receive an email confirmation. See you on the track. No limits, just smoke.' },
    ru: { icon: '✅', title: 'Оплата прошла. Регистрация подтверждена.', msg: 'Вы получите подтверждение по email. Увидимся на трассе.' },
    ar: { icon: '✅', title: 'تم الدفع. التسجيل مؤكد.', msg: 'ستصلك رسالة تأكيد بالبريد. نراك في المضمار.' }
  },
  failed: {
    he: { icon: '⚠️', title: 'התשלום לא הצליח.', msg: 'נסה שוב או צור קשר 053-775-7323. ההרשמה לא נקלטה.' },
    en: { icon: '⚠️', title: 'Payment failed.', msg: 'Try again or call 053-775-7323. Registration was not saved.' },
    ru: { icon: '⚠️', title: 'Оплата не прошла.', msg: 'Попробуйте снова или позвоните 053-775-7323. Регистрация не сохранена.' },
    ar: { icon: '⚠️', title: 'فشل الدفع.', msg: 'حاول مرة أخرى أو اتصل بـ 053-775-7323. لم يتم حفظ التسجيل.' }
  },
  cancel: {
    he: { icon: 'ℹ️', title: 'התשלום בוטל.', msg: 'אפשר לחזור ולמלא טופס שוב. אם יש שאלה, 053-775-7323.' },
    en: { icon: 'ℹ️', title: 'Payment canceled.', msg: 'You can fill in the form again. Questions? 053-775-7323.' },
    ru: { icon: 'ℹ️', title: 'Оплата отменена.', msg: 'Можно заполнить форму снова. Вопросы? 053-775-7323.' },
    ar: { icon: 'ℹ️', title: 'تم إلغاء الدفع.', msg: 'يمكنك ملء النموذج مرة أخرى. أسئلة؟ 053-775-7323.' }
  }
};

const I18N_ALERTS = {
  backendNotConfigured: {
    he: 'שגיאה: ה-Backend עוד לא הוגדר. צור קשר ב-053-775-7323.',
    en: 'Error: backend not configured. Call 053-775-7323.',
    ru: 'Ошибка: бэкенд не настроен. Позвоните 053-775-7323.',
    ar: 'خطأ: الواجهة الخلفية غير مُعدّة. اتصل بـ 053-775-7323.'
  },
  submitting: { he: 'שולח...', en: 'Sending...', ru: 'Отправка...', ar: 'جاري الإرسال...' },
  submitBtn: { he: 'שלח ועבור לתשלום', en: 'Submit & pay', ru: 'Отправить и оплатить', ar: 'إرسال والدفع' },
  generalError: {
    he: 'לא הצלחנו לעבד את הרישום',
    en: 'Could not process registration',
    ru: 'Не удалось обработать регистрацию',
    ar: 'تعذر معالجة التسجيل'
  },
  matrixWarn: {
    he: amt => `שים לב, סכום ${amt} ₪ לא תואם למטריצה. צור קשר 053-775-7323`,
    en: amt => `Note: amount ₪${amt} not in price matrix. Call 053-775-7323`,
    ru: amt => `Внимание: сумма ₪${amt} не в матрице. Звоните 053-775-7323`,
    ar: amt => `تنبيه: المبلغ ₪${amt} غير ضمن المصفوفة. اتصل بـ 053-775-7323`
  }
};

let currentLang = 'he';

function getStoredLang() {
  try { return localStorage.getItem(STORAGE_KEY) || 'he'; } catch { return 'he'; }
}
function setStoredLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
}

function applyLanguage(lang) {
  if (!LANG_CYCLE.includes(lang)) lang = 'he';
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';

  // Update all elements with data-{lang} attributes
  document.querySelectorAll('[data-he]').forEach(el => {
    const val = el.getAttribute('data-' + lang);
    if (val !== null) el.innerHTML = val;
  });

  // Update placeholders
  document.querySelectorAll('[data-placeholder-he]').forEach(el => {
    const val = el.getAttribute('data-placeholder-' + lang);
    if (val !== null) el.placeholder = val;
  });

  // Update language toggle labels (cycle to NEXT language)
  const idx = LANG_CYCLE.indexOf(lang);
  const nextLang = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
  document.querySelectorAll('[data-cur-lang]').forEach(el => {
    el.textContent = LANG_LABELS[nextLang];
  });

  setStoredLang(lang);

  // Re-render dynamic parts (price breakdown)
  if (typeof updatePriceDisplay === 'function') updatePriceDisplay();
  // Re-render status banner if visible
  if (typeof refreshStatusBannerLang === 'function') refreshStatusBannerLang();
}

function cycleLanguage() {
  const idx = LANG_CYCLE.indexOf(currentLang);
  const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
  applyLanguage(next);
}

document.addEventListener('click', e => {
  if (e.target.closest('#lang-toggle-top') || e.target.closest('#lang-toggle-float')) {
    cycleLanguage();
  }
});

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
  const L = key => I18N_BREAKDOWN[key][currentLang] || I18N_BREAKDOWN[key].he;
  let total = d.carClass === 'highHP' ? CONFIG.pricing.base.highHP : CONFIG.pricing.base.regular;
  breakdown.push({
    label: d.carClass === 'highHP' ? L('carHighHP') : L('carRegular'),
    amount: total
  });

  if (d.additionalDriver === 'yes') {
    const addAmount = CONFIG.pricing.addons.additionalDriver;
    total += addAmount;
    breakdown.push({ label: L('addDriver'), amount: addAmount });

    if (d.helmetSecondary === 'yes') {
      total += CONFIG.pricing.addons.helmetRental;
      breakdown.push({ label: L('helmet2'), amount: CONFIG.pricing.addons.helmetRental });
    }
  }

  if (d.helmetPrimary === 'yes') {
    total += CONFIG.pricing.addons.helmetRental;
    breakdown.push({ label: L('helmet1'), amount: CONFIG.pricing.addons.helmetRental });
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
    const fn = I18N_ALERTS.matrixWarn[currentLang] || I18N_ALERTS.matrixWarn.he;
    warn.textContent = fn(result.total);
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
  submitBtn.textContent = I18N_ALERTS.submitting[currentLang] || I18N_ALERTS.submitting.he;

  const data = collectFormData();
  const priceResult = calculatePrice(data);
  const formData = new FormData(form);

  if (!CONFIG.appsScriptUrl || CONFIG.appsScriptUrl.includes('PLACEHOLDER')) {
    alert(I18N_ALERTS.backendNotConfigured[currentLang] || I18N_ALERTS.backendNotConfigured.he);
    submitBtn.disabled = false;
    submitBtn.textContent = I18N_ALERTS.submitBtn[currentLang] || I18N_ALERTS.submitBtn.he;
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
    const generalMsg = I18N_ALERTS.generalError[currentLang] || I18N_ALERTS.generalError.he;
    alert((err.message || generalMsg) + '\n053-775-7323');
    submitBtn.disabled = false;
    submitBtn.textContent = I18N_ALERTS.submitBtn[currentLang] || I18N_ALERTS.submitBtn.he;
  }
});

/* ====== STATUS BANNER (post-CardCom redirect) ====== */
let _currentStatusKey = null;

function refreshStatusBannerLang() {
  if (!_currentStatusKey) return;
  const banner = document.getElementById('status-banner');
  if (!banner || banner.hidden) return;
  const s = (I18N_STATUS[_currentStatusKey] || {})[currentLang] || (I18N_STATUS[_currentStatusKey] || {}).he;
  if (!s) return;
  document.getElementById('status-icon').textContent = s.icon;
  document.getElementById('status-title').textContent = s.title;
  document.getElementById('status-msg').textContent = s.msg;
}

function showStatusBanner() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if (!status || !I18N_STATUS[status]) return;

  const banner = document.getElementById('status-banner');
  const closeBtn = document.getElementById('status-close');
  if (!banner) return;

  _currentStatusKey = status;
  banner.classList.add(status);
  banner.hidden = false;
  refreshStatusBannerLang();

  closeBtn.addEventListener('click', () => {
    banner.hidden = true;
    _currentStatusKey = null;
  });
}

/* ====== REVEAL ON SCROLL ====== */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || els.length === 0) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => obs.observe(el));
}

/* ====== INIT ====== */
applyLanguage(getStoredLang());
syncConditionalFields();
updatePriceDisplay();
showStatusBanner();
initReveal();
