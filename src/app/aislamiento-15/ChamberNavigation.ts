/**
 * HÉLIX / 015 — deterministic, low-overhead indoor navigation.
 * World-space footprints make large medical equipment solid. Both the player
 * and the stalker respect the same furniture; the stalker uses a small A* grid
 * to route around pods, gurneys and control consoles.
 */
import * as THREE from "three";
export type RoomIndex = 0|1|2;
export type Footprint = { x:number; z:number; hw:number; hd:number };
const Z = [0,-13,-26] as const;
// One authoritative first-room layout for both visible fixtures and player/stalker collisions.
export const EMERGENCY_LAYOUT = {
  locker: { x: -4.45, z: -4.45 },
  fuse: { x: -3.09, z: 3.14 },
} as const;
const solids: ReadonlyArray<ReadonlyArray<Footprint>> = [
  [
    {x:-2.95,z:2.55,hw:.68,hd:1.4}, // reception desk (rotated)
    {x:2.85,z:2.0,hw:.76,hd:1.25}, // bed
    {x:3.0,z:-2.68,hw:.78,hd:1.32}, // bed
    {x:EMERGENCY_LAYOUT.locker.x,z:EMERGENCY_LAYOUT.locker.z,hw:.47,hd:.93}, // locker clear of F-08 wall switchboard
  ],
  [
    {x:-4.04,z:-10.8,hw:1.05,hd:.53},
    {x:4.04,z:-12.8,hw:1.05,hd:.53},
    {x:-4.04,z:-13.55,hw:1.05,hd:.53},
    {x:4.13,z:-17.2,hw:.78,hd:.47}, // extractor
    {x:-2.9,z:-17.0,hw:.51,hd:.28}, // side-mounted oxygen station
    {x:-4.45,z:-15.7,hw:.49,hd:.84}, // cabinet
  ],
  [
    {x:-4.1,z:-26.95,hw:.84,hd:.84}, // reactor
    {x:-3.7,z:-24.6,hw:.77,hd:.41},
    {x:3.7,z:-24.6,hw:.77,hd:.41},
    {x:3.7,z:-27.35,hw:.77,hd:.41},
    {x:0,z:-29.2,hw:1.24,hd:.56}, // control desk
  ],
];
const HALF_WIDTH = 5.17, HALF_DEPTH=5.96;
const GRID=.58, WIDTH=19, DEPTH=22;
const originX= -((WIDTH-1)*GRID)/2;
function localCellX(i:number){ return originX+i*GRID; }
function localCellZ(room:RoomIndex,j:number){return Z[room]+HALF_DEPTH-j*GRID;}
function footBlocked(room:RoomIndex,x:number,z:number,radius:number) {
  const atExit=Math.abs(x)<.91 && z>=Z[room]-6.40;
  if (Math.abs(x)>HALF_WIDTH-radius || z>Z[room]+HALF_DEPTH-radius ||
      (z<Z[room]-HALF_DEPTH+radius && !atExit))return true;
  for(const f of solids[room]){
    if(Math.abs(x-f.x)<f.hw+radius && Math.abs(z-f.z)<f.hd+radius)return true;
  }
  return false;
}
export function canStand(room:RoomIndex,x:number,z:number,radius=.32) {
  return !footBlocked(room,x,z,radius);
}
export function slide(room:RoomIndex,at:THREE.Vector3,dx:number,dz:number,radius=.32) {
  const nx=at.x+dx,nz=at.z+dz;
  if(canStand(room,nx,nz,radius)){at.x=nx;at.z=nz;return;}
  if(canStand(room,nx,at.z,radius))at.x=nx;
  if(canStand(room,at.x,nz,radius))at.z=nz;
}
function hasLine(room:RoomIndex,from:THREE.Vector3,to:THREE.Vector3,radius=.33){
  const steps=Math.max(1,Math.ceil(from.distanceTo(to)/.26));
  for(let i=1;i<=steps;i++){
    const f=i/steps,x=THREE.MathUtils.lerp(from.x,to.x,f);
    const z=THREE.MathUtils.lerp(from.z,to.z,f);
    if(!canStand(room,x,z,radius))return false;
  }
  return true;
}
function cellAt(room:RoomIndex,x:number,z:number) {
  const ci=Math.max(0,Math.min(WIDTH-1,Math.round((x-originX)/GRID)));
  const cj=Math.max(0,Math.min(DEPTH-1,Math.round((Z[room]+HALF_DEPTH-z)/GRID)));
  return {i:ci,j:cj};
}
function nearestOpen(room:RoomIndex,x:number,z:number){
  let best=Infinity,bestPoint=new THREE.Vector3(0,0,Z[room]);
  for(let j=0;j<DEPTH;j++)for(let i=0;i<WIDTH;i++){
    const cx=localCellX(i),cz=localCellZ(room,j);
    if(!canStand(room,cx,cz,.4))continue;
    const d=(cx-x)**2+(cz-z)**2;
    if(d<best){best=d;bestPoint.set(cx,0,cz);}
  }
  return bestPoint;
}
export function clearSight(room:RoomIndex,a:THREE.Vector3,b:THREE.Vector3){
  return hasLine(room,a,b,.24);
}
export function findPath(room:RoomIndex,from:THREE.Vector3,to:THREE.Vector3):THREE.Vector3[] {
  if(hasLine(room,from,to,.37))return [to.clone().setY(0)];
  const start=cellAt(room,from.x,from.z);
  const end=cellAt(room,to.x,to.z);
  const n=WIDTH*DEPTH;
  const node=(i:number,j:number)=>j*WIDTH+i;
  const startId=node(start.i,start.j),targetId=node(end.i,end.j);
  const g=new Float32Array(n);g.fill(Infinity);g[startId]=0;
  const previous=new Int32Array(n);previous.fill(-1);
  const closed=new Uint8Array(n);
  const open=new Set<number>([startId]);
  const distance=(id:number)=>{
    const i=id%WIDTH,j=Math.floor(id/WIDTH);
    return Math.hypot(i-end.i,j-end.j);
  };
  let last=startId,iterations=0,bestScore=Infinity;
  while(open.size && iterations++<n){
    let current=-1,score=Infinity;
    for(const id of open){
      const value=g[id]+distance(id);
      if(value<score){current=id;score=value;}
    }
    if(current<0)break;
    if(distance(current)<bestScore){bestScore=distance(current);last=current;}
    if(current===targetId){last=current;break;}
    open.delete(current);closed[current]=1;
    const i=current%WIDTH,j=Math.floor(current/WIDTH);
    for(const [di,dj] of [[0,1],[1,0],[0,-1],[-1,0]]){
      const ni=i+di,nj=j+dj;
      if(ni<0||nj<0||ni>=WIDTH||nj>=DEPTH)continue;
      const neighbour=node(ni,nj);
      if(closed[neighbour]||!canStand(room,localCellX(ni),localCellZ(room,nj),.39))continue;
      const tentative=g[current]+1;
      if(tentative<g[neighbour]){
        g[neighbour]=tentative;previous[neighbour]=current;
        open.add(neighbour);
      }
    }
  }
  if(last===startId)return [nearestOpen(room,to.x,to.z)];
  const cells:number[]=[];
  for(let at=last;at>=0&&cells.length<n;at=previous[at]){
    cells.push(at);if(at===startId)break;
  }
  cells.reverse();
  const path=cells.slice(1).map(id=>new THREE.Vector3(localCellX(id%WIDTH),0,localCellZ(room,Math.floor(id/WIDTH))));
  // Path smoothing never crosses a solid footprint.
  const result:THREE.Vector3[]=[];
  let anchor=from.clone().setY(0),idx=0;
  while(idx<path.length){
    let far=idx;
    for(let k=idx;k<path.length;k++){
      if(hasLine(room,anchor,path[k],.37))far=k;else break;
    }
    const waypoint=path[far];
    result.push(waypoint);
    anchor=waypoint;idx=far+1;
  }
  if(hasLine(room,anchor,to,.33))result.push(to.clone().setY(0));
  return result;
}
