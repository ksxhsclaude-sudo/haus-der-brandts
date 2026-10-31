// =====================================================================
//  Das Haus der Brandts · 3D-Grafik (Three.js)
//  Die Spiellogik (Karte, Monster-KI, Multiplayer, Menüs) kommt unverändert aus index.html.
//  Diese Datei ersetzt nur render(): echte 3D-Räume, Taschenlampe mit Schatten, 3D-Monster.
//  Spielwelt: Feld (x,y) -> Three.js (x, Höhe, y). Eine Wand ist 1 Feld breit und WH hoch.
// =====================================================================
(()=>{
const TH=window.THREE,WH=1.3,EYE=1.1;
const LOWQ=isTouch,PHONE=isTouch&&Math.min(screen.width,screen.height)<500;
// Ohne WebGL bleibt einfach die normale Grafik
if(!TH||!document.createElement('canvas').getContext('webgl2')&&!document.createElement('canvas').getContext('webgl'))return;

// ---------- Renderer ----------
const glc=document.createElement('canvas');glc.id='c3';
glc.style.cssText='position:fixed;inset:0;width:100%;height:100%;';
cv.parentNode.insertBefore(glc,cv);
const R3=new TH.WebGLRenderer({canvas:glc,antialias:!LOWQ,powerPreference:'high-performance'});
R3.setPixelRatio(Math.min(devicePixelRatio||1,PHONE?1:LOWQ?1.25:1.5));
R3.shadowMap.enabled=true;R3.shadowMap.type=LOWQ?TH.PCFShadowMap:TH.PCFSoftShadowMap;
R3.outputColorSpace=TH.SRGBColorSpace;R3.toneMapping=TH.ACESFilmicToneMapping;R3.toneMappingExposure=1.15;
window.__R3=R3;const scene=new TH.Scene(),cam=new TH.PerspectiveCamera(72,1,.02,60);scene.add(cam);
scene.fog=new TH.FogExp2(0x000000,.15);scene.background=new TH.Color(0x000000);
function size3(){R3.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.fov=innerWidth/innerHeight<1.2?82:70;cam.updateProjectionMatrix()}
addEventListener('resize',size3);size3();
const ANISO=Math.min(8,R3.capabilities.getMaxAnisotropy());

// ---------- Licht ----------
const hemi=new TH.HemisphereLight(0x404050,0x080604,.4);scene.add(hemi);
const moon=new TH.DirectionalLight(0x8090c0,0);moon.position.set(-20,30,-10);scene.add(moon);
const torch=new TH.SpotLight(0xffe2b8,0,13,.46,.6,1);torch.castShadow=true;
torch.shadow.mapSize.set(LOWQ?512:1024,LOWQ?512:1024);torch.shadow.camera.near=.08;torch.shadow.camera.far=13;torch.shadow.bias=-.0015;torch.shadow.normalBias=.02;
cam.add(torch);torch.position.set(.12,-.1,.05);torch.target.position.set(0,-.05,-1);cam.add(torch.target);
const flashL=new TH.PointLight(0xffffff,0,9,1.2);cam.add(flashL);
const POOL=[];for(let i=0;i<6;i++){const l=new TH.PointLight(0xffffff,0,8,1.6);scene.add(l);POOL.push(l)}

// ---------- Texturen ----------
const texCache=new Map();
function ctex(canvas,up=4,rep=true){
  let t=texCache.get(canvas);if(t)return t;
  const u=up>1?mk(canvas.width*up,canvas.height*up,c=>{c.imageSmoothingEnabled=false;c.drawImage(canvas,0,0,canvas.width*up,canvas.height*up)}):canvas;
  t=new TH.CanvasTexture(u);t.colorSpace=TH.SRGBColorSpace;if(rep)t.wrapS=t.wrapT=TH.RepeatWrapping;t.anisotropy=ANISO;texCache.set(canvas,t);return t}
const TRR=rng(4242),R=()=>TRR();
function noiseDots(c,w,h,n,a){for(let i=0;i<n;i++){c.fillStyle=`rgba(0,0,0,${R()*a})`;c.fillRect(R()*w|0,R()*h|0,1+R()*2|0,1+R()*2|0)}}
function blot(c,w,h,col,n){for(let i=0;i<n;i++){const x=R()*w,y=R()*h,r=4+R()*12,gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2)}}
const planks=(b,v,dark)=>mk(64,64,(c,w,h)=>{for(let y=0;y<64;y+=8){const k=b+R()*v|0;c.fillStyle=`rgb(${k+14},${k+5},${k-6})`;c.fillRect(0,y,64,7);c.fillStyle=dark;c.fillRect(0,y+7,64,1);const j=R()*64|0;c.fillRect(j,y,1,7);c.fillStyle='rgba(0,0,0,.25)';for(let k2=0;k2<3;k2++)c.fillRect(R()*64,y+R()*6,6+R()*14,1)}noiseDots(c,w,h,350,.5);blot(c,w,h,'rgba(10,6,2,.45)',4)});
const FLOOR={
  0:planks(42,14,'#130b06'),
  1:mk(64,64,(c,w,h)=>{c.fillStyle='#140807';c.fillRect(0,0,w,h);for(let y=0;y<64;y+=16)for(let x=0;x<64;x+=16){const k=34+R()*14|0;c.fillStyle=`rgb(${k+10},${k-6},${k-10})`;c.fillRect(x+1+(y%32?8:0)%16,y+1,14,14)}noiseDots(c,w,h,500,.6);blot(c,w,h,'rgba(70,0,0,.35)',3)}),
  2:mk(64,64,(c,w,h)=>{c.fillStyle='#0f170c';c.fillRect(0,0,w,h);for(let i=0;i<700;i++){c.fillStyle=`rgb(${14+R()*20|0},${26+R()*34|0},${10+R()*14|0})`;c.fillRect(R()*64,R()*64,1,2+R()*3)}noiseDots(c,w,h,300,.5)}),
  3:mk(64,64,(c,w,h)=>{for(let y=0;y<64;y+=16)for(let x=0;x<64;x+=16){const k=((x+y)/16)%2?92:118;const v=k+R()*12|0;c.fillStyle=`rgb(${v-8},${v+4},${v})`;c.fillRect(x,y,16,16)}c.fillStyle='rgba(20,30,28,.6)';for(let i=0;i<64;i+=16){c.fillRect(i,0,1,64);c.fillRect(0,i,64,1)}noiseDots(c,w,h,600,.5);blot(c,w,h,'rgba(30,20,10,.4)',5)}),
  4:mk(64,64,(c,w,h)=>{c.fillStyle='#3a4a50';c.fillRect(0,0,w,h);for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=8){const v=60+R()*14|0;c.fillStyle=`rgb(${v-10},${v+4},${v+12})`;c.fillRect(x+.5,y+.5,7,7)}noiseDots(c,w,h,500,.5);c.fillStyle='rgba(90,0,0,.5)';c.beginPath();c.arc(40,30,6,0,7);c.fill()}),
  5:mk(64,64,(c,w,h)=>{c.fillStyle='#120e09';c.fillRect(0,0,w,h);for(let i=0;i<400;i++){c.fillStyle=`rgb(${30+R()*30|0},${20+R()*18|0},${10+R()*8|0})`;c.beginPath();c.ellipse(R()*64,R()*64,1+R()*2,.6+R(),R()*3,0,7);c.fill()}for(let i=0;i<120;i++){c.fillStyle=`rgb(${16+R()*14|0},${30+R()*24|0},${12|0})`;c.fillRect(R()*64,R()*64,1,2)}noiseDots(c,w,h,300,.5)}),
  6:planks(36,12,'#0e0805'),
  7:mk(64,64,(c,w,h)=>{c.fillStyle='#14061c';c.fillRect(0,0,w,h);for(let i=0;i<14;i++){c.strokeStyle=`rgba(${100+R()*60|0},${10+R()*20|0},${80+R()*50|0},.6)`;c.lineWidth=.5+R();c.beginPath();let x=R()*64,y=R()*64;c.moveTo(x,y);for(let k=0;k<5;k++){x+=(R()-.5)*18;y+=(R()-.5)*18;c.lineTo(x,y)}c.stroke()}noiseDots(c,w,h,300,.5)}),
  8:planks(30,12,'#0a0603'),
};
const CEIL={
  0:mk(64,64,(c,w,h)=>{c.fillStyle='#2a2420';c.fillRect(0,0,w,h);noiseDots(c,w,h,500,.4);blot(c,w,h,'rgba(40,25,10,.5)',5);c.fillStyle='#17110c';c.fillRect(0,0,64,5)}),
  1:mk(64,64,(c,w,h)=>{c.fillStyle='#1c1210';c.fillRect(0,0,w,h);noiseDots(c,w,h,700,.6);blot(c,w,h,'rgba(0,0,0,.6)',6)}),
  3:mk(64,64,(c,w,h)=>{c.fillStyle='#4a524e';c.fillRect(0,0,w,h);c.fillStyle='#2a302d';for(let i=0;i<64;i+=32){c.fillRect(i,0,1.5,64);c.fillRect(0,i,64,1.5)}noiseDots(c,w,h,400,.4);blot(c,w,h,'rgba(60,40,10,.45)',3)}),
  4:mk(64,64,(c,w,h)=>{c.fillStyle='#2a3438';c.fillRect(0,0,w,h);noiseDots(c,w,h,500,.5)}),
  6:planks(28,10,'#080402'),
  8:mk(64,64,(c,w,h)=>{c.fillStyle='#1a120a';c.fillRect(0,0,w,h);for(let x=0;x<64;x+=32){c.fillStyle='#0c0703';c.fillRect(x,0,10,64)}noiseDots(c,w,h,600,.6);c.strokeStyle='rgba(220,220,220,.2)';c.lineWidth=.4;for(let i=0;i<6;i++){c.beginPath();c.moveTo(10,R()*64);c.quadraticCurveTo(20,R()*64,32,R()*64);c.stroke()}}),
};
const OUTDOOR=z=>z===2||z===5||z===7;
// Zonen-Stimmung: Nebel, Umgebungslicht, Mond
const MOOD={0:[0x0b0806,.15,0x6a5644,0x0c0806,.5,0],1:[0x0e0403,.18,0x6a2a20,0x060101,.4,0],2:[0x070b16,.09,0x40507a,0x0a140a,.55,.5],
  3:[0x0a100e,.11,0x6a8a82,0x101614,.7,0],4:[0x060e12,.15,0x3a5a6a,0x050a0c,.45,0],5:[0x060a0c,.12,0x2a3a50,0x0a0c08,.35,.3],
  6:[0x120b06,.15,0x5a4028,0x0a0604,.45,0],7:[0x10041a,.09,0x6a2a80,0x14041a,.6,.15],8:[0x0c0804,.2,0x4a3220,0x080503,.22,0]};

