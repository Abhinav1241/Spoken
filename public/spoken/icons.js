/* Spoken icon library. One style: a 64x64 grid, one thick ink line (stroke), a mid-tone fill (.m), one accent shape (.a or .as stroke).
   Colours come from the scene palette, so every icon works on every site. Ids and keywords are what the LLM may choose from. */
(function(){
const gear=(cx,cy,r1,r2,n)=>{ let d=''; for(let i=0;i<n*2;i++){ const a0=i/(n*2)*Math.PI*2, a1=(i+1)/(n*2)*Math.PI*2, r=i%2?r1:r2; const p=a=>`${(cx+Math.cos(a)*r).toFixed(1)} ${(cy+Math.sin(a)*r).toFixed(1)}`; d+=(i?'L':'M')+p(a0+.08)+'L'+p(a1-.08); } return d+'Z'; };
const star=(cx,cy,R,r)=>{ let d=''; for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r:R; d+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1); } return d+'Z'; };
const grain=(y,s)=>`<path class="m" d="M32 ${y}c${-7*s} -1 ${-10*s} -7 ${-9*s} -12c${6*s} 1 ${10*s} 6 ${9*s} 12z"/>`;

const L=[
 /* food & drink */
 ['loaf','bread loaf sourdough bakery baker boulangerie panadería padaria bäckerei','<path class="m" d="M8 42c0-13 11-22 24-22s24 9 24 22c0 4-3 6-6 6H14c-3 0-6-2-6-6z"/><path d="M20 30l7 6M31 27l7 6M42 29l5 5"/><path class="as" d="M6 54h52"/>'],
 ['croissant','croissant pastry viennoiserie bakery café breakfast','<path class="m" d="M8 42c6-15 16-23 24-23s18 8 24 23c-6 2-11 0-14-4-2 4-6 6-10 6s-8-2-10-6c-3 4-8 6-14 4z"/><path d="M24 25l3 13M40 25l-3 13M32 21v17"/>'],
 ['cake','cake birthday patisserie dessert celebration bakery','<rect class="m" x="12" y="30" width="40" height="20" rx="3"/><path d="M12 38c4 4 8 4 10 0s6-4 10 0 6 4 10 0 6-4 10 0M32 30v-8M8 50h48"/><path class="a" d="M32 13c3 3 3 6 0 8-3-2-3-5 0-8z"/>'],
 ['coffee_cup','coffee cup café espresso latte cafe barista','<path class="m" d="M14 26h30v14a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z"/><path d="M44 30h4a6 6 0 0 1 0 12h-4M10 57h40"/><path class="as" d="M22 19c0-3 3-3 3-6M31 19c0-3 3-3 3-6"/>'],
 ['coffee_beans','coffee beans roastery roaster origin','<ellipse class="m" cx="24" cy="28" rx="10" ry="14" transform="rotate(-25 24 28)"/><path d="M19 17c7 6 2 16 9 23"/><ellipse class="a" cx="42" cy="40" rx="9" ry="13" transform="rotate(20 42 40)"/><path d="M46 29c-6 6-1 15-7 22"/>'],
 ['teapot','tea teapot tearoom chai','<path class="m" d="M16 30h28c2 0 4 2 4 4 0 10-8 18-18 18s-18-8-18-18c0-2 2-4 4-4z"/><path d="M48 37l9-9M14 34c-7 0-7 11 0 11M24 30c0-6 12-6 12 0"/><circle class="a" cx="30" cy="22" r="2.5"/>'],
 ['wine_glass','wine bar restaurant glass vino tasca bistro','<path class="m" d="M21 9h22c0 15-4 23-11 23s-11-8-11-23z"/><path class="a" d="M22 17h20c-1 8-4 12-10 12s-9-4-10-12z"/><path d="M32 32v17M23 51h18"/>'],
 ['beer','beer pub brewery bar pint ale','<rect class="m" x="14" y="20" width="26" height="33" rx="3"/><path class="a" d="M12 22c0-6 6-8 10-6 2-4 10-4 12 0 4-2 8 2 8 6z"/><path d="M40 27h6a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-6M22 29v17M32 29v17"/>'],
 ['pizza','pizza pizzeria italian slice','<path class="m" d="M32 57L10 17c14-6 30-6 44 0z"/><path d="M8 13c16-7 32-7 48 0"/><circle class="a" cx="28" cy="27" r="4"/><circle class="a" cx="38" cy="33" r="3.5"/><circle class="a" cx="31" cy="43" r="3"/>'],
 ['noodle_bowl','noodles ramen bowl soup asian restaurant comida food kitchen','<path class="m" d="M8 32h48c0 12-10 20-24 20S8 44 8 32z"/><path d="M24 52h16M17 31c2-8 6 0 8-8s6 0 8-8"/><path class="as" d="M36 30L54 8M42 32L58 14"/>'],
 ['fish','fish seafood fishmonger sushi bacalhau restaurant','<path class="m" d="M8 32c8-12 24-14 36-6l10-8v28l-10-8C32 46 16 44 8 32z"/><path d="M28 24c3 5 3 11 0 16"/><circle class="a" cx="19" cy="30" r="2.6"/>'],
 ['wheat','wheat grain flour farm organic bakery harvest',`<path d="M32 58V12"/>${grain(22,1)}${grain(22,-1)}${grain(32,1)}${grain(32,-1)}${grain(42,1)}${grain(42,-1)}<path class="a" d="M32 14c-2-4 0-8 0-8s2 4 0 8z"/>`],
 /* books & paper */
 ['book_stack','books bookshop bookstore library secondhand reading','<rect class="m" x="10" y="41" width="44" height="10" rx="2"/><rect class="a" x="14" y="31" width="38" height="10" rx="2"/><rect class="m" x="12" y="21" width="36" height="10" rx="2"/><path d="M17 41v10M21 31v10M18 21v10"/>'],
 ['open_book','book reading literature poetry tutor teaching lessons','<path class="m" d="M32 18c-8-6-18-6-24-4v34c6-2 16-2 24 4 8-6 18-6 24-4V14c-6-2-16-2-24 4z"/><path d="M32 18v34M14 25c4-1 8-1 12 1M14 33c4-1 8-1 12 1M38 26c4-2 8-2 12-1"/><path class="as" d="M38 34c4-2 8-2 12-1"/>'],
 ['pen','pen writing stationery calligraphy notary','<path class="m" d="M40 8l16 16-24 24-12 4 4-12z"/><path d="M36 12l16 16"/><path class="a" d="M20 40l-6 16 16-6z"/>'],
 /* plants & flowers */
 ['tulip','tulip flower florist fleur flor blume','<path d="M32 58V30"/><path class="m" d="M32 48c-9 0-13-7-13-11 7 0 11 5 13 11zM32 44c9 0 13-7 13-11-7 0-11 5-13 11z"/><path class="a" d="M22 12l5 6 5-8 5 8 5-6v12a10 10 0 0 1-20 0z"/>'],
 ['bouquet','bouquet flowers florist wedding bunch fleuriste','<path class="m" d="M20 34h24l-8 23h-8z"/><path d="M28 34l-4-10M32 34V20M36 34l4-10M26 43h12"/><circle class="a" cx="23" cy="20" r="6"/><circle class="a" cx="32" cy="13" r="6"/><circle class="a" cx="41" cy="20" r="6"/>'],
 ['potted_plant','plant houseplant nursery garden green studio','<path class="a" d="M20 40h24l-3 16H23z"/><path d="M18 40h28M32 40V26"/><path class="m" d="M32 40c0-10-10-14-16-14 0 8 6 14 16 14zM32 40c0-12 8-20 16-20 0 10-6 18-16 20z"/>'],
 ['leaf','leaf natural organic vegan eco garden landscaping','<path class="m" d="M12 52C12 26 30 12 54 10c0 26-16 42-42 42z"/><path d="M12 52L44 20M24 40h10M31 33l-1-8"/><path class="as" d="M44 20l6-6"/>'],
 ['sun','sun morning summer outdoor light solar','<circle class="a" cx="32" cy="32" r="11"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M15 49l6-6M43 21l6-6"/>'],
 /* music */
 ['vinyl','vinyl record music records shop dj','<circle class="m" cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="17"/><circle class="a" cx="32" cy="32" r="7"/><circle cx="32" cy="32" r="1.4"/><path d="M19 21c3-3 8-5 13-5"/>'],
 ['guitar','guitar music lessons band luthier live','<ellipse class="m" cx="31" cy="33" rx="9" ry="8" transform="rotate(-45 31 33)"/><ellipse class="m" cx="23" cy="42" rx="13" ry="12" transform="rotate(-45 23 42)"/><circle cx="25" cy="40" r="3.4"/><path d="M34 30L54 10"/><path class="a" d="M50 7l7 7-4 4-7-7z"/>'],
 ['headphones','headphones music audio sound studio podcast','<path d="M12 38v-6a20 20 0 0 1 40 0v6"/><rect class="a" x="8" y="36" width="10" height="17" rx="4"/><rect class="a" x="46" y="36" width="10" height="17" rx="4"/><path class="as" d="M28 30h8"/>'],
 /* repair & tools */
 ['bicycle','bike bicycle cycling repair bikes fiets fahrrad','<circle class="m" cx="16" cy="42" r="10"/><circle class="m" cx="48" cy="42" r="10"/><path d="M16 42l10-16h16l6 16M26 26l8 16H16M42 26l-2-6h6"/><rect class="a" x="21" y="17" width="10" height="4" rx="2"/>'],
 ['wrench','wrench spanner repair mechanic fix handyman garage','<path class="m" d="M45 8a12 12 0 0 0-11 16L10 48a5 5 0 0 0 7 7l23-24a12 12 0 0 0 16-11l-7 7-7-2-2-7z"/><circle class="a" cx="14" cy="51" r="2"/>'],
 ['hammer','hammer carpentry handyman builder diy fix construction','<rect class="m" x="29" y="20" width="7" height="37" rx="3"/><path class="a" d="M16 10h28a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H22c-4 0-8-4-8-8z"/><path d="M14 12c-5 0-6 6-6 6"/>'],
 ['screwdriver','screwdriver repair electronics phone fix tools','<rect class="a" x="26" y="6" width="12" height="22" rx="4"/><path d="M30 12v10M34 12v10M32 28v20"/><path class="m" d="M29 48h6l-3 9z"/>'],
 ['gear','gear cog mechanic engineering machine service workshop',`<path class="m" d="${gear(32,32,16,22,8)}"/><circle class="a" cx="32" cy="32" r="7"/>`],
 ['faucet','tap faucet plumbing plumber kitchen bathroom water','<path class="m" d="M8 20h28a10 10 0 0 1 10 10v6h-9v-4a4 4 0 0 0-4-4H8z"/><path d="M22 20v-8M15 12h14"/><path class="a" d="M41 43c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z"/>'],
 ['pipe','pipe plumbing plumber drain heating pipes','<path class="m" d="M8 20h24a12 12 0 0 1 12 12v25H34V32a2 2 0 0 0-2-2H8z"/><path d="M16 18v14M32 44h14"/><path class="as" d="M30 46h18"/>'],
 ['drop','water drop leak plumbing cleaning ink liquid','<path class="a" d="M32 7c10 14 16 22 16 31a16 16 0 0 1-32 0c0-9 6-17 16-31z"/><path d="M24 39a8 8 0 0 0 6 8"/>'],
 /* beauty */
 ['scissors','scissors hair salon barber haircut grooming tailor','<circle class="m" cx="17" cy="47" r="7"/><circle class="m" cx="45" cy="47" r="7"/><path d="M21 41L44 9M41 41L18 9"/><circle class="a" cx="31" cy="26" r="2.6"/>'],
 ['comb','comb hair barber salon grooming','<rect class="m" x="8" y="20" width="48" height="10" rx="3"/><path d="M12 30v14M18 30v14M24 30v14M30 30v14M36 30v14M42 30v14M48 30v14M54 30v10"/><path class="as" d="M14 25h12"/>'],
 ['mirror','mirror beauty makeup salon spa','<ellipse class="m" cx="32" cy="24" rx="14" ry="16"/><path d="M32 40v17M26 57h12"/><path class="as" d="M24 18c2-4 6-6 10-6"/>'],
 ['nail_polish','nails manicure nail salon beauty polish','<rect class="a" x="20" y="28" width="24" height="27" rx="5"/><rect class="m" x="26" y="10" width="12" height="18" rx="3"/><path d="M24 36h6"/>'],
 /* pets */
 ['paw','paw pet dog cat vet grooming animals','<path class="a" d="M20 45c0-8 6-12 12-12s12 4 12 12c0 6-6 8-12 8s-12-2-12-8z"/><ellipse class="m" cx="16" cy="31" rx="4" ry="5.5"/><ellipse class="m" cx="26" cy="20" rx="4" ry="5.5"/><ellipse class="m" cx="38" cy="20" rx="4" ry="5.5"/><ellipse class="m" cx="48" cy="31" rx="4" ry="5.5"/>'],
 ['dog','dog groomer dog walker kennel puppy pet','<path class="m" d="M16 22c0-6 6-10 12-8l12 4c6 2 12 6 12 12 0 4-4 6-8 6h-6l-4 12H22c-4-6-6-16-6-26z"/><path class="a" d="M22 15c-7 0-11 7-9 15 5 0 9-5 9-15z"/><circle cx="34" cy="24" r="1.4"/><circle class="a" cx="50" cy="30" r="2.4"/>'],
 ['bone','bone dog treat pet','<path class="m" d="M14 22a6 6 0 0 1 10-4l22 22a6 6 0 1 1 4 10 6 6 0 1 1-10 4L18 32a6 6 0 1 1-4-10z"/><path class="as" d="M24 30l10 10"/>'],
 /* art & tattoo */
 ['tattoo_machine','tattoo tattoo studio ink piercing flash','<rect class="m" x="12" y="14" width="24" height="16" rx="3"/><rect class="a" x="14" y="30" width="8" height="13" rx="2"/><rect class="a" x="25" y="30" width="8" height="13" rx="2"/><path d="M44 18v28M44 46l-2 12M37 20h14M36 22h8"/>'],
 ['paintbrush','paint brush painter artist art decorating mural','<path class="m" d="M46 8l10 10-20 20-10-10z"/><path class="a" d="M26 28l10 10c-4 6-10 8-16 8-4 0-8 2-8 6-2-8 0-16 6-20z"/><path d="M41 13l10 10"/>'],
 /* fitness & wellbeing */
 ['lotus','lotus yoga meditation wellbeing spa calm pilates','<path class="a" d="M32 17c6 6 6 18 0 27-6-9-6-21 0-27z"/><path class="m" d="M32 44c-4-10-12-16-20-16 0 10 8 16 20 16zM32 44c4-10 12-16 20-16 0 10-8 16-20 16z"/><path d="M10 53h44"/>'],
 ['dumbbell','gym fitness training personal trainer weights','<rect class="a" x="8" y="22" width="8" height="20" rx="2"/><rect class="a" x="48" y="22" width="8" height="20" rx="2"/><rect class="m" x="16" y="26" width="6" height="12" rx="1"/><rect class="m" x="42" y="26" width="6" height="12" rx="1"/><path d="M22 32h20"/>'],
 ['yoga_mat','yoga mat pilates stretch class studio','<rect class="m" x="8" y="42" width="40" height="9" rx="2"/><circle class="a" cx="46" cy="36" r="11"/><path d="M46 36a4 4 0 1 1-4 4M35 36v15"/>'],
 /* professional */
 ['briefcase','business consulting office accountant law professional','<rect class="m" x="8" y="20" width="48" height="32" rx="4"/><path d="M24 20v-6h16v6M8 32h48"/><rect class="a" x="28" y="29" width="8" height="7" rx="1"/>'],
 ['scales','law lawyer solicitor legal justice attorney firm','<path d="M32 10v40M20 53h24M12 18h40"/><path class="a" d="M6 34l6-16 6 16a6 6 0 0 1-12 0zM46 34l6-16 6 16a6 6 0 0 1-12 0z"/><circle class="m" cx="32" cy="10" r="3.4"/>'],
 ['document','document contract paperwork wills notary accounting tax','<path class="m" d="M16 8h22l10 10v38H16z"/><path d="M38 8v10h10M22 28h20M22 36h20M22 44h12"/><circle class="a" cx="40" cy="48" r="4.5"/>'],
 ['laptop','laptop web design it support computer tech freelance','<rect class="m" x="12" y="14" width="40" height="26" rx="2"/><path d="M6 46h52l-4 6H10z"/><rect class="a" x="18" y="20" width="14" height="5" rx="1"/>'],
 ['key','key locksmith property estate agent rental home','<circle class="a" cx="20" cy="32" r="10"/><circle cx="20" cy="32" r="3"/><path d="M30 32h26M46 32v8M52 32v6"/>'],
 ['camera','camera photographer photography photo studio wedding','<rect class="m" x="8" y="20" width="48" height="32" rx="4"/><path d="M22 20l4-6h12l4 6"/><circle class="a" cx="32" cy="36" r="10"/><circle cx="32" cy="36" r="4"/>'],
 ['needle_thread','tailor sewing alterations seamstress textile craft','<path d="M14 54L50 10M46 13l5-4"/><path class="as" d="M49 12c-10 10 4 16-6 26s-20 2-28 12"/><circle class="a" cx="14" cy="54" r="3"/>'],
 /* added: music lessons, transport, home, health, food, cleaning, kids */
 ['piano','piano piano tuner tuning piano lessons keyboard pianist','<rect class="m" x="8" y="16" width="48" height="32" rx="3"/><path d="M8 24h48M12 48v8M52 48v8M17 34v12M22 34v12M27 34v12M32 34v12M37 34v12M42 34v12M47 34v12"/><path class="a" d="M15 34h3v7h-3zM25 34h3v7h-3zM30 34h3v7h-3zM40 34h3v7h-3zM45 34h3v7h-3z"/>'],
 ['music_note','music lessons singing choir voice teacher note composer','<path d="M24 46V14l26-6v32"/><path class="as" d="M24 22l26-6"/><ellipse class="a" cx="18" cy="46" rx="7" ry="5.5"/><ellipse class="a" cx="44" cy="40" rx="7" ry="5.5"/>'],
 ['car','car garage mechanic auto driving instructor lessons car wash valeting','<path class="m" d="M8 42l4-12c1-3 3-4 6-4h28c3 0 5 1 6 4l4 12v8H8z"/><path class="a" d="M18 30l3-6h22l3 6z"/><path d="M8 42h48"/><circle cx="18" cy="50" r="5"/><circle cx="46" cy="50" r="5"/>'],
 ['house','house home cleaning estate agent property builder roofing renovation','<path class="m" d="M10 30L32 12l22 18v24H10z"/><path d="M6 32L32 10l26 22"/><rect class="a" x="27" y="38" width="10" height="16"/><rect x="16" y="34" width="7" height="7"/><rect x="41" y="34" width="7" height="7"/>'],
 ['truck','truck moving removals delivery haulage courier van','<rect class="m" x="6" y="20" width="32" height="24" rx="2"/><path class="a" d="M38 28h10l8 9v7H38z"/><path d="M42 31h5l4 5h-9z"/><circle cx="16" cy="46" r="5"/><circle cx="46" cy="46" r="5"/>'],
 ['tooth','dentist dental teeth orthodontist hygienist smile','<path class="m" d="M20 12c5 0 8 3 12 3s7-3 12-3c7 0 10 6 9 13-1 6-3 9-4 14-1 8-2 16-6 16-3 0-3-9-6-14-2-3-3-3-5 0-3 5-3 14-6 14-4 0-5-8-6-16-1-5-3-8-4-14-1-7 2-13 9-13z"/><path class="as" d="M22 20c3-2 6-2 8 0"/>'],
 ['phone_repair','phone repair smartphone screen mobile tablet repairs','<rect class="m" x="18" y="6" width="28" height="52" rx="5"/><rect x="22" y="12" width="20" height="36" rx="1"/><path class="as" d="M29 16l5 8-5 6 6 9"/><circle cx="32" cy="53" r="2"/>'],
 ['taxi','taxi cab driver rides airport transfer chauffeur','<path class="a" d="M8 42l4-12c1-3 3-4 6-4h28c3 0 5 1 6 4l4 12v8H8z"/><path class="m" d="M18 30l3-6h22l3 6z"/><rect class="m" x="26" y="15" width="12" height="6" rx="1"/><path d="M8 42h48" stroke-dasharray="4 4"/><circle cx="18" cy="50" r="5"/><circle cx="46" cy="50" r="5"/>'],
 ['candle','candle candles candlemaker aromatherapy gifts','<rect class="m" x="24" y="26" width="16" height="30" rx="2"/><path d="M32 26v-5M24 34c3 2 5 0 8 2s5 0 8-2"/><path class="a" d="M32 7c4 5 5 8 5 10a5 5 0 0 1-10 0c0-2 1-5 5-10z"/>'],
 ['cheese','cheese cheesemonger deli fromagerie charcuterie','<path class="a" d="M8 44L40 18l16 10v16z"/><path d="M8 44h48M40 18v26"/><circle cx="24" cy="38" r="3"/><circle cx="47" cy="34" r="2.5"/><circle cx="33" cy="40" r="2"/>'],
 ['ice_cream','ice cream gelato gelateria dessert sorbet','<path class="m" d="M22 30h20L32 58z"/><path d="M24 36l12 8M27 44l6-6"/><circle class="a" cx="26" cy="24" r="9"/><circle class="a" cx="38" cy="24" r="9"/><circle class="a" cx="32" cy="15" r="8"/>'],
 ['toolbox','tools handyman repairs maintenance odd jobs electrician','<rect class="m" x="8" y="24" width="48" height="28" rx="3"/><path d="M24 24v-8h16v8M8 34h48"/><rect class="a" x="28" y="31" width="8" height="7" rx="1"/>'],
 ['paint_roller','painter decorator painting decorating walls','<rect class="a" x="10" y="10" width="36" height="14" rx="4"/><path d="M46 17h6v12H32v8"/><rect class="m" x="28" y="37" width="8" height="20" rx="3"/>'],
 ['broom','cleaning cleaner housekeeping janitorial sweep','<path d="M44 8L30 34M14 50l8-6M20 54l6-6M26 54l4-5"/><path class="m" d="M30 34l-12 6-8 16c8 2 18 0 24-6l4-10z"/><path class="a" d="M27 31l10 6-2 4-10-6z"/>'],
 ['teddy','toys toy shop kids children nursery babysitting childcare','<circle class="m" cx="32" cy="40" r="14"/><circle class="a" cx="23" cy="14" r="4"/><circle class="a" cx="41" cy="14" r="4"/><circle class="m" cx="32" cy="22" r="10"/><circle cx="29" cy="21" r="1.2"/><circle cx="35" cy="21" r="1.2"/><path d="M30 26c1 1 3 1 4 0"/><circle class="a" cx="32" cy="42" r="5"/>'],
 ['bus','bus coach tours transport school run','<rect class="m" x="8" y="12" width="48" height="36" rx="6"/><path class="a" d="M12 18h40v14H12z"/><path d="M32 18v14M8 38h48"/><circle cx="18" cy="50" r="5"/><circle cx="46" cy="50" r="5"/>'],
 ['plane','travel agent flights holidays tours airport','<path class="m" d="M30 8c2-2 4-2 4 0v18l20 12v6l-20-6v12l6 5v4l-8-3-8 3v-4l6-5V38l-20 6v-6l20-12z"/><path class="as" d="M30 18h4"/>'],
 ['shears','garden gardener gardening landscaping hedge trimming tree surgeon','<path class="a" d="M32 30L18 8c6 0 12 4 16 14zM32 30L46 8c-6 0-12 4-16 14z"/><path d="M30 34L16 56M34 34l14 22"/><circle class="m" cx="32" cy="32" r="3.5"/><path class="as" d="M19 51l-4 6M45 51l4 6"/>'],
 ['mic','singer karaoke podcast events dj mc comedy open mic','<rect class="a" x="24" y="6" width="16" height="28" rx="8"/><path d="M16 26a16 16 0 0 0 32 0M32 42v12M24 56h16M28 14h8M28 20h8"/>'],
 ['spray_bottle','cleaning detailing spray window cleaning car valeting','<path class="m" d="M22 28h16l4 8v20H18V36z"/><path class="a" d="M26 16h10l8 4-4 2-4-2v8H26z"/><path d="M46 14l6-3M46 18h7M46 22l6 3"/>'],
 /* generic */
 ['storefront','shop store retail boutique local business generic','<path class="a" d="M8 20h48l-4 10H12z"/><path d="M10 12h44v8M12 30a5 5 0 0 0 10 0 5 5 0 0 0 10 0 5 5 0 0 0 10 0 5 5 0 0 0 10 0M26 56V41h12v15"/><rect class="m" x="12" y="30" width="40" height="26"/>'],
 ['heart','love care community charity wedding generic','<path class="a" d="M32 54C14 42 8 32 8 24a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 8-6 18-24 30z"/><path d="M18 24a6 6 0 0 1 6-6"/>'],
 ['star','star quality best award favourite generic',`<path class="a" d="${star(32,33,24,10)}"/>`],
 ['sparkle','new clean magic cleaning sparkle special generic','<path class="a" d="M32 6c2 14 6 18 20 20-14 2-18 6-20 20-2-14-6-18-20-20 14-2 18-6 20-20z"/><path class="m" d="M50 44l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'],
 ['clock','hours time open late 24/7 emergency appointment generic','<circle class="m" cx="32" cy="32" r="22"/><path d="M32 18v14l10 6"/><circle class="a" cx="32" cy="32" r="2.6"/>'],
 ['map_pin','location local neighbourhood delivery visit generic','<path class="a" d="M32 58C20 44 14 34 14 26a18 18 0 0 1 36 0c0 8-6 18-18 32z"/><circle class="m" cx="32" cy="26" r="6"/>'],
 ['chat','talk advice consulting coaching therapy support message generic','<path class="m" d="M10 14h44v30H28l-10 10V44h-8z"/><path d="M20 26h24"/><path class="as" d="M20 34h16"/>'],
 ['gift','gift present gifts shop occasion generic','<rect class="m" x="10" y="26" width="44" height="28" rx="2"/><path d="M8 20h48v8H8zM32 20v34"/><path class="a" d="M32 20c-4-8-14-10-14-4 0 4 8 4 14 4zM32 20c4-8 14-10 14-4 0 4-8 4-14 4z"/>'],
];

