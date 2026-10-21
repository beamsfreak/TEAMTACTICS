(function(){
  'use strict';
  const M=window.RolesModel,ns='http://www.w3.org/2000/svg',$=selector=>document.querySelector(selector);
  let roleId='2',sceneIndex=0,variant='wrong',stepIndex=0,progress=0,mode='single',running=false,finished=false,phase='step',phaseTime=0,lastFrame=null,raf=0;
  const tokens={own:{},opp:{}},rings={},labels={};
  function svg(tag,attrs={}){const node=document.createElementNS(ns,tag);for(const[key,value]of Object.entries(attrs))node.setAttribute(key,value);return node;}
  function buildTokens(){
    for(const id of M.ids){
      const opponent=svg('g',{'aria-label':`对手${id}号`});opponent.append(svg('circle',{r:3.05,class:'opp-circle'}));const bText=svg('text',{class:'token-no opp-no'});bText.textContent=id;opponent.append(bText);$('#opponents').append(opponent);tokens.opp[id]=opponent;
      const own=svg('g',{'aria-label':`我方${id}号${M.names[id]}`});const ring=svg('circle',{r:5,class:'focus-ring'});own.append(ring,svg('circle',{r:3.5,class:'own-circle'}));rings[id]=ring;
      const oText=svg('text',{class:'token-no'});oText.textContent=id;own.append(oText);
      const label=svg('text',{y:7.3,class:'focus-label'});label.textContent=M.names[id];own.append(label);labels[id]=label;
      $('#own-players').append(own);tokens.own[id]=own;
    }
  }
  function current(){return M.roles[roleId].scenes[sceneIndex].variants[variant].steps[stepIndex];}
  function route(a,b,klass){return svg('path',{d:`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`,class:klass});}
  function drawRoutes(){
    const s=current(),paths=[];
    for(const id of s.focus){const a=s.startOwn[id],b=s.endOwn[id];if(Math.hypot(b[0]-a[0],b[1]-a[1])>2)paths.push(route(a,b,`run-route${variant==='wrong'?' bad':''}`));}
    if(s.ballFrom!==s.ballTo){const group=id=>id[0]==='o'?s.endOwn:s.endOpp;const from=group(s.ballFrom)[s.ballFrom.slice(1)],to=group(s.ballTo)[s.ballTo.slice(1)];paths.push(route(from,to,'ball-route'));}
    $('#routes').replaceChildren(...paths);
  }
  function updateCopy(){
    const scene=M.roles[roleId].scenes[sceneIndex],s=current();$('#condition').textContent=scene.condition;$('#scene-tip').textContent=scene.tip;
    $('#verdict').textContent=variant==='wrong'?'❌ 错误处理':'✅ 正确处理';$('.explainer').classList.toggle('correct',variant==='right');
    $('#step-index').textContent=`第 ${stepIndex+1} / ${scene.variants[variant].steps.length} 步`;
    $('#step-title').textContent=s.title;$('#step-text').textContent=s.text;
    $('#board-title').textContent=`${roleId}号${M.names[roleId]}：${scene.name}，${scene.variants[variant].label}，第${stepIndex+1}步：${s.title}`;
    $('#step-buttons').replaceChildren(...scene.variants[variant].steps.map((item,index)=>{const button=document.createElement('button');button.type='button';button.textContent=index+1;button.setAttribute('aria-label',`播放第${index+1}步，${item.title}`);if(index===stepIndex)button.setAttribute('aria-current','step');button.addEventListener('click',()=>startStep(index));return button;}));
    $('#wrong').setAttribute('aria-pressed',String(variant==='wrong'));$('#right').setAttribute('aria-pressed',String(variant==='right'));
    for(const id of M.ids){rings[id].style.display=id===roleId?'':'none';labels[id].style.display=scene.labels.includes(id)?'':'none';}
    drawRoutes();
  }
  function render(){
    const shot=M.snapshot(roleId,sceneIndex,variant,stepIndex,progress);
    for(const id of M.ids){tokens.own[id].setAttribute('transform',`translate(${shot.own[id][0]} ${shot.own[id][1]})`);tokens.opp[id].setAttribute('transform',`translate(${shot.opp[id][0]} ${shot.opp[id][1]})`);}
    $('#ball').setAttribute('transform',`translate(${shot.ball[0]} ${shot.ball[1]})`);
    $('#progress').value=Math.round(progress*1000);$('#progress-label').value=`${Math.round(progress*100)}%`;
    $('#pause').disabled=!running&&(progress===0||finished);$('#pause').textContent=running?'暂停':'继续';
    $('#play-status').textContent=running?(phase==='hold'?'这一段看完了，马上进入下一段':mode==='compare'?`${variant==='wrong'?'错误':'正确'}示范播放中`:'分段播放中'):(progress===1?'已看完这一段':'准备播放');
  }
  function cancel(){running=false;if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=null;}
  function startLoop(){running=true;lastFrame=null;render();raf=requestAnimationFrame(tick);}
  function tick(time){raf=0;if(!running)return;const delta=lastFrame===null?0:Math.min(100,time-lastFrame);lastFrame=time;
    if(phase==='step'){progress=Math.min(1,progress+delta/2350);if(progress>=1){phase='hold';phaseTime=0;}}
    else {phaseTime+=delta;if(phaseTime>=850){const steps=M.roles[roleId].scenes[sceneIndex].variants[variant].steps;
      if(mode==='step'){cancel();progress=1;finished=true;}
      else if(stepIndex<steps.length-1){stepIndex++;progress=0;phase='step';updateCopy();}
      else if(mode==='compare'&&variant==='wrong'){variant='right';stepIndex=0;progress=0;phase='step';updateCopy();}
      else {cancel();progress=1;finished=true;}}
    }render();if(running)raf=requestAnimationFrame(tick);
  }
  function reset(toVariant=variant){cancel();finished=false;variant=toVariant;stepIndex=0;progress=0;mode='single';phase='step';updateCopy();render();}
  function begin(which,compare=false){reset(which);mode=compare?'compare':'single';startLoop();}
  function startStep(index){cancel();finished=false;stepIndex=index;progress=0;mode='step';phase='step';updateCopy();startLoop();}
  function setScene(index){sceneIndex=index;document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.scene)===index)));reset('wrong');}
  function setRole(id){if(!M.roles[id])id='2';roleId=id;const role=M.roles[id];
    $('#role-number').textContent=`${id}号`;$('#role-name').textContent=role.name;$('#role-lead').textContent=role.oneLine;$('#board-role').textContent=`${id}号${role.name} · 场上视角`;
    $('#legend-role').textContent=`重点看${id}号`;$('#role-rule').textContent=`${id}号的场上提醒`;$('#do-text').textContent=role.doText;$('#dont-text').textContent=role.dontText;
    $('#defense-name').textContent=role.scenes[0].name;$('#attack-name').textContent=role.scenes[1].name;
    document.querySelectorAll('[data-role]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.role===id)));
    setScene(0);history.replaceState(null,'',`#role-${id}`);
  }
  function createPicker(){
    for(const id of M.order){const button=document.createElement('button'),badge=document.createElement('span'),name=document.createElement('span');button.type='button';button.dataset.role=id;badge.className='role-badge';badge.textContent=id;name.className='role-name';name.textContent=M.names[id];button.append(badge,name);button.addEventListener('click',()=>setRole(id));$('#role-buttons').append(button);}
  }
  $('#compare').addEventListener('click',()=>begin('wrong',true));$('#wrong').addEventListener('click',()=>begin('wrong'));$('#right').addEventListener('click',()=>begin('right'));
  $('#pause').addEventListener('click',()=>{if(running){cancel();render();}else if(progress<1||phase==='hold')startLoop();});
  $('#reset').addEventListener('click',()=>reset());$('#progress').addEventListener('input',()=>{cancel();finished=false;phase='step';progress=Number($('#progress').value)/1000;render();});
  document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>setScene(Number(button.dataset.scene))));
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){cancel();render();}});
  window.addEventListener('hashchange',()=>{const id=location.hash.match(/^#role-(1|2|4|5|6|8|11|9|7)$/)?.[1];if(id&&id!==roleId)setRole(id);});
  buildTokens();createPicker();setRole(location.hash.match(/^#role-(1|2|4|5|6|8|11|9|7)$/)?.[1]||'2');
})();
