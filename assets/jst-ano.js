(() => {
  const JST_BASE = 'https://www.acervojst.com.br/';
  const VALID_YEARS = [1922,1923,1924,1925,1926,1927,1928,1929,1930,1931];
  const expectedEditions = {1922:14,1923:26,1924:54,1925:49,1926:40,1927:27,1928:48,1929:48,1930:32,1931:11};
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params = new URLSearchParams(location.search);
  let year = Number(params.get('ano'));
  if(!VALID_YEARS.includes(year)) year = 1922;
  const drivePreview = id => `https://drive.google.com/file/d/${id}/preview`;
  const driveView = id => `https://drive.google.com/file/d/${id}/view`;
  let pages = [];
  let currentPages = [];

  $('yearTitle').textContent = `Jornal Santuário da Trindade — ${year}`;
  document.title = `JST ${year} — Vox Ecclesiae`;

  function editionKey(p){
    return p.pdf || [p.iso||'',p.n||'',p.date||'',p.sourceStart||''].join('|');
  }
  function pageNo(p){ return Number(p.localPage || p.sourceLocalPage || p.page || 0); }
  function groupPages(arr){
    const m = new Map();
    arr.forEach(p=>{
      const k=editionKey(p); if(!m.has(k)) m.set(k,[]); m.get(k).push(p);
    });
    return [...m.values()].map(list=>list.sort((a,b)=>pageNo(a)-pageNo(b))).sort((a,b)=>{
      const A=a[0],B=b[0];
      return String(A.iso||'').localeCompare(String(B.iso||'')) || Number(A.n||0)-Number(B.n||0) || Number(A.sourceStart||0)-Number(B.sourceStart||0);
    });
  }
  function titleFor(list,index){
    const p=list[0];
    if(p.n) return `Edição nº ${p.n}`;
    if(p.date) return p.date;
    if(p.iso) return p.iso;
    return `Edição ${index+1}`;
  }
  function subFor(list){
    const p=list[0], bits=[];
    if(p.date) bits.push(p.date);
    else if(p.iso) bits.push(p.iso);
    bits.push(`${list.length} página${list.length===1?'':'s'} OCR`);
    return bits.join(' · ');
  }
  function render(){
    const groups=groupPages(pages);
    $('yearLead').textContent = year===1922 ? 'Ano completo em edições separadas, com acesso aos PDFs e ao texto OCR.' : 'Edições organizadas para consulta histórica, com acesso aos PDFs e ao texto OCR.';
    $('yearStats').innerHTML = `<div><strong>${groups.length}</strong><span>edições/arquivos</span></div><div><strong>${pages.length}</strong><span>páginas OCR</span></div><div><strong>${year}</strong><span>ano consultado</span></div>`;
    $('yearStatus').textContent = `Acervo de ${year} carregado no Vox Ecclesiae.`;
    $('editionGrid').innerHTML = groups.map((list,i)=>{
      const p=list[0], pdf=p.pdf||'', original=p.original||'';
      return `<article class="edition-card-vox">
        <div class="edition-card-head"><span class="edition-badge">JST · ${year}</span><h2>${esc(titleFor(list,i))}</h2><p>${esc(subFor(list))}</p></div>
        <div class="edition-card-actions">
          ${pdf?`<button class="action read-edition" data-key="${esc(editionKey(p))}" type="button">Ler edição</button>`:''}
          ${pdf?`<a class="action alt" href="${driveView(pdf)}" target="_blank" rel="noopener">Abrir PDF</a>`:''}
          ${original?`<a class="action alt" href="${driveView(original)}" target="_blank" rel="noopener">Original</a>`:''}
        </div>
      </article>`;
    }).join('');
    document.querySelectorAll('.read-edition').forEach(btn=>btn.addEventListener('click',()=>openReader(btn.dataset.key)));
    if(expectedEditions[year] && groups.length !== expectedEditions[year]){
      $('yearStatus').textContent += ` A catalogação publicada apresenta ${groups.length} agrupamentos nesta leitura.`;
    }
  }
  async function load(){
    try{
      let r=await fetch(`${JST_BASE}search-index-v2-${year}.json`,{cache:'force-cache'});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      pages=(await r.json()).map(p=>({...p,year:Number(p.year||year)}));
      if(!pages.length) throw new Error('índice vazio');
      render();
    }catch(err){
      $('yearStatus').textContent='Não foi possível carregar o índice OCR neste momento.';
      $('yearFallback').classList.remove('hidden');
      $('yearFallback').innerHTML=`<strong>Consulta alternativa:</strong> o conteúdo original de ${year} continua disponível no Acervo JST. <a href="${JST_BASE}ano-${year}.html" target="_blank" rel="noopener">Abrir ano ${year} no acervo original</a>.`;
    }
  }
  function openReader(key){
    currentPages=pages.filter(p=>editionKey(p)===key).sort((a,b)=>pageNo(a)-pageNo(b));
    if(!currentPages.length) return;
    const p=currentPages[0];
    $('readerTitle').textContent=`JST ${year} — ${p.n?`Edição nº ${p.n}`:(p.date||'edição')}`;
    $('pdfFrame').src=p.pdf?drivePreview(p.pdf):'about:blank';
    $('ocrText').innerHTML=currentPages.map((x,i)=>`<article class="ocr-page"><h3>Página ${pageNo(x)||i+1}</h3><div>${esc(x.text||'')}</div></article>`).join('');
    setTab('pdf');
    $('readerDialog').showModal();
  }
  function setTab(which){
    const ocr=which==='ocr';
    $('pdfPane').classList.toggle('hidden',ocr); $('ocrPane').classList.toggle('hidden',!ocr);
    $('tabPdf').classList.toggle('active',!ocr); $('tabOcr').classList.toggle('active',ocr); $('copyOcr').classList.toggle('hidden',!ocr);
  }
  $('readerClose').addEventListener('click',()=>{$('readerDialog').close();$('pdfFrame').src='about:blank'});
  $('tabPdf').addEventListener('click',()=>setTab('pdf'));
  $('tabOcr').addEventListener('click',()=>setTab('ocr'));
  $('copyOcr').addEventListener('click',async()=>{
    const text=currentPages.map((p,i)=>`Página ${pageNo(p)||i+1}\n${p.text||''}`).join('\n\n');
    try{await navigator.clipboard.writeText(text);$('copyOcr').textContent='Copiado';setTimeout(()=>$('copyOcr').textContent='Copiar texto',1200)}catch(e){}
  });
  load();
})();
