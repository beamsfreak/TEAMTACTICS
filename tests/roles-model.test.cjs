const assert=require('node:assert/strict');
const M=require('../roles-model.js');
const close=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<.001;
assert.deepEqual(M.order,['1','2','4','5','6','8','11','9','7']);
let stepsTotal=0;
for(const id of M.order){
  const role=M.roles[id];assert.equal(role.scenes.length,2,`${id}: defend and attack`);
  assert.ok(role.oneLine&&role.doText&&role.dontText);
  for(let sceneIndex=0;sceneIndex<2;sceneIndex++){
    const scene=role.scenes[sceneIndex],wrong=M.snapshot(id,sceneIndex,'wrong',0,0),right=M.snapshot(id,sceneIndex,'right',0,0);
    assert.deepEqual(wrong,right,`${id}/${scene.id}: both demonstrations start from the same state`);
    assert.ok(scene.condition&&scene.tip);
    for(const variant of ['wrong','right']){
      const list=scene.variants[variant].steps;assert.ok(list.length>=2);stepsTotal+=list.length;
      for(let i=0;i<list.length;i++){
        const step=list[i],start=M.snapshot(id,sceneIndex,variant,i,0),end=M.snapshot(id,sceneIndex,variant,i,1);
        assert.ok(step.title&&step.text&&step.focus.includes(id),`${id}/${scene.id}: role must be the focus`);
        for(const frame of [start,end,M.snapshot(id,sceneIndex,variant,i,.5)]){
          for(const team of [frame.own,frame.opp])for(const p of Object.values(team))assert.ok(p.every(Number.isFinite)&&p[0]>0&&p[0]<100&&p[1]>=0&&p[1]<=140,`${id}/${scene.id}: token in pitch`);
          assert.ok(frame.ball.every(Number.isFinite));
        }
        const receiver=(step.ballTo[0]==='o'?end.own:end.opp)[step.ballTo.slice(1)];
        assert.ok(Math.hypot(end.ball[0]-receiver[0],end.ball[1]-receiver[1])<5,`${id}/${scene.id}: ball reaches owner`);
        if(i){const prev=M.snapshot(id,sceneIndex,variant,i-1,1);for(const p of M.ids){assert.ok(close(prev.own[p],start.own[p]),`${id}: own ${p} jumps`);assert.ok(close(prev.opp[p],start.opp[p]),`${id}: opponent ${p} jumps`);}assert.ok(close(prev.ball,start.ball),`${id}: ball jumps`);}
      }
    }
  }
}
const rightBack=M.roles['5'].scenes[0],leftBack=M.roles['2'].scenes[0];
assert.ok(rightBack.variants.wrong.steps[0].endOwn[5][0]>rightBack.variants.right.steps[0].endOwn[5][0]);
assert.ok(leftBack.variants.wrong.steps[0].endOwn[2][0]<leftBack.variants.right.steps[0].endOwn[2][0]);
assert.deepEqual(M.roles['9'].scenes[1].variants.right.steps.map(s=>s.ballTo),['o9','o8','o8']);
console.log(`PASS: ${M.order.length} roles, 18 attack/defense scenes, ${stepsTotal} continuous demonstrations.`);