const byId={}; L.forEach(([id,kw,body])=>byId[id]={id, kw:kw.split(/\s+/), body});
function svg(id, cls=''){ const ic=byId[id]; if(!ic) return ''; return `<svg class="ic ${cls}" viewBox="0 0 64 64" aria-hidden="true">${ic.body}</svg>`; }
/* last-resort rescue: exact keyword matches only (or a plural). A near miss is worse than no object:
   a piano tuner must never get a guitar, so prefix guesses are not allowed. */
function match(text, n=3){
  const words=new Set(String(text||'').toLowerCase().split(/[^a-zà-ÿ0-9/]+/).filter(w=>w.length>2));
  const hit=k=>words.has(k)||words.has(k+'s')||(k.endsWith('s')&&words.has(k.slice(0,-1)));
  return L.map(([id,kw])=>({id, s:kw.split(/\s+/).filter(k=>k!=='generic'&&k.length>2).reduce((a,k)=>a+(hit(k)?1:0),0)}))
    .filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.id);
}
/* full-colour art (Microsoft Fluent Emoji, flat style, MIT licence), loaded from art.json: preferred over the hand-drawn set when an id exists in both */
const ART={};
function artSvg(id, cls=''){ return `<svg class="ic art ${cls}" viewBox="0 0 32 32" aria-hidden="true">${ART[id]}</svg>`; }
window.SpokenIcons={ids:L.map(l=>l[0]), has:id=>!!ART[id]||!!byId[id], svg:(id,cls='')=>ART[id]?artSvg(id,cls):svg(id,cls), match, addArt:j=>{ Object.assign(ART,(j&&j.icons)||j||{}); }, index:()=>L.map(([id,kw])=>`${id}: ${kw}`).join('\n')};
})();
