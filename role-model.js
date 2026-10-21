(function(root){
  'use strict';
  const ids=['1','2','4','5','6','8','7','9','11'];
  const baseOwn={1:[50,128],2:[27,107],4:[50,113],5:[75,107],6:[43,94],8:[62,94],7:[83,76],9:[51,61],11:[19,78]};
  const defenseOwn={...baseOwn,2:[27,105],4:[50,113],6:[43,98],11:[22,78],9:[51,64]};
  const defenseOpp={1:[50,10],2:[23,38],4:[49,37],5:[23,66],6:[44,67],8:[35,105],7:[12,81],9:[55,103],11:[81,78]};
  const attackOwn={...baseOwn,2:[28,102],4:[50,111],6:[44,91],11:[15,67],9:[49,52]};
  const attackOpp={1:[50,9],2:[25,27],4:[49,31],5:[23,51],6:[47,59],8:[58,72],7:[17,84],9:[55,93],11:[80,64]};
  const clone=points=>Object.fromEntries(ids.map(id=>[id,[...points[id]]]));
  const apply=(start,changes)=>{const result=clone(start);for(const[id,pos]of Object.entries(changes))result[id]=[...pos];return result;};
  function step(title,text,ownStart,oppStart,ownMoves,oppMoves,ballFrom,ballTo,kind,focus){
    return {title,text,startOwn:clone(ownStart),startOpp:clone(oppStart),endOwn:apply(ownStart,ownMoves),endOpp:apply(oppStart,oppMoves),ballFrom,ballTo,kind,focus};
  }
  const scenes=[
    {id:'defend',name:'左路防守',condition:'对方7号从我方左边路持球向前，11号还在回防途中。2号身后有中路接应人。',seedOwn:clone(defenseOwn),seedOpp:clone(defenseOpp),seedBall:'b7',variants:{
      wrong:{label:'错误处理',summary:'2号一人扑到边线，11号没有回到球侧，对方把球送进2号身后的肋部。',steps:(()=>{
        const a=step('2号扑得太外','2号直接冲向边线追持球人，11号还在前面。两人之间的左肋部露出来。',defenseOwn,defenseOpp,{2:[11,89]},{7:[10,91]},'b7','b7','carry',['2','11']);
        const b=step('对方打进肋部','蓝色7号把球交给内侧8号。2号已经被带出位置，4号不得不离开门前补救。',a.endOwn,a.endOpp,{2:[10,94],4:[41,111]},{7:[10,93],8:[32,109]},'b7','b8','pass',['2','4']);return[a,b];
      })()},
      right:{label:'正确处理',summary:'11号先回到球侧限制持球人；2号在其内后方延缓，6号堵住肋部，4号守住门前。',steps:(()=>{
        const a=step('11号回防，2号守内侧','11号回到球侧先限制持球人。2号停在他身后偏内的位置，不让对方一脚塞进肋部。',defenseOwn,defenseOpp,{11:[17,88],2:[26,102],6:[40,101]},{7:[11,90]},'b7','b7','carry',['2','11','6']);
        const b=step('逼其回传，门前有人','11号延缓、2号堵内线、6号保护肋部，4号留在中路。对方只能暂时回传重新组织。',a.endOwn,a.endOpp,{11:[17,89],2:[26,101],6:[39,102]},{7:[11,88],5:[24,68]},'b7','b5','pass',['2','11','6','4']);return[a,b];
      })()}
    }},
    {id:'attack',name:'左路进攻',condition:'我方11号带球推进，对方有人准备夹他；6号在中间可接应。2号需要给出安全的回传角度。',seedOwn:clone(attackOwn),seedOpp:clone(attackOpp),seedBall:'o11',variants:{
      wrong:{label:'错误处理',summary:'11号还未吸引足够防守，2号就沿同一条边线冲到前面。边路挤在一起，身后缺少接应。',steps:(()=>{
        const a=step('两人都挤到同一条边线','11号沿边带球时，2号也立即冲进同一条线路，身后没有稳妥的回传点。',attackOwn,attackOpp,{11:[13,52],2:[13,67]},{5:[20,49],7:[20,80]},'o11','o11','carry',['2','11']);
        const b=step('受阻后无法轻松回做','11号被对方限制，2号已经跑到身前；左侧后方一旦丢球也来不及保护。',a.endOwn,a.endOpp,{11:[12,45],2:[12,55]},{5:[18,46],7:[22,86]},'o11','o11','carry',['2','11']);return[a,b];
      })()},
      right:{label:'正确处理',summary:'2号留在11号身后偏内侧，形成回传角度；11号受阻就回做，2号再转给6号重新选边。',steps:(()=>{
        const a=step('11号推进，2号跟在后面','11号带球向前。2号在身后偏内侧跟进，既能接回传，也能防止对方断球后直冲左肋部。',attackOwn,attackOpp,{11:[13,52],2:[28,86],6:[43,85]},{5:[20,49],7:[18,78]},'o11','o11','carry',['2','11','6']);
        const b=step('受阻时回做给2号','11号不硬闯，把球回给身后的2号。2号接球前抬头观察6号和另一侧。',a.endOwn,a.endOpp,{11:[13,50],2:[29,83],6:[44,82]},{5:[19,48],7:[18,76]},'o11','o2','pass',['2','11','6']);
        const c=step('2号交给6号重新组织','2号一脚传给6号，左路继续接应，队友可以换边或再找向前机会。',b.endOwn,b.endOpp,{2:[29,82],6:[43,80],11:[15,46]},{},'o2','o6','pass',['2','6','11']);return[a,b,c];
      })()}
    }}
  ];
  const point=(group,id)=>group[id.slice(1)];
  const ease=t=>t*t*(3-2*t),mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const foot=(group,owner)=>{const p=point(group,owner);return[p[0]+(owner[0]==='o'?3.9:3.3),p[1]-1.1];};
  function snapshot(sceneIndex,variant,stepIndex,progress){
    const s=scenes[sceneIndex].variants[variant].steps[stepIndex],t=ease(Math.min(1,Math.max(0,progress)));
    const own={},opp={};for(const id of ids){own[id]=mix(s.startOwn[id],s.endOwn[id],t);opp[id]=mix(s.startOpp[id],s.endOpp[id],t);}
    const groups={o:own,b:opp},from=foot(groups[s.ballFrom[0]],s.ballFrom),to=foot(groups[s.ballTo[0]],s.ballTo);
    let ball;
    if(s.ballFrom===s.ballTo)ball=from;
    else {const travel=Math.min(1,Math.max(0,(progress-.22)/.62));ball=mix(from,to,ease(travel));}
    return {own,opp,ball};
  }
  root.RoleModel={ids,scenes,snapshot};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.RoleModel;
})(typeof window!=='undefined'?window:globalThis);
