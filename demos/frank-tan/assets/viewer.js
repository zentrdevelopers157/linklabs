(async () => {
  const stage   = document.getElementById('stage');
  const canvas  = document.getElementById('gl');
  const loading = document.getElementById('stage-loading');
  try {
    const THREE = await import('three');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
    const { FontLoader }      = await import('three/addons/loaders/FontLoader.js');
    const { TextGeometry }    = await import('three/addons/geometries/TextGeometry.js');

    const coarse = matchMedia('(pointer:coarse)').matches;
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    pmrem.dispose();

    const cam = new THREE.PerspectiveCamera(34, 1, 1, 1500);
    cam.position.set(0, 62, 330); cam.lookAt(0, 0, 0);

    const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(140, 200, 160); scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd0dd, .55); rim.position.set(-160, -80, -140); scene.add(rim);

    const rig = new THREE.Group(); scene.add(rig);

    const FIN = {
      silver:    new THREE.MeshPhysicalMaterial({ color: 0xd9dcdf, metalness: 1,   roughness: .32, clearcoat: .45, clearcoatRoughness: .35, envMapIntensity: 1.15 }),
      champagne: new THREE.MeshPhysicalMaterial({ color: 0xcfa86f, metalness: 1,   roughness: .27, clearcoat: .5,  clearcoatRoughness: .3,  envMapIntensity: 1.2  }),
      graphite:  new THREE.MeshPhysicalMaterial({ color: 0x43474b, metalness: .92, roughness: .4,  clearcoat: .4,  clearcoatRoughness: .4,  envMapIntensity: 1    })
    };
    const polyMat = new THREE.MeshStandardMaterial({ color: 0x121316, metalness: .05, roughness: .85 });
    let curMat = FIN.silver;

    const EXT = { depth: 90, bevelEnabled: true, bevelThickness: .9, bevelSize: .9, bevelSegments: 2, curveSegments: 8 };
    const hole = (s, x0, y0, x1, y1) => { const p = new THREE.Path(); p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.closePath(); s.holes.push(p); };

    function buildFrame() {
      const s = new THREE.Shape();
      s.moveTo(-55, -32); s.lineTo(55, -32); s.lineTo(55, 32); s.lineTo(15, 32);
      s.lineTo(15, 20); s.lineTo(-15, 20); s.lineTo(-15, 32); s.lineTo(-55, 32); s.closePath();
      hole(s, -50, -25, 50, 15); hole(s, -48, 22, -17, 27); hole(s, 17, 22, 48, 27);
      return [{ geo: new THREE.ExtrudeGeometry(s, EXT) }];
    }
    function buildThermal() {
      const mk = (a, b) => { const s = new THREE.Shape();
        s.moveTo(a, -32); s.lineTo(b, -32); s.lineTo(b, 32); s.lineTo(a, 32); s.closePath();
        hole(s, a + 5, -27, b - 5, 27); return new THREE.ExtrudeGeometry(s, EXT); };
      return [{ geo: mk(-38, -8) }, { geo: mk(8, 38) }, { geo: new THREE.BoxGeometry(20, 12, 88), mat: polyMat, fixed: true }];
    }
    function buildTube() {
      const s = new THREE.Shape(); s.absarc(0, 0, 30, 0, Math.PI * 2, false);
      const h = new THREE.Path(); h.absarc(0, 0, 24, 0, Math.PI * 2, true); s.holes.push(h);
      return [{ geo: new THREE.ExtrudeGeometry(s, EXT) }];
    }
    const BUILD = { frame: buildFrame, thermal: buildThermal, tube: buildTube };

    const cache = {}; let curKey = 'frame';
    function mount(k) {
      if (rig.children[0]) rig.remove(rig.children[0]);
      if (!cache[k]) {
        const g = new THREE.Group();
        BUILD[k]().forEach(p => { const m = new THREE.Mesh(p.geo, p.mat || curMat); if (p.fixed) m.userData.fixed = true; g.add(m); });
        g.position.sub(new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()));
        cache[k] = g;
      }
      cache[k].traverse(o => { if (o.isMesh && !o.userData.fixed) o.material = curMat; });
      rig.add(cache[k]);
    }
    mount('frame');

    const CALL = {
      frame:   ['W 110 · H 64 MM', '3 CHAMBERS · WALL 1.4'],
      thermal: ['BREAK 16 MM', 'POLYAMIDE PA STRIP'],
      tube:    ['Ø 60 MM', 'WALL 6.0 MM']
    };
    const calA = document.getElementById('cal-a'), calB = document.getElementById('cal-b');

    const RING = {
      frame:   'FT-80 - SLIDING WINDOW FRAME - 6063-T5 - ',
      thermal: 'THERMAL BREAK - POLYAMIDE STRIP - 16 MM - ',
      tube:    'TB-30 - SEAMLESS ROUND TUBE - WALL 6.0 - '
    };
    const RING_R = 88, CHAR_SIZE = 9;
    let ring = null, font = null, ringBorn = 0;
    let ringSpin = 0, ringVel = 0;
    const ringBase = RM ? 0 : 0.12;
    const ringMeshes = [];

    async function loadFont() {
      const urls = [
        'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json',
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'
      ];
      for (const u of urls) { try { return await new FontLoader().loadAsync(u); } catch (e) {} }
      return null;
    }

    function buildRing(text) {
      if (!font || !ring) return;
      while (ringMeshes.length) { const m = ringMeshes.pop(); ring.remove(m); m.geometry.dispose(); }
      const chars = [...text];
      const step = Math.PI * 2 / chars.length;
      chars.forEach((ch, i) => {
        if (ch === ' ') return;
        const geo = new TextGeometry(ch, { font, size: CHAR_SIZE, height: 2.2, curveSegments: 3, bevelEnabled: false });
        geo.center();
        const m = new THREE.Mesh(geo, curMat);
        const a = i * step;
        m.position.set(Math.sin(a) * RING_R, Math.cos(a) * RING_R, 0);
        m.rotation.z = -a;
        ring.add(m); ringMeshes.push(m);
      });
    }

    loadFont().then(f => {
      if (!f) return;
      font = f;
      ring = new THREE.Group();
      ring.rotation.x = -0.12;
      ring.scale.setScalar(0.001);
      ringBorn = performance.now();
      scene.add(ring);
      buildRing(RING[curKey]);
    });

    let swap = null;
    function setProfile(k) {
      if (k === curKey || swap) return;
      curKey = k; swap = { phase: 'out', t: 0 };
      document.querySelectorAll('.seg button').forEach(b => b.classList.toggle('on', b.dataset.g === k));
      const c = CALL[k]; if (c) { calA.textContent = c[0]; calB.textContent = c[1]; }
      if (ring) { buildRing(RING[k]); ringVel = Math.min(1.4, ringVel + 0.7); }
    }
    document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => setProfile(b.dataset.g)));

    function setFinish(f) {
      curMat = FIN[f] || curMat;
      const g = rig.children[0];
      if (g) g.traverse(o => { if (o.isMesh && !o.userData.fixed) o.material = curMat; });
      ringMeshes.forEach(m => m.material = curMat);
      document.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b.dataset.f === f));
      document.getElementById('fin-cur').textContent = f.toUpperCase();
    }
    document.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => setFinish(b.dataset.f)));

    let ry = -.6, rx = .3, vy = 0, dragging = false, lastX = 0, lastY = 0, lastAct = 0;
    canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; vy = 0; lastAct = performance.now(); try { canvas.setPointerCapture(e.pointerId); } catch {} });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      ry += dx * .0065; vy = dx * .0065;
      rx = Math.max(-.2, Math.min(.85, rx + dy * .005));
      if (ring) ringVel = Math.min(1.4, ringVel + Math.abs(dx) * .004);
      lastAct = performance.now();
    });
    const end = () => dragging = false;
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    let visible = true;
    new IntersectionObserver(en => visible = en[0].isIntersecting).observe(stage);

    function fit() {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    new ResizeObserver(fit).observe(stage); fit();

    const easeOutBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
    let first = true, prev = performance.now();

    (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible) { prev = now; return; }
      const dt = Math.min((now - prev) / 1000, .05); prev = now;

      if (!dragging) {
        ry += vy; vy *= .93;
        if (!RM && now - lastAct > 2600) ry += dt * .22;
      }
      rig.rotation.y += (ry - rig.rotation.y) * .12;
      rig.rotation.x += (rx - rig.rotation.x) * .12;
      rig.position.y = RM ? 0 : Math.sin(now * .0007) * 2.5;

      if (ring) {
        ringVel += (ringBase - ringVel) * Math.min(1, dt * 1.6);
        ringSpin -= ringVel * dt;
        ring.rotation.z = ringSpin;
        ring.position.y = RM ? 0 : Math.sin(now * .0007 + 1.7) * 3;
        const k = Math.min(1, (now - ringBorn) / 900);
        if (k < 1) ring.scale.setScalar(0.001 + (1 - Math.pow(1 - k, 3)) * 0.999);
      }

      if (swap) {
        swap.t += dt * 2.4;
        if (swap.phase === 'out') {
          const k = Math.min(swap.t, 1);
          rig.scale.setScalar(Math.max(.001, 1 - k * k));
          ry += dt * 4 * (1 - k);
          if (k >= 1) { mount(curKey); swap = { phase: 'in', t: 0 }; }
        } else {
          const k = Math.min(swap.t, 1);
          rig.scale.setScalar(Math.max(.001, easeOutBack(k)));
          if (k >= 1) { rig.scale.setScalar(1); swap = null; }
        }
      }

      renderer.render(scene, cam);
      if (first) { first = false; window.__FT3D = true; loading.classList.add('done'); }
    })(performance.now());

  } catch (err) {
    window.__FT3D = 'fallback';
    loading && loading.classList.add('done');
    const fb = document.getElementById('gl-fb'); fb && fb.classList.add('show');
    const ctl = document.querySelector('.stage-ctl'); ctl && ctl.classList.add('hide');
    console.warn('3D viewer unavailable, static fallback shown:', err);
  }
})();