// ---------- Material-Helfer ----------
const MAT=new Map();
function std(col,rough=.85,o={}){if(o.map||o.bumpMap||o.emissiveMap||o.transparent)return new TH.MeshStandardMaterial(Object.assign({color:col,roughness:rough,metalness:0},o));const k=col+'|'+rough+'|'+JSON.stringify(o);let m=MAT.get(k);if(!m){m=new TH.MeshStandardMaterial(Object.assign({color:col,roughness:rough,metalness:0},o));MAT.set(k,m)}return m}
function emis(col,inten=2){return std(0x000000,.6,{emissive:col,emissiveIntensity:inten})}
const glowTex=new TH.CanvasTexture(mk(64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64)}));
function glow(col,s,op=.6){const sp=new TH.Sprite(new TH.SpriteMaterial({map:glowTex,color:col,blending:TH.AdditiveBlending,depthWrite:false,transparent:true,opacity:op,fog:false}));sp.scale.set(s,s,1);return sp}
function box(w,h,d,m,x=0,y=0,z=0,par){const o=new TH.Mesh(new TH.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;if(par)par.add(o);return o}
function cyl(rt,rb,h,m,x=0,y=0,z=0,par,seg=10){const o=new TH.Mesh(new TH.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y,z);o.castShadow=true;if(par)par.add(o);return o}
function sph(r,m,x=0,y=0,z=0,par,sx=1,sy=1,sz=1){const o=new TH.Mesh(new TH.SphereGeometry(r,14,10),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;if(par)par.add(o);return o}
// Glied: Pivot oben, hängt nach unten (Länge l)
function limb(par,x,y,z,l,r0,r1,m){const p=new TH.Group();p.position.set(x,y,z);par.add(p);const c=new TH.Mesh(new TH.CylinderGeometry(r0,r1,l,8),m);c.position.y=-l/2;c.castShadow=true;p.add(c);const j=sph(r1*1.05,m,0,-l,0,p);return p}
function faceCap(r,tex,par,y,z){const g=new TH.SphereGeometry(r,24,16,Math.PI/2-.95,1.9,.45,1.95);const m=new TH.MeshStandardMaterial({map:tex,transparent:true,roughness:.7,alphaTest:.05});const o=new TH.Mesh(g,m);o.position.set(0,y,z);par.add(o);return o}
const facing=(o,a)=>{o.rotation.y=Math.PI/2-a};

// ---------- Monster-Modelle ----------
// Kranke, fleckige Haut mit Adern (für alle Monster)
function skinCanvas(base,blotch,vein){return mk(64,64,(c,w,h)=>{c.fillStyle=base;c.fillRect(0,0,w,h);for(let i=0;i<260;i++){c.fillStyle=`rgba(${blotch},${R()*.35})`;c.beginPath();c.arc(R()*64,R()*64,1+R()*5,0,7);c.fill()}
  c.strokeStyle=vein;c.lineWidth=.6;for(let i=0;i<9;i++){c.beginPath();let x=R()*64,y=R()*64;c.moveTo(x,y);for(let k=0;k<6;k++){x+=(R()-.5)*12;y+=R()*8;c.lineTo(x,y)}c.stroke()}noiseDots(c,w,h,400,.35);
  for(let i=0;i<4;i++){c.fillStyle='rgba(90,10,10,.55)';c.beginPath();c.arc(R()*64,R()*64,1+R()*2.5,0,7);c.fill()}})}
const skinTex=ctex(skinCanvas('#8a8274','40,30,25','rgba(60,30,60,.5)'),2);
const skinM=std(0xffffff,.7,{map:skinTex,bumpMap:skinTex,bumpScale:.5}),darkM=std(0x15110d,.9),boneM=std(0xd8cfb0,.6);
const paleTex=ctex(skinCanvas('#a49a88','50,40,30','rgba(70,40,70,.45)'),2),paleM=std(0xffffff,.7,{map:paleTex,bumpMap:paleTex,bumpScale:.5});
// Knochen zwischen zwei Punkten
function bone(par,a,b,r0,r1,m){const d=new TH.Vector3().subVectors(b,a),l=d.length();const c=new TH.Mesh(new TH.CylinderGeometry(r1,r0,l,7),m);c.position.copy(a).addScaledVector(d,.5);c.quaternion.setFromUnitVectors(new TH.Vector3(0,1,0),d.normalize());c.castShadow=true;par.add(c);return c}
const MFACE=ctex(mk(256,320,c=>drawFace(c,128,160,236,310,42,true)),1,false);
function buildMonster(){
  const g=new TH.Group(),body=new TH.Group();g.add(body);
  const ribs=ctex(mk(64,128,c=>{const gr=c.createLinearGradient(0,0,64,0);gr.addColorStop(0,'#4a463e');gr.addColorStop(.5,'#c4bcac');gr.addColorStop(1,'#4a463e');c.fillStyle=gr;c.fillRect(0,0,64,128);c.strokeStyle='rgba(40,28,20,.7)';c.lineWidth=2;for(let i=0;i<8;i++){const y=14+i*12;c.beginPath();c.moveTo(32,y);c.quadraticCurveTo(14,y-5,4,y+7);c.moveTo(32,y);c.quadraticCurveTo(50,y-5,60,y+7);c.stroke()}c.fillStyle='#3a0000';c.beginPath();c.ellipse(36,104,6,10,0,0,7);c.fill()}),1,false);
  const torsoM=new TH.MeshStandardMaterial({map:ribs,roughness:.75});
  const hip=new TH.Group();hip.position.y=.56;body.add(hip);
  const legL=limb(hip,-.075,0,0,.31,.042,.028,skinM),legR=limb(hip,.075,0,0,.31,.042,.028,skinM);
  const shinL=limb(legL,0,-.31,0,.3,.028,.02,skinM),shinR=limb(legR,0,-.31,0,.3,.028,.02,skinM);
  for(const sh of[shinL,shinR]){const ft=box(.05,.025,.12,skinM,0,-.31,.04,sh);for(let k=0;k<3;k++){const t=new TH.Mesh(new TH.ConeGeometry(.007,.06,4),darkM);t.rotation.x=1.5;t.position.set((k-1)*.016,-.315,.12);sh.add(t)}}
  const torso=new TH.Mesh(new TH.CylinderGeometry(.12,.08,.46,12),torsoM);torso.position.y=.23;torso.scale.z=.7;torso.castShadow=true;
  const spine=new TH.Group();hip.add(spine);spine.add(torso);spine.rotation.x=.3;
  // zerfetzter Lumpen um die Hüfte
  const ragM=std(0x2a2018,.95,{side:TH.DoubleSide});for(let i=0;i<9;i++){const a=i/9*Math.PI*2,l=.16+Math.random()*.14;const r=new TH.Mesh(new TH.PlaneGeometry(.07,l),ragM);r.position.set(Math.sin(a)*.095,-l/2+.02,Math.cos(a)*.07);r.rotation.y=a;r.rotation.x=(Math.random()-.5)*.3;r.castShadow=true;hip.add(r)}
  sph(.1,std(0x221a14,.95),0,0,0,hip,1.05,.45,.8);
  const armL=limb(spine,-.14,.43,0,.36,.03,.022,skinM),armR=limb(spine,.14,.43,0,.36,.03,.022,skinM);
  const foreL=limb(armL,0,-.36,0,.4,.022,.016,skinM),foreR=limb(armR,0,-.36,0,.4,.022,.016,skinM);
  for(const sx of[-.13,.13])sph(.04,skinM,sx,.44,0,spine,1,.8,.9);
  for(const f of[foreL,foreR])for(let k=0;k<4;k++){const cl=new TH.Mesh(new TH.ConeGeometry(.007,.1,4),darkM);cl.position.set((k-1.5)*.014,-.41,.01);cl.rotation.x=.25;f.add(cl)}
  const neck=new TH.Group();neck.position.y=.46;spine.add(neck);neck.rotation.x=.35;cyl(.02,.025,.1,skinM,0,.04,0,neck);
  const head=new TH.Group();head.position.set(0,.14,.02);neck.add(head);
  sph(.09,skinM,0,0,0,head,.9,1.15,1);faceCap(.092,MFACE,head,0,.004);
  const hairM=std(0x050403,.9);const hair=[];
  for(let i=0;i<34;i++){const a=(i/34)*Math.PI*2,len=.35+Math.random()*.45;const h=new TH.Mesh(new TH.BoxGeometry(.006,len,.006),hairM);const p=new TH.Group();p.position.set(Math.sin(a)*.075,.07,Math.cos(a)*.07-.01);p.rotation.z=Math.sin(a)*.12;
    const front=Math.cos(a)>.5;if(front&&Math.random()<.6)continue;h.position.y=-len/2;p.add(h);head.add(p);hair.push(p)}
  const eyes=[];for(const sx of[-.03,.03]){const e=sph(.008,emis(0xff2010,6),sx,.018,.085,head);e.castShadow=false;const gl=glow(0xff2a10,.09,.8);gl.position.copy(e.position);head.add(gl);eyes.push(gl)}
  g.userData={body,hip,spine,legL,legR,shinL,shinR,armL,armR,foreL,foreR,head,hair,eyes,phase:0};
  return g}
function animMonster(g,m,mv,dt){
  const u=g.userData;u.phase+=mv*9;const s=Math.sin(u.phase),hunt=m.state==='hunt';
  u.legL.rotation.x=s*.55;u.legR.rotation.x=-s*.55;u.shinL.rotation.x=Math.max(0,-s)*.6;u.shinR.rotation.x=Math.max(0,s)*.6;
  u.hip.position.y=.56+Math.abs(Math.cos(u.phase))*.015;u.legL.rotation.x+=-.12;u.legR.rotation.x+=-.12;u.shinL.rotation.x+=.22;u.shinR.rotation.x+=.22;
  const stun=m.state==='stun';
  u.armL.rotation.x=stun?-2.4:(hunt?-.6:0)-s*.35;u.armR.rotation.x=stun?-2.2:(hunt?-.6:0)+s*.35;u.armL.rotation.z=-.08;u.armR.rotation.z=.08;
  u.foreL.rotation.x=stun?-.9:-.25;u.foreR.rotation.x=stun?-.9:-.25;
  u.spine.rotation.x=(hunt?.55:.4)+Math.sin(T*1.7)*.03;
  u.head.rotation.z=Math.sin(T*.9)*.18+(Math.random()<.02?(Math.random()-.5)*.6:0);u.head.rotation.x=stun?.5:hunt?-.55:-.3;
  for(const h of u.hair)h.rotation.x=-.1-s*.06*(hunt?2:1);
  for(const e of u.eyes)e.material.opacity=stun?Math.random():(.6+Math.random()*.25)}

const DOLLFACE=ctex(mk(128,128,c=>{const g=c.createRadialGradient(54,50,4,64,64,60);g.addColorStop(0,'#fbf6ee');g.addColorStop(1,'#b0a696');c.fillStyle=g;c.fillRect(0,0,128,128);
  for(const s of[-1,1]){c.fillStyle='#000';c.beginPath();c.ellipse(64+s*20,58,11,14,0,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(64+s*20+2,56,2.5,0,7);c.fill();c.fillStyle='rgba(210,40,60,.45)';c.beginPath();c.arc(64+s*30,80,8,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(64+s*20,72);c.lineTo(64+s*21,92);c.stroke()}
  c.strokeStyle='#8a0010';c.lineWidth=4;c.beginPath();c.moveTo(36,90);c.quadraticCurveTo(64,112,92,90);c.stroke();c.strokeStyle='#2a1a14';c.lineWidth=1.5;for(let i=40;i<=88;i+=6){c.beginPath();c.moveTo(i,93+(1-Math.abs(i-64)/30)*6);c.lineTo(i,101+(1-Math.abs(i-64)/30)*6);c.stroke()}
  c.strokeStyle='#3a2a20';c.lineWidth=1.5;c.beginPath();c.moveTo(74,26);c.lineTo(80,40);c.lineTo(74,48);c.stroke()}),1,false);
function buildDoll(){
  const g=new TH.Group(),porc=std(0xe0d8ca,.45),dress=std(0x4a0d12,.9);
  for(const sx of[-.03,.03]){cyl(.012,.01,.26,porc,sx,.13,0,g);box(.03,.02,.045,darkM,sx,.01,.01,g)}
  const sk=new TH.Mesh(new TH.ConeGeometry(.13,.34,12,1,true),dress);sk.position.y=.38;sk.castShadow=true;g.add(sk);
  cyl(.05,.07,.18,dress,0,.6,0,g);box(.1,.02,.06,std(0xe8e0d0,.8),0,.69,0,g);
  const aL=limb(g,-.075,.66,0,.2,.013,.011,porc),aR=limb(g,.075,.66,0,.2,.013,.011,porc);
  const head=new TH.Group();head.position.y=.8;g.add(head);sph(.08,porc,0,0,0,head,1,1.08,1);faceCap(.082,DOLLFACE,head,0,.003);
  sph(.085,std(0x100606,.9),0,.035,-.012,head,1.02,.75,1.05);for(const sx of[-.07,.07])box(.03,.16,.04,std(0x100606,.9),sx,-.05,-.02,head);
  g.userData={aL,aR,head};return g}
function animDoll(g,d){const u=g.userData,p=d.pose;u.aL.rotation.set(p?-2.3:0,0,p?-.4:-.1);u.aR.rotation.set(p?-2:0,0,p?.5:.1);u.head.rotation.z=p?.38:-.08;
  g.position.y=d.moving?(Math.random()-.5)*.01:0}

const BLINDF=ctex(mk(128,128,c=>{const g=c.createRadialGradient(60,50,4,64,64,64);g.addColorStop(0,'#cfc6b8');g.addColorStop(1,'#8e8578');c.fillStyle=g;c.fillRect(0,0,128,128);c.fillStyle='#d4ccbb';c.fillRect(0,34,128,30);c.strokeStyle='rgba(110,100,80,.6)';for(let i=0;i<8;i++){c.beginPath();c.moveTo(i*18,34);c.lineTo(i*18+14,64);c.stroke()}
  c.fillStyle='rgba(135,0,0,.9)';c.beginPath();c.arc(46,50,8,0,7);c.arc(82,50,8,0,7);c.fill();c.fillRect(44,52,3,30);c.fillRect(82,52,3,20);c.fillStyle='#120606';c.beginPath();c.ellipse(64,90,9,15,0,0,7);c.fill()}),1,false);
const gownTex=ctex(mk(64,64,(c,w,h)=>{c.fillStyle='#7a8a8c';c.fillRect(0,0,w,h);c.fillStyle='rgba(50,60,62,.6)';for(let y=0;y<64;y+=6)for(let x=0;x<64;x+=6)c.fillRect(x+(y%12?3:0),y,1.5,1.5);
  blot(c,w,h,'rgba(110,90,30,.5)',3);blot(c,w,h,'rgba(90,0,0,.55)',2);c.fillStyle='rgba(110,0,0,.8)';for(let i=0;i<5;i++)c.fillRect(20+R()*20,R()*20,1.5,10+R()*30);noiseDots(c,w,h,400,.4)}),2);
function buildBlind(){
  const g=new TH.Group(),gown=std(0xffffff,.9,{map:gownTex,side:TH.DoubleSide});
  const hip=new TH.Group();hip.position.y=.52;g.add(hip);
  const lL=limb(hip,-.07,0,0,.52,.032,.022,paleM),lR=limb(hip,.07,0,0,.52,.032,.022,paleM);
  const sp=new TH.Group();hip.add(sp);sp.rotation.x=.45;
  const t=new TH.Mesh(new TH.CylinderGeometry(.11,.19,.62,12,1,true),gown);t.position.y=.16;t.castShadow=true;sp.add(t);
  sph(.12,gown,0,.46,0,sp,1.1,.5,.85);
  const aL=limb(sp,-.16,.44,0,.38,.026,.02,paleM),aR=limb(sp,.16,.44,0,.38,.026,.02,paleM);
  const fL=limb(aL,0,-.38,0,.46,.02,.014,paleM),fR=limb(aR,0,-.38,0,.46,.02,.014,paleM);
  for(const f of[fL,fR])for(let k=0;k<4;k++){const fi=new TH.Mesh(new TH.CylinderGeometry(.004,.003,.09,4),paleM);fi.position.set((k-1.5)*.012,-.5,.0);fi.rotation.x=.2;f.add(fi)}
  const neck=new TH.Group();neck.position.y=.5;sp.add(neck);neck.rotation.x=.5;cyl(.03,.035,.12,paleM,0,.05,0,neck);
  const head=new TH.Group();head.position.y=.17;neck.add(head);sph(.1,paleM,0,0,0,head,.95,1.15,1);faceCap(.102,BLINDF,head,0,.003);
  const band=new TH.Mesh(new TH.TorusGeometry(.098,.022,6,20),std(0xd4ccbb,.9));band.rotation.x=Math.PI/2;band.scale.set(1,1.05,1);band.position.y=.03;head.add(band);
  for(const sx of[-.035,.035]){const st=sph(.016,std(0x7a0000,.5),sx,.03,.105,head,1,1,.4);st.castShadow=false}
  g.userData={hip,lL,lR,sp,aL,aR,fL,fR,head,phase:0};return g}
function animBlind(g,b,mv){const u=g.userData;u.phase+=mv*8;const s=Math.sin(u.phase);u.lL.rotation.x=s*.4;u.lR.rotation.x=-s*.4;u.aL.rotation.x=.2-s*.15;u.aR.rotation.x=.2+s*.15;u.aL.rotation.z=-.25;u.aR.rotation.z=.25;
  u.fL.rotation.x=-.3;u.fR.rotation.x=-.3;u.head.rotation.y=b.state==='search'?Math.sin(T*3)*.7:Math.sin(T*.7)*.2;u.head.rotation.x=b.state==='hunt'?-.5:-.2;u.sp.rotation.x=.45+Math.sin(T*1.4)*.04}

const smokeM=new TH.MeshBasicMaterial({color:0x020104,transparent:true,opacity:.55,depthWrite:false});
function buildShadow(){
  const g=new TH.Group(),puffs=[];
  for(let i=0;i<26;i++){const y=.1+Math.random()*1.1,w=y>1?.07:y>.8?.1:.08;const m=new TH.Mesh(new TH.SphereGeometry(.05+Math.random()*.06,8,6),smokeM);m.position.set((Math.random()-.5)*w*2,y,(Math.random()-.5)*w);g.add(m);puffs.push({m,b:m.position.clone(),ph:Math.random()*7})}
  sph(.09,std(0x000000,1),0,1.12,0,g,.9,1.1,.9);
  const eyes=[];for(const sx of[-.035,.035]){const e=glow(0xd8e0ff,.08,.95);e.position.set(sx,1.13,.08);g.add(e);eyes.push(e)}
  g.userData={puffs,eyes};return g}
function animShadow(g,z){const u=g.userData;for(const p of u.puffs){p.m.position.set(p.b.x+Math.sin(T*2+p.ph)*.03,p.b.y+Math.sin(T*1.3+p.ph)*.02,p.b.z+Math.cos(T*1.7+p.ph)*.03)}
  for(const e of u.eyes)e.material.opacity=z.state==='flee'?Math.random():.95}

const CRF=ctex(mk(128,128,c=>{const g=c.createRadialGradient(56,50,4,64,64,62);g.addColorStop(0,'#e0d8c6');g.addColorStop(1,'#6c6252');c.fillStyle=g;c.fillRect(0,0,128,128);c.fillStyle='#000';for(const s of[-1,1]){c.beginPath();c.ellipse(64+s*22,56,14,18,0,0,7);c.fill()}
  c.fillStyle='#1a0000';c.beginPath();c.ellipse(64,98,20,22,0,0,7);c.fill();c.fillStyle='#d8cfb0';for(let i=-18;i<=18;i+=6){c.fillRect(64+i-1.5,78,3,8);c.fillRect(64+i-1.5,110,3,7)}}),1,false);
function buildCrawler(){
  const g=new TH.Group(),V=(x,y,z)=>new TH.Vector3(x,y,z);
  const body=new TH.Group();g.add(body);
  // Rumpf: dürr, Rippen und Wirbel sichtbar
  const torso=new TH.Mesh(new TH.CapsuleGeometry(.065,.36,4,10),skinM);torso.rotation.x=Math.PI/2;torso.position.set(0,.26,-.02);torso.scale.set(1.15,1,.8);torso.castShadow=true;body.add(torso);
  for(let i=0;i<8;i++){const v=sph(.017,paleM,0,.32,-.2+i*.055,body);v.castShadow=false}
  for(let i=0;i<5;i++)for(const sx of[-1,1]){const r=bone(body,V(0,.31,.1-i*.05),V(sx*.075,.22,.1-i*.05),.008,.006,paleM);r.castShadow=false}
  sph(.07,skinM,0,.27,-.24,body,1.1,.8,1);
  // vier lange Spinnenbeine: Knie hoch über dem Körper
  const legs=[];
  for(const[sx,fz,yaw]of[[-1,.12,.5],[1,.12,-.5],[-1,-.2,2.5],[1,-.2,-2.5]]){
    const root=new TH.Group();root.position.set(sx*.06,.27,fz);body.add(root);
    const leg=new TH.Group();root.add(leg);
    const dir=new TH.Vector3(Math.sin(yaw)*-1*sx*0+sx,0,0);
    const K=V(sx*.2,.32,Math.sign(fz)*.12),F=V(sx*.34,-.27,Math.sign(fz)*.22);
    bone(leg,V(0,0,0),K,.022,.016,skinM);sph(.022,paleM,K.x,K.y,K.z,leg);bone(leg,K,F,.016,.007,skinM);
    for(let k=0;k<3;k++)bone(leg,F,V(F.x+sx*.04,F.y-.005,F.z+(k-1)*.03),.006,.002,darkM);
    legs.push({root,ph:(sx>0?0:Math.PI)+(fz>0?0:Math.PI/2)})}
  // Hals nach oben, Kopf verdreht
  const neck=new TH.Group();neck.position.set(0,.3,.22);body.add(neck);bone(neck,V(0,0,0),V(0,.16,.08),.03,.025,skinM);
  const head=new TH.Group();head.position.set(0,.2,.11);neck.add(head);sph(.075,paleM,0,0,0,head,1,1.15,1);faceCap(.077,CRF,head,0,.003);
  sph(.079,std(0x0a0806,.9),0,.035,-.025,head,1,.75,1.05);for(let i=0;i<14;i++){const h=new TH.Mesh(new TH.BoxGeometry(.005,.16+Math.random()*.1,.005),std(0x050403,.9));h.position.set((Math.random()-.5)*.12,-.06,-.04+Math.random()*.05);head.add(h)}
  head.rotation.set(-.3,0,2.6);
  const eyes=[];for(const sx of[-.03,.03]){const e=glow(0xffc040,.07,.95);e.position.set(sx,.012,.075);head.add(e);eyes.push(e)}
  g.userData={legs,head,eyes,body,phase:0};return g}
function animCrawler(g,k,mv){const u=g.userData;u.phase+=mv*16;
  for(const L of u.legs){const s=Math.sin(u.phase+L.ph);L.root.rotation.y=s*.28;L.root.rotation.z=Math.max(0,Math.cos(u.phase+L.ph))*.12*(L.root.position.x>0?-1:1)}
  u.body.position.y=Math.abs(Math.sin(u.phase*2))*.012;u.body.rotation.z=Math.sin(u.phase)*.05;
  u.head.rotation.z=2.6+Math.sin(T*7)*.12*(k.state==='hunt'?2.5:1)+(Math.random()<.03?(Math.random()-.5):0);
  for(const e of u.eyes)e.material.opacity=k.state==='stun'?Math.random():.95}

function buildPlayer(col){const g=new TH.Group(),c=std(col,.85),j=std(0x26303e,.9),sk=std(0xe0b896,.7);
  for(const sx of[-.05,.05])cyl(.03,.025,.36,j,sx,.18,0,g);const t=new TH.Mesh(new TH.CapsuleGeometry(.09,.2,4,8),c);t.position.y=.5;t.castShadow=true;g.add(t);
  sph(.07,sk,0,.74,0,g);sph(.075,std(0x3a271a,.9),0,.77,-.01,g,1,.7,1);for(const sx of[-.11,.11])cyl(.025,.025,.3,c,sx,.5,0,g);
  const lamp=glow(0xffe9a8,.12,.9);lamp.position.set(.12,.38,.08);g.add(lamp);return g}

// ---------- Gegenstände ----------
function buildLocker(){const g=new TH.Group(),met=std(0x3d4742,.55,{metalness:.35});
  const front=new TH.MeshStandardMaterial({map:ctex(SPR.locker,4,false),roughness:.55,metalness:.3,transparent:true,alphaTest:.5});
  const b=box(.5,1.1,.42,met,0,.55,0,g);const f=new TH.Mesh(new TH.PlaneGeometry(.5,1.1),front);f.position.set(0,.55,.212);f.castShadow=true;g.add(f);
  box(.52,.03,.44,std(0x222826,.6,{metalness:.4}),0,1.1,0,g);return g}
function buildBed(){const g=new TH.Group(),st=std(0x6a7276,.45,{metalness:.5}),sh=std(0xa9aca2,.9);
  box(.5,.05,1,st,0,.3,0,g);box(.46,.1,.94,sh,0,.37,0,g);box(.28,.07,.18,std(0xc6c6ba,.9),0,.45,-.35,g);
  for(const[x,z]of[[-.23,-.47],[.23,-.47],[-.23,.47],[.23,.47]])cyl(.012,.012,.3,st,x,.15,z,g);box(.5,.35,.025,st,0,.47,-.5,g);
  const bl=new TH.Mesh(new TH.CircleGeometry(.1,12),std(0x5a0404,.35));bl.rotation.x=-Math.PI/2;bl.position.set(.05,.425,.12);bl.scale.set(1.4,.8,1);g.add(bl);return g}
function buildWheel(){const g=new TH.Group(),st=std(0x5a6064,.4,{metalness:.5});
  for(const sx of[-.16,.16]){const w=new TH.Mesh(new TH.TorusGeometry(.14,.012,6,16),st);w.position.set(sx,.15,0);w.rotation.y=Math.PI/2;w.castShadow=true;g.add(w)}
  box(.3,.03,.3,std(0x2a1e1a,.8),0,.26,0,g);box(.3,.3,.03,std(0x2a1e1a,.8),0,.42,-.15,g);return g}
function buildBattery(){const g=new TH.Group();cyl(.025,.025,.09,std(0xd8a830,.35,{metalness:.6,emissive:0x302000}),0,.045,0,g);cyl(.026,.026,.02,std(0x222222,.5),0,.06,0,g);const gl=glow(0xffd060,.25,.35);gl.position.y=.06;g.add(gl);return g}
function buildFilm(){const g=new TH.Group();box(.09,.06,.06,std(0xd9a520,.5,{emissive:0x2a1800}),0,.03,0,g);box(.092,.012,.062,std(0x111111,.5),0,.04,0,g);const gl=glow(0xffc040,.25,.35);gl.position.y=.05;g.add(gl);return g}
function buildMusicBox(){const g=new TH.Group();box(.18,.1,.13,std(0x6a2418,.45),0,.05,0,g);box(.19,.012,.14,std(0xe8b850,.3,{metalness:.7}),0,.1,0,g);
  const lid=box(.18,.11,.012,std(0x7a2a1a,.45),0,.155,-.065,g);lid.rotation.x=-.35;const mir=new TH.Mesh(new TH.PlaneGeometry(.15,.08),std(0xc8d4dc,.1,{metalness:.9}));mir.position.set(0,0,.007);lid.add(mir);
  const bal=new TH.Group();bal.position.set(0,.11,.01);g.add(bal);cyl(.004,.004,.05,std(0xf6eee6,.4),0,.025,0,bal);sph(.009,std(0xf6eee6,.4),0,.06,0,bal);const sk=new TH.Mesh(new TH.ConeGeometry(.022,.02,10),std(0xffd0e0,.6));sk.position.y=.035;bal.add(sk);
  const gl=glow(0xffaa40,.45,.5);gl.position.y=.12;g.add(gl);g.userData.spin=bal;return g}
function buildXray(){const g=new TH.Group(),st=std(0x555c60,.4,{metalness:.5});cyl(.01,.01,.45,st,0,.22,0,g);box(.2,.01,.2,st,0,.005,0,g);
  const scr=new TH.Mesh(new TH.PlaneGeometry(.28,.27),new TH.MeshStandardMaterial({map:ctex(SPR.xray,4,false),emissive:0xffffff,emissiveMap:ctex(SPR.xray,4,false),emissiveIntensity:1.2,transparent:true,alphaTest:.1}));
  scr.position.set(0,.52,0);g.add(scr);box(.3,.29,.015,std(0x3a4044,.5),0,.52,-.012,g);const gl=glow(0x99ccff,.7,.35);gl.position.y=.52;g.add(gl);return g}
function buildLantern(){const g=new TH.Group(),fr=std(0x2e2822,.6,{metalness:.4});box(.14,.02,.14,fr,0,.02,0,g);box(.16,.02,.16,fr,0,.32,0,g);
  for(const[x,z]of[[-.06,-.06],[.06,-.06],[-.06,.06],[.06,.06]])box(.012,.3,.012,fr,x,.17,z,g);
  const glass=new TH.Mesh(new TH.BoxGeometry(.11,.26,.11),std(0x8a9098,.2,{transparent:true,opacity:.45,emissive:0xff9030,emissiveIntensity:0}));glass.position.y=.17;g.add(glass);
  const fl=new TH.Mesh(new TH.SphereGeometry(.025,8,6),emis(0xffd080,0));fl.position.y=.15;fl.scale.y=1.6;g.add(fl);
  const ring=new TH.Mesh(new TH.TorusGeometry(.04,.006,6,12,Math.PI),fr);ring.position.y=.36;g.add(ring);const gl=glow(0xffaa50,1.2,0);gl.position.y=.17;g.add(gl);
  g.userData={glass,fl,gl};return g}
function heartGeo(){const s=new TH.Shape();s.moveTo(0,-.09);s.bezierCurveTo(-.11,-.02,-.1,.08,-.05,.08);s.bezierCurveTo(-.02,.08,0,.06,0,.04);s.bezierCurveTo(0,.06,.02,.08,.05,.08);s.bezierCurveTo(.1,.08,.11,-.02,0,-.09);
  const g=new TH.ExtrudeGeometry(s,{depth:.05,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:3});g.center();return g}
function buildHeart(){const g=new TH.Group();const h=new TH.Mesh(heartGeo(),std(0x8a0a12,.3,{emissive:0x500008,emissiveIntensity:1.2}));h.position.y=.32;h.castShadow=true;g.add(h);
  const v=cyl(.01,.012,.07,std(0x5a0810,.5),-.02,.42,0,g);v.rotation.z=.3;const gl=glow(0xff2020,.6,.5);gl.position.y=.32;g.add(gl);g.userData.h=h;return g}
function buildPhoto(){const g=new TH.Group(),wood=std(0x3a2414,.7);
  for(const sx of[-.06,.06]){const l=cyl(.008,.008,.42,wood,sx,.2,.04,g);l.rotation.x=-.15}const bl=cyl(.008,.008,.4,wood,0,.19,-.08,g);bl.rotation.x=.35;
  box(.24,.3,.02,std(0x6a4a24,.5),0,.42,0,g);const ph=new TH.Mesh(new TH.PlaneGeometry(.2,.26),new TH.MeshStandardMaterial({map:ctex(mk(40,52,c=>c.drawImage(SPR.photo,6,13,20,26,0,0,40,52)),4,false),emissive:0xffffff,emissiveMap:ctex(mk(40,52,c=>c.drawImage(SPR.photo,6,13,20,26,0,0,40,52)),4,false),emissiveIntensity:.35}));
  ph.position.set(0,.42,.012);g.add(ph);g.rotation.x=0;const gl=glow(0xfff0d0,.6,.35);gl.position.y=.42;g.add(gl);return g}
function buildNote(){const g=new TH.Group();const p=new TH.Mesh(new TH.PlaneGeometry(.18,.13),new TH.MeshStandardMaterial({map:ctex(mk(36,26,c=>{c.fillStyle='#d8ccb2';c.fillRect(0,0,36,26);c.strokeStyle='#5a4030';c.lineWidth=.7;for(let i=0;i<5;i++){c.beginPath();c.moveTo(3,4+i*4);c.lineTo(30-(i%2)*8,4+i*4);c.stroke()}c.fillStyle='rgba(120,0,0,.6)';c.beginPath();c.arc(28,18,2.5,0,7);c.fill()}),4,false),emissive:0x40382a,roughness:.9}));
  p.rotation.x=-Math.PI/2;p.rotation.z=.4;p.position.y=.005;p.receiveShadow=true;g.add(p);const gl=glow(0xfff0c8,.35,.4);gl.position.y=.04;g.add(gl);return g}
const PORTAL_SH={uniforms:{t:{value:0},open:{value:0}},transparent:true,depthWrite:false,side:TH.DoubleSide,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float t,open;varying vec2 vUv;void main(){vec2 p=vUv-.5;p.y*=.62;float r=length(p)*2.;float a=atan(p.y,p.x);float s=sin(a*4.+r*14.-t*3.)*.5+.5;vec3 c=mix(vec3(.02,0.,.05),vec3(.7,.3,1.),s*smoothstep(1.,.1,r));c+=vec3(.9,.6,1.)*pow(max(0.,1.-r),6.)*.6;float al=smoothstep(1.,.85,r)*(.25+open*.75);gl_FragColor=vec4(c*(.3+open*.9),al);}'};
function buildPortal(){const g=new TH.Group();const ringM=std(0x2a1a3a,.6,{emissive:0x3a1060,emissiveIntensity:.3});
  const ring=new TH.Mesh(new TH.TorusGeometry(.42,.05,8,32),ringM);ring.scale.y=1.55;ring.position.y=.68;ring.castShadow=true;g.add(ring);
  const disc=new TH.Mesh(new TH.PlaneGeometry(.84,1.3),new TH.ShaderMaterial(PORTAL_SH));disc.position.y=.68;g.add(disc);
  const dots=[];for(let k=0;k<12;k++){const a=k/12*Math.PI*2;const d=sph(.018,emis(0xe0a0ff,1),Math.cos(a)*.42,.68+Math.sin(a)*.65,.04,g);dots.push(d)}
  g.userData={disc,ring,ringM};return g}

// ---------- Level-Geometrie ----------
let LV3=null;
function disposeGroup(o){o.traverse(n=>{if(n.geometry)n.geometry.dispose()});scene.remove(o)}
function wallMat(ti){const tex=ctex(TEX[ti]);return std(0xffffff,.92,{map:tex,bumpMap:tex,bumpScale:.6})}
function buildLevel(){
  if(LV3)disposeGroup(LV3.root);
  const root=new TH.Group();scene.add(root);const lights=[];
  // Wände: nur Seiten, die an begehbare Felder grenzen. Pro Textur eine Geometrie.
  const G={};const quad=(key,ax,ay,bx,by,nx,ny,h0,h1)=>{const q=G[key]||(G[key]={p:[],n:[],u:[],i:[]});const o=q.p.length/3;
    q.p.push(ax,h0,ay, bx,h0,by, bx,h1,by, ax,h1,ay);for(let k=0;k<4;k++)q.n.push(nx,0,ny);q.u.push(0,0,1,0,1,1,0,1);q.i.push(o,o+1,o+2,o,o+2,o+3)};
  const fl=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&grid[y*MW+x]!==1;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(grid[y*MW+x]!==1)continue;const ti='w'+texIdx[y*MW+x];
    if(fl(x,y+1))quad(ti,x,y+1,x+1,y+1,0,1,0,WH);if(fl(x,y-1))quad(ti,x+1,y,x,y,0,-1,0,WH);
    if(fl(x+1,y))quad(ti,x+1,y+1,x+1,y,1,0,0,WH);if(fl(x-1,y))quad(ti,x,y,x,y+1,-1,0,0,WH)}
  // Böden und Decken pro Zone
  const F={};const fq=(key,x,y,h,down)=>{const q=F[key]||(F[key]={p:[],n:[],u:[],i:[]});const o=q.p.length/3;
    if(down)q.p.push(x,h,y, x+1,h,y, x+1,h,y+1, x,h,y+1);else q.p.push(x,h,y+1, x+1,h,y+1, x+1,h,y, x,h,y);for(let k=0;k<4;k++)q.n.push(0,down?-1:1,0);
    if(down)q.u.push(x,y,x+1,y,x+1,y+1,x,y+1);else q.u.push(x,y+1,x+1,y+1,x+1,y,x,y);q.i.push(o,o+1,o+2,o,o+2,o+3)};
  const indoor=[];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(grid[y*MW+x]===1)continue;const z=zoneAt(x,y);fq('f'+z,x,y,0,false);if(!OUTDOOR(z)){fq('c'+z,x,y,WH,true);indoor.push([x,y,z])}}
  const mkGeo=q=>{const g=new TH.BufferGeometry();g.setAttribute('position',new TH.Float32BufferAttribute(q.p,3));g.setAttribute('normal',new TH.Float32BufferAttribute(q.n,3));g.setAttribute('uv',new TH.Float32BufferAttribute(q.u,2));g.setIndex(q.i);return g};
  for(const k in G){const m=new TH.Mesh(mkGeo(G[k]),wallMat(+k.slice(1)));m.castShadow=m.receiveShadow=true;root.add(m)}
  for(const k in F){const z=+k.slice(1),floor=k[0]==='f';const cv_=floor?FLOOR[z]:(CEIL[z]||CEIL[0]);const tex=ctex(cv_);
    const m=new TH.Mesh(mkGeo(F[k]),std(0xffffff,floor?.88:.95,{map:tex,bumpMap:tex,bumpScale:.4}));m.receiveShadow=true;m.castShadow=!floor;root.add(m)}
  // Deckenlampen: Neon im Krankenhaus, Glühbirnen im Haus, rote im Keller, Kerzen auf dem Dachboden
  const rr=rng(seed+99);
  for(const[x,y,z]of indoor){const h=((x*73856093)^(y*19349663))>>>0;
    if((z===3||z===4)&&x%4===1&&y%3===1){const p=box(.5,.02,.12,emis(0xd8f0ff,2.2),x+.5,WH-.012,y+.5,root);p.castShadow=false;lights.push({x:x+.5,y:WH-.15,z:y+.5,c:0xbfe6ff,i:1.6,neon:true,m:p})}
    else if(z===0&&h%29===0){cyl(.003,.003,.25,darkM,x+.5,WH-.125,y+.5,root);const b=sph(.03,emis(0xffc070,2.5),x+.5,WH-.26,y+.5,root);b.castShadow=false;lights.push({x:x+.5,y:WH-.3,z:y+.5,c:0xffb060,i:1.1,fl:true,m:b})}
    else if(z===1&&h%37===0){const b=sph(.03,emis(0xff3020,2),x+.5,WH-.2,y+.5,root);b.castShadow=false;lights.push({x:x+.5,y:WH-.25,z:y+.5,c:0xff2010,i:.9,fl:true,m:b})}
    else if((z===8||z===6)&&h%41===0&&rr()<.8){cyl(.015,.015,.06,std(0xe8e0c8,.6),x+.5,.03,y+.5,root);const f=glow(0xffb050,.18,.9);f.position.set(x+.5,.08,y+.5);root.add(f);lights.push({x:x+.5,y:.25,z:y+.5,c:0xff9a40,i:.7,fl:true})}}
  // Bäume / Kisten (instanziert)
  if(TREES.length){const dm=new TH.Object3D();
    if(LVL===5){const crateTex=ctex(mk(32,32,c=>{c.fillStyle='#2a1c10';c.fillRect(0,0,32,32);const g=c.createLinearGradient(0,0,32,0);g.addColorStop(0,'#4a3218');g.addColorStop(.5,'#6a4c2a');g.addColorStop(1,'#46301a');c.fillStyle=g;c.fillRect(2,2,28,28);c.fillStyle='#2a1c10';c.fillRect(2,11,28,1);c.fillRect(2,20,28,1);c.save();c.beginPath();c.rect(2,2,28,28);c.clip();c.strokeStyle='#2a1c10';c.lineWidth=2.5;c.beginPath();c.moveTo(2,2);c.lineTo(30,30);c.stroke();c.restore()}));
      const im=new TH.InstancedMesh(new TH.BoxGeometry(1,1,1),std(0xffffff,.85,{map:crateTex,bumpMap:crateTex,bumpScale:.5}),TREES.length);im.castShadow=im.receiveShadow=true;
      TREES.forEach((t,i)=>{const s=t.v===2?.62:.5,h=t.v===2?.85:.48;dm.position.set(t.x,h/2,t.y);dm.rotation.set(0,(t.x*7+t.y*3)%1.2-.6,0);dm.scale.set(s,h,s);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});root.add(im)}
    else{const trunk=new TH.InstancedMesh(new TH.CylinderGeometry(.05,.11,1,6),std(0x1d140d,.95),TREES.length),fol=new TH.InstancedMesh(new TH.IcosahedronGeometry(1,0),std(0x0e1c0c,.95,{flatShading:true}),TREES.length*3);
      trunk.castShadow=fol.castShadow=true;trunk.receiveShadow=fol.receiveShadow=true;
      TREES.forEach((t,i)=>{const h=2.2+((t.x*13+t.y*7)%7)*.15;dm.position.set(t.x,h/2,t.y);dm.rotation.set(0,0,0);dm.scale.set(1,h,1);dm.updateMatrix();trunk.setMatrixAt(i,dm.matrix);
        for(let k=0;k<3;k++){const s=.35+((t.x*31+t.y*17+k*5)%5)*.06;dm.position.set(t.x+Math.sin(k*2.1+t.x)*.15,h*.62+k*.35,t.y+Math.cos(k*2.1+t.y)*.15);dm.scale.set(s,s*1.2,s);dm.rotation.set(k,t.x,0);dm.updateMatrix();fol.setMatrixAt(i*3+k,dm.matrix)}});
      root.add(trunk,fol)}}
  // Sterne + Mond für draußen
  const sg=new TH.BufferGeometry(),sp=[];for(let i=0;i<700;i++){const a=Math.random()*Math.PI*2,e=Math.random()*1.3+.1,r=50;sp.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)}
  sg.setAttribute('position',new TH.Float32BufferAttribute(sp,3));const stars=new TH.Points(sg,new TH.PointsMaterial({color:0xdde0ff,size:.12,fog:false,transparent:true,opacity:.8}));root.add(stars);
  const moonS=glow(0xe6e8f0,6,.9);moonS.material.blending=TH.NormalBlending;moonS.material.map=new TH.CanvasTexture(mk(64,64,c=>{const g=c.createRadialGradient(32,32,8,32,32,32);g.addColorStop(0,'rgba(240,242,255,1)');g.addColorStop(.32,'rgba(230,232,245,1)');g.addColorStop(.36,'rgba(200,210,255,.3)');g.addColorStop(1,'rgba(200,210,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64)}));root.add(moonS);
  LV3={root,lights,stars,moonS,grid,lang:LANG,objs:null,ents:new Map()};
}

// ---------- Objekte / Figuren je Bild aktualisieren ----------
function objMesh(o){
  switch(o.type){
    case'locker':{const g=buildLocker();g.position.set(o.x,0,o.y);facing(g,o.face);return g}
    case'deco':{const g=o.img==='bed'?buildBed():buildWheel();g.position.set(o.x,0,o.y);g.rotation.y=(o.x*3.7+o.y)%6.28;return g}
    case'battery':return buildBattery();
    case'film':return buildFilm();
    case'note':return buildNote();
    case'portal':return buildPortal();
    case'eye':return LVL===2?buildXray():LVL===3?buildLantern():LVL===4?buildHeart():LVL===5?buildPhoto():buildMusicBox();
  }return null}
function ent(key,make){let e=LV3.ents.get(key);if(!e){const m=make();if(!m)return null;e={m,px:null,py:null};LV3.root.add(m);LV3.ents.set(key,e)}e.seen=true;return e}
function place(e,x,y,a){const mv=e.px===null?0:Math.hypot(x-e.px,y-e.py);e.px=x;e.py=y;e.m.position.x=x;e.m.position.z=y;if(a!==undefined)facing(e.m,a);e.m.visible=true;return Math.min(mv,.2)}
let lastT3=0;
function sync(dt){
  for(const e of LV3.ents.values())e.seen=false;
  // Gegenstände
  for(const o of objs){
    if(o.type==='note'&&o.read)continue;
    if(o.gone&&!(o.type==='eye'&&LVL===3))continue;
    const e=ent('o'+o.i,()=>objMesh(o));if(!e)continue;
    e.m.visible=o!==P.hidden&&(o.type==='portal'||Math.hypot(o.x-P.x,o.y-P.y)<16);
    if(o.type==='locker'||o.type==='deco')continue;
    e.m.position.set(o.x,0,o.y);
    const bob=Math.sin(T*2.2+o.i)*.02;
    if(o.type==='battery'||o.type==='film'){e.m.position.y=.04+bob;e.m.rotation.y=T*1.4+o.i}
    else if(o.type==='portal'){facing(e.m,Math.atan2(P.y-o.y,P.x-o.x));const u=e.m.userData;u.disc.material.uniforms.t.value=T;u.disc.material.uniforms.open.value+=((finale?1:0)-u.disc.material.uniforms.open.value)*Math.min(1,dt*2);u.ringM.emissiveIntensity=finale?1.2+Math.sin(T*4)*.4:.25}
    else if(o.type==='eye'){
      if(LVL===3){const u=e.m.userData,on=o.gone;u.glass.material.emissiveIntensity=on?2.2+Math.sin(T*9)*.3:0;u.fl.material.emissiveIntensity=on?4:0;u.gl.material.opacity=on?.55:0}
      else if(LVL===4){const u=e.m.userData,b=1+Math.max(0,Math.sin(T*6))*.12;u.h.scale.setScalar(b);u.h.rotation.y=T*.8;e.m.position.y=bob}
      else if(LVL===1){e.m.userData.spin.rotation.y=T*2;facing(e.m,Math.atan2(P.y-o.y,P.x-o.x))}
      else facing(e.m,Math.atan2(P.y-o.y,P.x-o.x))}}
  // Monster
  if(M.active){const e=ent('M',buildMonster);const mv=place(e,M.x,M.y,M.a);animMonster(e.m,M,mv,dt)}
  DOLLS.forEach((d,i)=>{if(d.dead)return;const e=ent('d'+i,buildDoll);place(e,d.x,d.y,Math.atan2(P.y-d.y,P.x-d.x));animDoll(e.m,d)});
  BL.forEach((b,i)=>{const e=ent('b'+i,buildBlind);const mv=place(e,b.x,b.y,b.a);animBlind(e.m,b,mv)});
  SHD.forEach((z,i)=>{const e=ent('s'+i,buildShadow);place(e,z.x,z.y,Math.atan2(P.y-z.y,P.x-z.x));animShadow(e.m,z)});
  KR.forEach((k,i)=>{const e=ent('k'+i,buildCrawler);const mv=place(e,k.x,k.y,k.a);animCrawler(e.m,k,mv)});
  for(const id in RP){const r=RP[id];if(!r.al||r.lk>=0||(P.spec&&dist(r,P)<.3))continue;const e=ent('p'+id+'_'+r.c,()=>buildPlayer(PCOL[r.c%PCOL.length]));place(e,r.x,r.y,r.a);e.m.scale.y=r.cr?.75:1}
  // nicht mehr gebrauchte Figuren ausblenden / entfernen
  for(const[k,e]of LV3.ents)if(!e.seen){if(k[0]==='o'||k[0]==='p'){LV3.root.remove(e.m);LV3.ents.delete(k)}else e.m.visible=false}
}

// Lichtquellen: die 6 nächsten bekommen ein echtes Licht
function lightPool(){
  const src=LV3.lights.slice();
  if(LVL===3)for(const o of objs)if(o.type==='eye'&&o.gone)src.push({x:o.x,y:.3,z:o.y,c:0xff9a40,i:2.2,fl:true,far:true});
  if(finale)src.push({x:PORTAL.x,y:.7,z:PORTAL.y,c:0xb050ff,i:2.5,far:true});else src.push({x:PORTAL.x,y:.7,z:PORTAL.y,c:0x6a40a0,i:.35});
  for(const s of src)s.d=Math.hypot(s.x-P.x,s.z-P.y)-(s.far?3:0);
  src.sort((a,b)=>a.d-b.d);
  POOL.forEach((l,i)=>{const s=src[i];if(!s||s.d>14){l.intensity=0;return}l.position.set(s.x,s.y,s.z);l.color.setHex(s.c);let k=s.i;
    if(s.neon)k*=neon;if(s.fl&&Math.random()<.03)k*=.3;if(s.m&&s.neon&&s.m.material)s.m.material.emissiveIntensity=2.2*neon;l.intensity=k*3;l.distance=s.far?10:7})}

// Sichtbarkeit für die Spiellogik (Puppen erstarren, wenn man sie sieht; Glitch, wenn Er im Bild ist)
const v3=new TH.Vector3();
function onScreen(x,h,y){v3.set(x,h,y).project(cam);return v3.z<1&&Math.abs(v3.x)<1.05&&Math.abs(v3.y)<1.1?v3:null}
function visibility(){
  for(const d of DOLLS){if(d.dead)continue;const p=onScreen(d.x,.5,d.y);if(p&&los(P,d)){const dd=dist(P,d);if(light(dd,(p.x+1)/2)>.1)d.seen=T}}
  M.onScreen=false;if(M.active){const p=onScreen(M.x,.8,M.y);if(p&&los(P,M))M.onScreen=true}}

// ---------- 2D-Effekte über dem 3D-Bild (Vignette, rote Ränder, Spind, Körnung, Blitz, Namen) ----------
function overlay(){
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);g.globalAlpha=1;g.globalCompositeOperation='source-over';const mid=H/2;
  let gr=g.createRadialGradient(W/2,mid,H*.15,W/2,mid,Math.max(W,H)*.75);
  if(P.hidden){gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)')}else{gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.55,'rgba(0,0,0,.25)');gr.addColorStop(1,'rgba(0,0,0,.85)')}
  g.fillStyle=gr;g.fillRect(0,0,W,H);
  for(const d of[...DOLLS,...BL,...SHD,...KR]){if(P.hidden||(d.state?d.state!=='hunt'&&d.state!=='stalk':!d.active||d.dead))continue;const dd=dist(d,P);if(dd>6.5)continue;
    const rel=Math.atan2(Math.sin(Math.atan2(d.y-P.y,d.x-P.x)-P.a),Math.cos(Math.atan2(d.y-P.y,d.x-P.x)-P.a));if(Math.abs(rel)<.55&&(d.state||T-d.seen<.3))continue;
    const k=(1-dd/6.5)*(.55+Math.sin(T*9)*.15),beh=Math.abs(rel)>2.2,w=W*.22;let gw;
    if(beh){gw=g.createLinearGradient(0,H,0,H-H*.35);gw.addColorStop(0,`rgba(200,10,10,${k})`);gw.addColorStop(1,'rgba(200,10,10,0)');g.fillStyle=gw;g.fillRect(0,H*.65,W,H*.35)}
    else if(rel>0){gw=g.createLinearGradient(W,0,W-w,0);gw.addColorStop(0,`rgba(200,10,10,${k})`);gw.addColorStop(1,'rgba(200,10,10,0)');g.fillStyle=gw;g.fillRect(W-w,0,w,H)}
    else{gw=g.createLinearGradient(0,0,w,0);gw.addColorStop(0,`rgba(200,10,10,${k})`);gw.addColorStop(1,'rgba(200,10,10,0)');g.fillStyle=gw;g.fillRect(0,0,w,H)}}
  if(finale){g.fillStyle=`rgba(90,0,120,${.08+Math.sin(T*3)*.04})`;g.fillRect(0,0,W,H)}
  if(P.hidden){g.fillStyle='rgba(7,9,8,.96)';const st=H*.1;let y=0;for(let k=0;k<7;k++){const sy=H*.17+k*st;g.fillRect(0,y,W,sy-y);g.fillStyle='rgba(60,70,65,.5)';g.fillRect(0,sy-2*S,W,2*S);g.fillStyle='rgba(7,9,8,.96)';y=sy+st*.68}g.fillRect(0,y,W,H-y);g.fillRect(0,0,W*.05,H);g.fillRect(W*.95,0,W*.05,H)}
  g.globalAlpha=.1;g.drawImage(grain[(T*24|0)%4],0,0);g.globalAlpha=1;
  if(flashT>0){g.fillStyle=`rgba(255,255,255,${Math.min(1,flashT/.12)})`;g.fillRect(0,0,W,H)}
  X.setTransform(1,0,0,1,0,0);X.clearRect(0,0,cv.width,cv.height);X.imageSmoothingEnabled=true;X.drawImage(low,0,0,cv.width,cv.height);
  // Namen über Mitspielern
  const dp=cv.width/innerWidth;X.textAlign='center';X.textBaseline='bottom';
  for(const id in RP){const r=RP[id];if(!r.al||r.lk>=0)continue;const p=onScreen(r.x,1.0,r.y);if(!p||!los(P,r))continue;const d=dist(P,r),px=(p.x+1)/2*cv.width,py=(1-p.y)/2*cv.height;
    const fs=Math.round(clamp(15-d*.6,10,15)*dp);X.font=`500 ${fs}px "IBM Plex Mono",monospace`;const n=r.n||'',tw=X.measureText(n).width;X.globalAlpha=clamp(1.4-d/14,.35,1);
    X.fillStyle='rgba(0,0,0,.55)';X.fillRect(px-tw/2-6*dp,py-fs-4*dp,tw+12*dp,fs+6*dp);X.fillStyle=PCOL[r.c%PCOL.length];X.fillRect(px-tw/2-6*dp,py,tw+12*dp,2*dp);X.fillStyle='#fff';X.fillText(n,px,py);X.globalAlpha=1}}

// ---------- Hauptfunktion: ersetzt render() ----------
const fogC=new TH.Color(),tmpC=new TH.Color();let curZ=-1;
window.render=function(){
  if(!LV3||LV3.grid!==grid||LV3.lang!==LANG)buildLevel();
  const now=performance.now()/1000,dt=Math.min(.1,lastT3?now-lastT3:.016);lastT3=now;
  pz=zoneAt(Math.floor(P.x),Math.floor(P.y));
  // Kamera
  const bob=P.hidden?0:Math.sin(P.bob)*.018*P.moving*(CFG.bob?1:0),sh=shakeT>0?shakeT*.05:0;
  const ey=(P.eye||.5)*EYE+bob+(Math.random()-.5)*sh;
  cam.position.set(P.x+(Math.random()-.5)*sh,ey,P.y+(Math.random()-.5)*sh);
  const pitch=Math.atan(P.pitch*1.25);
  cam.lookAt(P.x+Math.cos(P.a),ey+Math.tan(pitch),P.y+Math.sin(P.a));
  // Stimmung der Zone weich überblenden
  const md=MOOD[pz]||MOOD[0];if(curZ<0){fogC.setHex(md[0]);curZ=pz}
  tmpC.setHex(finale?0x14041c:md[0]);fogC.lerp(tmpC,Math.min(1,dt*1.5));scene.fog.color.copy(fogC);
  scene.fog.density+=((P.hidden?.05:md[1])-scene.fog.density)*Math.min(1,dt*1.5);
  scene.background.copy(OUTDOOR(pz)?fogC.clone().multiplyScalar(.6):fogC);
  hemi.color.setHex(md[2]);hemi.groundColor.setHex(md[3]);hemi.intensity+=(md[4]*2.2*(pz===3?neon:1)-hemi.intensity)*Math.min(1,dt*2);
  moon.intensity=md[5]*1.6;LV3.stars.visible=OUTDOOR(pz);LV3.moonS.visible=pz===2||pz===5;LV3.moonS.position.set(P.x-30,22,P.y-25);LV3.stars.position.set(P.x,0,P.y);
  // Taschenlampe + Blitz
  torch.intensity=lightOn()?9*flick:0;flashL.intensity=flashT>0?flashT*60:0;
  R3.toneMappingExposure=1.35*(CFG.bri||1);
  sync(dt);lightPool();visibility();
  glc.style.transform=M.active&&M.onScreen&&dist(M,P)<6&&Math.random()<.3?`translate(${(Math.random()-.5)*10}px,${(Math.random()-.5)*4}px)`:'';
  R3.render(scene,cam);
  overlay();
};
})();
