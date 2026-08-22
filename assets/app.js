const JST_BASE = 'https://www.acervojst.com.br/';
const YEARS = [1922,1923,1924,1925,1926,1927,1928,1929,1930,1931];
const cache = new Map();
const NEWSPAPERS_FALLBACK = [
  {id:'santuario-da-trindade',nome:'Jornal Santuário da Trindade',masthead:'assets/mastheads/santuario-da-trindade.png',tipo:'Jornal',subtitulo:'Órgão do Santuário da Trindade',inicio:1922,fim:1931,edicoes:349,descricao:'Coleção digital completa já disponível, organizada por ano e edição, com pesquisa OCR no texto dos jornais.',status:'completo',url:'jornais/santuario-da-trindade.html'},
  {id:'brasil-central',nome:'Jornal Brasil Central',masthead:'assets/mastheads/brasil-central.png',tipo:'Jornal',subtitulo:'Imprensa católica goiana',inicio:null,fim:null,edicoes:0,descricao:'Coleção em fase de catalogação e preparação documental.',status:'catalogando',url:'jornais/brasil-central.html'},
  {id:'santuario-dapparecida',nome:'Jornal Santuário d’Apparecida',masthead:'assets/mastheads/santuario-dapparecida.png',tipo:'Jornal',subtitulo:'Grafia histórica preservada',inicio:null,fim:null,edicoes:0,descricao:'Coleção em fase de catalogação e preparação documental.',status:'catalogando',url:'jornais/santuario-dapparecida.html'},
  {id:'o-lidador',nome:'Jornal O Lidador',masthead:'assets/mastheads/o-lidador.png',tipo:'Jornal',subtitulo:'Imprensa católica goiana',inicio:null,fim:null,edicoes:0,descricao:'Coleção em fase de catalogação e preparação documental.',status:'catalogando',url:'jornais/o-lidador.html'}
];
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const driveView = id => `https://drive.google.com/file/d/${id}/view`;

function setActiveNav(){
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  $$('.topnav a').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('#')[0].split('/').pop().toLowerCase();
    if((file==='index.html'&&href==='index.html') || (file===''&&href==='index.html') || (href&&href===file)) a.classList.add('active');
  });
}

async function getNewspapers(){
  const prefix = location.pathname.includes('/jornais/') ? '../' : '';
  try{
    const r=await fetch(prefix+'data/jornais.json');
    if(!r.ok) throw new Error();
    return await r.json();
  }catch(e){ return NEWSPAPERS_FALLBACK.map(n=>({...n})); }
}

function cardHtml(n,prefix=''){
  const period=(Number.isInteger(n.inicio)&&Number.isInteger(n.fim))?`${n.inicio}–${n.fim}`:'Período em catalogação';
  const status=n.status==='completo'?'Coleção completa disponível':'OPUS IN FIERI · Acervo em construção';
  return `<article class="newspaper-card">
    <div class="masthead-wrap"><img src="${prefix}${n.masthead}" alt="Cabeçalho histórico estilizado de ${esc(n.nome)}"></div>
    <div class="body"><h3>${esc(n.nome)}</h3>
      <div class="card-meta">▦ <span>${period}</span></div>
      <div class="card-status">${status}</div>
      <a class="collection-button" href="${prefix}${n.url}">Ver coleção</a>
    </div></article>`;
}

async function renderGrid(){
  const grid=$('#newspaperGrid'); if(!grid) return;
  const papers=await getNewspapers();
  grid.innerHTML=papers.map(n=>cardHtml(n)).join('');
}

async function fillFilters(){
  const paperSel=$('#newspaperFilter'), yearSel=$('#yearFilter');
  if(!paperSel && !yearSel) return;
  const papers=await getNewspapers();
  if(paperSel){
    paperSel.innerHTML='<option value="">Todos os jornais</option>'+papers.map(n=>`<option value="${n.id}">${esc(n.nome)}</option>`).join('');
  }
  if(yearSel){ yearSel.innerHTML='<option value="">Todos os anos</option>'+YEARS.map(y=>`<option>${y}</option>`).join(''); }
}

function snippet(text,terms){
  const t=String(text||'').replace(/\s+/g,' ').trim(); const nt=norm(t); let pos=-1;
  for(const term of terms){ const p=nt.indexOf(term); if(p>=0&&(pos<0||p<pos))pos=p; }
  if(pos<0)pos=0; const start=Math.max(0,pos-135), end=Math.min(t.length,pos+330);
  return `${start?'… ':''}${esc(t.slice(start,end))}${end<t.length?' …':''}`;
}

