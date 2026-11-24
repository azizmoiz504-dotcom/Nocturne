/* Product pages: "Build your quote". The buyer picks size, rating / spec, material and quantity, and the
   WhatsApp button carries that choice. "Not sure" (or an empty box) sends the same "to confirm (…)" line as before. */
(function () {
  var box = document.querySelector('.pick'), go = document.getElementById('pickGo');
  if (!box || !go) return;
  var base = go.href.split('?')[0];
  function msg() {
    var lines = ['*' + box.dataset.name + '*', 'Group: ' + box.dataset.group];
    box.querySelectorAll('[data-k]').forEach(function (el) {
      var v = (el.value || '').trim();
      if (el.type === 'number' && v && !(+v > 0)) v = '';
      lines.push(el.dataset.k + ': ' + (v || el.dataset.unsure || ''));
    });
    return 'Hello Fakhri Tools, please send me a price for:\n\n' + lines.join('\n');
  }
  function upd() { go.href = base + '?text=' + encodeURIComponent(msg()); }
  box.addEventListener('input', upd);
  box.addEventListener('change', upd);
  box.hidden = false;
  upd();
})();
