let translations = {};
let currentLang = localStorage.getItem('lang') || 'en';

async function loadTranslations(lang) {
    const response = await fetch(`/app/i18n/${lang}.json`);
    translations = await response.json();
    currentLang = lang;
}

function getCurrentLang() {
    return currentLang;
}

async function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    await loadTranslations(lang);
    translateDOM();
    updateLangButtons();
}

function translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = resolve(key);
        if (value) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        const value = resolve(key);
        if (value) el.setAttribute('tootltip', value);
    });
}

function translateElement(el) {
    el.querySelectorAll('[data-i18n]').forEach(child => {
        const key = child.getAttribute('data-i18n');
        const value = resolve(key);
        if (value) child.textContent = value;
    });
    el.querySelectorAll('[data-i18n-tooltip]').forEach(child => {
        const key = child.getAttribute('data-i18n-tooltip');
        const value = resolve(key);
        if (value) child.setAttribute('tootltip', value);
    });
}

function getTranslation(section, key) {
    if (translations[section] && translations[section][key]) {
        return translations[section][key];
    }
    return key;
}

function resolve(dotKey) {
    const parts = dotKey.split('.');
    let obj = translations;
    for (const p of parts) {
        if (obj[p] === undefined) return null;
        obj = obj[p];
    }
    return obj;
}

function updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('lang-active', btn.dataset.lang === currentLang);
    });
}

// Init
await loadTranslations(currentLang);

export { setLanguage, getCurrentLang, getTranslation, translateElement, translateDOM, updateLangButtons, translations };
