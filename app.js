// ==========================================================================
// Scheme Connect - Main Application Logic & Interactive Engines
// Tagline: Know • Access • Benefit
// Supporting Tagline: Government Schemes for a Better Tomorrow
// ==========================================================================

// Global State
const STATE = {
  schemes: [],
  savedSchemeIds: new Set(),
  activeUser: null,
  currentCategory: 'all',
  language: localStorage.getItem('scheme_connect_language') || 'en',
  filters: {
    search: '',
    category: 'all',
    state: 'all',
    beneficiary: 'all',
    type: 'all'
  },
  fontSize: 16,
  isHighContrast: false,
  selectedSchemeForModal: null
};

// Storage Keys
const STORAGE_KEYS = {
  SCHEMES: 'scheme_connect_db_v1',
  BOOKMARKS: 'scheme_connect_bookmarks',
  USER: 'scheme_connect_user',
  HIGH_CONTRAST: 'scheme_connect_high_contrast',
  FONT_SIZE: 'scheme_connect_font_size'
};

// Category SVG Icons Definition
const CATEGORY_ICONS = {
  education: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  agriculture: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 1 1-2 0v-.07A7.002 7.002 0 0 1 5.07 11H5a1 1 0 1 1 0-2h.07A7.002 7.002 0 0 1 11 5.07V5a1 1 0 1 1 2 0v.07A7.002 7.002 0 0 1 18.93 11H19a1 1 0 1 1 0 2h-.07A7.002 7.002 0 0 1 13 16.93z"/></svg>`,
  healthcare: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`,
  employment: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  women: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M12 13v8M9 18h6"/></svg>`,
  housing: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  financial: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 7h8M8 11h8M12 11v6M14 17l-4-6"/></svg>`,
  social_welfare: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  skill: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initAccessibility();
  initLanguage();
  initNavigation();
  renderCategories();
  renderFeaturedSchemes();
  renderAllSchemes();
  initFilterControls();
  initEligibilityChecker();
  initContactForm();
  initAdminDashboard();
  initModals();
  updateStatsBadge();
  if (STATE.language === 'kn') {
    setLanguage('kn', false);
  }
});

// Load persistent data from localStorage or fallback to default
function initStorage() {
  // Load schemes
  try {
    const storedSchemes = localStorage.getItem(STORAGE_KEYS.SCHEMES);
    if (storedSchemes) {
      STATE.schemes = JSON.parse(storedSchemes);
    } else {
      STATE.schemes = [...INITIAL_SCHEMES];
      saveSchemesToStorage();
    }
  } catch (e) {
    console.error('Error loading schemes from storage:', e);
    STATE.schemes = [...INITIAL_SCHEMES];
  }

  // Load bookmarks
  try {
    const storedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (storedBookmarks) {
      STATE.savedSchemeIds = new Set(JSON.parse(storedBookmarks));
    }
  } catch (e) {
    console.error('Error loading bookmarks:', e);
  }

  // Load user
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      STATE.activeUser = JSON.parse(storedUser);
      updateUserNavUI();
    }
  } catch (e) {
    console.error('Error loading user:', e);
  }

  updateBookmarkNavCount();
}

function saveSchemesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEMES, JSON.stringify(STATE.schemes));
  } catch (e) {
    console.error('Error saving schemes:', e);
  }
}

function saveBookmarksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([...STATE.savedSchemeIds]));
    updateBookmarkNavCount();
  } catch (e) {
    console.error('Error saving bookmarks:', e);
  }
}

function updateBookmarkNavCount() {
  const countEl = document.getElementById('nav-saved-count');
  if (countEl) {
    countEl.textContent = STATE.savedSchemeIds.size;
  }
}

function updateStatsBadge() {
  const statsEl = document.getElementById('stats-total-schemes');
  if (statsEl) {
    statsEl.textContent = `${STATE.schemes.length}+`;
  }
}

// ==========================================================================
// Accessibility Controls (A-, A, A+, High Contrast, Voice Helper)
// ==========================================================================
function initAccessibility() {
  // Font Size
  const storedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
  if (storedFontSize) {
    STATE.fontSize = parseInt(storedFontSize, 10);
    document.documentElement.style.fontSize = `${STATE.fontSize}px`;
  }

  document.getElementById('btn-font-decrease')?.addEventListener('click', () => {
    if (STATE.fontSize > 13) {
      STATE.fontSize -= 1;
      applyFontSize();
    }
  });

  document.getElementById('btn-font-reset')?.addEventListener('click', () => {
    STATE.fontSize = 16;
    applyFontSize();
  });

  document.getElementById('btn-font-increase')?.addEventListener('click', () => {
    if (STATE.fontSize < 21) {
      STATE.fontSize += 1;
      applyFontSize();
    }
  });

  function applyFontSize() {
    document.documentElement.style.fontSize = `${STATE.fontSize}px`;
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, STATE.fontSize.toString());
    showToast(`Font size set to ${STATE.fontSize}px`);
  }

  // High Contrast Mode
  const storedContrast = localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST);
  if (storedContrast === 'true') {
    STATE.isHighContrast = true;
    document.body.classList.add('high-contrast');
    const label = document.getElementById('contrast-text');
    if (label) label.textContent = 'Normal View';
  }

  document.getElementById('btn-high-contrast')?.addEventListener('click', () => {
    STATE.isHighContrast = !STATE.isHighContrast;
    document.body.classList.toggle('high-contrast', STATE.isHighContrast);
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, STATE.isHighContrast.toString());
    const label = document.getElementById('contrast-text');
    if (label) {
      label.textContent = STATE.isHighContrast ? 'Normal View' : 'High Contrast';
    }
    showToast(STATE.isHighContrast ? 'High Contrast Mode Enabled' : 'Normal Color Theme Restored');
  });

  // Voice Reader Audio Helper
  document.getElementById('btn-voice-helper')?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const message = new SpeechSynthesisUtterance(
        "Welcome to Scheme Connect. Government Schemes for a Better Tomorrow. Know, Access, Benefit. Discover official government welfare schemes, check your eligibility, and visit verified official application portals."
      );
      message.rate = 0.95;
      message.pitch = 1.0;
      window.speechSynthesis.speak(message);
      showToast('Playing voice overview...');
    } else {
      showToast('Text-to-speech is not supported by your browser.');
    }
  });

  // Language selector integration
  document.getElementById('portal-lang-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'kn') {
      setLanguage('kn', true);
    } else {
      setLanguage('en', true);
    }
  });
}

// ==========================================================================
// Language Switcher & Bilingual Engine (Requirement #18)
// Primary: English, Secondary: Kannada (ಕನ್ನಡ)
// ==========================================================================
function initLanguage() {
  const toggleBtn = document.getElementById('btn-lang-toggle');
  toggleBtn?.addEventListener('click', () => {
    const nextLang = STATE.language === 'en' ? 'kn' : 'en';
    setLanguage(nextLang, true);
  });
}

