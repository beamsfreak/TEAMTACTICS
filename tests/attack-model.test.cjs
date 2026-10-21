const assert=require('node:assert/strict');
const M=require('../attack-model.js');
const near=(a,b,message)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-4,message);
assert.equal(M.strategies.length,6);
assert.equal(new Set(M.strategies.map(s=>s.id)).size,6);
for(const strategy of M.strategies){
  let owner=strategy.initialOwner;
  for(const [index,s] of strategy.steps.entries()){
    assert.equal(Object.keys(s.duties).length,9);
    assert.deepEqual(Object.keys(s.finish).sort(),M.ids.map(String).sort());
    if(s.ball.kind==='pass'||s.ball.kind==='shot')assert.equal(s.ball.from,owner,`${strategy.id} step ${index+1}: wrong sender`);
    else assert.equal(s.ball.owner,owner);
    owner=s.ownerEnd;
    for(let n=0;n<=100;n++){
      const snap=M.sample(strategy,index,n/100);
      for(const team of [snap.own,snap.opposition])for(const pos of Object.values(team))assert.ok(pos.every(Number.isFinite)&&pos[0]>0&&pos[0]<100&&pos[1]>=0&&pos[1]<=140);
      assert.ok(snap.ball.every(Number.isFinite));
      for(const id of M.ids)for(const other of M.ids){const a=snap.own[id],b=snap.opposition[other];assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>=4,`${strategy.id} step ${index+1}: player numbers overlap`);}
      if(s.ball.release&&n/100>=s.ball.release&&n/100<=s.ball.arrive)for(const pos of Object.values(snap.opposition))assert.ok(Math.hypot(snap.ball[0]-pos[0],snap.ball[1]-pos[1])>=3,`${strategy.id} step ${index+1}: ball crosses an opponent marker`);
      if(s.ball.release&&n/100>=s.ball.release&&n/100<=s.ball.arrive)for(const id of M.ids.filter(id=>id!==s.ball.from&&id!==s.ball.to)){const pos=snap.own[id];assert.ok(Math.hypot(snap.ball[0]-pos[0],snap.ball[1]-pos[1])>=3,`${strategy.id} step ${index+1}: ball crosses another teammate marker`);}
    }
    if(s.ball.release){
      for(const t of [s.ball.release,s.ball.arrive])near(M.ballAt(s,t-1e-8),M.ballAt(s,t+1e-8),'Ball must not jump at release or arrival');
    }
    if(index){const prev=M.sample(strategy,index-1,1),now=M.sample(strategy,index,0);for(const team of ['own','opposition'])for(const id of M.ids)near(prev[team][id],now[team][id],`${team} ${id} jumps at step transition`);near(prev.ball,now.ball,'Ball jumps between steps');}
  }
  const p=new M.Playback();p.setStrategy(M.strategies.indexOf(strategy));
  p.playAll();p.advance(strategy.steps.reduce((sum,s)=>sum+s.duration,0)+200);
  assert.equal(p.step,strategy.steps.length-1);assert.equal(p.progress,1);assert.equal(p.running,false);
  p.selectStep(2,true);p.advance(p.current.duration+10000);assert.equal(p.step,2);assert.equal(p.progress,1);assert.equal(p.running,false,'Segment must stop at its own end');
  p.selectStep(1,true);p.advance(900);p.pause();const paused=p.elapsed;p.advance(3000);assert.equal(p.elapsed,paused);p.resume();p.advance(100);assert.equal(p.elapsed,paused+100);
  p.seek(.45);assert.equal(p.running,false);assert.equal(p.progress,.45);p.resume();p.advance(100);assert.ok(p.progress>.45);
  p.selectStep(3);near(p.snapshot().ball,M.sample(strategy,2,1).ball,'Jumping to a later segment must start at previous segment end');
  p.playAll();assert.equal(p.step,0);assert.equal(p.progress,0);assert.equal(p.mode,'all');near(p.snapshot().ball,M.sample(strategy,0,0).ball,'Full replay returns to the strategy starting position');
  p.reset();assert.equal(p.started,false);assert.equal(p.step,0);assert.equal(p.progress,0);
  const first=p.snapshot(),holder=first.own[strategy.initialOwner];assert.ok(Math.hypot(first.ball[0]-holder[0],first.ball[1]-holder[1])<6,'Reset must return the ball to the actual starting holder');
  if(strategy.id==='counter'){assert.equal(strategy.initialOwner,6);assert.ok(Math.hypot(first.ball[0]-first.own[1][0],first.ball[1]-first.own[1][1])>20,'Counter-attack starts at the regain rather than at the goalkeeper');}
}
console.log(`PASS: ${M.strategies.length} strategies; ${M.strategies.reduce((n,s)=>n+s.steps.length,0)} complete steps; 18 players; possession ownership; continuous runs and ball paths; full playback; segmented stops; pause/resume; scrubbing; replay and reset.`);
