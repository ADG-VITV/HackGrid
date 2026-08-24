import * as THREE from 'three';
import{EffectComposer}from'three/addons/postprocessing/EffectComposer.js';
import{RenderPass}from'three/addons/postprocessing/RenderPass.js';
import{UnrealBloomPass}from'three/addons/postprocessing/UnrealBloomPass.js';

/* ════════ RENDERER ════════ */
const R=new THREE.WebGLRenderer({canvas:document.getElementById('c3d'),alpha:true,antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);
R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.2;
const S=new THREE.Scene(),C=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,1000);
C.position.set(0,0,40);

/* ════════ BLOOM (strong!) ════════ */
const comp=new EffectComposer(R);comp.addPass(new RenderPass(S,C));
comp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),1.0,.6,.75));

/* ════════ LIGHTS — all green ════════ */
S.add(new THREE.AmbientLight(0x082010,.8));
const dl1=new THREE.DirectionalLight(0x42ff5a,.8);dl1.position.set(5,15,10);S.add(dl1);
const dl2=new THREE.DirectionalLight(0x22cc55,.5);dl2.position.set(-8,-5,8);S.add(dl2);
const pl1=new THREE.PointLight(0x42ff5a,1.2,70);pl1.position.set(12,8,15);S.add(pl1);
const pl2=new THREE.PointLight(0x22dd66,.8,60);pl2.position.set(-12,-6,-5);S.add(pl2);
const pl3=new THREE.PointLight(0x88ffaa,.5,50);pl3.position.set(0,12,-10);S.add(pl3);

const mob=innerWidth<768;

