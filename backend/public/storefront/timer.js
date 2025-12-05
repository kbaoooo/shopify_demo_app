// public/storefront/timer.js
(function () {
  try {
    var shop =
      window.Shopify && window.Shopify.shop
        ? window.Shopify.shop
        : new URLSearchParams(location.search).get('shop');

    if (!shop) {
      console.warn('[ECT] Missing shop param');
      return;
    }

    var apiBase = 'https://shopify.demoapp.website/api/v1';

    function getContext() {
      var path = window.location.pathname || '/';
      if (path.indexOf('/cart') === 0) return 'cart';
      if (path.indexOf('/products/') === 0) return 'product';
      return 'default';
    }

    function fetchTimer() {
      var url =
        apiBase +
        '/storefront-timer?shop=' +
        encodeURIComponent(shop) +
        '&context=' +
        encodeURIComponent(getContext());

      return fetch(url, { credentials: 'omit' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(function (text) {
          if (!text) {
            console.log('[ECT] storefront-timer empty response');
            return null;
          }

          try {
            return JSON.parse(text);
          } catch (err) {
            console.warn('[ECT] storefront-timer invalid JSON:', text, err);
            return null;
          }
        });
    }

    function createBar(timer) {
      var id = 'ect-bar-' + timer.id;
      if (document.getElementById(id)) return;

      var bar = document.createElement('div');
      bar.id = id;
      bar.style.position = 'fixed';
      bar.style.left = '0';
      bar.style.right = '0';
      bar.style.zIndex = '9999';
      bar.style.padding = '10px 16px';
      bar.style.display = 'flex';
      bar.style.justifyContent = 'center';
      bar.style.alignItems = 'center';
      bar.style.fontFamily =
        'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';
      bar.style.backgroundColor = timer.bgColor || '#111827';
      bar.style.color = timer.textColor || '#f9fafb';
      bar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

      if (timer.position === 'BOTTOM_BAR') {
        bar.style.bottom = '0';
      } else {
        bar.style.top = '0';
      }

      var msgSpan = document.createElement('span');
      msgSpan.style.marginRight = '8px';

      var countdownSpan = document.createElement('span');
      countdownSpan.style.fontVariantNumeric = 'tabular-nums';
      countdownSpan.style.fontWeight = '600';

      bar.appendChild(msgSpan);
      bar.appendChild(countdownSpan);
      document.body.appendChild(bar);

      var target = null;

      if (timer.type === 'FIXED' && timer.endAt) {
        target = new Date(timer.endAt).getTime();
      } else if (timer.type === 'EVERGREEN') {
        var key = 'ect-' + timer.id + '-' + shop;
        var stored = localStorage.getItem(key);
        if (stored) {
          target = parseInt(stored, 10);
        } else {
          var now = Date.now();
          var minutes = timer.evergreenMinutes || 10;
          target = now + minutes * 60 * 1000;
          localStorage.setItem(key, String(target));
        }
      }

      function format(ms) {
        if (!target || ms <= 0) return '00:00';

        var total = Math.floor(ms / 1000); // tổng số giây
        var d = Math.floor(total / 86400); // ngày
        var h = Math.floor((total % 86400) / 3600); // giờ
        var m = Math.floor((total % 3600) / 60); // phút
        var s = total % 60; // giây

        if (d > 0) {
          return (
            d +
            'd ' +
            String(h).padStart(2, '0') +
            ':' +
            String(m).padStart(2, '0') +
            ':' +
            String(s).padStart(2, '0')
          );
        }

        if (total >= 3600) {
          return (
            String(h).padStart(2, '0') +
            ':' +
            String(m).padStart(2, '0') +
            ':' +
            String(s).padStart(2, '0')
          );
        }

        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }

      function tick() {
        var text = timer.message || '';
        var now = Date.now();
        var diff = target ? target - now : 0;

        // thay (timer) trong message bằng countdown
        var baseText = text.replace('(timer)', '').trim();
        msgSpan.textContent = baseText;
        countdownSpan.textContent = format(diff);

        if (diff <= 0 && target) {
          clearInterval(interval);
        }
      }

      tick();
      var interval = setInterval(tick, 1000);
    }

    fetchTimer()
      .then(function (timer) {
        if (!timer) return;
        createBar(timer);
      })
      .catch(function (err) {
        console.error('[ECT] Timer load failed', err);
      });
  } catch (err) {
    console.error('[ECT] Fatal error', err);
  }
})();
