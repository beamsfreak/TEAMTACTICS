(function(){
  'use strict';
  const M=window.SetpiecesModel||window.AttackModel, player=new M.Playback(), ns='http://www.w3.org/2000/svg';
  const $=s=>document.querySelector(s), nodes={own:{},blue:{}};
  const field=$('#tactic-board'), football=$('#football');
  let previousTime=null, speed=1, lastStep='',lastState='',animationId=0;
  function svg(tag,attrs={}){const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;}
  function addPlayers(){
    for(const id of M.ids){
      const blue=svg('g',{'aria-label':`对方${id}号`});blue.append(svg('circle',{r:3.1,class:'blue-circle'}));
      const bn=svg('text',{class:'token-number blue-number',y:.1});bn.textContent=id;blue.append(bn);$('#opponents').append(blue);nodes.blue[id]=blue;
      const own=svg('g',{'aria-label':`我方${id}号${M.names[id]}`});own.append(svg('circle',{r:4.65,class:'focus-ring'}),svg('circle',{r:3.7,class:'own-circle'}));
      const number=svg('text',{class:'token-number',y:.1});number.textContent=id;const label=svg('text',{class:'token-label',y:8});label.textContent=M.shortNames[id];own.append(number,label);$('#our-players').append(own);nodes.own[id]=own;
    }
  }
  function routePath(a,b,c){return c?`M${a.join(' ')}Q${c.join(' ')} ${b.join(' ')}`:`M${a.join(' ')}L${b.join(' ')}`;}
  function drawRoutes(s){
    $('#run-routes').replaceChildren();$('#pass-routes').replaceChildren();
    for(const id of M.ids){
      const a=s.start[id],b=s.finish[id];
      if(Math.hypot(b[0]-a[0],b[1]-a[1])>2)$('#run-routes').append(svg('path',{d:routePath(a,b,s.curves?.[id]),class:`run-route ${s.focus.includes(id)?'key-run':''}`}));
      nodes.own[id].classList.toggle('is-focus',s.focus.includes(id));
    }
    const p=M.passRoute(s);if(p)$('#pass-routes').append(svg('path',{d:routePath(p.from,p.to),class:`pass-route ${p.shot?'shot':''} ${p.high?'high-pass':''}`}));
    $('#run-routes').style.display=$('#show-runs').checked?'':'none';
  }
  function updateStep(){
    const s=player.current, strategy=player.strategy,key=`${player.strategyIndex}/${player.step}`;
    if(lastStep===key)return;lastStep=key;
    $('#step-count').textContent=`STEP ${String(player.step+1).padStart(2,'0')} / ${String(strategy.steps.length).padStart(2,'0')}`;
    $('#step-title').textContent=s.title;$('#step-text').textContent=s.text;$('#guard-text').textContent=s.guard;
    $('#duty-list').replaceChildren(...M.ids.map(id=>{const li=document.createElement('li'),badge=document.createElement('span'),body=document.createElement('div'),title=document.createElement('b'),p=document.createElement('p');badge.className='duty-no';badge.textContent=id;title.textContent=M.names[id];p.textContent=s.duties[id];body.append(title,p);li.append(badge,body);return li;}));
    document.querySelectorAll('.step-chip').forEach((b,i)=>{if(i===player.step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.classList.toggle('done',i<player.step);});
    $('#board-title').textContent=`${strategy.name}，第${player.step+1}步：${s.title}`;
    drawRoutes(s);
  }
  function render(){
    updateStep();const snapshot=player.snapshot();
    for(const id of M.ids){nodes.own[id].setAttribute('transform',`translate(${snapshot.own[id].join(' ')})`);nodes.blue[id].setAttribute('transform',`translate(${snapshot.opposition[id].join(' ')})`);}
    football.setAttribute('transform',`translate(${snapshot.ball.join(' ')})`);
    const b=player.current.ball, flying=!!b.release&&player.progress>b.release&&player.progress<b.arrive;
    const owner=b.kind==='carry'?b.owner:!flying&&player.progress>=b.arrive?b.to:!flying?b.from:null;
    const status=$('#possession-status');
    if(status)status.textContent=flying?(b.high?'高球飞行 · 看落点':b.toPoint?'球未受控 · 看第二点':'传球 / 射门中'):owner!=null?`${String(owner).startsWith('b')?'蓝方':'我方'} ${String(owner).replace(/^b/,'')}号持球`:b.kind==='hold'||b.fromPoint&&player.progress<=b.release?'准备重新开球':'球未受控 · 判断落点';
    football.classList.toggle('high-flight',flying&&!!b.high);
    $('#scrubber').value=String(Math.round(player.progress*1000));$('#progress-value').textContent=`${Math.round(player.progress*100)}%`;
    $('#scrubber').setAttribute('aria-valuetext',`第${player.step+1}步，${Math.round(player.progress*100)}%`);
    $('#prev-step').disabled=player.step===0;$('#next-step').disabled=player.step===player.strategy.steps.length-1;
    $('#pause').disabled=!player.started||player.finished;$('#pause').textContent=player.running?'暂停':'继续';
    if(!player.started)$('#pause').textContent='暂停';
    const state=player.running?(player.mode==='all'?'完整播放中':'本步播放中'):player.finished?(player.mode==='all'?'全程播放结束':'本步播放结束'):player.started?'已暂停':'准备播放';
    if(state!==lastState){$('#play-status').textContent=state;lastState=state;}
  }
  function ensureFrame(){if(animationId||!player.running)return;previousTime=null;animationId=requestAnimationFrame(frame);}
  function frame(now){
    animationId=0;if(previousTime!==null)player.advance(Math.max(0,now-previousTime)*speed);previousTime=now;render();
    if(player.running)animationId=requestAnimationFrame(frame);
  }
  function stopFrame(){if(animationId)cancelAnimationFrame(animationId);animationId=0;previousTime=null;}
  function prepareView(){if(window.innerWidth<760)$('#player').scrollIntoView({block:'start',behavior:'smooth'});}
  function playSingle(index,scroll=false){stopFrame();player.selectStep(index,true);render();ensureFrame();if(scroll)prepareView();}
  function selectStrategy(i){
    stopFrame();player.setStrategy(i);lastStep='';lastState='';
    document.querySelectorAll('[data-strategy]').forEach(b=>{b.setAttribute('aria-pressed',String(Number(b.dataset.strategy)===i));b.hidden=!!$('#lesson-groups')&&(M.strategies[Number(b.dataset.strategy)].group!==player.strategy.group);});
    document.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.group===player.strategy.group)));
    const followups=$('#followup-links');
    if(followups){followups.replaceChildren(...(player.strategy.followups||[]).map(id=>{const s=M.strategies.find(x=>x.id===id),a=document.createElement('a');a.href=`#${id}`;a.textContent=s.name;return a;}));$('#followup-panel').hidden=!followups.childElementCount;}
    $('#strategy-condition').textContent=player.strategy.condition;
    $('#origin-text').textContent=`${window.SetpiecesModel?'9人制':'3-2-3'} / ${player.strategy.startHint||'从门将出球开始'}`;
    $('#reset').textContent=player.strategy.resetLabel||'回到开球';
    $('#step-chips').classList.toggle('long-sequence',player.strategy.steps.length>8);
    $('#route-summary').textContent=player.strategy.summary;$('#principle').textContent=player.strategy.principle;
    $('#step-chips').replaceChildren(...player.strategy.steps.map((s,i)=>{const b=document.createElement('button');b.type='button';b.className='step-chip';b.textContent=i+1;b.setAttribute('aria-label',`播放第${i+1}步：${s.title}`);b.addEventListener('click',()=>playSingle(i));return b;}));
    $('#step-list').replaceChildren(...player.strategy.steps.map((s,i)=>{const li=document.createElement('li'),b=document.createElement('button'),n=document.createElement('span'),text=document.createElement('b');b.type='button';n.textContent=String(i+1).padStart(2,'0');text.textContent=s.title;b.append(n,text);b.addEventListener('click',()=>playSingle(i,true));li.append(b);return li;}));
    render();
  }
  $('#play-all').addEventListener('click',()=>{stopFrame();player.playAll();render();ensureFrame();prepareView();});
  $('#play-step').addEventListener('click',()=>{stopFrame();player.playStep();render();ensureFrame();});
  $('#pause').addEventListener('click',()=>{if(player.running){player.pause();stopFrame();}else player.resume();render();ensureFrame();});
  $('#reset').addEventListener('click',()=>{stopFrame();player.reset();render();});
  $('#prev-step').addEventListener('click',()=>playSingle(player.step-1));$('#next-step').addEventListener('click',()=>playSingle(player.step+1));
  $('#scrubber').addEventListener('input',()=>{stopFrame();player.seek(Number($('#scrubber').value)/1000);render();});
  $('#speed').addEventListener('change',()=>{speed=Number($('#speed').value);});
  $('#show-runs').addEventListener('change',()=>{$('#run-routes').style.display=$('#show-runs').checked?'':'none';});
  const tabs=$('.strategy-tabs');tabs.replaceChildren(...M.strategies.map((s,i)=>{const b=document.createElement('button'),letter=document.createElement('span'),body=document.createElement('span'),title=document.createElement('b'),small=document.createElement('small');b.type='button';b.dataset.strategy=String(i);b.setAttribute('aria-pressed','false');letter.className='letter';letter.textContent=s.letter;title.textContent=s.group==='press'?s.name.split(' · ').slice(-1)[0]:s.name.split(' · ')[0];small.textContent=s.short;body.append(title,small);b.append(letter,body);b.addEventListener('click',()=>{history.replaceState(null,'',`#${s.id}`);selectStrategy(i);});return b;}));
  document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{const i=M.strategies.findIndex(s=>s.group===b.dataset.group);history.replaceState(null,'',`#${M.strategies[i].id}`);selectStrategy(i);}));
  window.addEventListener('hashchange',()=>{selectStrategy(Math.max(0,M.strategies.findIndex(s=>`#${s.id}`===location.hash)));prepareView();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player.pause();stopFrame();render();}});
  document.addEventListener('keydown',e=>{if(e.target.closest('input,select,button,a,summary'))return;if(e.key===' '){e.preventDefault();if(player.running){player.pause();stopFrame();}else if(player.started&&!player.finished)player.resume();else player.playStep();render();ensureFrame();}else if(e.key==='ArrowRight'&&player.step<player.strategy.steps.length-1)playSingle(player.step+1);else if(e.key==='ArrowLeft'&&player.step>0)playSingle(player.step-1);});
  addPlayers();selectStrategy(Math.max(0,M.strategies.findIndex(s=>`#${s.id}`===location.hash)));
})();