/* ════════ MATERIALS ════════ */
const greens=[0x42ff5a,0x30ee50,0x22cc44,0x66ff88,0x88ffbb,0x20ddaa,0xaaffcc];
function pickC(){return greens[Math.floor(Math.random()*greens.length)]}
function mWire(c,o=.18){return new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false})}
function mEdge(c,o=.45){return new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false})}
const uWobble={value:0};
function mGlass(c,ei=.2){
  const m=new THREE.MeshPhysicalMaterial({color:c,emissive:c,emissiveIntensity:ei,metalness:0,roughness:.04,transmission:0,thickness:2.2,ior:1,transparent:true,opacity:.4,clearcoat:0,clearcoatRoughness:.02,side:THREE.DoubleSide});
  m.onBeforeCompile=sh=>{
    sh.uniforms.uTime=uWobble;
    sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
      float wob=sin(uTime*1.3+position.x*2.4+position.y*1.8+position.z*2.1)*0.055;
      transformed+=normal*wob;`);
  };
  return m;
}

/* ════════ CRYSTAL GEOMETRIES — sharp, many-faceted glass shards ════════ */
const gCrystal=(()=>{const g=new THREE.IcosahedronGeometry(.5,0);g.scale(.55,1.7,.55);return g})();
const gCrystalL=(()=>{const g=new THREE.IcosahedronGeometry(.65,0);g.scale(.5,2.1,.5);return g})();

// 0: mid-sized glass crystal shard
function ndC1(c){const g=new THREE.Group();g.add(new THREE.Mesh(gCrystal,mGlass(c,.25)));g.add(new THREE.LineSegments(new THREE.EdgesGeometry(gCrystal),mEdge(c,.5)));return g}
// 1: taller glass crystal spike
function ndC2(c){const g=new THREE.Group();g.add(new THREE.Mesh(gCrystalL,mGlass(c,.2)));g.add(new THREE.LineSegments(new THREE.EdgesGeometry(gCrystalL),mEdge(c,.4)));g.add(new THREE.Mesh(gCrystalL.clone(),mWire(c,.05)));return g}

const makers=[ndC1,ndC2];
const wt=[60,40],tw=wt.reduce((a,b)=>a+b,0);
function pickT(){let r=Math.random()*tw,s=0;for(let i=0;i<wt.length;i++){s+=wt[i];if(r<s)return i}return 0}

/* ════════ SPAWN OBJECTS — ring around logo ════════ */
const objs=[];
const COUNT=55; // same for mobile and laptop
const aspect=innerWidth/innerHeight;

for(let i=0;i<COUNT;i++){
  const c=pickC();
  const mesh=makers[pickT()](c);

  const angle=Math.random()*Math.PI*2;
  let r;
  // 85% of objects in outer ring (clear of logo), 15% small bg pieces
  if(Math.random()<.85){
    r=8+Math.random()*16; // outer ring: 8-24 units from center
    if(mob) r*=0.8; // slightly smaller ring on mobile so they don't go offscreen
  }else{
    r=3+Math.random()*5;  // few near center, will be behind logo
    mesh.position.z=-8-Math.random()*6; // push far behind
  }

  const x=Math.cos(angle)*r;
  // Squash/stretch Y dynamically based on aspect ratio so ring always fits screen
  const ySquash=aspect>1?.5:(1/aspect)*.4; 
  const y=Math.sin(angle)*r*ySquash;
  const z=mesh.position.z||(-4+Math.random()*8);
  mesh.position.set(x,y,z);
  mesh.rotation.set(Math.random()*6.28,Math.random()*6.28,Math.random()*6.28);
  const sc=.8+Math.random()*.5;mesh.scale.setScalar(sc);

  S.add(mesh);

  // Drift direction — slowly rotates for organic curved paths
  const driftAngle=Math.random()*6.28;
  const driftSpeed=.3+Math.random()*.6; // how fast it drifts
  objs.push({
    mesh,
    home:mesh.position.clone(),         // home position (where it returns to)
    rs:new THREE.Vector3((Math.random()-.5)*.006,(Math.random()-.5)*.01,(Math.random()-.5)*.005),
    dAngle:driftAngle,                  // current drift direction
    dTurn:.1+Math.random()*.3,          // how fast direction rotates (rad/s)
    dSpeed:driftSpeed,                  // drift speed
    dRadius:1.5+Math.random()*3,        // how far it wanders from home
    vel:new THREE.Vector3(0,0,0),
  });
}

/* ════════ MOUSE ════════ */
const m={x:innerWidth/2,y:innerHeight/2,nx:0,ny:0};
const m3=new THREE.Vector3(9999,9999,0); // 3D cursor position
const cfEl=document.getElementById('cf');
const lwEl=document.getElementById('lw');
const logoImg=document.getElementById('logoImg');
const logoGlowEl=document.getElementById('logoGlow');

function onMove(cx,cy){
  m.x=cx;m.y=cy;
  m.nx=(cx/innerWidth)*2-1;
  m.ny=-(cy/innerHeight)*2+1;
  cfEl.style.left=cx+'px';cfEl.style.top=cy+'px';
  // Update 3D cursor position
  const v=new THREE.Vector3(m.nx,m.ny,.5).unproject(C);
  const d=v.sub(C.position).normalize();
  m3.copy(C.position).add(d.multiplyScalar(-C.position.z/d.z));
}
addEventListener('pointermove',e=>onMove(e.clientX,e.clientY));
addEventListener('touchmove',e=>{if(e.touches.length)onMove(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});

/* ════════ LOGO TILT + GLOW (on hover/proximity to logo element) ════════ */
let glowVal=0;
function updateLogo(){
  // Check if cursor is near the logo DOM element
  const rect=lwEl.getBoundingClientRect();
  const pad=80; // extra padding around logo
  const cx=m.x,cy=m.y;
  const nearX=cx>=rect.left-pad&&cx<=rect.right+pad;
  const nearY=cy>=rect.top-pad&&cy<=rect.bottom+pad;
  const isNear=nearX&&nearY;

  let target=0;
  if(isNear){
    // How close to center of logo? 1=dead center, 0=at edge of pad zone
    const lcx=rect.left+rect.width/2, lcy=rect.top+rect.height/2;
    const dx=(cx-lcx)/(rect.width/2+pad), dy=(cy-lcy)/(rect.height/2+pad);
    const d=Math.sqrt(dx*dx+dy*dy);
    target=Math.max(0,1-d);
  }
  glowVal+=(target-glowVal)*.08;

  // Apply glow — big obvious green halo behind logo
  logoGlowEl.style.opacity=(glowVal*1.5).toFixed(3);
  logoGlowEl.style.transform=`scale(${1+glowVal*.4})`;

  // Logo image brightness + glow
  if(glowVal>.01){
    const b=1+glowVal*.25;
    const s1=20+glowVal*80;
    const s2=60+glowVal*160;
    logoImg.style.filter=`drop-shadow(0 0 ${s1}px rgba(66,255,90,${(.2+glowVal*.7).toFixed(2)})) drop-shadow(0 0 ${s2}px rgba(66,255,90,${(.1+glowVal*.4).toFixed(2)})) brightness(${b.toFixed(2)})`;
  }else{
    logoImg.style.filter='drop-shadow(0 0 20px rgba(66,255,90,.1))';
  }
}

/* ════════ GLITCH ════════ */
const gls=[document.getElementById('gr'),document.getElementById('gc'),document.getElementById('gw')];
const nbs=[document.getElementById('n1'),document.getElementById('n2'),document.getElementById('n3')];
let gb=false;
function glitch(){
  if(gb)return;gb=true;
  const dur=160+Math.random()*220,t0=performance.now();
  const pp=gls.map(()=>({y:Math.random()*90,h:3+Math.random()*15,x:(Math.random()<.5?-1:1)*(5+Math.random()*28),d:Math.random()*40}));
  function tk(now){
    const e=now-t0,p=Math.min(1,e/dur);
    gls.forEach((l,i)=>{
      const s=pp[i],q=Math.max(0,Math.min(1,(e-s.d)/(dur-s.d)));
      if(q<=0){l.style.opacity='0';return}
      const lc2=Math.sin(Math.PI*q),st=Math.random()<.2?(Math.random()-.5)*15:0;
      l.style.opacity=(.35+.6*lc2).toFixed(3);
      l.style.clipPath=`inset(${s.y}% 0 ${Math.max(0,100-s.y-s.h*(.7+Math.random()*.6))}% 0)`;
      l.style.transform=`translate3d(${s.x*lc2+st}px,${(Math.random()-.5)*3}px,0)`;
    });
    nbs.forEach((b,i)=>{
      const on=((e+i*50)%100)<55&&e<dur*.85;
      if(!on){b.style.opacity='0';return}
      b.style.top=(5+Math.random()*90)+'%';
      b.style.opacity=(.15+Math.random()*.5).toFixed(2);
      b.style.transform=`scaleX(${.4+Math.random()*1.2})`;
    });
    if(p<1)requestAnimationFrame(tk);
    else{gls.forEach(l=>{l.style.opacity='0';l.style.clipPath='none'});nbs.forEach(b=>{b.style.opacity='0'});gb=false;}
  }
  requestAnimationFrame(tk);
}
(function sc(d){setTimeout(()=>{glitch();sc(2500+Math.random()*6000)},d)})(2200);
let lgt=0;
function pxg(){const n=Date.now();if(n-lgt<1800)return;if(Math.hypot(m.nx,m.ny)<.15&&Math.random()<.4){lgt=n;glitch()}}

/* ════════ ANIMATION LOOP ════════ */
const clk=new THREE.Clock();

const dt=1/60; // fixed timestep for smooth movement

(function loop(){
  requestAnimationFrame(loop);
  const t=clk.getElapsedTime();
  uWobble.value=t;

  objs.forEach(o=>{
    const{mesh,home,rs,vel}=o;

    // Slowly rotate drift direction → organic curved paths
    o.dAngle+=o.dTurn*dt;

    // Drift force: gently push in current direction
    const driftX=Math.cos(o.dAngle)*o.dSpeed*dt;
    const driftY=Math.sin(o.dAngle)*o.dSpeed*dt*.6;
    vel.x+=driftX*.15;
    vel.y+=driftY*.15;

    // Pull back toward home when too far (soft leash)
    const hx=home.x-mesh.position.x;
    const hy=home.y-mesh.position.y;
    const hz=home.z-mesh.position.z;
    const homeDist=Math.sqrt(hx*hx+hy*hy+hz*hz);
    if(homeDist>o.dRadius){
      const pull=(homeDist-o.dRadius)*.008;
      vel.x+=hx/homeDist*pull;
      vel.y+=hy/homeDist*pull;
      vel.z+=hz/homeDist*pull;
    }

    // Cursor repulsion: scatter away
    const dx=mesh.position.x-m3.x, dy=mesh.position.y-m3.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<8&&dist>.01){
      const f=(1-dist/8);
      const force=f*f*2.5;
      vel.x+=dx/dist*force*.1;
      vel.y+=dy/dist*force*.1;
      vel.z+=(Math.random()-.5)*force*.02;
      // Spin faster near cursor
      mesh.rotation.x+=rs.x*f*20;
      mesh.rotation.y+=rs.y*f*20;
    }

    // Damping
    vel.multiplyScalar(.96);

    // Apply velocity
    mesh.position.x+=vel.x;
    mesh.position.y+=vel.y;
    mesh.position.z+=vel.z;

    // Rotation
    mesh.rotation.x+=rs.x;mesh.rotation.y+=rs.y;mesh.rotation.z+=rs.z;
  });

  // Orbiting lights
  pl1.position.x=Math.cos(t*.2)*15;pl1.position.z=Math.sin(t*.2)*12;
  pl2.position.x=Math.cos(t*.15+2)*13;pl2.position.z=Math.sin(t*.15+2)*10;

  updateLogo();
  pxg();

  // Camera follows cursor gently
  C.position.x+=(m.nx*2-C.position.x)*.012;
  C.position.y+=(m.ny*1-C.position.y)*.012;
  C.lookAt(0,0,0);

  comp.render();
})();

addEventListener('resize',()=>{C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);comp.setSize(innerWidth,innerHeight)});
document.addEventListener('click',glitch);