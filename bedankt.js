(function () {
  var params = new URLSearchParams(window.location.search);
  var config = window.HUIZENMARKT_CONFIG || {};
  var checkout = config.checkout || 'api';
  var supportEmail = config.email || 'info@huizenmarkt-nederland.nl';
  var paymentId = params.get('id') || (function () {
    try { return sessionStorage.getItem('hm_payment_id'); } catch (e) { return null; }
  })();
  var productSlug = params.get('product') || (function () {
    try { return sessionStorage.getItem('hm_product'); } catch (e) { return null; }
  })();

  var statusBox = document.getElementById('thanks-status');
  var statusText = document.getElementById('thanks-status-text');
  var downloadWrap = document.getElementById('thanks-download');
  var downloadBtn = document.getElementById('download-btn');
  var lead = document.getElementById('thanks-lead');
  var support = document.getElementById('thanks-support');

  function showSupport(message) {
    support.innerHTML = message + ' Mail <a href="mailto:' + supportEmail + '">' + supportEmail + '</a>.';
  }

  function applyPaidState(data) {
    statusBox.classList.remove('is-loading');

    if (data.productName) {
      lead.textContent = 'Bedankt voor je aankoop van de ' + data.productName + '.';
    }

    if (data.downloadUrl) {
      downloadBtn.href = data.downloadUrl;
      downloadWrap.hidden = false;
    }

    if (data.emailSent) {
      statusText.textContent = 'Betaling bevestigd. Je PDF is verstuurd naar je e-mail.';
      lead.textContent = (lead.textContent || 'Bedankt.') + ' Je PDF is ook per e-mail verzonden.';
      try {
        sessionStorage.removeItem('hm_payment_id');
        sessionStorage.removeItem('hm_product');
      } catch (e) {}
      return true;
    }

    if (data.paid) {
      statusText.textContent = 'Betaling bevestigd. Je PDF wordt per e-mail verstuurd.';
      lead.textContent = 'Je PDF wordt binnen enkele minuten naar je e-mailadres gestuurd.';
      if (data.downloadUrl) {
        statusText.textContent += ' Je kunt hem ook direct downloaden.';
      }
      return true;
    }

    return false;
  }

  function verifyOnce() {
    return fetch('/.netlify/functions/verify-payment?id=' + encodeURIComponent(paymentId))
      .then(function (res) { return res.json(); });
  }

  function pollPayment(attempt) {
    return verifyOnce().then(function (data) {
      if (applyPaidState(data)) return data;
      if (attempt >= 12) {
        statusBox.classList.remove('is-loading');
        statusText.textContent = 'We kunnen je betaling nog niet bevestigen.';
        showSupport('Heb je net betaald? Wacht een minuut en ververs de pagina, of neem contact op.');
        return data;
      }
      statusText.textContent = 'Betaling controleren… (' + (attempt + 1) + '/12)';
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(pollPayment(attempt + 1)); }, 2500);
      });
    });
  }

  if (!paymentId || checkout !== 'api') {
    if (productSlug && config.products && config.products[productSlug]) {
      lead.textContent = 'Bedankt voor je aankoop van de ' + config.products[productSlug].name + '. Je PDF komt per e-mail.';
    }
    return;
  }

  statusBox.hidden = false;
  pollPayment(0).catch(function () {
    statusBox.classList.remove('is-loading');
    statusText.textContent = 'Controle mislukt. Je betaling kan al gelukt zijn.';
    showSupport('Krijg je geen PDF per e-mail?');
  });
})();
