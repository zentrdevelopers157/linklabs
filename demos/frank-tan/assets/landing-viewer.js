(async () => {
  const stage = document.getElementById('material-stage');
  const canvas = document.getElementById('material-canvas');
  if (!stage || !canvas) return;
  const loading = document.getElementById('material-loading');
  const fallback = document.getElementById('material-fallback');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...document.querySelectorAll('[data-shape], [data-finish]')];
  let rendered = false;
  const timeout = setTimeout(() => { if (!rendered) fallback.classList.add('show'); }, 8000);
  try {
    const THREE = await import('three');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .025);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 1500);
    camera.position.set(0, 12, 390); camera.lookAt(0, 0, 0);
    const light = new THREE.DirectionalLight(0xffedcf, 3.2);
    light.position.set(-90,150,180); scene.add(light);
    const rim = new THREE.DirectionalLight(0xd1e4dc, 2);
    rim.position.set(160,-30,-110); scene.add(rim);
    const materials = {
      silver:new THREE.MeshPhysicalMaterial({color:0xc5cec9,metalness:1,roughness:.25,clearcoat:.4,envMapIntensity:1.6}),
      champagne:new THREE.MeshPhysicalMaterial({color:0xc5a16b,metalness:1,roughness:.27,clearcoat:.4,envMapIntensity:1.5}),
      graphite:new THREE.MeshPhysicalMaterial({color:0x454e48,metalness:.94,roughness:.3,clearcoat:.3,envMapIntensity:1.6})
    };
    const polymer = new THREE.MeshStandardMaterial({color:0x131b17,roughness:.8});
    const rig = new THREE.Group(); scene.add(rig);
    const extrusion = {depth:190,bevelEnabled:true,bevelSize:.5,bevelThickness:.5,bevelSegments:2,curveSegments:24};
    const rect = (x,y,w,h) => {
      const s = new THREE.Shape();
      s.moveTo(x,y);s.lineTo(x+w,y);s.lineTo(x+w,y+h);s.lineTo(x,y+h);s.closePath();
      return s;
    };
    const hole = (s,x,y,w,h) => {
      const p = new THREE.Path();
      p.moveTo(x,y);p.lineTo(x,y+h);p.lineTo(x+w,y+h);p.lineTo(x+w,y);p.closePath();s.holes.push(p);
    };
    function geometry(key) {
      if (key === 'tube') {
        const s = new THREE.Shape();s.absarc(0,0,32,0,Math.PI*2,false);
        const p = new THREE.Path();p.absarc(0,0,27,0,Math.PI*2,true);s.holes.push(p);
        return [{geometry:new THREE.ExtrudeGeometry(s,extrusion)}];
      }
      if (key === 'thermal') {
        const left = rect(-46,-28,36,56);hole(left,-41,-23,26,46);
        const right = rect(10,-28,36,56);hole(right,15,-23,26,46);
        return [
          {geometry:new THREE.ExtrudeGeometry(left,extrusion)},
          {geometry:new THREE.ExtrudeGeometry(right,extrusion)},
          {geometry:new THREE.BoxGeometry(24,7,190),position:[0,15,95],fixed:true},
          {geometry:new THREE.BoxGeometry(24,7,190),position:[0,-15,95],fixed:true}
        ];
      }
      const s = new THREE.Shape();
      s.moveTo(-56,-30);s.lineTo(56,-30);s.lineTo(56,30);s.lineTo(21,30);
      s.lineTo(21,18);s.lineTo(-18,18);s.lineTo(-18,30);s.lineTo(-56,30);s.closePath();
      hole(s,-51,-25,46,38);hole(s,0,-25,51,38);hole(s,-50,20,27,5);hole(s,26,20,24,5);
      return [{geometry:new THREE.ExtrudeGeometry(s,extrusion)}];
    }
    const cache = new Map();
    let shape='frame', finish='silver', current=null, swap=null;
    function mount(key) {
      if (current) rig.remove(current);
      if (!cache.has(key)) {
        const group = new THREE.Group();
        geometry(key).forEach(part => {
          const mesh = new THREE.Mesh(part.geometry,part.fixed ? polymer : materials[finish]);
          mesh.userData.fixed=!!part.fixed;
          if(part.position)mesh.position.set(...part.position);
          group.add(mesh);
        });
        group.position.sub(new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3()));
        cache.set(key,group);
      }
      current=cache.get(key);
      current.traverse(o=>{if(o.isMesh&&!o.userData.fixed)o.material=materials[finish];});
      rig.add(current);
    }
    mount(shape);
    const labels={frame:'FT–80 / SLIDING FRAME',thermal:'THERMAL BREAK / POLYAMIDE',tube:'TB–30 / ROUND TUBE'};
    document.querySelectorAll('[data-shape]').forEach(b=>b.addEventListener('click',()=>{
      if(!geometry || shape===b.dataset.shape || swap)return;
      shape=b.dataset.shape;
      document.querySelectorAll('[data-shape]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on);});
      document.getElementById('object-series').textContent=labels[shape];
      if(motion.matches){mount(shape);rig.scale.setScalar(1);}else swap={phase:0,t:0};
      lastInteraction=performance.now();
    }));
    document.querySelectorAll('[data-finish]').forEach(b=>b.addEventListener('click',()=>{
      finish=b.dataset.finish;
      current.traverse(o=>{if(o.isMesh&&!o.userData.fixed)o.material=materials[finish];});
      document.querySelectorAll('[data-finish]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on);});
      document.getElementById('material-finish').textContent=finish.toUpperCase();
    }));
    let rx=.62, ry=-.6, drag=false, px=0, py=0, lastInteraction=performance.now();
    rig.rotation.set(rx,ry,-.34);
    canvas.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);lastInteraction=performance.now();});
    canvas.addEventListener('pointermove',e=>{
      if(!drag)return;
      ry+=(e.clientX-px)*.009;rx=THREE.MathUtils.clamp(rx+(e.clientY-py)*.006,-1.1,1.1);
      px=e.clientX;py=e.clientY;lastInteraction=performance.now();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>{drag=false;}));
    let visible=true, scrollProgress=0, previous=performance.now();
    const observer=new IntersectionObserver(es=>visible=es[0].isIntersecting);
    observer.observe(stage);
    const resize=new ResizeObserver(()=>{
      const w=stage.clientWidth,h=stage.clientHeight;
      if(!w||!h)return;
      renderer.setSize(w,h,false);camera.aspect=w/h;
      camera.position.z=w/h<1 ? 425:390;camera.updateProjectionMatrix();
    });
    resize.observe(stage);
    const hero=document.querySelector('.lp-hero');
    addEventListener('scroll',()=>{scrollProgress=Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.offsetHeight));},{passive:true});
    function animate(now){
      requestAnimationFrame(animate);
      const dt=Math.min((now-previous)/1000,.04);previous=now;
      if(!visible||document.hidden)return;
      if(!motion.matches&&!drag&&now-lastInteraction>2500)ry+=dt*.09;
      const speed=motion.matches?1:Math.min(1,dt*8);
      rig.rotation.x+=(rx-rig.rotation.x)*speed;
      rig.rotation.y+=(ry+(motion.matches?0:scrollProgress*.7)-rig.rotation.y)*speed;
      rig.position.y=motion.matches?0:Math.sin(now*.0006)*3-scrollProgress*8;
      if(swap){
        swap.t=Math.min(1,swap.t+dt*3.4);
        const k=swap.t;
        rig.scale.setScalar(swap.phase===0?Math.max(.01,1-k*k):.01+.99*(1-Math.pow(1-k,3)));
        if(k===1){if(swap.phase===0){mount(shape);swap={phase:1,t:0};}else{swap=null;rig.scale.setScalar(1);}}
      }
      renderer.render(scene,camera);
      if(!rendered){rendered=true;clearTimeout(timeout);loading.classList.add('done');fallback.classList.remove('show');canvas.dataset.ready='true';}
    }
    requestAnimationFrame(animate);
  }catch(error){
    clearTimeout(timeout);loading.classList.add('done');fallback.classList.add('show');canvas.hidden=true;
    buttons.forEach(b=>b.disabled=true);
    document.querySelector('.object-hint').textContent='PROFILE STUDY';
    console.warn('Interactive viewer unavailable; illustration shown.',error);
  }
})();
