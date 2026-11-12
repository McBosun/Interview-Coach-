/* Runs the app outside Claude (e.g. GitHub Pages).
   Default: a built-in interviewer that needs NO account and NO API key.
   Optional: paste an Anthropic API key for a smarter AI interviewer (falls back automatically if the key fails). */
(function () {
  if (window.claude && window.claude.use) return;
  var KEY = 'hic_key', MODEL = 'claude-sonnet-5-5', warned = false;
  function key() { try { return (localStorage.getItem(KEY) || '').trim(); } catch (e) { return ''; } }
  function clearKey() { try { localStorage.removeItem(KEY); } catch (e) {} var i = document.getElementById('apikey'); if (i) i.value = ''; }

  /* ---------- built-in interviewer ---------- */
  var COMMON = [
    ['Tell me about a time a guest was very unhappy. What did you do and what happened?', 'the situation, your service recovery steps, and the outcome'],
    ['Tell me about a time you led a team through a difficult busy period.', 'how you planned, delegated, motivated, and measured the result'],
    ['How do you handle a conflict between two team members?', 'listening to both sides, fair action, and follow-up'],
    ['Tell me about a time you missed a target or made a mistake. What did you learn?', 'ownership, the fix, and a lasting change']
  ];
  var ROLE = {
    'General Manager': [
      ['How would you set the budget and revenue targets for the next 12 months at this property?', 'occupancy and rate assumptions, cost controls, and weekly tracking'],
      ['Tell me about a time you turned around an underperforming department.', 'the problem, your plan, and the numbers before and after'],
      ['How do you keep standards consistent across every department?', 'SOPs, audits, daily briefings, and accountability'],
      ['A big wedding party is double booked with a corporate event. What do you do?', 'the immediate fix, guest communication, compensation, and prevention']],
    'Front Office Manager': [
      ['Describe how you handle overbooking at the front desk.', 'walk policy, a clear guest script, relocation or upgrade, and recovery'],
      ['How do you train front desk staff to upsell without sounding pushy?', 'role play, incentives, guest-first language, and tracking results'],
      ['A guest demands a refund at 2am and the duty manager is unreachable. What do you do?', 'empathy, limits of your authority, a documented decision, and follow-up'],
      ['How do you manage shift handovers and avoid mistakes between teams?', 'checklists, logbooks, and briefings']],
    'Food & Beverage Manager': [
      ['How do you control food and beverage costs without hurting quality?', 'portion control, stock counts, waste tracking, and supplier negotiation'],
      ['Tell me about handling a kitchen and service team that blame each other.', 'root cause, a joint briefing, and shared targets'],
      ['A guest reports an allergic reaction after a meal. What do you do?', 'immediate safety, escalation, documentation, and prevention'],
      ['How would you plan menu pricing and promotions for a slow season?', 'costing, margins, demand data, and testing']],
    'Housekeeping Manager': [
      ['How do you plan housekeeping staffing for peak and low occupancy?', 'forecasts, rooms per attendant, and flexible hours'],
      ['How do you make sure rooms pass inspection every time?', 'checklists, supervisor audits, and feedback to attendants'],
      ['A guest says an item went missing from their room. How do you respond?', 'empathy, procedure, investigation, and confidentiality'],
      ['How do you manage linen, supplies and chemical costs?', 'par levels, counts, vendor management, and safety']],
    'Revenue Manager': [
      ['How do you set room rates through the seasons?', 'demand forecasts, competitor rates, segments, and pickup tracking'],
      ['How would you balance online travel agents with direct bookings?', 'commissions, rate parity, direct incentives, and channel mix'],
      ['Occupancy is far below forecast for next month. What do you do?', 'diagnosis, rate and channel changes, promotions, and daily review'],
      ['Which reports do you check every day and why?', 'pickup, pace, ADR, RevPAR, and cancellations']],
    'Events & Banquet Manager': [
      ['Walk me through planning a 300-guest wedding from enquiry to event day.', 'timeline, vendors, staffing, contingency, and client communication'],
      ['The client changes the guest count the day before. How do you cope?', 'policy, kitchen and staffing changes, calm communication, and cost'],
      ['How do you price event packages and protect your margins?', 'costing, minimum spend, deposits, and add-ons'],
      ['A key supplier fails to deliver an hour before the event. What now?', 'backup suppliers, honesty with the client, a quick fix, and a review']]
  };
  var CATS = ['Communication', 'Leadership', 'Guest focus', 'Commercial awareness', 'Structure of answers'];
  var STRONG = {
    'Communication': 'your answer was clear and well sized',
    'Leadership': 'you showed how you lead and involve your team',
    'Guest focus': 'you kept the guest at the centre',
    'Commercial awareness': 'you linked your actions to business impact',
    'Structure of answers': 'you followed a clear situation, action, result flow'
  };
  var WEAK = {
    'Leadership': 'say how you briefed, delegated or coached your team',
    'Guest focus': 'name the guest impact: how they felt and what changed for them',
    'Commercial awareness': 'add a number such as revenue, cost saved, occupancy, a score or a time',
    'Structure of answers': 'use Situation, Task, Action, Result so the interviewer can follow your story'
  };
  var st = { qs: [], rec: [], role: '', prop: '' };

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pickQuestions(role) {
    var intro = ['Tell me about yourself and why you want this ' + role + ' role.', 'your background, two or three key results, and why this property'];
    var r = shuffle(ROLE[role] || ROLE['General Manager']);
    var c = shuffle(COMMON);
    return [intro, c[0], r[0], r[1], r[2], c[1]];
  }
  function count(re, s) { var m = s.match(re); return m ? m.length : 0; }
  function score(t) {
    var l = t.toLowerCase(), w = t.trim().split(/\s+/).filter(Boolean).length;
    var star = (count(/\b(situation|when i|at the time|my role|was responsible|we had)\b/g, l) > 0 ? 1 : 0) +
      (count(/\bi (decided|asked|organi[sz]ed|trained|set up|introduced|created|spoke|met|called|implemented|reviewed|assigned|apologi[sz]ed|offered|checked|listened|arranged|moved|started)\b/g, l) > 0 ? 1 : 0) +
      (count(/\b(result|as a result|outcome|which led|resulting|improved|increased|reduced|saved|achieved|ended up)\b/g, l) > 0 ? 1 : 0);
    var num = count(/\d+(\.\d+)?\s?%|\b\d+\b|percent/g, l);
    var guest = count(/\b(guest|customer|client|experience|satisf|review|feedback|complaint|loyal|apolog)/g, l);
    var team = count(/\b(team|staff|colleague|coach|train|delegat|motivat|brief|mentor|supervis|shift)/g, l);
    var biz = count(/\b(revenue|cost|budget|profit|occupancy|adr|revpar|margin|forecast|payroll|stock|waste|upsell|rate|target)/g, l);
    function cl(x) { return Math.max(1, Math.min(9, Math.round(x))); }
    var comm = w < 12 ? 2 : w < 30 ? 4 : w < 55 ? 6 : w <= 200 ? 8 : 6;
    return { w: w, s: {
      'Communication': cl(comm), 'Leadership': cl(2.5 + team * 1.5 + (comm >= 6 ? 1 : 0)),
      'Guest focus': cl(2.5 + guest * 1.5 + (comm >= 6 ? 1 : 0)),
      'Commercial awareness': cl(2.5 + biz * 1.4 + (num > 0 ? 1.5 : 0)),
      'Structure of answers': cl(2 + star * 2.2 + (w >= 40 ? 1 : 0)) } };
  }
  function feedback(ans, q) {
    var sc = score(ans); st.rec.push(sc);
    if (sc.w < 10) return 'That was too short for me to assess. A strong answer would include ' + q[1] + '.';
    var best = CATS[0], worst = CATS[0];
    CATS.forEach(function (c) { if (sc.s[c] > sc.s[best]) best = c; if (sc.s[c] < sc.s[worst]) worst = c; });
    var fix = worst === 'Communication' ? (sc.w < 40 ? 'go deeper with 60 to 120 words of specific detail' : 'get to the point faster') : WEAK[worst];
    return 'Feedback: ' + STRONG[best].charAt(0).toUpperCase() + STRONG[best].slice(1) + '. To improve, ' + fix + '. A strong answer would include ' + q[1] + '.';
  }
  function card() {
    var avg = {}, tot = 0;
    CATS.forEach(function (c) { var s = 0; st.rec.forEach(function (r) { s += r.s[c]; }); avg[c] = st.rec.length ? s / st.rec.length : 0; tot += avg[c]; });
    var order = CATS.slice().sort(function (a, b) { return avg[b] - avg[a]; });
    var lines = ['SCORECARD', 'Overall: ' + (tot / CATS.length).toFixed(1) + ' / 10'];
    CATS.forEach(function (c) { lines.push(c + ': ' + avg[c].toFixed(1) + ' / 10'); });
    lines.push('Strengths: ' + order.slice(0, 3).map(function (c) { return STRONG[c]; }).join('; ') + '.');
    lines.push('To improve: ' + order.slice(-3).reverse().map(function (c) { return c === 'Communication' ? 'give fuller, more specific answers' : WEAK[c]; }).join('; ') + '.');
    lines.push('Tip: in every answer, finish with a result that includes a number.');
    lines.push('(Scored by built-in rules, not AI, so treat it as a guide.)');
    return lines.join('\n');
  }
  function local(messages) {
    var first = messages[0].content, last = messages[messages.length - 1].content;
    var m = first.match(/Role: (.*?)\. Property: (.*?)\. Interviewer style: (.*?)\./) || [];
    if (messages.length === 1) {
      st = { qs: pickQuestions(m[1] || 'General Manager'), rec: [], role: m[1] || 'General Manager', prop: (m[2] || 'property').toLowerCase() };
      var hi = /formal/i.test(m[3] || '') ? 'Good day, and thank you for attending this panel interview' : /tough/i.test(m[3] || '') ? 'Thanks for coming in. I have a lot to cover, so let\u2019s get straight to it' : 'Hello, and thanks for coming in';
      return hi + '. This is for the ' + st.role + ' position at our ' + st.prop + '.\n\nQuestion 1 of 6: ' + st.qs[0][0];
    }
    var nm = last.match(/answered (\d+) of/), n = nm ? parseInt(nm[1], 10) : st.rec.length + 1;
    var ans = last.split('\n\n[Interviewer note')[0];
    var fb = feedback(ans, st.qs[n - 1] || st.qs[0]);
    if (n >= 6) return fb + '\n\n' + card();
    return fb + '\n\nQuestion ' + (n + 1) + ' of 6: ' + st.qs[n][0];
  }

  /* ---------- optional AI via your own key ---------- */
  async function viaApi(messages, opts) {
    var r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key(), 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: messages }),
        signal: opts && opts.signal
      });
    } catch (err) { if (err && err.name === 'AbortError') throw err; return null; }
    if (r.status === 401) { clearKey(); return null; }
    if (!r.ok) return null;
    var j = await r.json();
    return (j.content || []).map(function (c) { return c.text || ''; }).join('');
  }

  window.claude = { use: async function (name) {
    if (name === 'sample') return async function (messages, opts) {
      var t = null;
      if (key() && !(messages.length === 1 && false)) t = await viaApi(messages, opts);
      if (t === null) {
        if (key() === '' && messages.length === 1) st = { qs: [], rec: [], role: '', prop: '' };
        await new Promise(function (r) { setTimeout(r, 350); });
        t = local(messages);
      }
      if (opts && opts.onText) opts.onText({ text: t });
      return { text: t };
    };
    if (name === 'downloads') return { save: async function (o) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(o.data); a.download = o.filename;
      document.body.appendChild(a); a.click(); a.remove();
    } };
    return null;
  } };

  var setup = document.getElementById('setup'), start = document.getElementById('start');
  var box = document.createElement('div');
  box.innerHTML = '<label>Optional: Anthropic API key for a smarter AI interviewer (leave empty to use the built-in one)</label>' +
    '<input id="apikey" type="password" autocomplete="off" placeholder="sk-ant-\u2026 (optional)" style="width:100%;padding:11px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--ink);font:inherit">';
  setup.insertBefore(box, start.parentNode);
  var inp = box.querySelector('input'); inp.value = key();
  inp.addEventListener('input', function () { try { localStorage.setItem(KEY, inp.value.trim()); } catch (e) {} });
})();