window.setLanguage = function(lang, notify = true) {
  STATE.language = lang;
  localStorage.setItem('scheme_connect_language', lang);
  const isKn = lang === 'kn';
  document.body.classList.toggle('lang-kn', isKn);

  // Sync Assistant State if loaded
  if (typeof ASSISTANT_STATE !== 'undefined') {
    ASSISTANT_STATE.language = lang;
    const langBtn = document.getElementById('assistant-lang-toggle');
    if (langBtn) {
      langBtn.textContent = isKn ? 'ಕನ್ನಡ | EN' : 'EN | ಕನ್ನಡ';
    }
    const inputField = document.getElementById('assistant-text-input');
    if (inputField) {
      inputField.placeholder = isKn ? TRANSLATIONS.kn.assistant_input_placeholder : TRANSLATIONS.en.assistant_input_placeholder;
    }
    if (typeof renderSuggestedQuestions === 'function') {
      renderSuggestedQuestions();
    }
  }

  // Update navbar toggle label
  const navToggleLabel = document.getElementById('lang-toggle-label');
  if (navToggleLabel) {
    navToggleLabel.textContent = isKn ? 'English' : 'English / ಕನ್ನಡ';
  }

  const selectEl = document.getElementById('portal-lang-select');
  if (selectEl) {
    selectEl.value = isKn ? 'kn' : 'en';
  }

  // Translate all mapped interface strings
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Navigation Links
  safeSetText('nav-item-home', t.nav_home);
  safeSetText('nav-item-all-schemes', t.nav_all_schemes);
  safeSetText('nav-item-categories', t.nav_categories);
  safeSetText('nav-item-eligibility', t.nav_eligibility);
  safeSetText('nav-item-doc-checker', t.nav_doc_checker);
  safeSetText('nav-item-about', t.nav_about);
  safeSetText('nav-item-contact', t.nav_contact);
  safeSetText('nav-admin-label', t.nav_admin);
  if (!STATE.activeUser) safeSetText('nav-user-label', t.nav_login);

  // Top Bar
  safeSetText('topbar-official-tag', t.topbar_tag);
  safeSetText('label-text-size', t.text_size);
  safeSetText('contrast-text', STATE.isHighContrast ? t.normal_view : t.high_contrast);
  safeSetText('label-voice-reader', t.voice_reader);

  // Hero Section
  safeSetText('hero-pill-text', t.hero_pill);
  safeSetText('hero-headline-1', t.hero_headline_1);
  safeSetText('hero-headline-2', t.hero_headline_2);
  safeSetText('hero-desc-text', t.hero_description);
  safeSetText('label-hero-explore', t.btn_explore);
  safeSetText('label-hero-check', t.btn_check_eligibility);
  const heroSearchInput = document.getElementById('hero-search-input');
  if (heroSearchInput) heroSearchInput.placeholder = t.hero_search_placeholder;
  safeSetText('btn-hero-search-go', t.hero_search_btn);
  safeSetText('label-popular-searches', t.popular_searches);

  // Trust Counters
  safeSetText('label-trust-schemes', t.trust_verified_schemes);
  safeSetText('label-trust-categories', t.trust_categories);
  safeSetText('label-trust-coverage', t.trust_coverage);
  safeSetText('label-trust-free', t.trust_free);

  // Categories Section
  safeSetText('tag-categories', t.categories_tag);
  safeSetText('title-categories', t.categories_title);
  safeSetText('subtitle-categories', t.categories_subtitle);

  // Featured Schemes
  safeSetText('tag-featured', t.featured_tag);
  safeSetText('title-featured', t.featured_title);
  safeSetText('subtitle-featured', t.featured_subtitle);

  // All Schemes Section
  safeSetText('tag-all-schemes', t.all_schemes_tag);
  safeSetText('title-all-schemes', t.all_schemes_title);
  safeSetText('subtitle-all-schemes', t.all_schemes_subtitle);
  safeSetText('label-filter-cat', t.filter_category);
  safeSetText('label-filter-state', t.filter_state);
  safeSetText('label-filter-ben', t.filter_beneficiary);
  safeSetText('label-filter-type', t.filter_type);
  safeSetText('label-showing', t.showing_schemes);
  safeSetText('label-verified-count', t.verified_schemes_count);
  safeSetText('btn-clear-filters', t.btn_reset_filters);

  // Eligibility Checker
  safeSetText('tag-checker', t.checker_tag);
  safeSetText('title-checker', t.checker_title);
  safeSetText('subtitle-checker', t.checker_subtitle);
  safeSetText('banner-checker-title', t.checker_banner_title);
  safeSetText('banner-checker-subtitle', t.checker_banner_subtitle);
  safeSetText('label-field-age', t.field_age);
  safeSetText('label-field-state', t.field_state);
  safeSetText('label-field-occ', t.field_occupation);
  safeSetText('label-field-income', t.field_income);
  safeSetText('label-field-edu', t.field_education);
  safeSetText('label-field-cat', t.field_category);
  safeSetText('label-btn-check-relevant', t.btn_check_relevant);
  safeSetText('btn-reset-checker', t.btn_reset_form);
  safeSetText('matched-schemes-title', t.matched_schemes_found);
  safeSetText('matched-schemes-subtitle', t.matched_schemes_desc);

  // Document Checker
  safeSetText('tag-doc-checker', t.doc_checker_tag);
  safeSetText('title-doc-checker', t.doc_checker_title);
  safeSetText('tagline-doc-checker', `"${t.doc_checker_tagline}"`);
  safeSetText('subtitle-doc-checker', t.doc_checker_subtitle);
  safeSetText('label-btn-upload-doc', t.btn_upload_doc);
  safeSetText('label-btn-capture-cam', t.btn_capture_cam);
  safeSetText('label-applicant-name', t.applicant_name_label);
  const applicantInput = document.getElementById('doc-applicant-name-input');
  if (applicantInput) applicantInput.placeholder = t.applicant_name_placeholder;
  safeSetText('label-target-scheme', t.select_target_scheme);
  safeSetText('title-scheme-checklist', t.scheme_checklist_title);
  safeSetText('btn-clear-all-docs', t.btn_clear_docs);
  safeSetText('btn-generate-doc-report', t.btn_download_report);
  safeSetText('title-ai-report', t.ai_report_title);

  // How It Works
  safeSetText('tag-how', t.how_tag);
  safeSetText('title-how', t.how_title);
  safeSetText('subtitle-how', t.how_subtitle);
  safeSetText('step1-title', t.step1_title);
  safeSetText('step1-desc', t.step1_desc);
  safeSetText('step2-title', t.step2_title);
  safeSetText('step2-desc', t.step2_desc);
  safeSetText('step3-title', t.step3_title);
  safeSetText('step3-desc', t.step3_desc);
  safeSetText('step4-title', t.step4_title);
  safeSetText('step4-desc', t.step4_desc);

  // Why Choose
  safeSetText('tag-why', t.why_tag);
  safeSetText('title-why', t.why_title);
  safeSetText('subtitle-why', t.why_subtitle);

  // About Us
  safeSetText('tag-about', t.about_tag);
  safeSetText('title-about', t.about_title);
  safeSetText('subtitle-about', t.about_subtitle);
  safeSetText('about-core-quote', `"${t.about_quote}"`);
  safeSetText('about-disclosure-text', t.about_disclosure);
  safeSetText('portal-motto-banner', `"${t.motto}"`);

  // Contact
  safeSetText('tag-contact', t.contact_tag);
  safeSetText('title-contact', t.contact_title);
  safeSetText('subtitle-contact', t.contact_subtitle);
  safeSetText('title-form-send', t.form_send_message);
  safeSetText('label-form-name', t.form_name);
  safeSetText('label-form-email', t.form_email);
  safeSetText('label-form-subject', t.form_subject);
  safeSetText('label-form-message', t.form_message);
  safeSetText('label-btn-send-message', t.btn_send_message);
  safeSetText('title-helplines', t.helplines_title);

  // Footer
  safeSetText('footer-desc-text', t.footer_desc);
  safeSetText('footer-tagline-text', t.footer_tagline);
  safeSetText('footer-disclaimer-p', t.footer_disclaimer);
  safeSetText('footer-rights-label', t.all_rights);

  // Re-render Dynamic components with language
  renderCategories();
  renderFeaturedSchemes();
  renderAllSchemes();

  if (notify) {
    showToast(isKn ? 'ವೆಬ್‌ಸೈಟ್ ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ' : 'Website language set to English');
  }
};

