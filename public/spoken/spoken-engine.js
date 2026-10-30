/* Spoken scene engine (core + engine + set pieces). Generated from prototype/sites. Load order: icons.js, then spoken-engine.js. No build step, no dependencies. */
/* Spoken site core: shared by every theme. No libraries.
   A theme calls Spoken.* helpers; the page passes one Business record in. */
(function(){
const S={};
S.reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
S.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
S.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
S.sm=u=>u*u*(3-2*u);
S.seg=(p,a,b)=>S.clamp((p-a)/(b-a),0,1);
S.backOut=u=>{ const c=1.6; return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2); };
S.lerp=(a,b,t)=>a+(b-a)*t;
S.mix=(c1,c2,t)=>{ const h=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)); const a=h(c1), b=h(c2); return 'rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')+')'; };

/* "214 Wythe Ave, Brooklyn" -> "Brooklyn" */
S.city=loc=>{ const p=String(loc||'').split(',').map(x=>x.trim()).filter(Boolean); return p.length>1?p[p.length-1]:''; };

/* best effort: "Mon–Sat, 6:00–14:00\nClosed Sundays" -> {days:[1..6], open:360, close:840}. null if unreadable. */
const D=['sun','mon','tue','wed','thu','fri','sat'];
S.parseHours=h=>{
  const t=String(h||'').replace(/\n/g,' ').replace(/\bnoon\b|\bmidday\b/gi,'12:00').replace(/\bmidnight\b/gi,'24:00');
  const tm=t.match(/(\d{1,2})(?:[:h.](\d{2})?)?\s*(am|pm)?\s*(?:[–-]|to|till|until|às|as|a|à|bis|al|alle|jusqu'à)\s*(\d{1,2})(?:[:h.](\d{2})?)?\s*(am|pm)?/i);
  if(!tm) return null;
  const toMin=(hh,mm,ap)=>{ hh=+hh; mm=+(mm||0); if(ap){ ap=ap.toLowerCase(); if(ap==='pm'&&hh<12) hh+=12; if(ap==='am'&&hh===12) hh=0; } return hh*60+mm; };
  let days=[0,1,2,3,4,5,6];
  const dm=t.toLowerCase().match(/(sun|mon|tue|wed|thu|fri|sat)\w*\s*(?:[–-]|to)\s*(sun|mon|tue|wed|thu|fri|sat)/);
  if(dm){ const a=D.indexOf(dm[1]), b=D.indexOf(dm[2]); days=[]; for(let i=a;;i=(i+1)%7){ days.push(i); if(i===b||days.length>7) break; } }
  const closed=[...t.toLowerCase().matchAll(/(?:closed|except)\s+(?:on\s+)?(sun|mon|tue|wed|thu|fri|sat)/g)].map(m=>D.indexOf(m[1]));
  days=days.filter(d=>!closed.includes(d));
  let open=toMin(tm[1],tm[2],tm[3]), close=toMin(tm[4],tm[5],tm[6]);
  if(close<=open && close<12*60) close+=12*60;
  return {days, open, close};
};
S.fmt=min=>{ const h=Math.floor(min/60)%24, m=Math.round(min%60); const ap=h<12?'am':'pm'; const h12=h%12||12; return `${h12}:${String(m).padStart(2,'0')} ${ap}`; };
S.openState=(h,now=new Date())=>{
  const p=S.parseHours(h); if(!p||!p.days.length) return null;
  const m=now.getHours()*60+now.getMinutes(), d=now.getDay();
  if(p.days.includes(d) && m>=p.open && m<p.close) return {open:true, text:`Open now, until ${S.fmt(p.close)}`};
  for(let k=0;k<8;k++){ const dd=(d+k)%7; if(p.days.includes(dd) && (k>0 || m<p.open)) return {open:false, text:`Closed now, opens ${k===0?'today':k===1?'tomorrow':['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dd]} at ${S.fmt(p.open)}`}; }
  return null;
};

/* progress through a tall section whose inner stage is sticky */
S.progress=el=>{ const r=el.getBoundingClientRect(), span=el.offsetHeight-innerHeight; return span>0?S.clamp(-r.top/span,0,1):1; };

/* reveal on scroll */
S.reveal=(root,sel)=>{
  const els=root.querySelectorAll(sel);
  if(S.reduce||!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:.18, rootMargin:'0px 0px -6% 0px'});
  els.forEach(e=>io.observe(e));
};

/* "Updated just now": shown when the owner edits while a customer is looking */
S.toast=(msg)=>{
  let t=document.getElementById('sp-toast');
  if(!t){ t=document.createElement('div'); t.id='sp-toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('on'); clearTimeout(S.toast.k); S.toast.k=setTimeout(()=>t.classList.remove('on'),2600);
};

/* the lead form: validates, then hands a Lead record to onSend (Base44: Lead.create) */
S.leadForm=(form, biz, onSend)=>{
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(form), lead={business_slug:biz.slug, name:String(f.get('name')||'').trim(), contact:String(f.get('contact')||'').trim(), message:String(f.get('message')||'').trim()};
    const bad=[]; if(!lead.name) bad.push('name'); if(!/@|\d{6,}/.test(lead.contact.replace(/\s/g,''))) bad.push('contact'); if(lead.message.length<2) bad.push('message');
    form.querySelectorAll('[name]').forEach(i=>i.setAttribute('aria-invalid', bad.includes(i.name)?'true':'false'));
    if(bad.length){ form.querySelector(`[name="${bad[0]}"]`).focus(); return; }
    onSend(lead);
  });
};

window.Spoken=S;
})();

/* Spoken scene engine. One Business record + one scene_spec -> a whole site with a scroll-driven hero.
   No hero is hand-built for a shop: archetype (backdrop), objects (icons), palette, mood and kicker all come from scene_spec,
   and the theme decides how things enter, move and settle. */
