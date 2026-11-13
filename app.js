var TOTAL=6, hist=[], n=0, busy=false, sample=null, dict=null, setupTxt='', ctl=null, base='', listening=false, muted=false, curTxt='';
var $=function(i){return document.getElementById(i)};
var SYS="You are an experienced hospitality industry interviewer conducting a realistic mock job interview. Rules: Ask exactly ONE question at a time. Mix behavioral (STAR-style), situational, and role-specific operational questions (guest complaints, staffing, budgets and cost control, revenue, standards, team conflict, overbooking, service recovery as relevant). Keep every reply short and speakable. After the candidate answers, give brief honest feedback (2 to 3 sentences: one strength, one concrete improvement, and what a stronger answer would include), then ask the next question. Do not praise weak answers. Never write the candidate's answers for them. Use plain text, no markdown headers.";
function stopSpeak(){try{speechSynthesis.cancel()}catch(e){}}
function speak(t){curTxt=t;if(muted||!window.speechSynthesis)return;stopSpeak();var u=new SpeechSynthesisUtterance(t.replace(/\*\*/g,'').replace(/\n+/g,'. '));u.rate=0.98;u.onstart=function(){$('vst').textContent='Interviewer speaking…'};u.onend=function(){$('vst').textContent='Your turn: tap the mic to answer'};speechSynthesis.speak(u)}
var spoken=0;
function qSpeak(s){if(muted||!window.speechSynthesis||!s.trim())return;var u=new SpeechSynthesisUtterance(s.replace(/\*\*/g,''));u.rate=0.98;u.onstart=function(){$('vst').textContent='Interviewer speaking…'};u.onend=function(){if(!speechSynthesis.speaking&&!speechSynthesis.pending)$('vst').textContent='Your turn: type, or tap Record answer'};speechSynthesis.speak(u)}
function streamSpeak(t,fin){var rest=t.slice(spoken),m,last=0,re=/[^.!?\n]+[.!?]+\s|[^\n]+\n/g;while((m=re.exec(rest))){last=re.lastIndex;qSpeak(m[0])}spoken+=last;if(fin){qSpeak(t.slice(spoken));spoken=t.length}}
function setup(){return "Role: "+$('role').value+". Property: "+$('prop').value+". Interviewer style: "+$('tone').value+". Candidate level: "+$('lvl').value+"."}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmt(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}
function add(cls,txt){var d=document.createElement('div');d.className='msg '+cls;d.innerHTML=fmt(txt);$('log').appendChild(d);scroll();return d}
function scroll(){var m=$('main');m.scrollTop=m.scrollHeight}
function prog(){$('pl').textContent=n<TOTAL?('Question '+Math.min(n+1,TOTAL)+' of '+TOTAL):'Scorecard';$('bar').style.width=(n/TOTAL*100)+'%'}
function build(){
  var msgs=hist.map(function(m){return {role:m.role,content:m.content}});
  var first=SYS+"\n\n"+setupTxt+"\n\nBegin the interview: greet me in one line, then ask question 1.";
  var out=[{role:'user',content:first}];
  if(hist.length){out=[{role:'user',content:first}].concat(msgs)}
  var last=out[out.length-1];
  if(last.role==='user'&&hist.length){
    var note=n<TOTAL?"\n\n[Interviewer note, not from the candidate: they have now answered "+n+" of "+TOTAL+" questions. Give feedback, then ask question "+(n+1)+".]":"\n\n[Interviewer note, not from the candidate: that was the final answer. Give brief feedback on it, then a SCORECARD: overall score out of 10, scores out of 10 for Communication, Leadership, Guest focus, Commercial awareness and Structure of answers, the 3 biggest strengths, the 3 most important things to improve, and one tip for the next practice round. Do not ask another question.]";
    out[out.length-1]={role:'user',content:last.content+note};
  }
  return out;
}
async function turn(){
  busy=true;$('send').disabled=true;$('vst').textContent='Interviewer is thinking…';
  var d=add('bot','…');spoken=0;stopSpeak();
  ctl=new AbortController();
  try{
    var r=await sample(build(),{onText:function(o){d.innerHTML=fmt(o.text);scroll();streamSpeak(o.text,false)},signal:ctl.signal,cache:false});
    d.innerHTML=fmt(r.text);
    hist.push({role:'assistant',content:r.text});curTxt=r.text;streamSpeak(r.text,true);
    if(n>=TOTAL){$('inp').disabled=true;$('send').disabled=true;var b=document.createElement('button');b.className='btn';b.textContent='Practice again';b.style.margin='10px 0';b.onclick=function(){location.reload()};$('log').appendChild(b);return}
  }catch(e){
    if(e&&e.code==='not_granted'){d.innerHTML='Permission to use Claude was declined, so the interviewer can\u2019t run. Reload and allow it to continue.';}
    else if(e&&e.code==='rate_limited'){d.innerHTML='Too many requests just now. Wait a moment and send again.';hist.pop();n--;}
    else{d.innerHTML='Something went wrong reaching the interviewer. '+(e&&e.message?esc(String(e.message)):'Please try sending again.');if(hist.length&&hist[hist.length-1].role==='user'){hist.pop();n--}}
  }finally{busy=false;if(n<TOTAL)$('send').disabled=false;prog();scroll()}
}
async function begin(){
  $('start').disabled=true;
  if(!sample){$('serr').textContent='The interviewer isn\u2019t available in this view. Open the page from your Claude account to use it.';$('serr').classList.remove('hide');$('start').disabled=false;return}
  setupTxt=setup();
  try{speechSynthesis.speak(new SpeechSynthesisUtterance(''))}catch(e){}
  $('setup').classList.add('hide');$('chat').classList.remove('hide');$('foot').classList.remove('hide');
  $('sub').textContent=$('role').value;
  prog();await turn();
}
async function send(){
  if(busy)return;var t=$('inp').value.trim();if(!t){$('vst').textContent='Nothing to send yet. Tap Record answer, or tap Type.';return}
  $('inp').value='';$('inp').style.height='auto';
  if(!hist.length)hist.push({role:'user',content:'(start)'}),hist.pop();
  hist.push({role:'user',content:t});n++;add('me',t);prog();await turn();
}
$('start').onclick=begin;$('send').onclick=send;
$('rep').onclick=function(){if(curTxt){var m=muted;muted=false;speak(curTxt);muted=m}};
$('mute').onclick=function(){muted=!muted;this.textContent=muted?'Voice off':'Voice on';if(muted)stopSpeak()};
$('inp').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&window.innerWidth>700){e.preventDefault();send()}});
$('inp').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,140)+'px'});
(async function(){
  try{sample=await claude.use('sample')}catch(e){sample=null}
  try{dict=await claude.use('dictation')}catch(e){dict=null}
  var vm=$('vmic');
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition,rec=null,mr=null,chunks=[],stream=null,recording=false,curStop=function(){},hasT=!!(dict||SR),transOnly=false;
  if(dict)dict.onFinal(function(o){$('inp').value=($('inp').value+' '+o.text).trim()});
  vm.disabled=false;vm.textContent='🎙️ Record answer';
  function idle(){recording=false;listening=false;vm.textContent='🎙️ Record answer'}
  function clip(blob){var url=URL.createObjectURL(blob);var w=document.createElement('div');w.className='msg me';var a=document.createElement('audio');a.controls=true;a.src=url;a.style.width='100%';w.appendChild(a);var b=document.createElement('button');b.className='btn ghost';b.textContent='Save audio';b.style.marginTop='6px';b.onclick=async function(){try{var dl=await claude.use('downloads');if(dl)await dl.save({filename:'interview-answer-'+(n+1)+'.webm',data:blob})}catch(e){}};w.appendChild(b);$('log').appendChild(w);scroll()}
  async function transcribeLocal(blob){
    if(!blob){$('vst').textContent='No audio was captured. Try again.';return}
    try{
      $('vst').textContent='Turning your audio into text (the first time downloads about 40 MB)…';
      if(!window._asr){var tf=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');window._asr=await tf.pipeline('automatic-speech-recognition','Xenova/whisper-tiny.en')}
      var o=await window._asr(URL.createObjectURL(blob),{chunk_length_s:30});
      var t=((o&&o.text)||'').trim();
      if(t){$('inp').value=t;$('vst').textContent='Sending your answer…';send()}else{$('vst').textContent='I couldn’t hear any words. Try again, or tap Type.'}
    }catch(e){$('vst').textContent='Couldn’t convert the audio to text here. Tap Type, or use your keyboard’s mic key.'}
  }
  function startTranscriptOnly(){if(!hasT){curStop();$('vst').textContent='This browser blocks the microphone. Tap Type to answer, or open the page in Chrome.';return}recording=true;listening=true;transOnly=true;vm.textContent='⏹ Stop';$('vst').textContent='Listening… (audio saving isn’t available here)'}
  vm.onclick=async function(){
    if(busy)return;
    if(recording){if(transOnly){transOnly=false;curStop();idle();setTimeout(function(){if($('inp').value.trim()){send()}else{$('vst').textContent='I couldn’t hear any words. Try again or tap Type.'}},800);return}try{mr.stop()}catch(e){}curStop();return}
    stopSpeak();
    var base0=$('inp').value.trim();
    if(dict){dict.start().catch(function(){});curStop=function(){try{dict.stop().catch(function(){})}catch(e){}}}
    else if(SR){try{rec=new SR();rec.lang='en-US';rec.continuous=true;rec.interimResults=true;rec.onresult=function(ev){var t='';for(var i=0;i<ev.results.length;i++)t+=ev.results[i][0].transcript+' ';$('inp').value=(base0+' '+t).trim()};rec.start();curStop=function(){try{rec.stop()}catch(e){}}}catch(e){}}
    if(!navigator.mediaDevices||!window.MediaRecorder){startTranscriptOnly();return}
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){startTranscriptOnly();return}
    chunks=[];mr=new MediaRecorder(stream);
    mr.ondataavailable=function(ev){if(ev.data&&ev.data.size)chunks.push(ev.data)};
    mr.onstop=function(){stream.getTracks().forEach(function(t){t.stop()});idle();var blob=chunks.length?new Blob(chunks,{type:mr.mimeType||'audio/webm'}):null;if(blob)clip(blob);setTimeout(function(){if($('inp').value.trim()){$('vst').textContent='Sending your answer…';send()}else{transcribeLocal(blob)}},800)};
    mr.start();recording=true;listening=true;vm.textContent='⏹ Stop recording';$('vst').textContent='Recording…';
  };
  var live=document.createElement('div');live.id='live';$('inp').parentNode.insertBefore(live,$('inp'));
  setInterval(function(){var v=$('inp').value.trim();live.textContent=v||'Your spoken answer will appear here';live.style.opacity=v?1:.6},250);
  var tg=$('mic');tg.classList.remove('hide');tg.textContent='Type';tg.onclick=function(){var t=document.body.classList.toggle('typing');tg.textContent=t?'Voice':'Type';live.style.display=t?'none':'block';if(t)$('inp').focus()};
  if(true)return;
  if(dict){
    dict.onPartial(function(o){$('inp').value=base+(base?' ':'')+o.text});
    dict.onFinal(function(o){base=(base+' '+o.text).trim();$('inp').value=base});
    dict.onState(function(s){listening=s.state==='listening';vm.textContent=listening?'⏹ Tap when done':'🎤 Tap to answer';if(listening)$('vst').textContent='Listening…'});
    vm.onclick=async function(){
      if(busy)return;
      if(listening){try{await dict.stop()}catch(e){}setTimeout(function(){if($('inp').value.trim())send()},250)}
      else{stopSpeak();base='';$('inp').value='';dict.start().catch(function(){$('vst').textContent='Microphone not allowed. Type your answer below.'})}
    };
  }else{
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){
      var rec=null;
      vm.onclick=function(){
        if(busy)return;
        if(listening){try{rec.stop()}catch(e){}return}
        stopSpeak();base='';$('inp').value='';
        rec=new SR();rec.lang='en-US';rec.continuous=true;rec.interimResults=true;
        rec.onresult=function(ev){var t='';for(var i=0;i<ev.results.length;i++)t+=ev.results[i][0].transcript+' ';$('inp').value=t.trim()};
        rec.onstart=function(){listening=true;vm.textContent='⏹ Tap when done';$('vst').textContent='Listening…'};
        rec.onend=function(){var was=listening;listening=false;vm.textContent='🎤 Tap to answer';if(was&&$('inp').value.trim())send()};
        rec.onerror=function(){listening=false;vm.textContent='🎤 Tap to answer';$('vst').textContent='Mic blocked here. Use the microphone key on your keyboard instead, then tap Send.'};
        try{rec.start()}catch(e){}
      };
    }else{
      vm.textContent='🎤 Answer with keyboard mic';
      vm.onclick=function(){stopSpeak();$('inp').focus();$('vst').textContent='Tap the microphone key on your keyboard, speak your answer, then tap Send'};
    }
  }
})();
