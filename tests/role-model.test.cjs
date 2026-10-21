const assert=require('node:assert/strict');
const M=require('../role-model.js');
const close=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.001;
assert.deepEqual(M.scenes.map(scene=>scene.id),['defend','attack']);
for(let sceneIndex=0;sceneIndex<M.scenes.length;sceneIndex++){
  const scene=M.scenes[sceneIndex];
  const wrong=M.snapshot(sceneIndex,'wrong',0,0),right=M.snapshot(sceneIndex,'right',0,0);
  assert.deepEqual(wrong,right,`${scene.id}: wrong/right must start from identical players and ball`);
  for(const variantName of ['wrong','right']){
    const steps=scene.variants[variantName].steps;
    assert.ok(steps.length>=2);
    for(let i=0;i<steps.length;i++){
      const step=steps[i],start=M.snapshot(sceneIndex,variantName,i,0),end=M.snapshot(sceneIndex,variantName,i,1);
      assert.deepEqual(Object.keys(start.own).sort(),[...M.ids].sort());
      assert.deepEqual(Object.keys(start.opp).sort(),[...M.ids].sort());
      for(const frame of [start,end,...[.2,.5,.8].map(t=>M.snapshot(sceneIndex,variantName,i,t))]){
        for(const team of [frame.own,frame.opp])for(const pos of Object.values(team))assert.ok(pos.every(Number.isFinite)&&pos[0]>0&&pos[0]<100&&pos[1]>=0&&pos[1]<=140);
        assert.ok(frame.ball.every(Number.isFinite));
      }
      const owner=step.ballTo,ownerPoint=(owner[0]==='o'?end.own:end.opp)[owner.slice(1)];
      assert.ok(Math.hypot(end.ball[0]-ownerPoint[0],end.ball[1]-ownerPoint[1])<5,'ball reaches receiver');
      if(i){const previous=M.snapshot(sceneIndex,variantName,i-1,1);for(const id of M.ids){assert.ok(close(previous.own[id],start.own[id]));assert.ok(close(previous.opp[id],start.opp[id]));}assert.ok(close(previous.ball,start.ball),'ball must not jump between steps');}
    }
  }
}
const defending=M.scenes[0];
assert.ok(defending.variants.wrong.steps[0].endOwn[2][0]<defending.variants.right.steps[0].endOwn[2][0],'wrong 2 is dragged wider than correct 2');
assert.ok(defending.variants.right.steps[0].endOwn[11][1]>defending.variants.wrong.steps[0].endOwn[11][1],'correct 11 recovers');
const attacking=M.scenes[1];
assert.ok(attacking.variants.right.steps[0].endOwn[2][1]>attacking.variants.wrong.steps[0].endOwn[2][1],'correct 2 stays behind winger');
assert.deepEqual(attacking.variants.right.steps.map(s=>s.ballTo),['o11','o2','o6']);
console.log('PASS: two left-back scenes, shared wrong/right opening, continuous ball and player paths.');
