const assert=require('node:assert/strict');
const A=require('../attack-extra.js'),S=require('../setpieces-model.js');
const near=(a,b,label)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-4,label);
assert.equal(A.strategies.length,14);
assert.equal(A.strategies.filter(s=>s.group==='press').length,3);
assert.equal(A.strategies.filter(s=>s.group==='response').length,5);
assert.equal(S.strategies.length,6);
let total=0;const overlaps=[];
for(const M of [A,S]){
  assert.equal(new Set(M.strategies.map(s=>s.id)).size,M.strategies.length);
  for(const scene of M.strategies){
    total+=scene.steps.length;
    for(const id of scene.followups||[])assert.ok(A.strategies.some(s=>s.id===id),'Broken continuation link');
    for(const [i,step] of scene.steps.entries()){
      assert.equal(Object.keys(step.duties).length,9,scene.id+' full duties');
      assert.ok(step.title&&step.text&&step.guard);
      assert.ok(step.duration>0);
      if(i){const prev=M.sample(scene,i-1,1),now=M.sample(scene,i,0);for(const team of ['own','opposition'])for(const id of M.ids)near(prev[team][id],now[team][id],`${scene.id} step ${i+1}: ${team} ${id} jumps`);near(prev.ball,now.ball,`${scene.id} step ${i+1}: ball jumps`);}
      for(let n=0;n<=100;n++){
        const snap=M.sample(scene,i,n/100);
        for(const team of ['own','opposition']){
          assert.equal(Object.keys(snap[team]).length,9);
          for(const xy of Object.values(snap[team]))assert.ok(xy.every(Number.isFinite)&&xy[0]>=0&&xy[0]<=100&&xy[1]>=0&&xy[1]<=140,scene.id+' out of bounds');
        }
        assert.ok(snap.ball.every(Number.isFinite));
        for(let k=0;k<M.ids.length;k++)for(let j=k+1;j<M.ids.length;j++)nearEnough(snap.own[M.ids[k]],snap.own[M.ids[j]],scene.id,i,'own',M.ids[k],M.ids[j]);
        for(const a of M.ids)for(const b of M.ids)nearEnough(snap.own[a],snap.opposition[b],scene.id,i,'opp',a,b);
      }
      const ball=step.ball;
      if(ball.release&&!ball.high)for(let n=0;n<=100;n++){
        const t=n/100;if(t<ball.release||t>ball.arrive)continue;
        const snap=M.sample(scene,i,t);
        for(const team of ['own','opposition'])for(const id of M.ids){const key=team==='own'?id:'b'+id;if(ball.from===key||ball.to===key)continue;assert.ok(Math.hypot(snap.ball[0]-snap[team][id][0],snap.ball[1]-snap[team][id][1])>=3,`${scene.id} step ${i+1}: ground pass crosses unrelated player ${key}`);}
      }
      if(step.ball.release)for(const t of [step.ball.release,step.ball.arrive])near(M.ballAt(step,t-1e-8),M.ballAt(step,t+1e-8),scene.id+' release or arrival jump');
    }
    const player=new M.Playback();player.setStrategy(M.strategies.indexOf(scene));
    player.playAll();player.advance(scene.steps.reduce((n,s)=>n+s.duration,0)+1);
    assert.equal(player.step,scene.steps.length-1);assert.equal(player.progress,1);assert.equal(player.running,false);
    player.selectStep(0,true);player.advance(player.current.duration+20000);assert.equal(player.step,0);assert.equal(player.progress,1);assert.equal(player.running,false);
    player.selectStep(1,true);player.advance(1000);player.pause();const time=player.elapsed;player.advance(10000);assert.equal(player.elapsed,time);player.resume();player.advance(100);assert.equal(player.elapsed,time+100);
    player.seek(.5);assert.equal(player.running,false);assert.equal(player.progress,.5);player.reset();assert.equal(player.step,0);assert.equal(player.started,false);
  }
}
function nearEnough(a,b,id,i,team,n,m){const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d<4&&!overlaps.some(x=>x.id===id&&x.step===i+1&&x.team===team&&x.pair===n+'/'+m))overlaps.push({id,step:i+1,team,pair:n+'/'+m,d:+d.toFixed(1)});}
if(overlaps.length){console.error('Overlapping number audit:',JSON.stringify(overlaps));process.exitCode=1;}
console.log(`Checked ${total} steps: full/step playback, pause/resume/reset/scrub, 18 tokens, duties, bounds, ball and player continuity.`);
