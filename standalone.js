/* Lets the app run outside Claude (e.g. GitHub Pages) using your own Anthropic API key.
   The key is kept only in this browser's localStorage and is sent only to api.anthropic.com. */
(function () {
  if (window.claude && window.claude.use) return;
  var KEY = 'hic_key', MODEL = 'claude-sonnet-5-5';
  function key() { try { return (localStorage.getItem(KEY) || '').trim(); } catch (e) { return ''; } }
  window.claude = {
    use: async function (name) {
      if (name === 'sample') {
        return async function (messages, opts) {
          var r;
          try { r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-api-key': key(),
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: messages }),
            signal: opts && opts.signal
          }); } catch (err) {
            if (err && err.name === 'AbortError') throw err;
            throw { code: 'network', message: 'Could not reach api.anthropic.com. Check your internet connection, any ad blocker, and that your API key has no stray characters.' };
          }
          if (!r.ok) {
            var m = ''; try { var ej = await r.json(); m = (ej.error && ej.error.message) || ''; } catch (x) {}
            var hint = r.status === 401 ? 'Your API key was rejected. Re-paste it.' : r.status === 429 ? 'Rate limit reached. Wait a moment and try again.' : m;
            throw { code: r.status === 429 ? 'rate_limited' : 'api_' + r.status, message: '(' + r.status + ') ' + hint };
          }
          var j = await r.json();
          var t = (j.content || []).map(function (c) { return c.text || ''; }).join('');
          if (opts && opts.onText) opts.onText({ text: t });
          return { text: t };
        };
      }
      if (name === 'downloads') {
        return { save: async function (o) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(o.data); a.download = o.filename;
          document.body.appendChild(a); a.click(); a.remove();
        } };
      }
      return null;
    }
  };
  var setup = document.getElementById('setup'), start = document.getElementById('start');
  var box = document.createElement('div');
  box.innerHTML = '<label>Anthropic API key (saved only in this browser)</label>' +
    '<input id="apikey" type="password" autocomplete="off" placeholder="sk-ant-…" ' +
    'style="width:100%;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--ink);font:inherit">';
  setup.insertBefore(box, start.parentNode);
  var inp = box.querySelector('input'); inp.value = key();
  inp.addEventListener('input', function () { try { localStorage.setItem(KEY, inp.value.trim()); } catch (e) {} });
  start.addEventListener('click', function (e) {
    if (!key()) {
      e.stopImmediatePropagation();
      var s = document.getElementById('serr');
      s.textContent = 'Paste your Anthropic API key above first.'; s.classList.remove('hide');
    }
  }, true);
})();
