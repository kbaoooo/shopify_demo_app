(function () {
  const scriptTag = document.currentScript;
  if (!scriptTag) return;

  const src = new URL(scriptTag.src);
  // storefront url format: https://your-backend.com/storefront/timer.js?shop=shop-domain.myshopify.com
  const shop = src.searchParams.get('shop');
  if (!shop) {
    warn('Countdown Timer: No shop parameter provided in script URL.');
    return;
  }

  // page type detection
  let pageType = '';
  if (window.location.pathname.startsWith('/products')) {
    pageType = 'PRODUCT_PAGE';
  } else if (
    window.location.pathname === '/cart' ||
    window.location.pathname.startsWith('/cart')
  ) {
    pageType = 'CART_PAGE';
  }

  const positionMap = {
    PRODUCT_PAGE: 'PRODUCT_PAGE',
    CART_PAGE: 'CART_PAGE',
  };
  const desiredPosition = positionMap[pageType] || 'TOP_BAR';

  const apiUrl = 'https://shopify.demoapp.website/api/v1';
  fetch(
    `${apiUrl}/countdown-timer/storefront/timers?shop=${encodeURIComponent(
      shop,
    )}&position=${encodeURIComponent(desiredPosition)}`,
  )
    .then((res) => res.json())
    .then((timers) => {
      if (!Array.isArray(timers) || timers.length === 0) return;
      const timer = timers[0];

      // create timer element
      createTimerBar(timer);
    })
    .catch((err) => {
      console.error('Countdown Timer: Error fetching timer data', err);
    });

  function createTimerBar(timer) {
    const timerBar = document.createElement('div');
    timerBar.style.position = 'fixed';
    timerBar.style.left = '0';
    timerBar.style.right = '0';
    timerBar.style.zIndex = '9999';
    timerBar.style.backgroundColor = timer.bgColor || '#111827';
    timerBar.style.color = timer.textColor || '#F9FAFB';
    timerBar.style.display = 'flex';
    timerBar.style.justifyContent = 'center';
    timerBar.style.alignItems = 'center';
    timerBar.style.padding = '8px 16px';
    timerBar.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    timerBar.style.fontSize = '14px';
    timerBar.style.gap = '8px';

    if (timer.position === 'TOP_BAR') {
      timerBar.style.top = '0';
    } else if (timer.position === 'BOTTOM_BAR') {
      timerBar.style.bottom = '0';
    } else {
      // PRODUCT_PAGE or CART_PAGE: fix bottom
      timerBar.style.bottom = '0';
    }

    const message = document.createElement('span');
    message.textContent = timer.message || 'Hurry up! Offer ends soon.';
    timerBar.appendChild(message);

    const countdown = document.createElement('span');
    countdown.style.fontWeight = '600';
    timerBar.appendChild(countdown);

    document.body.appendChild(timerBar);
    setupCountdown(timer, countdown);
  }

  function setupCountdown(timer, countdown) {
    if (timer.type === 'FIXED' && timer.endAt) {
      const endTime = new Date(timer.endAt).getTime();
      const tick = () => {
        const now = Date.now();
        let remaining = Math.floor((endTime - now) / 1000);
        if (remaining <= 0) {
          countdown.textContent = '00:00:00';
          return;
        }

        const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
        remaining %= 3600;
        const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
        const seconds = String(remaining % 60).padStart(2, '0');

        countdown.textContent = `${hours}:${minutes}:${seconds}`;
      };
      tick();
      setInterval(tick, 1000);
      return;
    }

    if (timer.type === 'EVERGREEN' && timer.evergreenMinutes) {
      const key = `timer_${timer.id}_expiresAt`;
      let expiresAt = localStorage.getItem(key);
      const now = Date.now();

      // handle first time or expired
      if (!expiresAt || Number(expiresAt) <= now) {
        expiresAt = String(now + timer.evergreenMinutes * 60 * 1000);
        localStorage.setItem(key, expiresAt);
      }

      const tick = () => {
        const now = Date.now();
        let remaining = Math.floor((Number(expiresAt) - now) / 1000);
        if (remaining <= 0) {
          countdown.textContent = '00:00:00';
          return;
        }

        const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
        remaining %= 3600;
        const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
        const seconds = String(remaining % 60).padStart(2, '0');

        countdown.textContent = `${hours}:${minutes}:${seconds}`;
      };
      tick();
      setInterval(tick, 1000);
      return;
    }
    // fallback for other types or missing data
    countdown.textContent = '';
  }
})();
