(function(){
  'use strict';
  const M=window.DefenseModel,player=new M.Playback(),ns='http://www.w3.org/2000/svg';
  const $=s=>document.querySelector(s),nodes={own:{},opp:{}};
  const football=$('#football');let frameId=0,previous=null,speed=1,lastStep='',lastState='';
  function svg(tag,attrs={}){const element=document.createElementNS(ns,tag);for(const[key,value]of Object.entries(attrs))element.setAttribute(key,value);return element;}
  function makePlayers(){
    for(const id of M.ids){
      const foe=svg('g',{'aria-label':`对方${id}号`});foe.append(svg('circle',{r:3.1,class:'blue-circle'}));
      const foeNo=svg('text',{class:'token-number blue-number',y:.1});foeNo.textContent=id;foe.append(foeNo);$('#opponents').append(foe);nodes.opp[id]=foe;
      const own=svg('g',{'aria-label':`我方${id}号${M.names[id]}`});own.append(svg('circle',{r:4.65,class:'focus-ring'}),svg('circle',{r:3.7,class:'own-circle'}));
      const ownNo=svg('text',{class:'token-number',y:.1});ownNo.textContent=id;
      const label=svg('text',{class:'token-label',y:8});label.textContent=M.labels[id];own.append(ownNo,label);$('#our-players').append(own);nodes.own[id]=own;
    }
  }
  function drawRoutes(s){
    $('#run-routes').replaceChildren();$('#pass-routes').replaceChildren();
    for(const id of M.ids){const a=s.start[id],b=s.end[id];
      if(Math.hypot(b[0]-a[0],b[1]-a[1])>2)$('#run-routes').append(svg('path',{d:`M${a.join(' ')}L${b.join(' ')}`,class:`run-route ${s.focus.includes(id)?'key-run':''}`}));
      nodes.own[id].classList.toggle('is-focus',s.focus.includes(id));
    }
    const pass=M.route(s);if(pass)$('#pass-routes').append(svg('path',{d:`M${pass.from.join(' ')}L${pass.to.join(' ')}`,class:`pass-route${pass.high?' high-pass':''}`}));
    $('#run-routes').style.display=$('#show-runs').checked?'':'none';
  }
  function updateStep(){
    const s=player.current,scene=player.scene,key=`${player.sceneIndex}/${player.step}`;if(lastStep===key)return;lastStep=key;
    $('#step-count').textContent=`STEP ${String(player.step+1).padStart(2,'0')} / ${String(scene.steps.length).padStart(2,'0')}`;
    $('#step-title').textContent=s.title;$('#step-text').textContent=s.text;$('#guard-text').textContent=s.guard;
    document.querySelectorAll('.step-chip').forEach((button,index)=>{if(index===player.step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');button.classList.toggle('done',index<player.step);});
    $('#board-title').textContent=`${scene.name}，第${player.step+1}步：${s.title}`;drawRoutes(s);
  }
  function render(){
    updateStep();const snap=player.snapshot();for(const id of M.ids){nodes.own[id].setAttribute('transform',`translate(${snap.own[id].join(' ')})`);nodes.opp[id].setAttribute('transform',`translate(${snap.opposition[id].join(' ')})`);}
    football.setAttribute('transform',`translate(${snap.ball.join(' ')})`);
    $('#scrubber').value=String(Math.round(player.progress*1000));$('#progress-value').textContent=`${Math.round(player.progress*100)}%`;
    $('#scrubber').setAttribute('aria-valuetext',`第${player.step+1}步，${Math.round(player.progress*100)}%`);
    $('#prev-step').disabled=player.step===0;$('#next-step').disabled=player.step===player.scene.steps.length-1;
    $('#pause').disabled=!player.started||(!player.running&&player.progress>=1);$('#pause').textContent=player.running?'暂停':'继续';
    if(!player.started)$('#pause').textContent='暂停';
    const state=player.running?(player.mode==='all'?'完整播放中':'本步播放中'):player.progress>=1?(player.mode==='all'?'全程播放结束':'本步播放结束'):player.started?'已暂停':'准备播放';
    if(lastState!==state){$('#play-status').textContent=state;lastState=state;}
  }
  function tick(now){frameId=0;if(previous!==null)player.advance(Math.min(Math.max(now-previous,0),100)*speed);previous=now;render();if(player.running)ensureFrame();}
  function ensureFrame(){if(!frameId&&player.running)frameId=requestAnimationFrame(tick);}
  function stopFrame(){if(frameId)cancelAnimationFrame(frameId);frameId=0;previous=null;}
  function showPlayer(){if(innerWidth<760)$('#player').scrollIntoView({block:'start',behavior:'smooth'});}
  function playOne(i,scroll=false){stopFrame();player.selectStep(i,true);render();ensureFrame();if(scroll)showPlayer();}
  function selectScene(index){
    stopFrame();player.setScene(index);lastStep='';lastState='';const scene=player.scene;
    document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.scene)===index)));
    $('#scene-condition').textContent=scene.condition;$('#route-summary').textContent=scene.summary;
    $('#step-chips').replaceChildren(...scene.steps.map((step,i)=>{const button=document.createElement('button');button.type='button';button.className='step-chip';button.textContent=i+1;button.setAttribute('aria-label',`播放第${i+1}步：${step.title}`);button.addEventListener('click',()=>playOne(i));return button;}));
    $('#step-list').replaceChildren(...scene.steps.map((step,i)=>{const li=document.createElement('li'),button=document.createElement('button'),number=document.createElement('span'),title=document.createElement('b');button.type='button';number.textContent=String(i+1).padStart(2,'0');title.textContent=step.title;button.append(number,title);button.addEventListener('click',()=>playOne(i,true));li.append(button);return li;}));
    $('#duty-list').replaceChildren(...M.ids.map(id=>{const li=document.createElement('li'),badge=document.createElement('span'),body=document.createElement('div'),title=document.createElement('b'),p=document.createElement('p');badge.className='duty-no';badge.textContent=id;title.textContent=M.names[id];p.textContent=scene.roles[id];body.append(title,p);li.append(badge,body);return li;}));
    render();
  }
  $('#play-all').addEventListener('click',()=>{stopFrame();player.playAll();render();ensureFrame();showPlayer();});
  $('#play-step').addEventListener('click',()=>{stopFrame();player.playStep();render();ensureFrame();});
  $('#pause').addEventListener('click',()=>{if(player.running){player.pause();stopFrame();}else player.resume();render();ensureFrame();});
  $('#reset').addEventListener('click',()=>{stopFrame();player.reset();render();});
  $('#prev-step').addEventListener('click',()=>playOne(player.step-1));$('#next-step').addEventListener('click',()=>playOne(player.step+1));
  $('#scrubber').addEventListener('input',()=>{stopFrame();player.seek(Number($('#scrubber').value)/1000);render();});
  $('#speed').addEventListener('change',()=>{speed=Number($('#speed').value);});
  $('#show-runs').addEventListener('change',()=>{$('#run-routes').style.display=$('#show-runs').checked?'':'none';});
  document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.scene);history.replaceState(null,'',`#${M.scenes[index].id}`);selectScene(index);}));
  window.addEventListener('hashchange',()=>selectScene(Math.max(0,M.scenes.findIndex(scene=>`#${scene.id}`===location.hash))));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){player.pause();stopFrame();render();}});
  makePlayers();selectScene(Math.max(0,M.scenes.findIndex(scene=>`#${scene.id}`===location.hash)));
})();
