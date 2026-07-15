(function () {
  var config = window.HUIZENMARKT_CONFIG || {};
  var mode = config.mode || 'waitlist';
  var checkout = config.checkout || 'api';
  var paymentLinks = config.paymentLinks || {};
  var supportEmail = config.email || 'info@huizenmarkt-nederland.nl';

  function isPlaceholder(url) {
    return !url || url.indexOf('VERVANG') !== -1;
  }

  document.querySelectorAll('[data-product]').forEach(function (btn) {
    var slug = btn.getAttribute('data-product');

    if (btn.hasAttribute('data-soon')) {
      btn.classList.add('btn-disabled');
      btn.setAttribute('aria-disabled', 'true');
      btn.addEventListener('click', function (e) { e.preventDefault(); });
      return;
    }

    if (mode === 'live' && checkout === 'links') {
      var link = paymentLinks[slug];
      if (!isPlaceholder(link)) {
        btn.href = link;
        btn.target = '_blank';
        btn.rel = 'noopener';
        return;
      }
    }

    if (mode === 'live' && checkout === 'api') {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        btn.disabled = true;
        var label = btn.textContent;
        btn.textContent = 'Even geduld…';

        fetch('/.netlify/functions/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: slug })
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { ok: res.ok, data: data };
            });
          })
          .then(function (result) {
            if (!result.ok || !result.data.checkoutUrl) {
              throw new Error(result.data.error || 'Checkout mislukt');
            }
            try {
              sessionStorage.setItem('hm_payment_id', result.data.paymentId);
              sessionStorage.setItem('hm_product', slug);
            } catch (err) {}
            window.location.href = result.data.checkoutUrl;
          })
          .catch(function () {
            btn.disabled = false;
            btn.textContent = label;
            alert('Betaling starten mislukt. Mail ' + supportEmail);
          });
      });
      return;
    }

    btn.classList.add('btn-disabled');
    btn.setAttribute('aria-disabled', 'true');
    btn.setAttribute('title', 'Betaling nog niet beschikbaar');
    btn.addEventListener('click', function (e) { e.preventDefault(); });
  });

  var newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailEl = document.getElementById('email');
      var email = emailEl ? emailEl.value : '';
      var subject = encodeURIComponent('Marktbriefing inschrijving');
      var body = encodeURIComponent('Hoi, ik wil de Marktbriefing.\n\nE-mail: ' + (email || ''));
      window.location.href = 'mailto:' + supportEmail + '?subject=' + subject + '&body=' + body;
    });
  }
})();
