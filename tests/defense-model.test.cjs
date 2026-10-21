const assert=require('node:assert/strict');
const M=require('../defense-model.js');
const close=(a,b,label)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<.001,label);
assert.equal(M.scenes.length,5);
assert.equal(new Set(M.scenes.map(s=>s.id)).size,5);
for(const scene of M.scenes){
  assert.equal(Object.keys(scene.roles).length,9);
  let owner=scene.initialOwner;
  for(const [i,step] of scene.steps.entries()){
    assert.deepEqual(Object.keys(step.start).sort(),M.ids.map(String).sort());
    assert.deepEqual(Object.keys(step.oppStart).sort(),M.ids.map(String).sort());
    assert.equal(step.ownerStart,owner);
    assert.equal(step.ball.kind==='carry'?step.ball.owner:step.ball.from,owner);
    owner=step.ownerEnd;
    for(let n=0;n<=100;n++){
      const p=M.snapshot(scene,i,n/100);
      for(const team of [p.own,p.opposition])for(const xy of Object.values(team))assert.ok(xy.every(Number.isFinite)&&xy[0]>0&&xy[0]<100&&xy[1]>=0&&xy[1]<=140,`${scene.id} step ${i+1} out of bounds`);
      assert.ok(p.ball.every(Number.isFinite));
    }
    if(i){const previous=M.snapshot(scene,i-1,1),current=M.snapshot(scene,i,0);for(const team of ['own','opposition'])for(const id of M.ids)close(previous[team][id],current[team][id],`${scene.id} step ${i+1}: player jump`);close(previous.ball,current.ball,`${scene.id} step ${i+1}: ball jump`);}
  }
  const player=new M.Playback();player.setScene(M.scenes.indexOf(scene));player.playAll();player.advance(scene.steps.reduce((sum,s)=>sum+s.duration,0)+100);
  assert.equal(player.step,scene.steps.length-1);assert.equal(player.progress,1);assert.equal(player.running,false);
  player.selectStep(1,true);player.advance(100000);assert.equal(player.step,1);assert.equal(player.progress,1);
  player.selectStep(0,true);player.advance(800);player.pause();const paused=player.elapsed;player.advance(500);assert.equal(player.elapsed,paused);player.resume();player.advance(500);assert.equal(player.elapsed,paused+500);
  player.seek(.4);assert.equal(player.progress,.4);assert.equal(player.running,false);
  player.playAll();assert.equal(player.step,0);assert.equal(player.progress,0);
}
const shape=M.scenes[0],start=M.snapshot(shape,0,0),end=M.snapshot(shape,0,1);
assert.ok(start.own[11][1]<end.own[11][1]&&start.own[7][1]<end.own[7][1],'both wingers must recover');
const regain=M.scenes[1];assert.equal(regain.steps[2].ownerEnd,'o6');assert.equal(regain.steps[3].ownerStart,'o6');
const counter=M.scenes[2];assert.ok(counter.steps[0].end[4][1]>counter.steps[0].start[4][1],'central defender must retreat');
const central=M.scenes[3];assert.deepEqual(central.steps.map(s=>s.ball.kind==='pass'?[s.ball.from,s.ball.to]:[s.ball.owner]),[['b4'],['b4','b8'],['b8','b9'],['b9','b8']]);
const longBall=M.scenes[4];assert.equal(longBall.steps[1].ball.high,true);assert.equal(M.route(longBall.steps[1]).high,true);
assert.ok(longBall.initialOpp[9][1]>longBall.initialOwn[4][1],'opposition forward starts behind the back line legally');
assert.ok(longBall.steps[1].end[4][1]>longBall.steps[1].oppEnd[9][1],'central defender recovers goal-side');
console.log(`PASS: ${M.scenes.length} defensive scenes, ${M.scenes.reduce((n,s)=>n+s.steps.length,0)} steps, nine roles, continuous animations and playback.`);