async function loadYear(year){
  if(cache.has(year)) return cache.get(year);
  const url=`${JST_BASE}search-index-v2-${year}.json`;
  const promise=fetch(url,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(arr=>arr.map(p=>({...p,year:Number(p.year||year)})));
  cache.set(year,promise); return promise;
}

async function searchArchive(){
  const input=$('#mainSearch'); if(!input) return;
  const q=input.value.trim(); const out=$('#searchResults'); const status=$('#searchStatus');
  if(!q){ out.classList.add('hidden'); status.textContent=''; return; }
  const terms=norm(q).split(/\s+/).filter(Boolean);
  const paper=$('#newspaperFilter')?.value||''; const selectedYear=$('#yearFilter')?.value||'';
  out.classList.remove('hidden'); out.innerHTML='';
  if(paper && paper!=='santuario-da-trindade'){
    const papers=await getNewspapers(); const n=papers.find(x=>x.id===paper);
    status.textContent='Esta coleção ainda está em catalogação e não possui índice OCR publicado.';
    out.innerHTML=n?`<article class="result"><h3>${esc(n.nome)}</h3><div class="result-meta">Coleção em catalogação</div><p>${esc(n.descricao)}</p><a class="small-btn" href="${n.url}">Abrir coleção</a></article>`:'';
    return;
  }
  const years=selectedYear?[Number(selectedYear)]:YEARS;
  status.textContent=`Pesquisando ${years.length===1?'o ano de '+years[0]:'a coleção Santuário da Trindade (1922–1931)'}…`;
  const settled=await Promise.allSettled(years.map(loadYear));
  const pages=settled.filter(x=>x.status==='fulfilled').flatMap(x=>x.value);
  if(!pages.length){
    status.textContent='Não foi possível carregar o índice OCR agora.';
    out.innerHTML=`<article class="result"><h3>Índice temporariamente indisponível</h3><p>Você ainda pode acessar diretamente a coleção completa do Jornal Santuário da Trindade.</p><a class="small-btn" href="${JST_BASE}" target="_blank" rel="noopener">Abrir Acervo JST</a></article>`;
    return;
  }
  const found=pages.filter(p=>terms.every(t=>norm(p.text).includes(t))).sort((a,b)=>Number(a.year)-Number(b.year)||String(a.iso||'').localeCompare(String(b.iso||''))||Number(a.page||0)-Number(b.page||0));
  status.textContent=`${found.length} página${found.length===1?'':'s'} encontrada${found.length===1?'':'s'} no Jornal Santuário da Trindade.`;
  if(!found.length){ out.innerHTML='<article class="result"><h3>Nenhuma ocorrência encontrada</h3><p>Tente outra grafia ou uma palavra mais curta. O OCR de jornais antigos pode conter falhas.</p></article>'; return; }
  out.innerHTML=found.slice(0,150).map(p=>{
    const y=Number(p.year||0), page=p.globalPage||p.page||'?';
    const title=y===1922&&p.n?`${y} · Edição nº ${p.n} · página ${p.page}`:`${y} · ${p.date||p.iso||'edição'} · página ${p.localPage||p.page||'?'}`;
    return `<article class="result"><h3>${esc(title)}</h3><div class="result-meta">Jornal Santuário da Trindade · página ${esc(page)} do volume</div><div class="snippet">${snippet(p.text,terms)}</div><div class="result-actions">${p.pdf?`<a class="small-btn" href="${driveView(p.pdf)}" target="_blank" rel="noopener">Abrir PDF</a>`:''}<a class="small-btn alt" href="jornais/jst-ano.html?ano=${y}">Abrir ano ${y}</a></div></article>`;
  }).join('')+(found.length>150?'<div class="callout">Foram exibidos os primeiros 150 resultados. Use o filtro de ano para refinar a pesquisa.</div>':'');
}

function initSearch(){
  const form=$('#searchForm'), input=$('#mainSearch');
  if(form) form.addEventListener('submit',e=>{e.preventDefault();searchArchive()});
  const params=new URLSearchParams(location.search); if(input&&params.get('q')){input.value=params.get('q');setTimeout(searchArchive,50)}
}

setActiveNav(); renderGrid(); fillFilters(); initSearch();
