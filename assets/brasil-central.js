(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let editions = [];

  function formatDate(iso) {
    const [y,m,d] = String(iso || '').split('-');
    return y && m && d ? `${d}/${m}/${y}` : String(iso || 'Data pendente');
  }

  function fileHref(value) {
    if (!value) return '';
    const text = String(value).trim();
    if (/^https?:\/\//i.test(text)) return text;
    return `https://drive.google.com/file/d/${encodeURIComponent(text)}/view`;
  }

  function titleFor(e) {
    const number = String(e.numero || '').trim();
    if (number && !/pendente|não legível|não indicado/i.test(number)) return `Edição nº ${number}`;
    return formatDate(e.data);
  }

  function buildFilters() {
    const years = [...new Set(editions.map(e => String(e.data || '').slice(0,4)).filter(Boolean))].sort();
    $('jbcYear').innerHTML = '<option value="">Todos os anos</option>' + years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join('');
  }

  function filteredEditions() {
    const year = $('jbcYear').value;
    const status = $('jbcStatus').value;
    const q = $('jbcQuery').value.trim().toLocaleLowerCase('pt-BR');
    return editions.filter(e => {
      if (year && !String(e.data || '').startsWith(year)) return false;
      if (status && e.status !== status) return false;
      if (q) {
        const haystack = [e.id,e.data,e.anoJornal,e.numero,e.status,e.nota].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  function actionsFor(e) {
    const actions = [];
    const pdfOcr = fileHref(e.pdfOcr);
    const pdfVisual = fileHref(e.pdfVisual);
    const txt = fileHref(e.txt);
    const json = fileHref(e.json);
    if (pdfOcr) actions.push(`<a class="action" href="${esc(pdfOcr)}" target="_blank" rel="noopener">PDF pesquisável</a>`);
    if (pdfVisual) actions.push(`<a class="action alt" href="${esc(pdfVisual)}" target="_blank" rel="noopener">PDF visual</a>`);
    if (txt) actions.push(`<a class="action alt" href="${esc(txt)}" target="_blank" rel="noopener">TXT OCR</a>`);
    if (json) actions.push(`<a class="action alt" href="${esc(json)}" target="_blank" rel="noopener">JSON</a>`);
    if (!actions.length) return '<span class="muted">Arquivo digital ainda não vinculado ao catálogo público.</span>';
    return actions.join('');
  }

  function render() {
    const list = filteredEditions();
    const pages = list.reduce((sum,e) => sum + (Number(e.paginas) || 0), 0);
    const partials = list.filter(e => e.status === 'Parcial').length;
    $('jbcStats').innerHTML = `<div><strong>${list.length}</strong><span>edições catalogadas</span></div><div><strong>${pages}</strong><span>páginas físicas conhecidas</span></div><div><strong>${partials}</strong><span>edições parciais</span></div>`;
    $('jbcLoadStatus').textContent = list.length ? `Exibindo ${list.length} edição${list.length === 1 ? '' : 'ões'} do catálogo publicável.` : 'Nenhuma edição corresponde aos filtros selecionados.';
    $('jbcEditionGrid').innerHTML = list.map(e => {
      const pageText = Number(e.paginas) > 0 ? `${e.paginas} página${Number(e.paginas) === 1 ? '' : 's'}` : 'Quantidade de páginas pendente';
      const statusClass = e.status === 'Concluido' ? 'status-pill complete' : 'status-pill';
      return `<article class="edition-card-vox">
        <div class="edition-card-head">
          <span class="edition-badge">JBC · ${esc(String(e.data || '').slice(0,4) || 's.d.')}</span>
          <h2>${esc(titleFor(e))}</h2>
          <p>${esc(formatDate(e.data))} · Ano editorial ${esc(e.anoJornal || 'Pendente')} · ${esc(pageText)}</p>
          <p><span class="${statusClass}">${esc(e.status || 'Pendente')}</span></p>
          ${e.nota ? `<p>${esc(e.nota)}</p>` : ''}
          <p class="muted"><small>${esc(e.id)}</small></p>
        </div>
        <div class="edition-card-actions">${actionsFor(e)}</div>
      </article>`;
    }).join('');
  }

  async function load() {
    try {
      const response = await fetch('../data/brasil-central.json', {cache:'no-cache'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      editions = Array.isArray(data.edicoes) ? data.edicoes.slice().sort((a,b) => String(a.data || '').localeCompare(String(b.data || ''))) : [];
      buildFilters();
      render();
    } catch (error) {
      $('jbcLoadStatus').textContent = 'Não foi possível carregar o catálogo do Jornal Brasil Central neste momento.';
      $('jbcEditionGrid').innerHTML = '';
    }
  }

  ['jbcYear','jbcStatus'].forEach(id => $(id).addEventListener('change', render));
  $('jbcQuery').addEventListener('input', render);
  load();
})();
