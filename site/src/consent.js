/* LUTC Consulting — Cookie consent (privacy-first, opt-in for non-essential) */
(function () {
  'use strict';

  var STORAGE_KEY = 'lutc-consent-v1';
  var MAX_AGE_DAYS = 365;

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || typeof data.ts !== 'number') return null;
      if ((Date.now() - data.ts) / 86400000 > MAX_AGE_DAYS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function apply(data) {
    var root = document.documentElement;
    root.setAttribute('data-consent-analytics', data.analytics ? 'granted' : 'denied');
    root.setAttribute('data-consent-functional', data.functional ? 'granted' : 'denied');
    // 将来アクセス解析等を導入する場合は、上記属性が 'granted' の場合のみ読み込むこと。
  }

  function writeConsent(prefs) {
    var data = { ts: Date.now(), analytics: !!prefs.analytics, functional: !!prefs.functional };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    apply(data);
    return data;
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    }
    if (html != null) e.innerHTML = html;
    return e;
  }

  var banner = null;

  function close() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function open() {
    if (banner) return;
    var current = readConsent() || { analytics: false, functional: false };

    banner = el('div', { class: 'cookie-banner', role: 'dialog', 'aria-label': 'Cookieの利用について' });
    var inner = el('div', { class: 'cookie-inner' });

    inner.appendChild(el('div', { class: 'cookie-text' },
      '<strong>Cookieの利用について</strong>' +
      '<p>当サイトは、表示や基本機能に必要な最小限のCookie等のみを使用しています。今後アクセス解析などの任意のCookieを導入する場合に備え、利用可否を選択いただけます。詳細は<a href="privacy.html">プライバシーポリシー</a>をご覧ください。</p>'
    ));

    var settings = el('div', { class: 'cookie-settings', hidden: 'hidden' });
    settings.innerHTML =
      '<label class="cookie-opt"><input type="checkbox" checked disabled><span>必須<small>サイトの動作に必要</small></span></label>' +
      '<label class="cookie-opt"><input type="checkbox" id="ck-analytics"' + (current.analytics ? ' checked' : '') + '><span>分析<small>アクセス解析・任意</small></span></label>' +
      '<label class="cookie-opt"><input type="checkbox" id="ck-functional"' + (current.functional ? ' checked' : '') + '><span>機能性<small>利便性向上・任意</small></span></label>';
    inner.appendChild(settings);

    var actions = el('div', { class: 'cookie-actions' });
    var acceptAll = el('button', { type: 'button', class: 'button cookie-accept' }, 'すべて許可');
    var rejectAll = el('button', { type: 'button', class: 'button secondary cookie-reject' }, '必須のみ');
    var toggle = el('button', { type: 'button', class: 'cookie-toggle' }, '設定');
    var save = el('button', { type: 'button', class: 'button cookie-save', hidden: 'hidden' }, '選択を保存');

    acceptAll.addEventListener('click', function () { writeConsent({ analytics: true, functional: true }); close(); });
    rejectAll.addEventListener('click', function () { writeConsent({ analytics: false, functional: false }); close(); });
    toggle.addEventListener('click', function () {
      settings.removeAttribute('hidden');
      save.removeAttribute('hidden');
      toggle.setAttribute('hidden', 'hidden');
    });
    save.addEventListener('click', function () {
      writeConsent({
        analytics: document.getElementById('ck-analytics').checked,
        functional: document.getElementById('ck-functional').checked
      });
      close();
    });

    actions.appendChild(acceptAll);
    actions.appendChild(rejectAll);
    actions.appendChild(toggle);
    actions.appendChild(save);
    inner.appendChild(actions);
    banner.appendChild(inner);
    document.body.appendChild(banner);
  }

  // フッターの「Cookie設定」から再表示できるように公開
  window.__lutcConsentOpen = open;

  function init() {
    var existing = readConsent();
    if (existing) apply(existing);
    else open();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