(function(){
const S=window.Spoken, IC=window.SpokenIcons;
const ARCHETYPES=['hearth','counter','workbench','studio','desk','street'];
const MOODS=['dawn','day','dusk','night'];
const THEMES=['craft','editorial','bold','minimal','zine'];
const DEF={craft:['#EADFCB','#C98B4A','#9A3B14'], editorial:['#F4EFE6','#C9BFAE','#8A2A1F'], bold:['#111014','#3A3A44','#E8FF3A'], minimal:['#FAFAF8','#D3DDD8','#0F5E5A'], zine:['#F3F0E8','#FFC9D6','#C2125F']};
const NIGHT='#0E0F24';
/* set pieces: hand-built heroes for a family of trades, registered by separate files.
   PIECES[id] = { ownsServices, ownsTitle, back:'sky'|'wall', mount(layer, ctx) -> { update(p, frame), setServices?(list), destroy?() } } */
const PIECES={};

/* ---------- chrome strings in the owner's language ---------- */
const T={
 en:{services:'What we offer',visit:'Visit',msg:'Message us',hours:'Hours',dir:'Get directions',name:'Your name',contact:'Phone or email',message:'Message',send:'Send',sent:'Sent',thanks:'Thanks. They’ll reply soon.',made:'Made with a voice note',scroll:'Scroll',openNow:'Open now',closedNow:'Closed now',opens:'opens',until:'until',untitled:'A new shop',today:'today',tomorrow:'tomorrow',write:'Orders, questions, anything. It goes straight to them.'},
 pt:{services:'O que oferecemos',visit:'Visite-nos',msg:'Envie mensagem',hours:'Horário',dir:'Como chegar',name:'O seu nome',contact:'Telefone ou email',message:'Mensagem',send:'Enviar',sent:'Enviado',thanks:'Obrigado. Respondemos em breve.',made:'Feito com uma mensagem de voz',scroll:'Deslize',openNow:'Aberto agora',closedNow:'Fechado agora',opens:'abre',until:'até às',untitled:'Uma nova loja',today:'hoje',tomorrow:'amanhã',write:'Encomendas, perguntas, o que for. Chega direto a eles.'},
 es:{services:'Lo que ofrecemos',visit:'Visítanos',msg:'Escríbenos',hours:'Horario',dir:'Cómo llegar',name:'Tu nombre',contact:'Teléfono o email',message:'Mensaje',send:'Enviar',sent:'Enviado',thanks:'Gracias. Te responderán pronto.',made:'Hecho con una nota de voz',scroll:'Desliza',openNow:'Abierto ahora',closedNow:'Cerrado ahora',opens:'abre',until:'hasta las',untitled:'Un nuevo negocio',today:'hoy',tomorrow:'mañana',write:'Pedidos, preguntas, lo que sea. Les llega directo.'},
 fr:{services:'Ce que nous proposons',visit:'Venir',msg:'Nous écrire',hours:'Horaires',dir:'Itinéraire',name:'Votre nom',contact:'Téléphone ou e-mail',message:'Message',send:'Envoyer',sent:'Envoyé',thanks:'Merci. Réponse très bientôt.',made:'Fait avec un message vocal',scroll:'Défiler',openNow:'Ouvert',closedNow:'Fermé',opens:'ouvre',until:'jusqu’à',untitled:'Une nouvelle boutique',today:'aujourd’hui',tomorrow:'demain',write:'Commandes, questions, tout. Ça arrive directement chez eux.'},
 de:{services:'Unser Angebot',visit:'Besuchen',msg:'Schreiben Sie uns',hours:'Öffnungszeiten',dir:'Route',name:'Ihr Name',contact:'Telefon oder E-Mail',message:'Nachricht',send:'Senden',sent:'Gesendet',thanks:'Danke. Antwort folgt bald.',made:'Gemacht mit einer Sprachnachricht',scroll:'Scrollen',openNow:'Jetzt geöffnet',closedNow:'Jetzt geschlossen',opens:'öffnet',until:'bis',untitled:'Ein neuer Laden',today:'heute',tomorrow:'morgen',write:'Bestellungen, Fragen, alles. Geht direkt an sie.'},
 it:{services:'Cosa offriamo',visit:'Vieni a trovarci',msg:'Scrivici',hours:'Orari',dir:'Indicazioni',name:'Il tuo nome',contact:'Telefono o email',message:'Messaggio',send:'Invia',sent:'Inviato',thanks:'Grazie. Risponderanno presto.',made:'Fatto con un messaggio vocale',scroll:'Scorri',openNow:'Aperto ora',closedNow:'Chiuso ora',opens:'apre',until:'fino alle',untitled:'Un nuovo negozio',today:'oggi',tomorrow:'domani',write:'Ordini, domande, qualsiasi cosa. Arriva direttamente a loro.'},
};

/* ---------- colour ---------- */
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hex=a=>'#'+a.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>{ const x=rgb(a), y=rgb(b); return hex(x.map((v,i)=>v+(y[i]-v)*t)); };
const lum=h=>{ const c=rgb(h).map(v=>{ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }); return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
const contrast=(a,b)=>{ const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
const DARK='#1B1714', LIGHT='#F4EFE6';
const inkFor=bg=>contrast(bg,DARK)>=contrast(bg,LIGHT)?DARK:LIGHT;
const rgba=(h,a)=>`rgba(${rgb(h).join(',')},${a})`;
/* night → day through a warm, accent-lit dusk. A straight blend between a dark cool colour and a light warm one passes through grey. */
function dawnPath(n, d, L, acc){
  const base=mix(mix(n,d,.5), acc, .32), c=rgb(base), chroma=(Math.max(...c)-Math.min(...c))/255;
  // a cool or muted accent would leave the midpoint gray: the less colour it has, the more amber it borrows
  const warm=mix(base, '#FFB070', .1+S.clamp(.3-chroma,0,.3)*1.1);
  return L<.5 ? mix(n, warm, S.sm(L/.5)) : mix(warm, d, S.sm((L-.5)/.5));
}
const norm=s=>String(s||'').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N} ]+/gu,' ').replace(/\s+/g,' ').trim();

/* ---------- 1. validate scene_spec; repair what can be repaired, else fall back ---------- */
function fixPalette(p, theme, notes){
  const d=DEF[theme], hx=/^#[0-9a-f]{6}$/i;
  const pal=[0,1,2].map(i=>(Array.isArray(p) && hx.test(p[i]||''))?p[i]:(notes && p && notes.push(`palette[${i}] "${(p||[])[i]}" invalid → theme default`), d[i]));
  /* a washed-out palette reads as a template: give a near-white/black background a tint from the shop's own colours, and a grey accent more colour */
  const chroma=h=>{ const c=rgb(h); return (Math.max(...c)-Math.min(...c))/255; };
  if(chroma(pal[0])<.06) pal[0]=mix(pal[0], mix(pal[1],pal[2],.45), lum(pal[0])>.4?.22:.28);
  if(chroma(pal[2])<.4){ const c=rgb(pal[2]), a=(c[0]+c[1]+c[2])/3; pal[2]=hex(c.map(v=>a+(v-a)*(chroma(pal[2])<.15?2.4:1.7))); }
  if(chroma(pal[1])<.12){ const c=rgb(pal[1]), a=(c[0]+c[1]+c[2])/3; pal[1]=hex(c.map(v=>a+(v-a)*2.2)); }
  if(contrast(pal[2],pal[0])<2.2){ pal[2]=mix(pal[2], inkFor(pal[0]), .5); notes && notes.push('accent too close to background → deepened'); }
  if(contrast(pal[1],pal[0])<1.12) pal[1]=mix(pal[1], inkFor(pal[0]), .16);
  return pal;
}
function checkKicker(k, biz, notes){
  if(typeof k!=='string' || !k.trim()) return '';
  k=k.trim().replace(/^["“”'‘’]+|["“”'‘’.]+$/g,'');
  if(k.length>90){ notes.push('kicker over 90 characters → dropped'); return ''; }
  if(biz.transcript && !norm(biz.transcript).includes(norm(k))){ notes.push('kicker is not the owner’s own words → dropped'); return ''; }
  return k;
}
function monogram(biz, theme, raw, notes){
  return {archetype:'monogram', set_piece:'none', objects:['__mono'], palette:fixPalette(raw&&raw.palette, theme, null), mood:(raw && MOODS.includes(raw.mood))?raw.mood:'day', kicker:raw?checkKicker(raw.kicker,biz,notes):''};
}
function validate(raw, biz){
  const notes=[];
  const theme=THEMES.includes(biz.theme)?biz.theme:(notes.push(`theme "${biz.theme}" invalid → craft`),'craft');
  const text=[biz.business_name,biz.category,biz.about,biz.tagline,(biz.services||[]).map(s=>s.name).join(' ')].join(' ');
  if(!raw || typeof raw!=='object'){ notes.push('scene_spec missing → monogram scene'); return {spec:monogram(biz,theme,null,notes), theme, notes}; }
  let set_piece='none';
  if(typeof raw.set_piece==='string' && raw.set_piece && raw.set_piece!=='none'){
    if(PIECES[raw.set_piece]) set_piece=raw.set_piece; else notes.push(`set_piece "${raw.set_piece}" not available → generic scene`); }
  let objs=Array.isArray(raw.objects)?raw.objects:[];
  const unknown=objs.filter(id=>!IC.has(id)); if(unknown.length) notes.push('unknown icons dropped: '+unknown.join(', '));
  objs=[...new Set(objs.filter(id=>IC.has(id)))].slice(0,5);
  if(!objs.length && set_piece==='none'){ const m=IC.match(text,3); if(m.length){ objs=m; notes.push('objects rescued by keyword match: '+m.join(', ')); } }
  if(!objs.length && set_piece==='none'){ notes.push('no usable objects → monogram scene'); return {spec:monogram(biz,theme,raw,notes), theme, notes}; }
  const archetype=ARCHETYPES.includes(raw.archetype)?raw.archetype:(notes.push(`archetype "${raw.archetype}" invalid → street`),'street');
  const palette=fixPalette(raw.palette, theme, notes);
  const mood=MOODS.includes(raw.mood)?raw.mood:(raw.mood!==undefined && notes.push(`mood "${raw.mood}" invalid → day`),'day');
  return {spec:{archetype, objects:objs, palette, mood, kicker:checkKicker(raw.kicker,biz,notes), set_piece}, theme, notes};
}

/* ---------- 2. backdrops, drawn only from the palette ---------- */
const SURF=`<rect x="-500" y="760" width="2600" height="240" style="fill:var(--surf)"/><rect x="-500" y="760" width="2600" height="8" style="fill:var(--edge)"/>`;
const BACK={
  hearth:`<ellipse cx="800" cy="600" rx="520" ry="330" style="fill:var(--glow)"/><path d="M470 760V420A330 280 0 0 1 1130 420V760Z" style="fill:var(--arch)"/><path d="M470 760V420A330 280 0 0 1 1130 420V760" fill="none" style="stroke:var(--wall)" stroke-width="24" stroke-dasharray="58 9"/><path d="M585 760V472A215 195 0 0 1 1015 472V760Z" fill="url(#sx-fire)" style="opacity:var(--lamp)"/>${SURF}`,
  counter:`<rect x="-500" width="2600" height="760" style="fill:var(--wall)"/><rect x="1010" y="110" width="440" height="430" fill="url(#sx-skyg)"/><path d="M1010 325h440M1230 110v430" style="stroke:var(--wall2)" stroke-width="14"/><rect x="1010" y="110" width="440" height="430" fill="none" style="stroke:var(--wall2)" stroke-width="20"/><path d="M110 290h640M110 470h640" style="stroke:var(--wall2)" stroke-width="12"/><g style="fill:var(--wall2)"><rect x="150" y="226" width="54" height="64" rx="8"/><rect x="226" y="246" width="40" height="44" rx="6"/><rect x="300" y="210" width="70" height="80" rx="10"/><rect x="420" y="232" width="48" height="58" rx="8"/><rect x="560" y="416" width="60" height="54" rx="8"/><rect x="640" y="400" width="44" height="70" rx="6"/><rect x="180" y="410" width="90" height="60" rx="10"/></g>${SURF}`,
  workbench:`<rect x="-500" width="2600" height="760" style="fill:var(--wall)"/><rect x="120" y="80" width="1360" height="560" fill="url(#sx-peg)"/><path d="M800 0v150" style="stroke:var(--wall2)" stroke-width="6"/><path d="M740 150h120l40 60H700z" style="fill:var(--acc)"/><path d="M700 210H900L1120 760H480Z" style="fill:var(--glow)"/><rect x="-500" y="740" width="2600" height="30" style="fill:var(--edge)"/>${SURF}`,
  studio:`<rect x="-500" width="2600" height="760" style="fill:var(--wall)"/><path d="M560 640V260A240 200 0 0 1 1040 260V640Z" fill="url(#sx-skyg)"/><path d="M560 640V260A240 200 0 0 1 1040 260V640ZM800 60v580M560 420h480" fill="none" style="stroke:var(--wall2)" stroke-width="16"/><ellipse cx="800" cy="840" rx="520" ry="60" style="fill:var(--glow)"/>${SURF}`,
  desk:`<rect x="-500" width="2600" height="760" style="fill:var(--wall)"/><rect x="200" y="150" width="300" height="220" fill="url(#sx-skyg)"/><rect x="200" y="150" width="300" height="220" fill="none" style="stroke:var(--wall2)" stroke-width="16"/><rect x="620" y="200" width="160" height="200" style="fill:var(--wall2)"/><path d="M1150 760V430l-90-150" fill="none" style="stroke:var(--wall2)" stroke-width="12"/><path d="M1000 250l120-40 30 70-130 30z" style="fill:var(--acc)"/><path d="M1030 300L850 760H1290L1130 290Z" style="fill:var(--glow)"/>${SURF}`,
  /* the fallback for anything, so it carries the most detail: a whole shopfront on a street at the hour of the light */
  street:`<rect x="-500" y="120" width="2600" height="640" style="fill:var(--wall2)"/>
    <rect x="200" y="30" width="1200" height="730" style="fill:var(--wall)"/><rect x="200" y="30" width="1200" height="730" fill="url(#sx-brick)"/>
    <rect x="180" y="30" width="1240" height="26" style="fill:var(--edge)"/><rect x="190" y="290" width="1220" height="14" style="fill:var(--edge)"/>
    ${[300,700,1100].map(x=>`<rect x="${x}" y="100" width="200" height="150" style="fill:var(--glow2)"/><path d="M${x} 100h200v150H${x}zM${x+100} 100v150M${x} 175h200" fill="none" style="stroke:var(--wall2)" stroke-width="10"/><rect x="${x-14}" y="250" width="228" height="14" style="fill:var(--edge)"/>`).join('')}
    <path d="M-200 330 Q400 410 800 330 T1800 330" fill="none" style="stroke:var(--wall2)" stroke-width="3"/>
    ${[...Array(15)].map((_,i)=>{ const x=-120+i*130; const y=330+Math.sin(i*1.05)*0+ (i%2?28:16); return `<circle cx="${x}" cy="${y}" r="9" style="fill:var(--bulb)"/><circle cx="${x}" cy="${y}" r="26" style="fill:var(--glow)"/>`; }).join('')}
    <path d="M250 390h1100l-50 96H300z" fill="url(#sx-stripe)"/><path d="M300 486${[...Array(11)].map(()=>'a50 22 0 0 0 100 0').join('')}" style="fill:var(--acc)"/>
    <rect x="300" y="520" width="620" height="240" style="fill:var(--glow2)"/><path d="M340 560l120 160M420 540l150 200M760 540l110 150" style="stroke:rgba(255,255,255,.22)" stroke-width="14"/><rect x="300" y="520" width="620" height="240" fill="none" style="stroke:var(--wall2)" stroke-width="18"/>
    <rect x="1000" y="520" width="190" height="240" style="fill:var(--wall2)"/><rect x="1030" y="550" width="130" height="90" style="fill:var(--glow2)"/><circle cx="1165" cy="660" r="7" style="fill:var(--acc)"/>
    <rect x="975" y="752" width="240" height="14" style="fill:var(--edge)"/>
    <path d="M950 760h-40l8-50h-16v-10h76v10h-16l8 50z" style="fill:var(--wall2)"/><ellipse cx="932" cy="696" rx="34" ry="24" style="fill:var(--mid)"/>
    <path d="M1235 760h40l-8-50h16v-10h-76v10h16l-8 50z" style="fill:var(--wall2)"/><ellipse cx="1253" cy="696" rx="34" ry="24" style="fill:var(--mid)"/>
    <path d="M1520 760V300" style="stroke:var(--wall2)" stroke-width="16"/><path d="M1490 300h60l-10-50h-40z" style="fill:var(--wall2)"/><ellipse cx="1520" cy="790" rx="170" ry="34" style="fill:var(--glow)"/><circle cx="1520" cy="285" r="44" style="fill:var(--glow)"/>
    <rect x="-500" y="760" width="2600" height="240" style="fill:var(--surf)"/><rect x="-500" y="760" width="2600" height="10" style="fill:var(--edge)"/><path d="M-500 880h2600" style="stroke:var(--edge)" stroke-width="4" stroke-dasharray="160 40"/>`,
  monogram:`<circle cx="800" cy="500" r="430" fill="none" style="stroke:var(--wall2)" stroke-width="2"/><circle cx="800" cy="500" r="330" fill="none" style="stroke:var(--wall2)" stroke-width="2" stroke-dasharray="6 14"/>${SURF}`,
};
const DEFS=`<defs>
 <linearGradient id="sx-skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></linearGradient>
 <radialGradient id="sx-fire" cx="50%" cy="88%" r="70%"><stop offset="0" style="stop-color:#FFE2A8"/><stop offset=".35" style="stop-color:var(--acc)"/><stop offset=".85" style="stop-color:var(--wall2)"/></radialGradient>
 <pattern id="sx-peg" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="4" style="fill:var(--wall2)"/></pattern>
 <pattern id="sx-brick" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0h80M0 20h80M20 0v20M60 20v20" fill="none" style="stroke:var(--wall2)" stroke-width="2" opacity=".55"/></pattern>
 <pattern id="sx-stripe" width="80" height="10" patternUnits="userSpaceOnUse"><rect width="40" height="10" style="fill:var(--acc)"/><rect x="40" width="40" height="10" style="fill:var(--bg)"/></pattern>
</defs>`;

/* ---------- 3. objects: where they stand (x%, height as % of the stage) ---------- */
const SLOTS={desk:[[66,44],[85,21],[49,17],[92,12],[77,11,1]], mob:[[50,30],[84,15],[16,14],[72,10,1],[30,9,1]]};
function slots(n, mobile){ const s=(mobile?SLOTS.mob:SLOTS.desk).slice(0,n).map(a=>a.slice()); if(n===1){ s[0][1]=mobile?34:50; } if(n>3){ s[0][1]-=4; } return s; }
function objSVG(id, biz, t){
  if(id!=='__mono') return IC.svg(id);
  const src=(biz.business_name||biz.category||'').trim();
  // no name at all: Spoken's waveform, never a letter taken from placeholder text
  const inner=src?`<text x="32" y="43.5" text-anchor="middle" class="mono">${S.esc(src.charAt(0).toUpperCase())}</text>`:'<path class="as" d="M20 30v4M26 25v14M32 19v26M38 25v14M44 30v4"/>';
  return `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true"><circle class="m" cx="32" cy="32" r="26"/><circle class="as" cx="32" cy="32" r="21" stroke-dasharray="2 4"/>${inner}</svg>`;
}
const rnd=seed=>()=>(seed=(seed*16807)%2147483647)/2147483647;

/* ---------- 4. the five grammars: how objects, title and services move as p goes 0 → 1 ---------- */
const G={
  craft:{ // made by hand: drawn line by line, then filled, then they settle on the surface
    obj(o,i,p){ const e=S.seg(p,.01+i*.06,.32+i*.06), d=S.sm(e); o.el.style.setProperty('--d',d.toFixed(3)); o.el.style.setProperty('--f',S.seg(e,.55,1).toFixed(3));
      const rise=i===0?.84+.16*S.sm(S.seg(p,.24,.44)):1; o.el.style.opacity=e>0?1:0;
      o.el.style.transform=`translateX(-50%) translateY(${((1-d)*-5).toFixed(2)}%) rotate(${(o.rot*d).toFixed(2)}deg) scaleY(${rise.toFixed(3)})`; },
    title(el,tt){ const b=S.backOut(tt); el.style.opacity=Math.min(1,tt*3); el.style.transform=`scale(${(1.3-.3*b).toFixed(3)}) rotate(-1.5deg)`; },
    svc(it,e,i,dt,vel){ const y=-160*(1-S.backOut(e)); if(e>.3&&!it.kick){ it.kick=1; it.w+=(i%2?-1:1)*2.4; } if(e<.05) it.kick=0;
      it.w+=(-24*it.th-2.4*it.w+S.clamp(vel*26,-6,6))*dt; it.th+=it.w*dt; it.el.style.opacity=e>0?1:0; it.el.style.transform=`translateY(${y.toFixed(1)}%) rotate(${(it.th*12).toFixed(2)}deg)`; }},
  editorial:{ // figures in a printed plate: each plate wipes open, the drawing drifts inside it
    obj(o,i,p){ const e=S.sm(S.seg(p,.01+i*.07,.3+i*.07)); o.el.style.setProperty('--d',1); o.el.style.setProperty('--f',1); o.el.style.opacity=S.clamp((e-.04)*6,0,1); // fade the first sliver so no bare strip of paper shows
      o.el.style.clipPath=`inset(${((1-e)*100).toFixed(1)}% 0 0 0)`; o.el.style.transform='translateX(-50%)'; o.ic.style.transform=`translateY(${((1-e)*16-p*6).toFixed(2)}%) scale(.74)`; },
    title(el,tt){ const e=S.sm(tt); el.style.opacity=1; el.querySelectorAll('.wl > span').forEach((s,k)=>s.style.transform=`translateY(${((1-S.sm(S.seg(tt,k*.12,.7+k*.12)))*110).toFixed(1)}%)`); el.style.setProperty('--rule',e.toFixed(3)); },
    svc(it,e){ const s=S.sm(e); it.el.style.opacity=s; it.el.style.transform=`translateY(${((1-s)*14).toFixed(1)}px)`; }},
  bold:{ // they slam in big and spin to a stop; the name runs across as a marquee
    obj(o,i,p){ const e=S.seg(p,.01+i*.05,.2+i*.05), b=S.backOut(e); o.el.style.setProperty('--d',1); o.el.style.setProperty('--f',1); o.el.style.opacity=e>0?1:0;
      const spin=i===0?Math.sin(p*7)*7:0; o.el.style.transform=`translateX(-50%) scale(${(2.3-1.3*b).toFixed(3)}) rotate(${((1-b)*-40+spin+o.rot*.4).toFixed(2)}deg)`; },
    title(el,tt){ const b=S.backOut(tt); el.style.opacity=tt>0?1:0; el.style.transform=`scale(${(1.6-.6*b).toFixed(3)})`; },
    svc(it,e){ const b=S.backOut(e); it.el.style.opacity=e>0?1:0; it.el.style.transform=`scale(${(1.9-.9*b).toFixed(3)})`; }},
  minimal:{ // lines draw slowly, fills barely arrive, lots of air
    obj(o,i,p){ const e=S.seg(p,.01+i*.08,.3+i*.08), d=S.sm(e); o.el.style.setProperty('--d',d.toFixed(3)); o.el.style.setProperty('--f',(S.seg(e,.7,1)*.55).toFixed(3)); o.el.style.opacity=Math.min(1,d*4);
      o.el.style.transform=`translateX(-50%) translateY(${((1-d)*4).toFixed(2)}%)`; },
    title(el,tt){ const e=S.sm(tt); el.style.opacity=e; el.style.letterSpacing=`${(.16-.18*e).toFixed(3)}em`; },
    svc(it,e){ const s=S.sm(e); it.el.style.opacity=s; it.el.style.transform=`translateX(${((1-s)*10).toFixed(1)}px)`; }},
  zine:{ // cut-out stickers thrown on from the edges, taped down; a hand-drawn line runs through
    obj(o,i,p){ const e=S.seg(p,.01+i*.05,.18+i*.05), b=S.backOut(e); o.el.style.setProperty('--d',1); o.el.style.setProperty('--f',1); o.el.style.opacity=e>0?1:0;
      o.el.style.transform=`translateX(-50%) translate(${((1-b)*o.dx*260).toFixed(1)}%,${((1-b)*o.dy*200).toFixed(1)}%) rotate(${(o.rot*2.2*b+(1-b)*o.dx*50).toFixed(2)}deg)`; },
    title(el,tt){ el.style.opacity=tt>0?1:0; el.querySelectorAll('.wz').forEach((s,k)=>{ const b=S.backOut(S.seg(tt,k*.14,k*.14+.45)); s.style.transform=`scale(${b.toFixed(3)}) rotate(${(k%2?2.5:-2.5)}deg)`; }); },
    svc(it,e,i){ const b=S.backOut(e); it.el.style.opacity=e>0?1:0; it.el.style.transform=`scale(${b.toFixed(3)}) rotate(${(i%2?8:-7)}deg)`; }},
};

/* ---------- 5. light: opening hours drive it when present, otherwise the mood ---------- */
function lightAt(p, hours, mood){
  if(hours) return .08+.92*S.sm(S.seg(p,.04,.8));
  const M={dawn:[.12,.9], day:[.9,1], dusk:[.86,.32], night:[.14,.22]}[mood]||[.9,1];
  return M[0]+(M[1]-M[0])*S.sm(S.seg(p,.04,.85));
}

/* ---------- page ---------- */
// the closing beat of a generic hero: open hours if we know them, else the city
function badgeText(b,t){ const h=S.parseHours(b.hours), en=t===T.en, f=m=>en?S.fmt(m).replace(':00','').replace(' ',''):`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;
  return h?`${t.openNow} · ${f(h.open)}–${f(h.close)}`:S.city(b.location); }
function template(b, spec, theme, t, opts){
  const e=S.esc, name=b.business_name||b.category||t.untitled, svcs=(b.services||[]).filter(s=>s&&s.name);
  const words=name.split(/\s+/);
  const titleHTML=theme==='zine'?words.map(w=>`<span class="wz">${e(w)}</span>`).join(' '):theme==='editorial'?words.map(w=>`<span class="wl"><span>${e(w)}</span></span>`).join(' '):e(name);
  const visitBits=[b.hours,b.location,b.phone_or_contact].some(Boolean);
  return `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="sx-rough"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter><filter id="sx-hand"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1.6"/></filter></svg>
<header class="sx-nav" id="sx-nav"><b data-bind="business_name">${e(name)}</b><nav>${svcs.length?`<a href="#sx-svc">${t.services}</a>`:''}${visitBits?`<a href="#sx-visit">${t.visit}</a>`:''}<a href="#sx-msg">${t.msg}</a></nav></header>
<section class="sx-hero${opts.freeze!=null?' frozen':''}" id="sx-hero" aria-label="${e(name)}">
  <div class="sx-stage" id="sx-stage">
    ${spec.set_piece!=='none'?`<div class="sx-piece sp-${spec.set_piece}" id="sx-piece" aria-hidden="true"></div>`:`
    <svg class="sx-back" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${DEFS}<rect x="-500" width="2600" height="1000" fill="url(#sx-skyg)"/><g class="bk">${BACK[spec.archetype]}</g></svg>
    <div class="sx-objs" id="sx-objs">${spec.objects.map((id,i)=>`<div class="sx-obj${i===0?' hero':''}" data-i="${i}">${theme==='zine'?'<i class="tape"></i>':''}${objSVG(id,b,t)}${theme==='editorial'?`<span class="cap">Fig. ${i+1}</span>`:''}</div>`).join('')}</div>
    ${theme==='bold'?`<div class="sx-marq" aria-hidden="true"><span>${(e(name)+' · ').repeat(6)}</span></div>`:''}
    ${theme==='zine'?'<svg class="sx-squig" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M-10 80 C80 10 140 120 230 60 S380 0 460 70 620 120 700 50 860 10 1010 70"/></svg>':''}`}
    ${spec.kicker?`<p class="sx-kick" id="sx-kick">“${e(spec.kicker)}”</p>`:''}
    <div class="sx-title${spec.set_piece!=='none'&&PIECES[spec.set_piece].ownsTitle?' sx-sr':''}" id="sx-title"><h1 data-bind-title>${titleHTML}</h1>${b.tagline?`<p class="sx-tl" data-bind="tagline">${e(b.tagline)}</p>`:''}</div>
    <div class="sx-svc" id="sx-svc-hero"></div>
    <p class="sx-clock" id="sx-clock" aria-hidden="true"><i></i><span></span></p>
    ${spec.set_piece==='none'&&badgeText(b,t)?`<p class="sx-badge" id="sx-badge" aria-hidden="true">${e(badgeText(b,t))}</p>`:''}
    <p class="sx-cue" aria-hidden="true">${t.scroll}</p>
  </div>
</section>
${b.about?`<section class="sx-sec sx-about"><p class="big sx-rv" data-bind="about">${e(b.about)}</p></section>`:''}
${svcs.length?`<section class="sx-sec sx-svcs" id="sx-svc"><h2 class="sx-h sx-rv">${t.services}</h2><ul class="sx-list" id="sx-list"></ul></section>`:''}
${visitBits?`<section class="sx-sec sx-visit" id="sx-visit"><div class="vin"><div class="sx-rv"><h2 class="sx-h">${t.visit}</h2>${b.hours?`<p class="sx-hours" data-bind="hours">${e(b.hours)}</p><p class="sx-open" id="sx-open"><i></i><span></span></p>`:''}</div>
  <div class="sx-rv">${b.location?`<p class="sx-addr" data-bind="location">${e(b.location)}</p>`:''}${b.phone_or_contact?`<p class="sx-contact" data-bind="phone_or_contact">${e(b.phone_or_contact)}</p>`:''}${b.location?`<a class="sx-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+', '+b.location)}">${t.dir}</a>`:''}</div></div></section>`:''}
<section class="sx-sec sx-msg" id="sx-msg"><form class="sx-form sx-rv" id="sx-form" novalidate><h2 class="sx-h">${t.msg}</h2><p class="sx-sub">${t.write}</p>
  <label>${t.name}<input name="name" autocomplete="name"></label><label>${t.contact}<input name="contact" autocomplete="email"></label><label>${t.message}<textarea name="message" rows="3"></textarea></label>
  <button class="sx-btn" type="submit">${t.send}</button><div class="sx-sent" aria-live="polite"><div><b>${t.sent}</b><p>${t.thanks}</p></div></div></form></section>
<footer class="sx-foot"><span>${t.made} · <a href="${opts.home||'../index.html'}">Spoken</a></span>${opts.demoEdit?'<button type="button" id="sx-demo">Prototype: simulate an owner edit</button>':''}</footer>`;
}

function mount(root, business, rawSpec, opts={}){
  let b=structuredClone(business);
  const {spec, theme, notes}=validate(rawSpec, b);
  const t=T[(b.language||'en').slice(0,2)]||T.en;
  const [bg,mid,acc]=spec.palette, ink=inkFor(bg);
  document.documentElement.lang=(b.language||'en').slice(0,2);
  document.body.className=`sx th-${theme}`;
  const page=document.body.style;
  page.setProperty('--bg',bg); page.setProperty('--mid',mid); page.setProperty('--acc',acc); page.setProperty('--ink',ink);
  page.setProperty('--paper', mix(bg, ink===DARK?'#ffffff':'#000000', .35)); page.setProperty('--line', rgba(ink,.18)); page.setProperty('--soft', rgba(ink,.62));
  page.setProperty('--acc-ink', inkFor(acc)); page.setProperty('--ink-on-mid', inkFor(mid));
  page.setProperty('--acc-text', contrast(acc,bg)>=3?acc:mix(acc, ink, .55)); page.setProperty('--ic-ink', mix(ink, mid, .15)); page.setProperty('--ic-mid', mid); page.setProperty('--ic-acc', acc);
  root.innerHTML=template(b, spec, theme, t, opts);
  const $=s=>root.querySelector(s), stage=$('#sx-stage'), hero=$('#sx-hero'), nav=$('#sx-nav');
  const hours=S.parseHours(b.hours);
  const R=rnd(b.slug?[...b.slug].reduce((a,c)=>a+c.charCodeAt(0),7):7);
  const g=G[theme];

  /* objects */
  const objs=[...root.querySelectorAll('.sx-obj')].map((el,i)=>({el, i, ic:el.querySelector('.ic'), rot:(R()-.5)*8*(i?1:.5), dx:R()<.5?-1:1, dy:R()<.5?-.6:.6}));
  objs.forEach(o=>o.el.querySelectorAll('.ic *:not(text)').forEach(n=>n.setAttribute('pathLength','1')));
  function place(){ const mob=innerWidth<760;
    if(theme==='editorial'){ // a measured row of framed figures on the wall: they can never overlap, whatever the count
      const W=stage.clientWidth, H=stage.clientHeight, gap=mob?14:30, x0=mob?.06*W:.5*W, x1=mob?.94*W:.95*W;
      let sz=(mob?[20,14,13,12,11]:[32,22,20,18,16]).slice(0,objs.length).map(v=>v/100*H), tot=sz.reduce((a,b)=>a+b,0)+gap*(sz.length-1);
      const k=Math.min(1,(x1-x0)/tot); sz=sz.map(v=>v*k); tot*=k; let x=x0+((x1-x0)-tot)/2;
      objs.forEach((o,i)=>{ const s=sz[i]; o.el.style.left=(x+s/2)+'px'; o.el.style.height=s+'px'; o.el.style.bottom=mob?'23%':'31%'; o.el.style.zIndex=5; x+=s+gap; });
      return; }
    const s=slots(objs.length, mob);
    objs.forEach((o,i)=>{ const [x,h,up]=s[i]; o.el.style.left=x+'%'; o.el.style.height=h+'%'; o.el.style.bottom=`calc(${mob?22:24}% - 2.2% + ${up?(mob?30:34):0}%)`; o.el.style.zIndex=i===0?5:4-i; }); }
  function aim(){ const o=objs[0], w=$('#sx-objs'); if(o&&w) w.style.transformOrigin=`${o.el.style.left} 72%`; }
  place(); aim();

  /* hero services: up to 4 (3 on phones) */
  let items=[];
  /* the scene's colours at any light level 0 (night) … 1 (day), always through a warm dusk */
  function toneAt(L){ const W=(n,d)=>dawnPath(n,d,L,acc); const sky1=W(mix(mid,NIGHT,.82), mix(bg,'#ffffff',.3));
    return {L, sky1, sky2:W(mix(mid,NIGHT,.6), mix(bg,acc,.14)), wall:W(mix(mid,NIGHT,.72), mix(bg,mid,.26)), wall2:W(mix(mid,NIGHT,.56), mix(bg,mid,.55)),
      surf:W(mix(mid,NIGHT,.78), mix(mid,'#000000',.12)), edge:W(mix(mid,NIGHT,.5), mix(mid,'#ffffff',.25)), arch:W(mix(mid,NIGHT,.6), mix(mid,'#2A1A12',.42)), ink:inkFor(sky1), accent:acc}; }
  /* set piece, if one was chosen and is registered */
  const pieceDef=spec.set_piece!=='none'?PIECES[spec.set_piece]:null;
  let piece=null;
  if(pieceDef){
    const ctx={palette:spec.palette, ink, hours, name:b.business_name||b.category||t.untitled, tagline:b.tagline||'', services:(b.services||[]).filter(s=>s&&s.name),
      objects:spec.objects, mood:spec.mood, theme, t, lang:(b.language||'en').slice(0,2), reduce:S.reduce, frozen:opts.freeze!=null, rnd:R,
      S, mix, rgba, inkFor, icon:IC.svg, stage, toneAt, lightAt:p=>lightAt(p,hours,spec.mood), city:S.city(b.location)};
    try{ piece=pieceDef.mount($('#sx-piece'), ctx); }
    catch(err){ console.error(`set piece "${spec.set_piece}" failed → generic scene`, err); return mount(root, business, {...spec, set_piece:'none'}, opts); }
  }
  function renderHeroSvc(){
    if(pieceDef && pieceDef.ownsServices){ $('#sx-svc-hero').innerHTML=''; $('#sx-svc-hero').classList.add('none'); items=[]; return; }
    const n=Math.min((b.services||[]).length, innerWidth<760?3:4), list=(b.services||[]).slice(0,n);
    $('#sx-svc-hero').innerHTML=theme==='craft'?`<svg class="line" viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="M-10 6 Q500 46 1010 6" vector-effect="non-scaling-stroke"/></svg>`+list.map((s,i)=>`<div class="it" style="left:${(i+.5)/n*100}%"><i class="peg"></i><div class="card"><b>${S.esc(s.name)}</b><span>${S.esc(s.price||'')}</span></div></div>`).join('')
      : list.map(s=>`<div class="it"><b>${S.esc(s.name)}</b><span class="${String(s.price||'').length>6?'long':''}">${S.esc(s.price||'')}</span></div>`).join('');
    items=[...root.querySelectorAll('#sx-svc-hero .it')].map(el=>({el, th:0, w:0, kick:0}));
    $('#sx-svc-hero').classList.toggle('none', !n);
  }
  function renderList(changed){
    const ul=$('#sx-list'); if(!ul) return;
    ul.innerHTML=(b.services||[]).filter(s=>s&&s.name).map((s,i)=>`<li class="${changed===s.name?'flash':''}"><span class="n"><b>${S.esc(s.name)}</b>${s.description?`<small>${S.esc(s.description)}</small>`:''}</span><i class="dots"></i><span class="pr">${S.esc(s.price||'')}</span></li>`).join('');
  }
  function renderOpen(){
    const o=$('#sx-open'); if(!o) return; const h=S.parseHours(b.hours); o.hidden=!h; if(!h) return;
    const now=new Date(), m=now.getHours()*60+now.getMinutes(), d=now.getDay(), fmt=min=>t===T.en?S.fmt(min):`${Math.floor(min/60)%24}:${String(min%60).padStart(2,'0')}`;
    if(h.days.includes(d) && m>=h.open && m<h.close){ o.classList.add('yes'); o.querySelector('span').textContent=`${t.openNow}, ${t.until} ${fmt(h.close)}`; return; }
    o.classList.remove('yes'); for(let k=0;k<8;k++){ const dd=(d+k)%7; if(h.days.includes(dd)&&(k>0||m<h.open)){ const day=k===0?t.today:k===1?t.tomorrow:new Date(now.getTime()+k*864e5).toLocaleDateString(b.language||'en',{weekday:'long'}); o.querySelector('span').textContent=`${t.closedNow}, ${t.opens} ${day} ${fmt(h.open)}`; return; } }
  }
  renderHeroSvc(); renderList(); renderOpen();
  S.reveal(root,'.sx-rv');
  const onResize=()=>{ place(); aim(); renderHeroSvc(); }; addEventListener('resize',onResize);

  /* generic scene beats on top of the theme grammar, so every tenth of the scroll looks different:
     objects arrive (0–.45), the camera pushes in on the hero object (.42–.52), it lights up while the rest step back (.58–.7),
     the camera pulls out as the services arrive (.7–.9), and the hours badge stamps on at the end (.9–.98) */
  const objsEl=$('#sx-objs'), backEl=$('.sx-back'), badge=$('#sx-badge');
  function beats(p){
    const push=S.sm(S.seg(p,.42,.52))*(1-S.sm(S.seg(p,.7,.8))), lit=S.sm(S.seg(p,.58,.7))*(1-.6*S.seg(p,.8,.95));
    if(objsEl) objsEl.style.transform=`scale(${(1+.16*push).toFixed(3)})`;
    if(backEl) backEl.style.transform=`translateY(${(-p*2).toFixed(2)}%) scale(${(1+.05*p+.04*push).toFixed(3)})`;
    objs.forEach(o=>{ if(o.i===0){ o.el.style.transform+=` scale(${(1+.1*lit).toFixed(3)})`; o.el.style.filter=lit>.01?`drop-shadow(0 0 ${(lit*26).toFixed(1)}px var(--glow2))`:''; }
      else o.el.style.opacity=((+o.el.style.opacity||0)*(1-.45*lit)).toFixed(3); });
    if(badge){ const e=S.seg(p,.9,.98), b=S.backOut(e); badge.style.opacity=e>0?1:0; badge.style.transform=`scale(${(S.reduce?1:1.8-.8*b).toFixed(3)}) rotate(-4deg)`; }
  }
  /* frame loop */
  let lastP=0, vel=0, last=performance.now(), visible=true, alive=true, raf=0, tones=null;
  const born=performance.now(), h1=$('#sx-title h1'), ownTitle=!!(pieceDef&&pieceDef.ownsTitle);
  let stampHit=null, stampShake=0;
  h1.style.transformOrigin='0 60%';
  const io='IntersectionObserver' in window?new IntersectionObserver(es=>{ visible=es[0].isIntersecting; }):null; if(io) io.observe(hero);
  const set=(k,v)=>stage.style.setProperty(k,v);
  const kick=$('#sx-kick'), title=$('#sx-title'), clock=$('#sx-clock'), cue=$('.sx-cue'), marq=$('.sx-marq'), squig=$('.sx-squig path');
  const openAt=hours?hours.open:null, startAt=hours?Math.max(0,hours.open-120):0;
  clock.hidden=!hours;
  function frame(now){
    if(!alive) return;
    const dt=Math.min(.05,(now-last)/1000); last=now;
    if(!visible && opts.freeze==null){ raf=requestAnimationFrame(frame); return; }
    const p=opts.freeze!=null?opts.freeze:(S.reduce?1:S.progress(hero));
    vel+=((p-lastP)/Math.max(dt,.001)-vel)*Math.min(1,dt*6); lastP=p;
    const sw=(pieceDef&&pieceDef.stamp)||[.5,.6], se=(S.reduce||ownTitle)?1:S.seg(p,sw[0],sw[1]);
    /* light */
    const L=(piece&&piece.light)?piece.light(p):lightAt(p, hours, spec.mood);
    tones=toneAt(L); const {sky1,sky2,wall,wall2,surf,edge}=tones;
    set('--sky1',sky1); set('--sky2',sky2); set('--wall',wall); set('--wall2',wall2); set('--surf',surf); set('--edge',edge); set('--u-ink',inkFor(surf));
    // a hearth stays lit after dawn: the fire is the point of the scene
    set('--lamp',(spec.archetype==='hearth'?.8+(1-L)*.2:.3+(1-L)*.7).toFixed(3)); set('--glow',rgba(acc,(spec.archetype==='hearth'?.16:.08)+(1-L)*.22));
    set('--arch',tones.arch); set('--bulb',mix('#FFE2A8', mix(bg,'#ffffff',.4), L*.6)); set('--glow2',rgba(mix(acc,'#FFE2A8',.5),(.25+(1-L)*.55).toFixed(3)));
    const backTone=pieceDef?(pieceDef.back==='wall'?wall:sky1):['hearth','street','monogram'].includes(spec.archetype)?sky1:wall;
    if(piece) piece.update(p,{now, dt, vel, L, tones, stamp:se, mobile:innerWidth<760});
    const sInk=inkFor(backTone); set('--s-ink',sInk); set('--s-soft',rgba(sInk,.75)); set('--wash',rgba(backTone,.86));
    nav.style.color=hero.getBoundingClientRect().bottom<70?'':sInk;
    nav.classList.toggle('solid', hero.getBoundingClientRect().bottom<70);
    /* objects, title, services */
    objs.forEach(o=>g.obj(o,o.i,p));
    if(!pieceDef) beats(p);
    // the name is there from the first frame: its theme entrance plays once on arrival, not at the end of the scroll
    const tt=(opts.freeze!=null||S.reduce)?1:S.clamp((now-born-250)/1100,0,1); g.title(title,tt);
    // then the name waits, faint, until one scroll-driven stamp: it lifts, fills in and lands with a jolt
    if(stampHit===null) stampHit=se>=1;
    if(se>=1&&!stampHit&&!S.reduce&&opts.freeze==null) stampShake=1; stampHit=se>=1;
    stampShake*=Math.exp(-dt*10); const jx=stampShake*6*Math.sin(now*.11), jy=stampShake*4*Math.cos(now*.13);
    const sc=se<.55?1+.32*S.sm(se/.55):1.32-.32*S.backOut((se-.55)/.45);
    h1.style.opacity=(.38+.62*S.sm(S.seg(se,0,.5))).toFixed(3);
    h1.style.transform=se>0&&se<1||stampShake>.01?`translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px) scale(${sc.toFixed(3)}) rotate(${(-2.5*Math.sin(Math.PI*se)).toFixed(2)}deg)`:'';
    const tl=title.querySelector('.sx-tl'); if(tl) tl.style.clipPath=`inset(0 ${((1-S.sm(S.seg(tt,.45,1)))*100).toFixed(1)}% 0 0)`;
    const hang=pieceDef?S.seg(p,.78,.98):S.seg(p,.7,.9); set('--line-o',(pieceDef?S.seg(p,.74,.8):S.seg(p,.66,.72)).toFixed(3));
    items.forEach((it,i)=>g.svc(it,S.seg(hang,i*.15,i*.15+.45),i,dt,vel));
    if(kick) kick.style.opacity=(1-S.seg(p,.48,.58)).toFixed(3);
    cue.style.opacity=(1-S.seg(p,0,.04)).toFixed(3);
    if(marq) marq.style.transform=`translateX(${(-p*38).toFixed(2)}%) rotate(-4deg)`;
    if(squig) squig.style.strokeDashoffset=(1-S.sm(S.seg(p,.3,.7))).toFixed(3);
    if(hours){ const tm=startAt+(openAt-startAt)*S.seg(p,0,.95); clock.querySelector('span').textContent=p>.95?`${t===T.en?S.fmt(openAt):Math.floor(openAt/60)+':'+String(openAt%60).padStart(2,'0')} · ${t.openNow.toLowerCase()}`:(t===T.en?S.fmt(Math.floor(tm/5)*5):`${Math.floor(tm/60)}:${String(Math.floor(tm%60/5)*5).padStart(2,'0')}`); }
    if(opts.freeze==null) raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  if(opts.freeze!=null) setTimeout(()=>{ if(alive) raf=requestAnimationFrame(frame); },400);

  /* lead form */
  const form=$('#sx-form'); S.leadForm(form,b,lead=>{ if(opts.onLead){ Promise.resolve(opts.onLead(lead)).catch(e=>console.error('Lead failed',e)); } else console.info('Lead',lead); form.classList.add('done'); });

  /* live edits */
  function update(next, changed){
    b=structuredClone(next);
    root.querySelectorAll('[data-bind]').forEach(el=>{ const k=el.dataset.bind; if(k in b) el.textContent=b[k]; });
    renderHeroSvc(); renderList(changed); renderOpen(); if(piece&&piece.setServices) piece.setServices((b.services||[]).filter(s=>s&&s.name), changed); S.toast('Updated just now');
  }
  const demo=$('#sx-demo'); if(demo) demo.addEventListener('click',()=>{ const n=structuredClone(b), s=(n.services||[])[0]; if(!s) return;
    const v=parseFloat(String(s.price).replace(/[^\d.]/g,''))||0, cur=(String(s.price).match(/[$€£]/)||['$'])[0]; s.price=cur+(v+.5).toFixed(2); update(n,s.name);
    const sv=document.getElementById('sx-svc'); if(sv) sv.scrollIntoView({behavior:S.reduce?'auto':'smooth'}); });
  function destroy(){ alive=false; cancelAnimationFrame(raf); if(piece&&piece.destroy) piece.destroy(); removeEventListener('resize',onResize); if(io) io.disconnect(); root.innerHTML=''; }
  return {update, destroy, spec, theme, notes};
}

/* ---------- one call for a whole site, and live updates that know when the layout must be rebuilt ----------
   site(root, business) reads business.scene_spec (object or JSON string). update(next) patches text, prices and hours in place;
   if the theme, the scene or which sections exist changes, it rebuilds and keeps the scroll position. */
const sceneOf=b=>{ const s=b&&b.scene_spec; if(typeof s==='string'){ try{ return JSON.parse(s); }catch(e){ return null; } } return s||null; };
const shapeOf=b=>JSON.stringify([b.theme, sceneOf(b), b.business_name, b.language, !!b.about, !!b.tagline, !!(b.services||[]).length, !!b.hours, !!b.location, !!b.phone_or_contact]);
function site(root, business, opts={}){
  let cur=business, inst=mount(root, business, sceneOf(business), opts), shape=shapeOf(business);
  return {
    update(next){
      if(!next || JSON.stringify(next)===JSON.stringify(cur)) return;
      if(shapeOf(next)!==shape){ const y=scrollY; inst.destroy(); inst=mount(root, next, sceneOf(next), opts); shape=shapeOf(next); scrollTo(0,y); S.toast('Updated just now'); }
      else { const prev=(cur.services||[]), changed=(next.services||[]).find((s,i)=>!prev[i]||prev[i].name!==s.name||prev[i].price!==s.price); inst.update(next, changed&&changed.name); }
      cur=next;
    },
    destroy(){ inst.destroy(); },
    get notes(){ return inst.notes; }
  };
}

window.SpokenEngine={mount, site, validate, ARCHETYPES, MOODS, THEMES, setPieces:PIECES};
})();

/* Set piece: bakery / oven. Night to opening: the oven lights, dough rises, a blade scores it, it bakes pale to gold, dawn comes,
   the prices drop onto a line as swinging tags, the loaf comes out and the sign flips to open. ("&" in CSS = ".sp-bakery ") */
(function(){
const CSS=`&>*{position:absolute}
&.bk-sky{inset:0;background:linear-gradient(180deg,var(--bk-a),var(--bk-b) 62%,var(--bk-c))}
&.bk-dawn{inset:0;background:radial-gradient(120% 70% at 60% 100%,var(--bk-sun),transparent 70%);opacity:var(--dawn)}
&svg.oven{left:50%;bottom:22%;width:min(92vw,640px);transform:translateX(-50%);opacity:var(--oven)}
&.glow{left:50%;bottom:14%;width:min(120vw,900px);height:70%;transform:translateX(-50%);background:radial-gradient(closest-side,var(--bk-fire),transparent 75%);opacity:var(--glow-o);mix-blend-mode:screen}
&.counter{left:0;right:0;bottom:0;height:24%;background:repeating-linear-gradient(178deg,rgba(0,0,0,.07) 0 2px,transparent 2px 19px),linear-gradient(180deg,var(--wood-a),var(--wood-b))}
&.counter:before{content:"";position:absolute;inset:0 0 auto;height:10px;background:linear-gradient(180deg,rgba(255,210,170,.28),transparent)}
&canvas{inset:0;width:100%;height:100%}
&.obj{left:50%;bottom:calc(24% - 2.5%);width:min(76vw,420px);transform:translateX(-50%) translateY(var(--lift)) scale(var(--zoom));transform-origin:50% 90%}
&.obj svg{display:block;width:100%;height:auto;overflow:visible}
&.steam{position:absolute;left:20%;right:20%;bottom:58%;height:60%;opacity:var(--steam)}
&.steam path{fill:none;stroke:rgba(255,248,236,.75);stroke-width:6;stroke-linecap:round;stroke-dasharray:60 240;animation:bk-st 3.2s linear infinite;filter:blur(3px)}
&.steam path:nth-child(2){animation-delay:-1.1s}&.steam path:nth-child(3){animation-delay:-2.2s}
@keyframes bk-st{from{stroke-dashoffset:300}to{stroke-dashoffset:0}}
&.line{z-index:7;left:0;right:0;top:36%;height:30%}
&.line svg{position:absolute;inset:0 0 auto;width:100%;height:40px;overflow:visible}
&.line path{fill:none;stroke:#8C6A45;stroke-width:2;opacity:var(--twine)}
&.tag{position:absolute;top:0;width:clamp(96px,14vw,164px);margin-left:calc(clamp(96px,14vw,164px)/-2);transform-origin:50% 0;opacity:0}
&.peg{display:block;width:12px;height:26px;margin:-12px auto 0;border-radius:3px;background:linear-gradient(90deg,#b98d5d,#e2c49b 50%,#a77c50);box-shadow:0 2px 3px #0004}
&.card{position:relative;margin-top:-6px;padding:22px 10px 14px;background:var(--kraft);color:#2B2118;text-align:center;clip-path:polygon(16% 0,84% 0,100% 12%,100% 100%,0 100%,0 12%);box-shadow:0 12px 20px -10px #0008}
&.card:before{content:"";position:absolute;top:7px;left:50%;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:var(--bk-a)}
&.card b{display:block;font-family:var(--display);font-weight:600;font-size:clamp(13px,1.5vw,18px);line-height:1.1}
&.card span{display:inline-block;margin-top:8px;font-family:var(--mono);font-weight:500;font-size:clamp(12px,1.3vw,15px);color:var(--bk-rust);border:1.5px solid currentColor;padding:1px 6px;transform:rotate(-3deg)}
&.sign{z-index:6;right:16px;bottom:5%;width:118px;perspective:500px;opacity:var(--sign-o)}
&.sign:before{content:"";display:block;width:70%;height:22px;margin:0 auto -2px;border:2px solid #8C6A45;border-bottom:0;border-radius:50% 50% 0 0/100% 100% 0 0}
&.flip{position:relative;height:52px;transform-style:preserve-3d;transform:rotateY(var(--flip))}
&.flip b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;backface-visibility:hidden;border-radius:6px;background:var(--kraft);color:#2B2118;font-family:var(--display);font-size:18px;line-height:1;box-shadow:0 8px 14px -8px #0008}
&.flip b small{margin-top:4px;font-family:var(--mono);font-weight:500;font-size:11px;color:var(--bk-rust)}
&.flip b+b{transform:rotateY(180deg)}
@media(min-width:760px){&.sign{right:5vw;bottom:7%;width:150px}&.flip{height:64px}&.flip b{font-size:22px}&.obj{left:66%;width:min(42vw,560px)}&svg.oven,&.glow{left:66%}&svg.oven{width:min(52vw,640px)}&.line{top:14%}}
@media(prefers-reduced-motion:reduce){&.steam path{animation:none}}`;
const OVEN=`<svg class="oven" viewBox="0 0 600 420"><defs><radialGradient id="bk-fire" cx="50%" cy="85%" r="70%"><stop offset="0" stop-color="#FFD08A"/><stop offset=".35" style="stop-color:var(--bk-acc)"/><stop offset=".8" stop-color="#6a1a14"/><stop offset="1" stop-color="#2a0c0c"/></radialGradient></defs>
<path d="M40 420V210A260 200 0 0 1 560 210V420Z" style="fill:var(--bk-arch)"/><path d="M40 420V210A260 200 0 0 1 560 210V420" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="14" stroke-dasharray="36 6"/><path d="M130 420V250A170 140 0 0 1 470 250V420Z" fill="#120808"/><path class="fire" d="M130 420V250A170 140 0 0 1 470 250V420Z" fill="url(#bk-fire)"/></svg>`;
const LOAF=`<svg viewBox="0 0 400 250"><defs><radialGradient id="bk-crust" cx="50%" cy="30%" r="75%"><stop offset="0" style="stop-color:var(--c1)"/><stop offset=".7" style="stop-color:var(--c2)"/><stop offset="1" style="stop-color:var(--c3)"/></radialGradient>
<pattern id="bk-flour" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r="1.2" fill="#fff"/><circle cx="10" cy="10" r=".9" fill="#fff"/></pattern></defs>
<ellipse cx="200" cy="236" rx="175" ry="12" fill="rgba(0,0,0,.35)"/><rect x="10" y="226" width="380" height="16" rx="8" style="fill:var(--wood-a)"/>
<g class="loaf" style="transform-origin:200px 228px"><path d="M38 210C34 140 110 78 200 78S366 140 362 210C360 228 330 232 200 232S40 228 38 210Z" fill="url(#bk-crust)"/>
<path d="M38 210C34 140 110 78 200 78S366 140 362 210C360 228 330 232 200 232S40 228 38 210Z" fill="url(#bk-flour)" style="opacity:var(--flour)"/>
<path d="M112 132C160 104 240 100 296 124" fill="none" stroke="#F4DFB4" stroke-linecap="round" style="stroke-width:var(--open)"/>
<path class="score" d="M112 132C160 104 240 100 296 124" fill="none" style="stroke:var(--c3)" stroke-width="7" stroke-linecap="round"/>
<path d="M70 168C120 150 150 150 186 160" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="5" stroke-linecap="round"/></g>
<g class="lame" style="opacity:0"><g transform="scale(1.7)"><rect x="-6" y="-26" width="12" height="40" rx="3" fill="#cfd3da"/><rect x="-3" y="-60" width="6" height="40" rx="3" fill="#5b3a22"/></g></g></svg>
<svg class="steam" viewBox="0 0 200 200"><path d="M60 200C40 150 80 120 60 70 45 40 70 20 65 0"/><path d="M100 200C80 150 120 120 100 70 85 40 110 20 105 0"/><path d="M140 200C120 150 160 120 140 70 125 40 150 20 145 0"/></svg>`;

window.SpokenEngine.setPieces.bakery={ownsServices:true, back:'sky', stamp:[.55,.65],
mount(layer, ctx){
  const {S, mix, palette:[bg,mid,acc]}=ctx;
  if(!document.getElementById('sp-css-bakery')){ const st=document.createElement('style'); st.id='sp-css-bakery'; st.textContent=CSS.replace(/&/g,'.sp-bakery '); document.head.appendChild(st); }
  const hm=m=>S.fmt(m).replace(':00','').replace(' ','');
  layer.innerHTML=`<div class="bk-sky"></div><div class="bk-dawn"></div>${OVEN}<div class="glow"></div><div class="counter"></div><canvas></canvas><div class="obj">${LOAF}</div><div class="line"><svg viewBox="0 0 1000 40" preserveAspectRatio="none"><path d="M-10 6Q500 46 1010 6" vector-effect="non-scaling-stroke"/></svg><div class="tags"></div></div><div class="sign"><div class="flip"><b>${S.esc(ctx.t.closedNow)}</b><b>${S.esc(ctx.t.openNow)}${ctx.hours?`<small>${hm(ctx.hours.open)}–${hm(ctx.hours.close)}</small>`:''}</b></div></div>`;
  const q=s=>layer.querySelector(s), set=(k,v)=>layer.style.setProperty(k,v);
  const fire=q('.fire'), obj=q('.obj'), loaf=q('.loaf'), score=q('.score'), lame=q('.lame'), cv=q('canvas'), cx=cv.getContext('2d');
  const L=score.getTotalLength(); score.style.strokeDasharray=L;
  // the palette tints the bake: dough → gold → deep crust leaning to the shop's accent
  const DOUGH=['#F2E6CF','#E7D2AE','#D7BC90'], BAKED=['#E9AE5E',mix('#B86A2C',acc,.2),mix('#7E3B17',acc,.15)];
  set('--bk-acc',acc); set('--bk-rust',mix('#9A3B14',acc,.5)); set('--kraft',mix('#C7A57A',mid,.3)); set('--bk-fire',ctx.rgba(mix(acc,'#FF6E3C',.4),.6));
  let services=ctx.services, tags=[];
  function renderTags(){ const n=Math.min(services.length, innerWidth<760?3:4), list=services.slice(0,n);
    q('.tags').innerHTML=list.map((s,i)=>`<div class="tag" style="left:${(i+.5)/n*100}%"><i class="peg"></i><div class="card"><b>${S.esc(s.name)}</b><span>${S.esc(s.price||'')}</span></div></div>`).join('');
    tags=[...layer.querySelectorAll('.tag')].map((el,i)=>({el,i,th:0,w:0,kick:0})); }
  function size(){ const d=Math.min(devicePixelRatio||1,1.5); cv.width=Math.round(layer.clientWidth*d); cv.height=Math.round(layer.clientHeight*d); }
  renderTags(); size(); const onR=()=>{ size(); renderTags(); }; addEventListener('resize',onR);
  const dust=[...Array(80)].map(()=>({x:Math.random(),y:Math.random(),r:.6+Math.random()*1.8,v:.02+Math.random()*.05,a:Math.random()*6}));
  // the bakery always tells the dawn story: hours set the clock, the light follows the bake
  const dawnAt=p=>S.sm(S.seg(p,.45,.8));
  return {
    light:p=>.06+.94*dawnAt(p),
    setServices(list){ services=list; renderTags(); },
    destroy(){ removeEventListener('resize',onR); },
    update(p,f){
      // every tenth of the scroll is a different moment: ignite, rise, push in and score, bake, dawn, the name, the tags, out of the oven
      const fireUp=S.sm(S.seg(p,0,.16)), rise=S.sm(S.seg(p,.03,.22)), cut=S.seg(p,.2,.32), push=S.sm(S.seg(p,.15,.24))*(1-S.sm(S.seg(p,.33,.43))),
        bake=S.sm(S.seg(p,.32,.5)), dawn=dawnAt(p), hang=S.seg(p,.65,.84), out=S.sm(S.seg(p,.85,.97)), T=f.tones;
      set('--bk-a',T.sky1); set('--bk-b',T.sky2); set('--bk-c',T.wall2); set('--bk-sun',ctx.rgba(mix(bg,'#FFD6AA',.5),.85)); set('--dawn',dawn.toFixed(3));
      set('--bk-arch',T.arch); set('--oven',(1-dawn*.35-out*.25).toFixed(3)); fire.style.opacity=(.12+.88*fireUp*(1-out*.5)).toFixed(3);
      set('--glow-o',(fireUp*(.45+bake*.5)*(1-dawn*.45)*(1-out*.4)).toFixed(3));
      set('--wood-a',mix(mix('#3b2416',mid,.15),mix('#a77c50',mid,.25),dawn)); set('--wood-b',mix(mix('#1d120c',mid,.1),mix('#7a5233',mid,.25),dawn));
      loaf.style.transform=`scale(${(.84+rise*.16).toFixed(3)},${(.46+rise*.54).toFixed(3)})`;
      ['--c1','--c2','--c3'].forEach((k,i)=>set(k,mix(DOUGH[i],BAKED[i],bake)));
      set('--flour',(S.seg(p,.03,.12)*(1-bake*.85)).toFixed(3)); set('--open',(cut*5+bake*13).toFixed(1)+'px');
      score.style.strokeDashoffset=(L*(1-cut)).toFixed(1);
      if(cut>0&&cut<1){ const pt=score.getPointAtLength(L*cut); lame.style.opacity=1; lame.setAttribute('transform',`translate(${pt.x},${pt.y-4}) rotate(18)`); } else lame.style.opacity=0;
      set('--steam',(S.seg(p,.46,.56)*(1-S.seg(p,.9,1)*.6)).toFixed(3)); set('--twine',S.seg(p,.64,.7).toFixed(3));
      // the camera pushes in for the cut, and at the end the loaf comes out of the oven, forward onto the counter
      set('--zoom',(1+push*.38+out*.24).toFixed(3)); set('--lift',(out*11).toFixed(1)+'%');
      set('--sign-o',S.seg(p,.84,.88).toFixed(3)); set('--flip',(-180*S.sm(S.seg(p,.9,.99))).toFixed(1)+'deg');
      tags.forEach(g=>{ const e=S.seg(hang,g.i*.16,g.i*.16+.45), y=-150*(1-S.backOut(e));
        if(e>.3&&!g.kick){ g.kick=1; g.w+=(g.i%2?-1:1)*2.6; } if(e<.05) g.kick=0;
        if(!ctx.reduce){ g.w+=(-24*g.th-2.4*g.w+S.clamp(f.vel*28,-6,6)+Math.sin(f.now/900+g.i)*.15)*f.dt; g.th+=g.w*f.dt; }
        g.el.style.opacity=e>0?1:0; g.el.style.transform=`translateY(${y.toFixed(1)}%) rotate(${(g.th*12).toFixed(2)}deg)`; });
      const W=cv.width, H=cv.height, puff=Math.max(S.seg(p,.03,.1)*(1-S.seg(p,.1,.2)), f.stamp>.5&&f.stamp<1?1:(f.stamp>=1?1-S.seg(p,.65,.7):0)); cx.clearRect(0,0,W,H);
      if(!ctx.reduce) for(const d of dust){ d.y+=d.v*(1+puff*6)*f.dt; d.x+=Math.sin(d.a+f.now/2400)*.0006; if(d.y>1){ d.y=0; d.x=Math.random(); }
        cx.fillStyle=`rgba(255,${Math.round(236-(1-dawn)*40)},${Math.round(214-(1-dawn)*80)},${(.18+puff*.55)*(d.y<.78?1:0)})`; cx.beginPath(); cx.arc(d.x*W,d.y*H,d.r*(W/900+.6),0,6.283); cx.fill(); }
    }};
}};
})();

/* Set piece: record shop. A turntable under one spotlight: the record turns with the scroll, the tonearm swings over and drops,
   the needle finds the groove, and the prices slam in one by one, huge. Palette, hours and services drive it. */
(function(){
const CSS=`.sp-records .rc-wall{position:absolute;inset:0;background:linear-gradient(180deg,var(--rc-a),var(--rc-b))}
.sp-records .rc-wall:after{content:"";position:absolute;inset:0;background:radial-gradient(90% 55% at 50% 100%,var(--acc),transparent 70%);opacity:calc(var(--haze,0)*.32)}
.sp-records .rc-spot{position:absolute;inset:0;background:radial-gradient(42% 60% at var(--rc-x) 44%,var(--rc-glow),transparent 70%);opacity:var(--spot)}
.sp-records .tt{position:absolute;left:50%;top:35.5%;width:min(80vw,440px);aspect-ratio:600/520;transform:translate(-50%,0) translate(var(--sx),var(--sy))}
.sp-records .tt svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.sp-records .sheen{position:absolute;left:4.17%;top:4.81%;width:78.33%;height:90.38%;border-radius:50%;background:conic-gradient(from 20deg,transparent 0 8%,rgba(255,255,255,.13) 13%,transparent 19% 50%,rgba(255,255,255,.09) 56%,transparent 62%);mix-blend-mode:screen;pointer-events:none}
.sp-records .px{position:absolute;z-index:7;left:16px;right:16px;bottom:13%;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
.sp-records .pi{opacity:0;transform-origin:30% 70%}
.sp-records .pi span{display:block;font-family:var(--display);font-size:clamp(40px,11vw,64px);line-height:.92;color:var(--acc);text-shadow:0 6px 0 rgba(0,0,0,.55);white-space:nowrap}
.sp-records .pi span.long{font-size:clamp(30px,8.6vw,44px)}
.sp-records .pi b{display:block;margin-top:2px;font-family:var(--mono);font-weight:500;font-size:12px;color:var(--rc-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(max-width:759px){.sx-stage:has(.sp-records) .sx-kick{top:auto;bottom:27.5%}}
@media(min-width:760px){.sp-records .tt{left:73%;top:13%;width:min(46vw,64vh,640px);transform:translate(-50%,0) translate(var(--sx),var(--sy))}
.sp-records .px{left:max(20px,5vw);right:max(20px,5vw);bottom:12%;display:flex;justify-content:space-between;gap:24px}
.sp-records .pi span{font-size:clamp(56px,8.4vw,132px)}.sp-records .pi span.long{font-size:clamp(40px,5.4vw,84px)}.sp-records .pi b{font-size:13px}}`;

window.SpokenEngine.setPieces.records={ownsServices:true, back:'wall', stamp:[.42,.5],
mount(layer, ctx){
  const {S, mix, rgba, palette:[bg,mid,acc]}=ctx;
  if(!document.getElementById('sp-css-records')){ const st=document.createElement('style'); st.id='sp-css-records'; st.textContent=CSS; document.head.appendChild(st); }
  const vinyl=mix('#0c0c0f',mid,.12), lab=ctx.inkFor(acc), plinth=mix(mix(bg,'#ffffff',.06),mid,.35);
  const h=ctx.hours, hh=m=>S.fmt(m).replace(':00','').replace(' ',''), open=h?`open ${hh(h.open)}–${hh(h.close)}`:(ctx.city||'');
  let grooves=''; for(let r=92;r<232;r+=3.2) grooves+=`<circle r="${r}" stroke-opacity="${(.045+((r*7)%5)/70).toFixed(3)}"/>`;
  const name=S.esc(ctx.name).toUpperCase(), sleeve=mix(mid,'#000000',.35);
  layer.innerHTML=`<div class="rc-wall"></div><div class="rc-spot"></div><div class="tt"><svg viewBox="0 0 600 520" aria-hidden="true">
<defs><path id="rc-arc" d="M-58 0A58 58 0 1 1 58 0"/><radialGradient id="rc-vin" r=".5"><stop offset=".3" stop-color="${vinyl}"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
<rect x="6" y="18" width="588" height="496" rx="22" fill="rgba(0,0,0,.5)" transform="translate(0 10)"/><rect x="6" y="6" width="588" height="500" rx="22" fill="${plinth}"/>
<rect x="6" y="6" width="588" height="500" rx="22" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2"/>
<circle cx="260" cy="260" r="244" fill="${mix(plinth,'#000000',.45)}"/>
<g class="disc" transform="translate(260 260)"><circle r="236" fill="url(#rc-vin)"/><g fill="none" stroke="#fff" stroke-width="1">${grooves}</g>
<circle r="86" fill="${acc}"/><circle r="86" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="3"/>
<text font-family="var(--mono)" font-size="15" fill="${lab}" letter-spacing="1"><textPath href="#rc-arc" startOffset="50%" text-anchor="middle">${name}</textPath></text>
<text y="34" text-anchor="middle" font-family="var(--mono)" font-size="13" fill="${lab}">${S.esc(open)}</text><text y="54" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="${lab}" opacity=".7">33⅓</text>
<circle r="7" fill="#d8d8dc"/></g>
<g class="rings" transform="translate(260 260)" fill="none" stroke="${acc}" stroke-width="3"><circle/><circle/><circle/></g>
<g class="slv"><rect x="14" y="14" width="492" height="492" rx="6" fill="${sleeve}"/><rect x="14" y="330" width="492" height="64" fill="${acc}"/><circle cx="260" cy="190" r="118" fill="none" stroke="${acc}" stroke-width="10"/><circle cx="260" cy="190" r="74" fill="${acc}" opacity=".35"/>
<text x="260" y="376" text-anchor="middle" font-family="var(--display)" font-size="40" fill="${lab}"${name.length>16?' textLength="440" lengthAdjust="spacingAndGlyphs"':''}>${name}</text></g>
<circle class="led" cx="44" cy="474" r="6" fill="${acc}"/><circle cx="560" cy="474" r="16" fill="${mix(plinth,'#000000',.3)}"/>
<g class="arm" transform="rotate(0 528 74)"><circle cx="528" cy="74" r="30" fill="${mix(plinth,'#000000',.35)}"/>
<g class="armbody"><path class="ash" d="M534 86L548 330L520 392" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M528 74L542 320L514 382" fill="none" stroke="#d6d7db" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="498" y="372" width="30" height="40" rx="5" fill="#2b2b30" transform="rotate(22 514 392)"/><circle cx="528" cy="74" r="14" fill="#9fa1a8"/><rect x="514" y="24" width="28" height="34" rx="6" fill="#55565c"/></g></g>
</svg><div class="sheen"></div></div><div class="px"></div>`;
  const q=s=>layer.querySelector(s), set=(k,v)=>layer.style.setProperty(k,v);
  const slv=q('.slv'), rings=[...layer.querySelectorAll('.rings circle')], disc=q('.disc'), arm=q('.arm'), body=q('.armbody'), ash=q('.ash'), led=q('.led');
  set('--acc',acc); set('--rc-ink',mix(ctx.inkFor(bg),acc,.15));
  let pis=[];
  function renderPrices(list){ const n=Math.min(list.length,4);
    q('.px').innerHTML=list.slice(0,n).map(s=>{ const pr=String(s.price||'');
      return `<div class="pi"><span class="${pr.length>5?'long':''}">${S.esc(pr||'·')}</span><b>${S.esc(s.name)}</b></div>`; }).join('');
    pis=[...layer.querySelectorAll('.pi')].map((el,i)=>({el,i,hit:0})); }
  renderPrices(ctx.services);
  let rot=0, shake=0, dropped=0;
  return {
    light:()=>.1,
    setServices(list){ renderPrices(list); },
    update(p,f){
      const T=f.tones, swing=S.sm(S.seg(p,.28,.4)), drop=S.sm(S.seg(p,.4,.46)), play=drop>=1?1:0;
      set('--rc-a',T.wall); set('--rc-b',T.wall2); set('--rc-x',f.mobile?'50%':'73%');
      set('--rc-glow',rgba(mix(acc,'#ffffff',.55),.22+.2*drop)); set('--spot',S.sm(S.seg(p,0,.1)).toFixed(3)); set('--haze',S.sm(S.seg(p,.9,1)).toFixed(3));
      // the record comes out of its sleeve (.06–.24), sound rings pulse once the needle is down (.46–.6), the room lights up at the end (.9–1)
      const out=S.sm(S.seg(p,.06,.24)); slv.setAttribute('transform',`translate(${(-out*640).toFixed(1)} ${(out*30).toFixed(1)}) rotate(${(-out*8).toFixed(2)} 260 260)`); slv.style.opacity=(1-S.seg(p,.2,.26)).toFixed(3);
      rings.forEach((c,k)=>{ const t=S.seg(p,.46,.6), u=t>0&&t<1?((t*3+k/3)%1):0; c.setAttribute('r',(236+130*u).toFixed(1)); c.style.opacity=u?((1-u)*.7).toFixed(3):0; });
      if(!ctx.reduce) rot=(rot+f.dt*(play?198:24+Math.min(Math.abs(f.vel),6)*40))%360;
      disc.setAttribute('transform',`translate(260 260) rotate(${((ctx.reduce?0:p*720)+rot).toFixed(1)})`);
      arm.setAttribute('transform',`rotate(${(swing*25).toFixed(2)} 528 74)`);
      const lift=(1-drop)*swing; body.setAttribute('transform',`translate(${(-lift*3).toFixed(1)} ${(-lift*7).toFixed(1)})`);
      ash.setAttribute('transform',`translate(${(lift*6).toFixed(1)} ${(lift*12).toFixed(1)})`); ash.style.opacity=.6-lift*.35;
      if(play&&!dropped&&!ctx.reduce) shake=.5; dropped=play;
      led.style.opacity=play?(.6+.4*Math.abs(Math.sin(f.now/260))):.15;
      const n=pis.length||1;
      pis.forEach(g=>{ const a=.52+g.i*(.4/n), e=S.seg(p,a,a+.07);
        if(e>=1&&!g.hit){ g.hit=1; if(!ctx.reduce) shake=1; } if(e<1) g.hit=0;
        const s=ctx.reduce?1:(e<1?2.6-1.6*e*e:1);
        g.el.style.opacity=ctx.reduce?e:(e>0?Math.min(1,e*2.2):0); g.el.style.transform=`scale(${s.toFixed(3)}) rotate(${(e<1&&!ctx.reduce?(1-e)*-6:0).toFixed(2)}deg)`; });
      shake*=Math.exp(-f.dt*9); const k=shake*7;
      set('--sx',(k*Math.sin(f.now*.09)).toFixed(1)+'px'); set('--sy',(k*Math.cos(f.now*.11)).toFixed(1)+'px');
    }};
}};
})();

/* Set piece: bookshop. Spines drop onto a shelf one by one, a clothbound book with the shop's name on its cover waits under
   a reading lamp, then the cover turns: the endpaper holds the name and the hours, the facing page is the contents (the services). */
(function(){
const CSS=`.sp-books .bo-wall{position:absolute;inset:0;background:linear-gradient(180deg,var(--bo-a),var(--bo-b))}
.sp-books .bo-lamp{position:absolute;inset:0;background:radial-gradient(46% 50% at 50% 48%,var(--bo-glow),transparent 72%)}
.sp-books .row{position:absolute;left:3%;right:3%;bottom:calc(100% - var(--shelf));height:var(--rowh);display:flex;align-items:flex-end;gap:2px;clip-path:inset(-200% 0 0 0)}
.sp-books .s{flex:none;border-radius:2px 2px 0 0;box-shadow:inset -3px 0 0 rgba(0,0,0,.18),inset 2px 0 0 rgba(255,255,255,.1);opacity:0}
.sp-books .plank{position:absolute;left:0;right:0;top:var(--shelf);height:16px;background:linear-gradient(180deg,var(--bo-wood),var(--bo-wood2));box-shadow:0 14px 18px -8px rgba(0,0,0,.45)}
.sp-books .book{position:absolute;left:50%;top:var(--top);width:calc(var(--pw)*2);height:calc(var(--pw)*1.45);perspective:calc(var(--pw)*7);transform-origin:75% 0}
.sp-books .shadow{position:absolute;left:var(--sh-l);right:-2%;bottom:-6%;height:12%;border-radius:50%;background:rgba(0,0,0,.4);filter:blur(10px)}
.sp-books .pg{position:absolute;top:0;left:50%;width:50%;height:100%;background:var(--paper);color:#2A2520;box-shadow:3px 3px 0 #e2d9c8,6px 6px 0 #d4c9b4,8px 10px 18px rgba(0,0,0,.3);padding:calc(var(--pw)*.12) calc(var(--pw)*.1);box-sizing:border-box}
.sp-books .pg h3{margin:0 0 calc(var(--pw)*.07);font-family:var(--voice);font-style:italic;font-weight:400;font-size:calc(var(--pw)*.09)}
.sp-books .pg li{display:flex;align-items:baseline;gap:6px;margin:0 0 calc(var(--pw)*.05);font-family:var(--display);font-size:calc(var(--pw)*.068);line-height:1.15;opacity:0}
.sp-books .pg li i{flex:1;border-bottom:1.5px dotted rgba(42,37,32,.45);transform:translateY(-3px)}
.sp-books .pg li b{font-family:var(--mono);font-weight:500;font-size:calc(var(--pw)*.06);white-space:nowrap}
.sp-books .pg ul{list-style:none;margin:0;padding:0}
.sp-books .cv{position:absolute;left:50%;top:-1.5%;width:51.5%;height:103%;transform-origin:0 50%;transform-style:preserve-3d}
.sp-books .cv>div{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-sizing:border-box}
.sp-books .front{background:repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),linear-gradient(100deg,rgba(0,0,0,.28),transparent 9%),var(--cloth);border-radius:2px 6px 6px 2px;color:var(--foil);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12%;box-shadow:0 18px 30px -12px rgba(0,0,0,.55)}
.sp-books .front:before{content:"";position:absolute;inset:6%;border:1.5px solid currentColor;opacity:.7}
.sp-books .front .em{width:34%;margin-bottom:8%}.sp-books .front .em svg{width:100%;height:auto;--ic-ink:var(--foil);--ic-mid:transparent;--ic-acc:var(--foil)}
.sp-books .front h2{font-family:var(--display);font-size:calc(var(--pw)*.15);line-height:1.02;margin:0}
.sp-books .front p{margin:6% 0 0;font-family:var(--voice);font-style:italic;font-size:calc(var(--pw)*.065);line-height:1.3;opacity:.85}
.sp-books .back{transform:rotateY(180deg);background:var(--endp);color:#2A2520;border-radius:6px 2px 2px 6px;padding:calc(var(--pw)*.12) calc(var(--pw)*.1);display:flex;flex-direction:column;justify-content:center}
.sp-books .back small{font-family:var(--voice);font-style:italic;font-size:calc(var(--pw)*.065);opacity:.7}
.sp-books .back h2{margin:4% 0 6%;font-family:var(--display);font-size:calc(var(--pw)*.16);line-height:1;color:var(--acc-text)}
.sp-books .back hr{width:30%;margin:0 0 7%;border:0;border-top:1.5px solid currentColor;opacity:.4}
.sp-books .back p{margin:0 0 3%;font-family:var(--mono);font-size:calc(var(--pw)*.058);line-height:1.4}
.sp-books .rib{position:absolute;z-index:3;left:calc(50% + 10px);top:-2%;width:calc(var(--pw)*.07);height:78%;background:var(--cloth);clip-path:polygon(0 0,100% 0,100% 100%,50% 92%,0 100%);transform-origin:50% 0;transform:scaleY(var(--rib,0))}
.sp-books .stp{position:absolute;right:9%;bottom:9%;padding:6px 10px;border:2px solid var(--acc-text);border-radius:4px;color:var(--acc-text);font-family:var(--mono);font-weight:500;font-size:calc(var(--pw)*.058);line-height:1.35;text-align:center;opacity:0}
@media(max-width:759px){.sx-stage:has(.sp-books) .sx-kick{top:auto;bottom:19%}}
@media(min-width:760px){.sx-stage:has(.sp-books) .sx-kick{top:44%;max-width:16ch}}`;
const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dayText(days){ if(!days||!days.length) return ''; if(days.length===7) return 'Every day';
  const st=days.find(d=>!days.includes((d+6)%7)); if(st==null) return days.map(d=>D[d]).join(', ');
  let n=0; while(days.includes((st+n+1)%7)) n++; return n+1===days.length?(n?`${D[st]}–${D[(st+n)%7]}`:D[st]):days.map(d=>D[d]).join(', '); }

window.SpokenEngine.setPieces.books={ownsServices:true, ownsTitle:true, back:'wall',
mount(layer, ctx){
  const {S, mix, rgba, palette:[bg,mid,acc]}=ctx, e=S.esc;
  if(!document.getElementById('sp-css-books')){ const st=document.createElement('style'); st.id='sp-css-books'; st.textContent=CSS; document.head.appendChild(st); }
  const light=ctx.inkFor(acc)!==ctx.inkFor('#ffffff'), foil=light?mix('#E4C47E',acc,.12):'#2A2520';
  const h=ctx.hours, hh=m=>S.fmt(m).replace(':00','').replace(' ',''), hours=h?`${dayText(h.days)} · ${hh(h.open)}–${hh(h.close)}`:'';
  const stampText=h?`${e(dayText(h.days))}<br>${e(hh(h.open))}–${e(hh(h.close))}`:e(ctx.city||''), R=ctx.rnd, tones=[acc, mix(acc,'#000000',.35), mix(mid,'#000000',.45), mix(mid,'#000000',.2), mix(acc,'#8A3A2A',.55), mix(bg,'#000000',.25), mix(acc,mid,.5), mix('#2B3550',acc,.3)];
  const spines=[...Array(64)].map((_,i)=>{ const w=Math.round(14+R()*20), ht=Math.round(58+R()*40), c=tones[Math.floor(R()*tones.length)], band=R()<.6, lab=R()<.25;
    const bg2=[band?`linear-gradient(transparent 10%,${rgba('#E4C47E',.75)} 10% 12.5%,transparent 12.5% 86%,${rgba('#E4C47E',.75)} 86% 88.5%,transparent 88.5%)`:'', lab?`linear-gradient(transparent 30%,${rgba('#F4EFE6',.85)} 30% 46%,transparent 46%)`:'', c].filter(Boolean).join(',');
    return `<div class="s" style="width:${w}px;height:${ht}%;background:${bg2}"></div>`; }).join('');
  const icon=ctx.objects&&ctx.objects[0]?ctx.icon(ctx.objects[0]):'';
  layer.innerHTML=`<div class="bo-wall"></div><div class="bo-lamp"></div><div class="row">${spines}</div><div class="plank"></div>
<div class="book"><div class="shadow"></div><div class="pg"><h3>${e(ctx.t&&ctx.t.services||'Contents')}</h3><ul></ul>${stampText?`<div class="stp">${stampText}</div>`:''}</div><i class="rib"></i>
<div class="cv"><div class="front">${icon?`<div class="em">${icon}</div>`:''}<h2>${e(ctx.name)}</h2>${ctx.tagline?`<p>${e(ctx.tagline)}</p>`:''}</div>
<div class="back"><small>Ex libris</small><h2>${e(ctx.name)}</h2><hr>${hours?`<p>${e(hours)}</p>`:''}${ctx.city?`<p>${e(ctx.city)}</p>`:''}</div></div></div>`;
  const q=s=>layer.querySelector(s), set=(k,v)=>layer.style.setProperty(k,v);
  const stp=q('.stp'), lamp=q('.bo-lamp'), book=q('.book'), cv=q('.cv'), sp=[...layer.querySelectorAll('.s')];
  set('--cloth',acc); set('--foil',foil); set('--paper',mix('#F7F1E5',bg,.2)); set('--endp',mix(mix('#EFE6D4',bg,.3),acc,.06));
  let lis=[];
  function renderList(list){ q('.pg ul').innerHTML=list.slice(0,6).map(s=>`<li><span>${e(s.name)}</span><i></i><b>${e(s.price||'')}</b></li>`).join(''); lis=[...layer.querySelectorAll('.pg li')]; }
  function size(){ const W=layer.clientWidth, H=layer.clientHeight, mob=W<760;
    const pw=mob?Math.min(W*.46,210):Math.min(H*.56/1.45,W*.24,330);
    set('--pw',pw.toFixed(1)+'px'); set('--shelf',(mob?21:27)+'%'); set('--rowh',(mob?12:14)+'%'); set('--top',(mob?Math.max(H*.25,0):H*.31).toFixed(0)+'px'); }
  renderList(ctx.services); size(); addEventListener('resize',size);
  return {
    setServices(list){ renderList(list); },
    destroy(){ removeEventListener('resize',size); },
    update(p,f){
      const T=f.tones, turn=S.sm(S.seg(p,.45,.62)), mob=f.mobile;
      set('--bo-a',T.wall); set('--bo-b',T.wall2); set('--bo-glow',rgba(mix('#FFD9A0',acc,.1),.5-.25*T.L));
      set('--bo-wood',mix(mix('#5a3d26',mid,.2),'#000000',.3*(1-T.L))); set('--bo-wood2',mix('#3a2717','#000000',.3*(1-T.L)));
      const n=sp.length; sp.forEach((el,i)=>{ const a=.04+(i/n)*.3, k=ctx.reduce?1:S.seg(p,a,a+.08);
        el.style.opacity=k>0?1:0; el.style.transform=`translateY(${(-(1-S.backOut(k))*240).toFixed(1)}%)`; });
      // the book comes toward you while the shelf fills and the lamp warms (0–.42); after it opens: contents, a ribbon, then a date stamp with the hours
      const near=S.sm(S.seg(p,0,.42)), sc=((mob?1.22:1.12)-(mob?.22:.12)*turn)*(.8+.2*near);
      lamp.style.opacity=(.25+.75*S.sm(S.seg(p,.18,.42))).toFixed(3); set('--rib',S.sm(S.seg(p,.76,.86)).toFixed(3));
      if(stp){ const k=S.seg(p,.9,.97); stp.style.opacity=k>0?1:0; stp.style.transform=`scale(${(ctx.reduce?1:2.2-1.2*S.backOut(k)).toFixed(3)}) rotate(-8deg)`; }
      book.style.transform=`translateY(${((mob?turn*9:0)-(1-near)*5).toFixed(2)}vh) translateX(${(-50-25*(1-turn)).toFixed(2)}%) scale(${sc.toFixed(3)})`;
      q('.shadow').style.setProperty('--sh-l',(50-52*turn).toFixed(1)+'%');
      if(ctx.reduce){ cv.style.transform=turn>.5?'rotateY(-180deg)':'none'; }
      else cv.style.transform=`rotateY(${(-180*turn).toFixed(2)}deg)`;
      lis.forEach((li,i)=>{ const k=S.seg(p,.6+i*.04,.67+i*.04); li.style.opacity=k.toFixed(3); li.style.transform=`translateY(${((1-k)*6).toFixed(1)}px)`; });
    }};
}};
})();
