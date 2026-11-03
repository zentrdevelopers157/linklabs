(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const rm=matchMedia('(prefers-reduced-motion: reduce)');
  const year=$('#yr');if(year)year.textContent=new Date().getFullYear();
  const nav=$('#nav'),burger=$('#burger'),menu=$('#nav-menu');
  const mobile=matchMedia('(max-width:900px)');
  function closeMenu(){nav?.classList.remove('open');burger?.setAttribute('aria-expanded','false');burger?.setAttribute('aria-label','Open menu');if(menu)menu.inert=mobile.matches;}
  closeMenu();
  mobile.addEventListener('change',closeMenu);
  burger?.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Close menu':'Open menu');menu.inert=mobile.matches&&!open;
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();burger.focus();}});
  $$('.nav-links a').forEach(a=>a.addEventListener('click',closeMenu));
  const updateNav=()=>nav?.classList.toggle('scrolled',scrollY>20);
  addEventListener('scroll',updateNav,{passive:true});updateNav();
  if(!rm.matches){
    document.body.classList.add('motion-ready');
    const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target);}}),{threshold:.12});
    $$('.reveal').forEach(e=>reveal.observe(e));
  }
  rm.addEventListener('change',()=>{if(rm.matches)document.body.classList.remove('motion-ready');});

  const video=$('#craft-video');
  if(!video)return;
  const chapters={
    extrude:{n:'01',label:'EXTRUSION',title:'Born from fire.<br>Defined by precision.',caption:'Heated billet. One continuous stroke. Infinite possibility.',alt:'Aluminum extrusion process',lines:['Born from fire.<br>Defined by precision.','One continuous<br>stroke.','A new form.<br>A new possibility.']},
    finish:{n:'02',label:'CNC MACHINING',title:'Every cut.<br>Considered.',caption:'Channels, holes and lengths — machined for the next stage.',alt:'Precision CNC machining of aluminum profiles',lines:['Every cut.<br>Considered.','Precision in<br>every detail.','Made to<br>come together.']},
    warehouse:{n:'03',label:'READY TO SHIP',title:'Your next project.<br>Already taking shape.',caption:'Profiles, finishes and accessories. Consolidated for your project.',alt:'Aluminum profiles in the warehouse',lines:['Your next project.<br>Already taking shape.','One partner.<br>Every detail.','From Foshan.<br>To your world.']}
  };
  const order=Object.keys(chapters);
  const toggle=$('#film-toggle'),title=$('#scene-title'),progress=$('#film-progress'),error=$('#film-error');
  let key='extrude',inView=false,userPaused=false,line=-1,raf=0,epoch=0;
  const clock=t=>'00:'+String(Math.floor(t||0)).padStart(2,'0');
  function updateButton(){
    toggle.innerHTML=video.paused?'PLAY FILM <span>▶</span>':'PAUSE FILM <span>Ⅱ</span>';
    toggle.setAttribute('aria-label',video.paused?'Play film':'Pause film');
  }
  function tick(){
    const duration=Number.isFinite(video.duration)?video.duration:8;
    progress.style.transform='scaleX('+Math.min(1,video.currentTime/duration)+')';
    $('#film-time').textContent=clock(video.currentTime)+' / '+clock(duration);
    const next=video.currentTime<2.7?0:video.currentTime<5.4?1:2;
    if(next!==line){
      line=next;title.innerHTML=chapters[key].lines[next];
      title.classList.remove('enter');void title.offsetWidth;if(!rm.matches)title.classList.add('enter');
    }
    raf=video.paused?0:requestAnimationFrame(tick);
  }
  async function play(){try{await video.play();}catch{updateButton();}}
  function select(next,explicit=false){
    key=next;const c=chapters[key];epoch++;line=-1;error.hidden=true;
    if(raf){cancelAnimationFrame(raf);raf=0;}
    video.pause();video.poster='assets/films/'+key+'.webp';video.src='assets/films/'+key+'.mp4';video.setAttribute('aria-label',c.alt);
    $('#chapter-index').textContent=c.n+' / 03';$('#scene-kicker').textContent=c.n+' — '+c.label;
    $('#scene-caption').textContent=c.caption;title.innerHTML=c.title;
    $$('.chapter').forEach(b=>{const active=b.dataset.chapter===key;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
    progress.style.transform='scaleX(0)';$('#film-time').textContent='00:00 / 00:08';
    if(explicit)userPaused=false;
    if(inView&&!userPaused&&(!rm.matches||explicit))play();
    updateButton();
  }
  $$('.chapter').forEach(b=>b.addEventListener('click',()=>select(b.dataset.chapter,true)));
  toggle.addEventListener('click',()=>{userPaused=!video.paused;if(video.paused)play();else video.pause();});
  video.addEventListener('play',()=>{updateButton();if(!raf)raf=requestAnimationFrame(tick);});
  video.addEventListener('pause',()=>{updateButton();if(raf){cancelAnimationFrame(raf);raf=0;}});
  video.addEventListener('seeked',()=>{if(!raf)tick();});
  video.addEventListener('ended',()=>{if(rm.matches||userPaused){updateButton();return;}select(order[(order.indexOf(key)+1)%order.length]);});
  video.addEventListener('error',()=>{error.hidden=false;updateButton();});
  new IntersectionObserver(es=>{
    inView=es[0].isIntersecting;
    if(inView&&!userPaused&&!rm.matches&&!document.hidden)play();else video.pause();
  },{threshold:.2}).observe(video);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(inView&&!userPaused&&!rm.matches)play();});
  rm.addEventListener('change',()=>{if(rm.matches)video.pause();else if(inView&&!userPaused)play();});
  updateButton();
})();