function safeSetText(id, text) {
  if (!text) return;
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
  }
}

// ==========================================================================
// Navigation & Scrolling
// ==========================================================================
function initNavigation() {
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-toggle-btn');
  const navMenu = document.getElementById('nav-menu');
  mobileToggle?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    const expanded = navMenu?.classList.contains('active');
    mobileToggle.setAttribute('aria-expanded', expanded);
  });

  // Close mobile menu when clicking nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu?.classList.remove('active');
      mobileToggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

// ==========================================================================
// Render Categories Section
// ==========================================================================
function renderCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  const isKn = STATE.language === 'kn';
  const t = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;

  container.innerHTML = SCHEME_CATEGORIES.map(cat => {
    // Count matching schemes in active db
    const count = STATE.schemes.filter(s => s.categoryId === cat.id || s.category.toLowerCase().includes(cat.id.toLowerCase())).length;
    const iconSvg = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS.education;
    const catName = isKn && KANNADA_CATEGORIES[cat.id] ? KANNADA_CATEGORIES[cat.id] : cat.name;
    const countLabel = isKn ? `${count} ${t.schemes_count_label || 'ಯೋಜನೆಗಳು'}` : `${count} ${count === 1 ? 'Scheme' : 'Schemes'}`;

    return `
      <div class="category-card" data-category="${cat.id}">
        <div class="category-icon-box" aria-hidden="true">
          ${iconSvg}
        </div>
        <h3 class="category-name">${escapeHtml(catName)}</h3>
        <p class="category-description">${escapeHtml(cat.description)}</p>
        <div class="category-footer">
          <span class="category-count">${countLabel}</span>
          <button type="button" class="category-action-btn" onclick="filterByCategory('${cat.id}')">
            ${escapeHtml(t.btn_view_schemes || 'View Schemes')} &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Global category click handler
window.filterByCategory = function(categoryId) {
  STATE.filters.category = categoryId;
  const selectEl = document.getElementById('filter-category');
  if (selectEl) {
    selectEl.value = categoryId;
  }
  renderAllSchemes();
  const targetSection = document.getElementById('all-schemes');
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  }
};

// ==========================================================================
// Render Featured Schemes Section
// ==========================================================================
function renderFeaturedSchemes() {
  const container = document.getElementById('featured-schemes-grid');
  if (!container) return;

  const isKn = STATE.language === 'kn';
  const t = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
  const featured = STATE.schemes.filter(s => s.featured).slice(0, 6);

  container.innerHTML = featured.map(scheme => {
    const isBookmarked = STATE.savedSchemeIds.has(scheme.id);
    const catIcon = CATEGORY_ICONS[scheme.categoryId] || CATEGORY_ICONS.education;
    const schemeName = isKn && KANNADA_SCHEME_NAMES[scheme.id] ? KANNADA_SCHEME_NAMES[scheme.id] : scheme.name;
    const catName = isKn && KANNADA_CATEGORIES[scheme.categoryId] ? KANNADA_CATEGORIES[scheme.categoryId] : scheme.category;

    return `
      <div class="featured-scheme-card" data-id="${scheme.id}">
        <span class="featured-badge">${escapeHtml(t.featured_badge || '★ Flagship Scheme')}</span>
        <div class="featured-card-header">
          <div class="featured-card-icon">
            ${catIcon}
          </div>
          <div class="featured-card-meta">
            <span class="featured-category-tag">${escapeHtml(catName)}</span>
            <h3 class="featured-card-title">${escapeHtml(schemeName)}</h3>
          </div>
        </div>

        <div class="featured-dept">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/></svg>
          <span>${escapeHtml(scheme.department)}</span>
        </div>

        <p class="featured-desc">${escapeHtml(scheme.shortDescription)}</p>

        <div class="featured-highlights">
          <div class="highlight-row">
            <strong>${escapeHtml(t.key_benefit || 'Key Benefit:')}</strong>
            <span>${escapeHtml(scheme.benefits[0] || 'Direct government assistance')}</span>
          </div>
          <div class="highlight-row">
            <strong>${escapeHtml(t.eligibility_label || 'Eligibility:')}</strong>
            <span>${escapeHtml(scheme.eligibility[0] || 'Eligible Indian citizens')}</span>
          </div>
        </div>

        <div class="featured-card-actions">
          <button type="button" class="btn btn-primary btn-sm" onclick="openSchemeDetailsModal('${scheme.id}')">
            ${escapeHtml(t.btn_learn_more || 'Learn More')}
          </button>
          <button type="button" class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="toggleBookmark('${scheme.id}', this)" title="${isBookmarked ? 'Remove from Saved' : 'Save Scheme'}" aria-label="Bookmark Scheme">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Render All Schemes Directory & Filter Engine
// ==========================================================================
function renderAllSchemes() {
  const container = document.getElementById('schemes-cards-grid');
  const emptyState = document.getElementById('schemes-empty-state');
  const countBadge = document.getElementById('filter-result-count');
  if (!container) return;

  const isKn = STATE.language === 'kn';
  const t = TRANSLATIONS[STATE.language] || TRANSLATIONS.en;
  const { search, category, state, beneficiary, type } = STATE.filters;
  const searchLower = search.trim().toLowerCase();

  const filtered = STATE.schemes.filter(s => {
    // Search match
    if (searchLower) {
      const knName = KANNADA_SCHEME_NAMES[s.id] || '';
      const matchSearch =
        s.name.toLowerCase().includes(searchLower) ||
        knName.toLowerCase().includes(searchLower) ||
        s.shortDescription.toLowerCase().includes(searchLower) ||
        s.department.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower) ||
        s.benefits.some(b => b.toLowerCase().includes(searchLower)) ||
        s.eligibility.some(e => e.toLowerCase().includes(searchLower)) ||
        s.beneficiaryGroups.some(bg => bg.toLowerCase().includes(searchLower));
      if (!matchSearch) return false;
    }

    // Category match
    if (category !== 'all') {
      const matchCat = s.categoryId === category || s.category.toLowerCase().includes(category.toLowerCase());
      if (!matchCat) return false;
    }

    // State match
    if (state !== 'all') {
      if (state === 'All India') {
        if (s.state !== 'All India') return false;
      } else if (state === 'Karnataka') {
        if (s.state !== 'Karnataka') return false;
      }
    }

    // Beneficiary match
    if (beneficiary !== 'all') {
      const matchBen = s.beneficiaryGroups.some(bg => bg.toLowerCase().includes(beneficiary.toLowerCase()));
      if (!matchBen) return false;
    }

    // Scheme type match
    if (type !== 'all') {
      if (s.schemeType !== type) return false;
    }

    return true;
  });

  if (countBadge) {
    countBadge.textContent = filtered.length;
  }

  updateActiveFilterChips();

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = filtered.map(scheme => {
    const isBookmarked = STATE.savedSchemeIds.has(scheme.id);
    const schemeName = isKn && KANNADA_SCHEME_NAMES[scheme.id] ? KANNADA_SCHEME_NAMES[scheme.id] : scheme.name;
    const catName = isKn && KANNADA_CATEGORIES[scheme.categoryId] ? KANNADA_CATEGORIES[scheme.categoryId] : scheme.category;
    const stateName = isKn && scheme.state === 'All India' ? 'ಭಾರತಾದ್ಯಂತ' : scheme.state;

    return `
      <div class="scheme-card" data-id="${scheme.id}">
        <div class="scheme-card-top">
          <div class="scheme-tags-row">
            <span class="tag-badge badge-cat">${escapeHtml(catName)}</span>
            <span class="tag-badge badge-state">${escapeHtml(stateName)}</span>
            <span class="tag-badge badge-type">${escapeHtml(scheme.schemeType)}</span>
          </div>
          <button type="button" class="card-bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="toggleBookmark('${scheme.id}', this)" title="${isBookmarked ? 'Remove from Saved' : 'Save Scheme'}" aria-label="Save scheme">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>

        <h3 class="scheme-card-title">${escapeHtml(schemeName)}</h3>

        <div class="scheme-card-dept">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/></svg>
          <span>${escapeHtml(scheme.department)}</span>
        </div>

        <p class="scheme-card-desc">${escapeHtml(scheme.shortDescription)}</p>

        <!-- Preview Checklist Block -->
        <div class="scheme-details-preview">
          <div class="preview-item">
            <span class="preview-label">${escapeHtml(t.eligibility_label || 'Eligibility:')}</span>
            <span class="preview-value">${escapeHtml(scheme.eligibility[0] || 'Subject to departmental criteria')}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">${escapeHtml(t.key_benefit || 'Main Benefit:')}</span>
            <span class="preview-value">${escapeHtml(scheme.benefits[0] || 'Financial and welfare assistance')}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">${isKn ? 'ಅಗತ್ಯ ದಾಖಲೆಗಳು:' : 'Documents:'}</span>
            <span class="preview-value">${escapeHtml(scheme.documents.slice(0, 3).join(', '))}</span>
          </div>
        </div>

        <!-- Footer with Last Updated & Action Buttons -->
        <div class="scheme-card-footer">
          <div class="updated-date-text">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${escapeHtml(t.updated_label || 'Updated:')} ${escapeHtml(scheme.lastUpdated || 'November 2026')}</span>
          </div>

          <div class="scheme-action-buttons">
            <button type="button" class="btn btn-outline btn-sm" onclick="openSchemeDetailsModal('${scheme.id}')">
              ${escapeHtml(t.btn_view_details || 'View Full Details')}
            </button>
            <a href="${escapeHtml(scheme.officialLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Open verified official government portal">
              ${escapeHtml(t.btn_apply_official || 'Apply Official')}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Active Filter Chips Display
function updateActiveFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;

  const chips = [];
  const { search, category, state, beneficiary, type } = STATE.filters;

  if (search) {
    chips.push({ label: `Search: "${search}"`, key: 'search' });
  }
  if (category !== 'all') {
    const catObj = SCHEME_CATEGORIES.find(c => c.id === category);
    chips.push({ label: `Category: ${catObj ? catObj.name : category}`, key: 'category' });
  }
  if (state !== 'all') {
    chips.push({ label: `State: ${state}`, key: 'state' });
  }
  if (beneficiary !== 'all') {
    chips.push({ label: `Beneficiary: ${beneficiary}`, key: 'beneficiary' });
  }
  if (type !== 'all') {
    chips.push({ label: `Type: ${type}`, key: 'type' });
  }

  container.innerHTML = chips.map(c => `
    <span class="filter-chip">
      ${escapeHtml(c.label)}
      <button type="button" onclick="removeFilter('${c.key}')" aria-label="Remove filter">&times;</button>
    </span>
  `).join('');
}

window.removeFilter = function(filterKey) {
  if (filterKey === 'search') {
    STATE.filters.search = '';
    const heroInput = document.getElementById('hero-search-input');
    if (heroInput) heroInput.value = '';
  } else {
    STATE.filters[filterKey] = 'all';
    const selectEl = document.getElementById(`filter-${filterKey}`);
    if (selectEl) selectEl.value = 'all';
  }
  renderAllSchemes();
};

// Filter Controls Event Listeners
function initFilterControls() {
  // Hero Search Input
  const heroSearch = document.getElementById('hero-search-input');
  const heroSearchBtn = document.getElementById('btn-hero-search-go');

  function triggerSearch() {
    if (heroSearch) {
      STATE.filters.search = heroSearch.value.trim();
      renderAllSchemes();
      const target = document.getElementById('all-schemes');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  heroSearchBtn?.addEventListener('click', triggerSearch);
  heroSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerSearch();
  });

  // Popular Search Pills
  document.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const term = pill.getAttribute('data-search') || '';
      if (heroSearch) heroSearch.value = term;
      STATE.filters.search = term;
      renderAllSchemes();
      document.getElementById('all-schemes')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Dropdown Filters
  document.getElementById('filter-category')?.addEventListener('change', (e) => {
    STATE.filters.category = e.target.value;
    renderAllSchemes();
  });

  document.getElementById('filter-state')?.addEventListener('change', (e) => {
    STATE.filters.state = e.target.value;
    renderAllSchemes();
  });

  document.getElementById('filter-beneficiary')?.addEventListener('change', (e) => {
    STATE.filters.beneficiary = e.target.value;
    renderAllSchemes();
  });

  document.getElementById('filter-type')?.addEventListener('change', (e) => {
    STATE.filters.type = e.target.value;
    renderAllSchemes();
  });

  // Clear / Reset All Filters
  function resetAllFilters() {
    STATE.filters = { search: '', category: 'all', state: 'all', beneficiary: 'all', type: 'all' };
    if (heroSearch) heroSearch.value = '';
    ['category', 'state', 'beneficiary', 'type'].forEach(id => {
      const el = document.getElementById(`filter-${id}`);
      if (el) el.value = 'all';
    });
    renderAllSchemes();
    showToast('Filters cleared');
  }

  document.getElementById('btn-clear-filters')?.addEventListener('click', resetAllFilters);
  document.getElementById('btn-empty-reset')?.addEventListener('click', resetAllFilters);
}

// ==========================================================================
// Interactive Eligibility Checker Engine (Requirement #7)
// ==========================================================================
function initEligibilityChecker() {
  const form = document.getElementById('eligibility-form');
  const resultsContainer = document.getElementById('eligibility-results');
  const matchedList = document.getElementById('matched-schemes-list');
  const matchedCountPill = document.getElementById('matched-count-pill');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const ageGroup = document.getElementById('check-age').value;
    const state = document.getElementById('check-state').value;
    const occupation = document.getElementById('check-occupation').value;
    const income = document.getElementById('check-income').value;
    const education = document.getElementById('check-education').value;
    const category = document.getElementById('check-category').value;

    // Run matching algorithm
    const matches = evaluateEligibility({
      ageGroup,
      state,
      occupation,
      income,
      education,
      category
    });

    displayEligibilityResults(matches);
  });

  document.getElementById('btn-reset-checker')?.addEventListener('click', () => {
    if (resultsContainer) resultsContainer.classList.remove('active');
  });
}

function evaluateEligibility(profile) {
  const results = [];

  // Parse income estimate numeric
  let incomeNum = 1000000;
  if (profile.income === 'below1L') incomeNum = 80000;
  else if (profile.income === '1L-2.5L') incomeNum = 200000;
  else if (profile.income === '2.5L-5L') incomeNum = 350000;
  else if (profile.income === '5L-8L') incomeNum = 650000;
  else if (profile.income === 'above8L') incomeNum = 950000;

  // Age numeric range
  let minAge = 18;
  let maxAge = 60;
  if (profile.ageGroup === 'under18') { minAge = 0; maxAge = 17; }
  else if (profile.ageGroup === '18-25') { minAge = 18; maxAge = 25; }
  else if (profile.ageGroup === '26-40') { minAge = 26; maxAge = 40; }
  else if (profile.ageGroup === '41-59') { minAge = 41; maxAge = 59; }
  else if (profile.ageGroup === '60plus') { minAge = 60; maxAge = 100; }

  STATE.schemes.forEach(scheme => {
    let score = 0;
    const reasons = [];

    // 1. State match (30 points)
    if (scheme.state === 'All India') {
      score += 25;
      reasons.push("Central Pan-India welfare scheme open to your state");
    } else if (scheme.state.toLowerCase() === profile.state.toLowerCase()) {
      score += 30;
      reasons.push(`State-specific scheme for ${profile.state} residents`);
    } else {
      // Scheme is for another state
      return;
    }

    // 2. Occupation Match (30 points)
    if (scheme.occupation === 'any' || scheme.occupation === profile.occupation) {
      score += 30;
      if (scheme.occupation === profile.occupation) {
        reasons.push(`Directly tailored for ${formatOccupation(profile.occupation)}s`);
      } else {
        reasons.push("Open to all citizen occupations");
      }
    } else if (profile.occupation === 'daily_wage' && (scheme.beneficiaryGroups.includes('Unorganised Workers') || scheme.beneficiaryGroups.includes('Daily Wage Workers'))) {
      score += 28;
      reasons.push("Specially targeted at unorganised and daily-wage workers");
    } else if (profile.occupation === 'farmer' && scheme.categoryId === 'agriculture') {
      score += 30;
      reasons.push("Comprehensive agricultural and farm livelihood support");
    } else if (profile.occupation === 'student' && scheme.categoryId === 'education') {
      score += 30;
      reasons.push("Student scholarship and educational assistance");
    } else {
      // Partial points if scheme is universal healthcare or food security
      if (scheme.id === 'ab-pmjay' || scheme.id === 'pmgkay' || scheme.id === 'pmsby') {
        score += 15;
      } else {
        score -= 20;
      }
    }

    // 3. Income Compatibility (20 points)
    if (scheme.maxIncome === null || incomeNum <= scheme.maxIncome) {
      score += 20;
      if (scheme.maxIncome) {
        reasons.push(`Your family income bracket is within the eligible ceiling of ₹${(scheme.maxIncome/100000).toFixed(1)} Lakh`);
      }
    } else {
      score -= 30; // Exceeds income limit
    }

    // 4. Age Compatibility (10 points)
    if (maxAge >= (scheme.minAge || 0) && minAge <= (scheme.maxAge || 100)) {
      score += 10;
    } else {
      score -= 25;
    }

    // 5. Gender / Community / Special Category (10 points)
    if (scheme.gender === 'female') {
      if (profile.category === 'female' || profile.occupation === 'homemaker') {
        score += 10;
        reasons.push("Dedicated women empowerment and financial autonomy scheme");
      } else {
        // Restricted to women
        return;
      }
    }

    if (profile.category === 'SC' && scheme.community === 'SC') {
      score += 10;
      reasons.push("Dedicated affirmative educational and social welfare benefits for SC students/citizens");
    }

    if (profile.category === 'disability' && (scheme.name.toLowerCase().includes('disability') || scheme.benefits.some(b => b.toLowerCase().includes('disability')))) {
      score += 15;
      reasons.push("Special provisions and allowances for differently-abled citizens");
    }

    if (score >= 45) {
      const matchPercentage = Math.min(98, Math.max(55, Math.round((score / 100) * 100)));
      results.push({
        scheme,
        score,
        matchPercentage,
        reasons
      });
    }
  });

  // Sort by highest match score
  results.sort((a, b) => b.score - a.score);
  return results;
}

function formatOccupation(occ) {
  const map = {
    farmer: 'Farmer',
    student: 'Student',
    daily_wage: 'Daily Wage / Construction Worker',
    homemaker: 'Homemaker',
    self_employed: 'Self-Employed / Artisan',
    unemployed: 'Job Seeker',
    retired: 'Senior Citizen',
    salaried: 'Salaried Citizen'
  };
  return map[occ] || occ;
}

function displayEligibilityResults(matches) {
  const resultsContainer = document.getElementById('eligibility-results');
  const matchedList = document.getElementById('matched-schemes-list');
  const countPill = document.getElementById('matched-count-pill');
  if (!resultsContainer || !matchedList) return;

  resultsContainer.classList.add('active');
  countPill.textContent = `${matches.length} Potentially Relevant Schemes`;

  if (matches.length === 0) {
    matchedList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: var(--color-bg-light); border-radius: var(--radius-md);">
        <p style="color: var(--color-text-muted);">No exact scheme matches found for this specific combination. Try adjusting your income range or explore our All Schemes directory.</p>
        <a href="#all-schemes" class="btn btn-outline btn-sm">Browse All Schemes</a>
      </div>
    `;
    return;
  }

  matchedList.innerHTML = matches.map(item => {
    const s = item.scheme;
    return `
      <div class="scheme-card" style="border-left: 4px solid var(--color-indian-green);">
        <div class="scheme-card-top">
          <span class="tag-badge" style="background: var(--color-soft-green); color: var(--color-indian-green); font-weight: 700;">
            ${item.matchPercentage}% High Match
          </span>
          <span class="tag-badge badge-cat">${escapeHtml(s.category)}</span>
        </div>

        <h4 class="scheme-card-title" style="font-size: 1.15rem;">${escapeHtml(s.name)}</h4>
        <div class="scheme-card-dept" style="margin-bottom: 0.6rem;">${escapeHtml(s.department)}</div>

        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-sm); padding: 0.75rem; margin-bottom: 1rem; font-size: 0.8125rem;">
          <strong style="color: #166534; display: block; margin-bottom: 0.25rem;">Why You May Qualify:</strong>
          <ul style="padding-left: 1.25rem; color: #14532D; margin: 0;">
            ${item.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
          </ul>
        </div>

        <div class="scheme-details-preview" style="padding: 0.75rem; margin-bottom: 1rem;">
          <div class="preview-item">
            <span class="preview-label">Key Benefit:</span>
            <span class="preview-value">${escapeHtml(s.benefits[0] || 'Government grant / welfare support')}</span>
          </div>
        </div>

        <div class="scheme-card-footer" style="padding-top: 0.75rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openSchemeDetailsModal('${s.id}')">
            View Eligibility Details
          </button>
          <a href="${escapeHtml(s.officialLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
            Official Portal &rarr;
          </a>
        </div>
      </div>
    `;
  }).join('');

  resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================================================
// Detailed Scheme View Modal (Requirement #6)
// ==========================================================================
window.openSchemeDetailsModal = function(schemeId) {
  const scheme = STATE.schemes.find(s => s.id === schemeId);
  if (!scheme) return;

  const isKn = STATE.language === 'kn';
  const schemeName = isKn && KANNADA_SCHEME_NAMES[scheme.id] ? KANNADA_SCHEME_NAMES[scheme.id] : scheme.name;
  const catName = isKn && KANNADA_CATEGORIES[scheme.categoryId] ? KANNADA_CATEGORIES[scheme.categoryId] : scheme.category;

  STATE.selectedSchemeForModal = scheme;
  const modal = document.getElementById('modal-scheme-details');
  const titleEl = document.getElementById('detail-scheme-name');
  const metaEl = document.getElementById('detail-scheme-meta');
  const bodyEl = document.getElementById('detail-scheme-body');
  const officialBtn = document.getElementById('detail-official-btn');
  const bookmarkBtn = document.getElementById('btn-bookmark-modal');
  const bookmarkText = document.getElementById('btn-bookmark-modal-text');

  if (titleEl) titleEl.textContent = schemeName;
  if (officialBtn) officialBtn.href = scheme.officialLink;

  const isBookmarked = STATE.savedSchemeIds.has(scheme.id);
  if (bookmarkText) bookmarkText.textContent = isBookmarked ? (isKn ? 'ಉಳಿಸಿದ ಯೋಜನೆಗಳಲ್ಲಿವೆ' : 'Saved in My Schemes') : (isKn ? 'ಯೋಜನೆ ಉಳಿಸಿ' : 'Save Scheme');
  if (bookmarkBtn) {
    bookmarkBtn.classList.toggle('active', isBookmarked);
    bookmarkBtn.onclick = () => {
      toggleBookmark(scheme.id);
      const nowSaved = STATE.savedSchemeIds.has(scheme.id);
      bookmarkText.textContent = nowSaved ? (isKn ? 'ಉಳಿಸಿದ ಯೋಜನೆಗಳಲ್ಲಿವೆ' : 'Saved in My Schemes') : (isKn ? 'ಯೋಜನೆ ಉಳಿಸಿ' : 'Save Scheme');
      bookmarkBtn.classList.toggle('active', nowSaved);
    };
  }

  if (metaEl) {
    metaEl.innerHTML = `
      <span class="tag-badge badge-cat">${escapeHtml(catName)}</span>
      <span class="tag-badge badge-state">${escapeHtml(isKn && scheme.state === 'All India' ? 'ಭಾರತಾದ್ಯಂತ' : scheme.state)}</span>
      <span class="tag-badge badge-type">${escapeHtml(scheme.schemeType)}</span>
      <span class="tag-badge" style="background: #E2E8F0; color: #475569;">${isKn ? 'ಅಪ್‌ಡೇಟ್:' : 'Updated:'} ${escapeHtml(scheme.lastUpdated || 'November 2026')}</span>
    `;
  }

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 1.25rem;">
        <strong>${isKn ? 'ಸಚಿವಾಲಯ / ಅನುಷ್ಠಾನ ಇಲಾಖೆ:' : 'Ministry / Implementing Department:'}</strong> ${escapeHtml(scheme.department)}
      </div>

      <div style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.75rem; color: var(--color-text-main);">
        ${escapeHtml(scheme.fullDescription || scheme.shortDescription)}
      </div>

      <!-- Main Benefits Breakdown -->
      <h3 class="modal-section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-indian-green)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
        ${isKn ? 'ಪ್ರಮುಖ ಆರ್ಥಿಕ ಮತ್ತು ಕಲ್ಯಾಣ ಪ್ರಯೋಜನಗಳು' : 'Key Financial & Welfare Benefits'}
      </h3>
      <ul class="modal-checklist">
        ${scheme.benefits.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
      </ul>

      <!-- Prescribed Eligibility Criteria -->
      <h3 class="modal-section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-indian-blue)" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        ${isKn ? 'ನಿಗದಿತ ಅರ್ಹತಾ ಮಾನದಂಡಗಳು' : 'Prescribed Eligibility Criteria'}
      </h3>
      <ul class="modal-checklist">
        ${scheme.eligibility.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
      </ul>

      <!-- Required Documents Checklist -->
      <h3 class="modal-section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-saffron-dark)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        ${isKn ? 'ಅಗತ್ಯ ದಾಖಲೆಗಳ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ' : 'Required Documents Checklist'}
      </h3>
      <div style="background: var(--color-bg-light); border-radius: var(--radius-sm); padding: 1rem; border-left: 3px solid var(--color-soft-saffron);">
        <ul style="padding-left: 1.25rem; font-size: 0.9375rem; line-height: 1.6; margin: 0;">
          ${scheme.documents.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
        </ul>
      </div>

      <!-- Step-by-Step Application Process -->
      <h3 class="modal-section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-indian-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        ${isKn ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ (ಪ್ರಕ್ರಿಯೆ)' : 'How to Apply (Application Process)'}
      </h3>
      <ol class="modal-steps-list">
        ${scheme.applicationProcess.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
      </ol>

      <!-- Verified Source Reassurance -->
      <div style="margin-top: 2rem; padding: 1rem; background: #F1F5F9; border-radius: var(--radius-sm); font-size: 0.8125rem; color: var(--color-text-muted);">
        <strong>${isKn ? 'ಅಧಿಕೃತ ಮೂಲದ ಸೂಚನೆ:' : 'Official Source Notice:'}</strong> ${isKn ? 'ಈ ಯೋಜನೆಯ ಮಾಹಿತಿಯನ್ನು ಪ್ರಕಟಿತ ಸರ್ಕಾರಿ ಗೆಜೆಟ್‌ಗಳು ಮತ್ತು ಇಲಾಖಾ ವೆಬ್‌ಸೈಟ್‌ಗಳಿಂದ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ನೇರವಾಗಿ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಮೂಲಕವೇ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ:' : 'This scheme information is compiled from published government gazettes and official department portals. Scheme Connect does not charge any processing fees. Always apply directly via'} 
        <a href="${escapeHtml(scheme.officialLink)}" target="_blank" rel="noopener noreferrer" style="color: var(--color-indian-blue); font-weight: 600; text-decoration: underline;">
          ${escapeHtml(scheme.officialLink)}
        </a>.
      </div>
    `;
  }

  modal?.classList.add('active');
};

// ==========================================================================
// Bookmarking / Saved Schemes System
// ==========================================================================
window.toggleBookmark = function(schemeId, buttonEl) {
  if (STATE.savedSchemeIds.has(schemeId)) {
    STATE.savedSchemeIds.delete(schemeId);
    showToast('Scheme removed from saved bookmarks');
    if (buttonEl) {
      buttonEl.classList.remove('active');
      const iconSvg = buttonEl.querySelector('svg');
      if (iconSvg) iconSvg.setAttribute('fill', 'none');
    }
  } else {
    STATE.savedSchemeIds.add(schemeId);
    showToast('Scheme saved to your bookmarks!');
    if (buttonEl) {
      buttonEl.classList.add('active');
      const iconSvg = buttonEl.querySelector('svg');
      if (iconSvg) iconSvg.setAttribute('fill', 'currentColor');
    }
  }
  saveBookmarksToStorage();
};

function renderSavedSchemesModal() {
  const container = document.getElementById('saved-schemes-body');
  if (!container) return;

  const savedList = STATE.schemes.filter(s => STATE.savedSchemeIds.has(s.id));

  if (savedList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-light)" stroke-width="1.5" style="margin-bottom: 1rem;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <h4 style="color: var(--color-indian-blue); margin-bottom: 0.5rem;">No schemes bookmarked yet</h4>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; max-width: 420px; margin: 0 auto 1.5rem;">Click the bookmark icon on any scheme card to save it here for convenient review and application tracking.</p>
        <a href="#all-schemes" class="btn btn-primary btn-sm" onclick="closeAllModals()">Explore Schemes</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      ${savedList.map(scheme => `
        <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div>
            <span class="tag-badge badge-cat" style="margin-bottom: 0.25rem;">${escapeHtml(scheme.category)}</span>
            <h4 style="font-size: 1.1rem; color: var(--color-indian-blue); margin-bottom: 0.25rem;">${escapeHtml(scheme.name)}</h4>
            <div style="font-size: 0.8125rem; color: var(--color-text-muted);">${escapeHtml(scheme.department)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button type="button" class="btn btn-outline btn-sm" onclick="openSchemeDetailsModal('${scheme.id}')">View Details</button>
            <a href="${escapeHtml(scheme.officialLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Official Portal</a>
            <button type="button" class="btn btn-outline btn-sm" onclick="toggleBookmark('${scheme.id}'); renderSavedSchemesModal();" style="color: #DC2626; border-color: #FCA5A5;" title="Remove">Remove</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================================================
// Admin Dashboard (Requirement #15: Add, Edit, Update, Delete)
// ==========================================================================
function initAdminDashboard() {
  const listTabBtn = document.getElementById('tab-admin-list');
  const addTabBtn = document.getElementById('tab-admin-add');
  const listView = document.getElementById('admin-view-list');
  const formView = document.getElementById('admin-view-form');
  const searchInput = document.getElementById('admin-search-input');
  const exportBtn = document.getElementById('btn-admin-export');
  const resetBtn = document.getElementById('btn-admin-reset');
  const form = document.getElementById('admin-scheme-form');
  const cancelBtn = document.getElementById('btn-admin-cancel-form');

  // Tab switching
  listTabBtn?.addEventListener('click', () => {
    listTabBtn.classList.replace('btn-outline', 'btn-primary');
    addTabBtn.classList.replace('btn-primary', 'btn-outline');
    listView.style.display = 'block';
    formView.style.display = 'none';
  });

  addTabBtn?.addEventListener('click', () => {
    openAdminAddForm();
  });

  cancelBtn?.addEventListener('click', () => {
    listTabBtn.click();
  });

  searchInput?.addEventListener('input', (e) => {
    renderAdminTable(e.target.value);
  });

  // Export JSON
  exportBtn?.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(STATE.schemes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `scheme-connect-database-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Scheme database exported successfully!');
  });

  // Reset to Defaults
  resetBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all schemes to verified default records? Any custom additions or edits will be restored.')) {
      STATE.schemes = [...INITIAL_SCHEMES];
      saveSchemesToStorage();
      renderAdminTable();
      renderAllSchemes();
      renderCategories();
      renderFeaturedSchemes();
      updateStatsBadge();
      showToast('Database reset to verified default schemes.');
    }
  });

  // Save / Update Scheme Form
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = document.getElementById('admin-form-mode').value;
    const schemeId = document.getElementById('admin-scheme-id').value;

    const name = document.getElementById('admin-input-name').value.trim();
    const category = document.getElementById('admin-input-category').value;
    const department = document.getElementById('admin-input-dept').value.trim();
    const state = document.getElementById('admin-input-state').value.trim();
    const schemeType = document.getElementById('admin-input-type').value;
    const shortDescription = document.getElementById('admin-input-shortdesc').value.trim();
    const benefits = document.getElementById('admin-input-benefits').value.split('\n').map(s => s.trim()).filter(Boolean);
    const eligibility = document.getElementById('admin-input-eligibility').value.split('\n').map(s => s.trim()).filter(Boolean);
    const documents = document.getElementById('admin-input-documents').value.split('\n').map(s => s.trim()).filter(Boolean);
    const applicationProcess = document.getElementById('admin-input-process').value.split('\n').map(s => s.trim()).filter(Boolean);
    const officialLink = document.getElementById('admin-input-link').value.trim();
    const lastUpdated = document.getElementById('admin-input-updated').value.trim();

    // Map category to categoryId
    const catMap = {
      'Education Schemes': 'education',
      'Agriculture Schemes': 'agriculture',
      'Healthcare Schemes': 'healthcare',
      'Employment Schemes': 'employment',
      'Women Empowerment Schemes': 'women',
      'Housing Schemes': 'housing',
      'Financial Assistance Schemes': 'financial',
      'Social Welfare Schemes': 'social_welfare',
      'Skill Development Schemes': 'skill'
    };
    const categoryId = catMap[category] || 'social_welfare';

    if (mode === 'edit' && schemeId) {
      // Update existing
      const idx = STATE.schemes.findIndex(s => s.id === schemeId);
      if (idx !== -1) {
        STATE.schemes[idx] = {
          ...STATE.schemes[idx],
          name,
          category,
          categoryId,
          department,
          state,
          schemeType,
          shortDescription,
          benefits,
          eligibility,
          documents,
          applicationProcess,
          officialLink,
          lastUpdated
        };
        showToast(`Scheme "${name}" updated successfully!`);
      }
    } else {
      // Add new
      const newId = 'scheme-' + Date.now();
      const newScheme = {
        id: newId,
        name,
        category,
        categoryId,
        department,
        state,
        schemeType,
        beneficiaryGroups: ["All Citizens"],
        shortDescription,
        fullDescription: shortDescription,
        benefits,
        eligibility,
        documents,
        applicationProcess,
        officialLink,
        lastUpdated: lastUpdated || 'November 2026',
        featured: false,
        minAge: 0,
        maxAge: 100,
        occupation: "any",
        maxIncome: null,
        educationLevel: "any",
        gender: "all",
        community: "all"
      };
      STATE.schemes.unshift(newScheme);
      showToast(`New scheme "${name}" created successfully!`);
    }

    saveSchemesToStorage();
    renderAdminTable();
    renderAllSchemes();
    renderCategories();
    renderFeaturedSchemes();
    updateStatsBadge();
    listTabBtn.click();
  });
}

function renderAdminTable(filterSearch = '') {
  const tbody = document.getElementById('admin-schemes-tbody');
  const countEl = document.getElementById('admin-total-count');
  if (!tbody) return;

  if (countEl) countEl.textContent = STATE.schemes.length;

  const searchLower = filterSearch.toLowerCase().trim();
  const list = searchLower ? STATE.schemes.filter(s => s.name.toLowerCase().includes(searchLower) || s.category.toLowerCase().includes(searchLower)) : STATE.schemes;

  tbody.innerHTML = list.map(scheme => `
    <tr style="border-bottom: 1px solid var(--color-border);">
      <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--color-indian-blue);">
        ${escapeHtml(scheme.name)}
      </td>
      <td style="padding: 0.75rem 1rem;">
        <span class="tag-badge badge-cat">${escapeHtml(scheme.category)}</span>
      </td>
      <td style="padding: 0.75rem 1rem;">${escapeHtml(scheme.state)}</td>
      <td style="padding: 0.75rem 1rem; color: var(--color-text-muted);">${escapeHtml(scheme.lastUpdated || 'November 2026')}</td>
      <td style="padding: 0.75rem 1rem; text-align: right;">
        <button type="button" class="btn btn-outline btn-sm" onclick="openAdminEditForm('${scheme.id}')" style="margin-right: 0.35rem; padding: 0.25rem 0.5rem; font-size: 0.78rem;">Edit</button>
        <button type="button" class="btn btn-outline btn-sm" onclick="quickUpdateSchemeDate('${scheme.id}')" title="Update date to current month" style="margin-right: 0.35rem; padding: 0.25rem 0.5rem; font-size: 0.78rem; color: var(--color-indian-green);">Touch</button>
        <button type="button" class="btn btn-outline btn-sm" onclick="adminDeleteScheme('${scheme.id}')" style="color: #DC2626; border-color: #FCA5A5; padding: 0.25rem 0.5rem; font-size: 0.78rem;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAdminAddForm() {
  const listTabBtn = document.getElementById('tab-admin-list');
  const addTabBtn = document.getElementById('tab-admin-add');
  const listView = document.getElementById('admin-view-list');
  const formView = document.getElementById('admin-view-form');
  const form = document.getElementById('admin-scheme-form');

  addTabBtn.classList.replace('btn-outline', 'btn-primary');
  listTabBtn.classList.replace('btn-primary', 'btn-outline');
  listView.style.display = 'none';
  formView.style.display = 'block';

  form.reset();
  document.getElementById('admin-form-mode').value = 'add';
  document.getElementById('admin-scheme-id').value = '';
  document.getElementById('admin-input-updated').value = 'November 2026';
}

window.openAdminEditForm = function(schemeId) {
  const scheme = STATE.schemes.find(s => s.id === schemeId);
  if (!scheme) return;

  openAdminAddForm();
  document.getElementById('admin-form-mode').value = 'edit';
  document.getElementById('admin-scheme-id').value = scheme.id;

  document.getElementById('admin-input-name').value = scheme.name || '';
  document.getElementById('admin-input-category').value = scheme.category || 'Education Schemes';
  document.getElementById('admin-input-dept').value = scheme.department || '';
  document.getElementById('admin-input-state').value = scheme.state || 'All India';
  document.getElementById('admin-input-type').value = scheme.schemeType || 'Central Sector Scheme';
  document.getElementById('admin-input-shortdesc').value = scheme.shortDescription || '';
  document.getElementById('admin-input-benefits').value = (scheme.benefits || []).join('\n');
  document.getElementById('admin-input-eligibility').value = (scheme.eligibility || []).join('\n');
  document.getElementById('admin-input-documents').value = (scheme.documents || []).join('\n');
  document.getElementById('admin-input-process').value = (scheme.applicationProcess || []).join('\n');
  document.getElementById('admin-input-link').value = scheme.officialLink || '';
  document.getElementById('admin-input-updated').value = scheme.lastUpdated || 'November 2026';
};

window.quickUpdateSchemeDate = function(schemeId) {
  const scheme = STATE.schemes.find(s => s.id === schemeId);
  if (scheme) {
    scheme.lastUpdated = 'November 2026';
    saveSchemesToStorage();
    renderAdminTable();
    renderAllSchemes();
    showToast(`Updated date for "${scheme.name}"`);
  }
};

window.adminDeleteScheme = function(schemeId) {
  const scheme = STATE.schemes.find(s => s.id === schemeId);
  if (!scheme) return;

  if (confirm(`Are you sure you want to delete scheme: "${scheme.name}"?`)) {
    STATE.schemes = STATE.schemes.filter(s => s.id !== schemeId);
    saveSchemesToStorage();
    renderAdminTable();
    renderAllSchemes();
    renderCategories();
    renderFeaturedSchemes();
    updateStatsBadge();
    showToast(`Scheme "${scheme.name}" deleted.`);
  }
};

// ==========================================================================
// Contact Form & Feedback (Requirement #13)
// ==========================================================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !subject || !message) {
      showToast('Please fill in all required fields.');
      return;
    }

    // Basic email pattern check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.');
      return;
    }

    form.reset();
    showToast(`Thank you, ${name}! Your message has been received. Our team will review your inquiry.`);
  });
}

// ==========================================================================
// Modals Open/Close Handlers
// ==========================================================================
function initModals() {
  // Scheme details close
  document.getElementById('btn-close-scheme-modal')?.addEventListener('click', () => {
    document.getElementById('modal-scheme-details')?.classList.remove('active');
  });

  // Admin portal open/close
  document.getElementById('btn-open-admin')?.addEventListener('click', () => {
    renderAdminTable();
    document.getElementById('modal-admin-dashboard')?.classList.add('active');
  });
  document.getElementById('btn-footer-admin')?.addEventListener('click', () => {
    renderAdminTable();
    document.getElementById('modal-admin-dashboard')?.classList.add('active');
  });
  document.getElementById('btn-close-admin-modal')?.addEventListener('click', () => {
    document.getElementById('modal-admin-dashboard')?.classList.remove('active');
  });

  // Saved schemes open/close
  document.getElementById('btn-view-saved')?.addEventListener('click', () => {
    renderSavedSchemesModal();
    document.getElementById('modal-saved-schemes')?.classList.add('active');
  });
  document.getElementById('btn-close-saved-modal')?.addEventListener('click', () => {
    document.getElementById('modal-saved-schemes')?.classList.remove('active');
  });

  // Citizen Login open/close
  document.getElementById('btn-open-login')?.addEventListener('click', () => {
    document.getElementById('modal-citizen-login')?.classList.add('active');
  });
  document.getElementById('btn-close-login-modal')?.addEventListener('click', () => {
    document.getElementById('modal-citizen-login')?.classList.remove('active');
  });

  // Citizen Auth Form submit
  document.getElementById('citizen-auth-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const mobile = document.getElementById('auth-mobile').value.trim();
    const name = document.getElementById('auth-name').value.trim() || 'Citizen';
    const state = document.getElementById('auth-state').value;

    STATE.activeUser = { mobile, name, state };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(STATE.activeUser));
    updateUserNavUI();
    document.getElementById('modal-citizen-login')?.classList.remove('active');
    showToast(`Welcome, ${name}! You are now signed in to Scheme Connect.`);
  });

  // Legal Modals
  document.getElementById('link-privacy-policy')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('modal-legal')?.classList.add('active');
  });
  document.getElementById('link-terms-conditions')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('modal-legal')?.classList.add('active');
  });
  document.getElementById('btn-close-legal-modal')?.addEventListener('click', () => {
    document.getElementById('modal-legal')?.classList.remove('active');
  });

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

window.closeAllModals = function() {
  document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
};

function updateUserNavUI() {
  const labelEl = document.getElementById('nav-user-label');
  if (labelEl && STATE.activeUser) {
    labelEl.textContent = STATE.activeUser.name;
  }
}

// ==========================================================================
// Toast Notifications & Helpers
// ==========================================================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-indian-green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
