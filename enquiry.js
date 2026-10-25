/* Enquiry desk: attribution and form enhancement for static pages.
 *
 * <script src="enquiry.js" data-brand="sood" defer></script>
 *
 * - Reads utm_* / gclid / gbraid / wbraid from the landing URL and the external referrer, once, in memory.
 *   Nothing is written to cookies or storage, so it needs no consent banner.
 * - Fills the hidden attribution fields of every <form data-enquiry> and sends it with fetch, showing the
 *   result inline. Without JavaScript the same form posts normally and the desk redirects back.
 * - Appends brand and attribution to cal.com booking links, so a booking carries its ad click too
 *   (the event type needs hidden questions with the same identifiers).
 */
(function () {
  'use strict';
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid'];
  var script = document.currentScript;
  var brand = (script && script.getAttribute('data-brand')) || '';
  var loadedAt = Date.now();
  var params = new URLSearchParams(location.search);
  var landing = location.href;
  var referrer = '';
  try {
    if (document.referrer && new URL(document.referrer).origin !== location.origin) referrer = document.referrer;
  } catch (e) { /* ignore malformed referrers */ }

  function attribution() {
    var out = { landing: landing, referrer: referrer };
    KEYS.forEach(function (k) { if (params.get(k)) out[k] = params.get(k); });
    return out;
  }

  function setField(form, name, value) {
    if (!value) return;
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  function showStatus(form, kind, text) {
    var box = form.querySelector('[data-enquiry-status]');
    if (!box) return;
    box.hidden = false;
    box.setAttribute('data-state', kind);
    box.textContent = text;
    box.focus && box.focus();
  }

  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (el) { el.removeAttribute('aria-invalid'); });
  }

  function enhance(form) {
    // An unconfigured copy of the snippet must not look like it works.
    if ((form.getAttribute('action') || '').indexOf('__DESK_URL__') !== -1) {
      form.hidden = true;
      if (window.console) console.warn('enquiry form hidden: replace __DESK_URL__ with the enquiry desk address');
      return;
    }
    var a = attribution();
    Object.keys(a).forEach(function (k) { setField(form, k, a[k]); });
    setField(form, 'page', location.href);
    if (brand && !form.querySelector('input[name="brand"]')) setField(form, 'brand', brand);
    var sending = false;
    // Pages with deep links per situation (#fit-2) can pre-select the matching offer.
    function offerFromHash() {
      var el = form.querySelector('[name="offer"]');
      var m = /^#(fit-\d+)$/.exec(location.hash || '');
      if (el && !el.value && m && form.hasAttribute('data-offer-from-hash')) el.value = m[1];
    }
    offerFromHash();

    form.addEventListener('submit', function (ev) {
      offerFromHash();
      if (!window.fetch || sending) return;
      ev.preventDefault();
      sending = true;
      clearErrors(form);
      setField(form, 'elapsed_ms', String(Date.now() - loadedAt));
      setField(form, 'page', location.href);
      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      var body = new URLSearchParams(new FormData(form));
      fetch(form.action, { method: 'POST', body: body, headers: { Accept: 'application/json' }, credentials: 'omit' })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            form.setAttribute('data-sent', '');
            showStatus(form, 'ok', form.getAttribute('data-success') || 'Thank you. Your message arrived, and Nikhil will reply by email.');
            return;
          }
          var fields = (r.data && r.data.fields) || {};
          Object.keys(fields).forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (el) el.setAttribute('aria-invalid', 'true');
          });
          var msgs = Object.keys(fields).map(function (k) { return fields[k]; });
          showStatus(form, 'error', msgs.length ? msgs.join(' ') : (r.data && r.data.error) || 'That did not go through. Please try again or email instead.');
        })
        .catch(function () {
          // Network or CORS trouble: fall back to a normal post, which works without JavaScript.
          sending = false;
          form.submit();
        })
        .then(function () {
          sending = false;
          if (button) button.disabled = false;
        });
    });
  }

  function decorateBooking(link) {
    try {
      var u = new URL(link.href);
      var a = attribution();
      if (brand) u.searchParams.set('brand', brand);
      KEYS.forEach(function (k) { if (a[k]) u.searchParams.set(k, a[k]); });
      link.href = u.href;
    } catch (e) { /* leave the link alone */ }
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('form[data-enquiry]'), enhance);
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="https://cal.com/"]'), decorateBooking);
    // A no-JavaScript submission comes back with ?enquiry=sent.
    if (params.get('enquiry') === 'sent') {
      Array.prototype.forEach.call(document.querySelectorAll('form[data-enquiry]'), function (f) {
        showStatus(f, 'ok', f.getAttribute('data-success') || 'Thank you. Your message arrived.');
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
