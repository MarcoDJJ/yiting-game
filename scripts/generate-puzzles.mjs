// Offline, deterministic puzzle authoring. Solutions are replayed by tests.
import {writeFile} from 'node:fs/promises';
import {seeded} from '../lib/state.js';
const dirs=[[1,0],[-1,0],[0,1],[0,-1]],key=p=>p.x+','+p.y,pt=([x,y])=>({x,y});
const beams=[
 [[-1,1],[2,1],[2,5],[5,5]],
 [[-1,4],[3,4],[3,0],[5,0]],
 [[-1,1],[1,1],[1,4],[4,4],[4,6]],
 [[-1,1],[1,1],[1,4],[3,4],[3,0],[5,0]],
 [[-1,1],[1,1],[1,5],[3,5],[3,3],[5,3],[5,6]],
 [[-1,0],[1,0],[1,5],[3,5],[3,2],[4,2],[4,6],[5,6]]
];
const pharaoh=[];
for(let stage=1;stage<=24;stage++){
 const tier=Math.floor((stage-1)/4),flip=(stage-1)%4,rng=seeded('temple-layout-'+stage);
 const vertices=beams[tier].map(([x,y])=>({x:flip&1?5-x:x,y:flip&2?6-y:y})),exit=vertices.at(-1),protectedCells=new Set();
 for(let j=1;j<vertices.length;j++){let p={...vertices[j-1]},end=vertices[j],dx=Math.sign(end.x-p.x),dy=Math.sign(end.y-p.y);while(key(p)!==key(end)){p={x:p.x+dx,y:p.y+dy};protectedCells.add(key(p));}}
 const mirrors=vertices.slice(1,-1).map((p,i)=>{const prev=vertices[i],next=vertices[i+2],dx=Math.sign(p.x-prev.x),dy=Math.sign(p.y-prev.y),ox=Math.sign(next.x-p.x),oy=Math.sign(next.y-p.y);const solution=ox===-dy&&oy===-dx?'/':'\\';return{...p,solution,slash:solution==='/'?'\\':'/'};});
 const source={...vertices[0],dx:Math.sign(vertices[1].x-vertices[0].x),dy:Math.sign(vertices[1].y-vertices[0].y)};
 let best=null;
 for(let attempt=0;attempt<100;attempt++){
  const cells=[];for(let y=0;y<7;y++)for(let x=0;x<6;x++)cells.push({x,y});
  const shuffled=cells.filter(p=>!protectedCells.has(key(p))); // Fisher-Yates below
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const walls=new Set(shuffled.slice(0,Math.min(2+tier,shuffled.length-4)).map(key));
  const plates=shuffled.filter(p=>!walls.has(key(p))&&p.x>0&&p.x<5&&p.y>0&&p.y<6).slice(0,tier>=3?2:1);
  if(plates.length!==(tier>=3?2:1))continue;
  const free=p=>p.x>=0&&p.x<6&&p.y>=0&&p.y<7&&!walls.has(key(p))&&key(p)!==key(exit);
  const candidates=cells.filter(p=>free(p)&&!plates.some(q=>key(p)===key(q)));
  let player={...candidates[Math.floor(rng()*candidates.length)]},stones=plates.map(p=>({...p})),reverse=[],pulls=0;
  const finishPlayer={...player};
  for(let i=0;i<600+tier*250;i++){
   const [dx,dy]=dirs[Math.floor(rng()*4)],next={x:player.x+dx,y:player.y+dy};
   if(!free(next)||stones.some(p=>key(p)===key(next)))continue;
   const behind=stones.findIndex(p=>p.x===player.x-dx&&p.y===player.y-dy);
   if(behind>=0&&rng()<.85){stones[behind]={...player};pulls++;}
   player=next;reverse.push([-dx,-dy]);
  }
  const distance=stones.reduce((s,p)=>s+Math.min(...plates.map(q=>Math.abs(p.x-q.x)+Math.abs(p.y-q.y))),0);
  if(!distance||stones.some(p=>plates.some(q=>key(p)===key(q))))continue;
  // The finish position must have a walk to the door, without moving solved stones.
  const queue=[[finishPlayer,[]]],seen=new Set();let finishRoute=null;
  for(let at=0;at<queue.length;at++){const [p,route]=queue[at];if(key(p)===key(exit)){finishRoute=route;break;}for(const [dx,dy]of dirs){const q={x:p.x+dx,y:p.y+dy};if(q.x<0||q.x>=6||q.y<0||q.y>=7||walls.has(key(q))||plates.some(s=>key(s)===key(q))||seen.has(key(q)))continue;seen.add(key(q));queue.push([q,[...route,[dx,dy]]]);}}
  if(!finishRoute)continue;
  const score=distance+pulls*.002;
  if(!best||score>best.quality)best={stage,source,exit,mirrors,plates,stones,player,walls:[...walls],solution:[...reverse.reverse(),...finishRoute],quality:score};
  if(distance>=3+tier*2)break;
 }
 if(!best)throw Error('No board '+stage);
 // Remove loops from the guaranteed reverse-play solution without changing states.
 let p={...best.player},stones=best.stones.map(p=>({...p})),states=new Map(),route=[];
 const stateKey=()=>key(p)+'|'+stones.map(key).sort().join('|');states.set(stateKey(),0);
 for(const [dx,dy]of best.solution){const next={x:p.x+dx,y:p.y+dy},s=stones.find(q=>key(q)===key(next));if(s){s.x+=dx;s.y+=dy;}p=next;const k=stateKey();if(states.has(k)){route=route.slice(0,states.get(k));for(const [k,n]of states)if(n>route.length)states.delete(k);}else{route.push([dx,dy]);states.set(k,route.length);}}
 best.solution=route;delete best.quality;pharaoh.push(best);
}
const reef=[];
for(let stage=1;stage<=24;stage++){
 const tier=Math.floor((stage-1)/4),n=[4,5,6,6,7,7][tier],count=[2,3,4,5,5,6][tier],rng=seeded('reef-path-'+stage);let chosen;
 for(let attempt=0;attempt<100;attempt++){
  let path=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)path.push({x:y%2?n-1-x:x,y});
  for(let i=0;i<450;i++){if(rng()<.5)path.reverse();const p=path[0],neighbors=path.map((q,j)=>j>1&&Math.abs(p.x-q.x)+Math.abs(p.y-q.y)===1?j:-1).filter(j=>j>0);if(neighbors.length){const k=neighbors[Math.floor(rng()*neighbors.length)];path=[...path.slice(0,k).reverse(),...path.slice(k)];}}
  const pairs=[],rocks=[];let offset=0;
  for(let j=0;j<count;j++){const remaining=path.length-offset-(count-j-1),len=j===count-1?remaining:Math.max(3,Math.floor(remaining/(count-j))+(rng()<.5?-1:1));pairs.push(path.slice(offset,offset+len));offset+=len;if(j<count-1)rocks.push(key(path[offset++]));}
  chosen={stage,n,pairs,rocks};if(pairs.every(p=>Math.abs(p[0].x-p.at(-1).x)+Math.abs(p[0].y-p.at(-1).y)>=2))break;
 }
 reef.push(chosen);
}
await writeFile('lib/puzzle-levels.js','// Authored by scripts/generate-puzzles.mjs. Stable layouts preserve saved level identities.\nexport const PHARAOH_LEVELS='+JSON.stringify(pharaoh)+';\nexport const REEF_LEVELS='+JSON.stringify(reef)+';\n');
console.log('Authored 24 pyramid chambers and 24 full-coverage turtle boards.');
