/* 홍보자료 게시판: board/posts.json 을 읽어 목록·글보기를 그림 */
(() => {
  const listEl = document.getElementById('board-list');
  const viewEl = document.getElementById('post-view');
  if (!listEl && !viewEl) return;
  const PER = 10;
  const q = new URLSearchParams(location.search);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dot = d => (d || '').replace(/-/g, '.');
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB';
  const clip = s => (s ? '<i class="clip" aria-label="첨부파일 있음"></i>' : '');

  fetch('board/posts.json?v=' + Date.now()).then(r => r.json()).then(all => {
    all.sort((a, b) => b.id - a.id);
    if (listEl) list(all); else view(all);
  }).catch(() => {
    (listEl || viewEl).innerHTML = '<p class="board-empty">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
  });

  function list(all) {
    const word = (q.get('q') || '').trim();
    const input = document.getElementById('board-q');
    if (input) input.value = word;
    const strip = h => h.replace(/<[^>]+>/g, ' ');
    const rows = word ? all.filter(p => (p.title + ' ' + strip(p.body)).toLowerCase().includes(word.toLowerCase())) : all;
    const pages = Math.max(1, Math.ceil(rows.length / PER));
    const page = Math.min(pages, Math.max(1, parseInt(q.get('page') || '1', 10) || 1));
    const cnt = document.getElementById('board-count');
    if (cnt) cnt.textContent = word ? `"${word}" 검색 결과 ${rows.length}건` : `전체 ${rows.length}건`;
    listEl.innerHTML = rows.length ? rows.slice((page - 1) * PER, page * PER).map(p =>
      `<li><a href="community02_view.html?id=${p.id}"><span class="no">${p.id}</span><span class="tt">${esc(p.title)}${clip(p.files && p.files.length)}</span><span class="dt">${dot(p.date)}</span><span class="circ"><i class="chev"></i></span></a></li>`
    ).join('') : '<li class="board-empty">검색 결과가 없습니다.</li>';
    const pg = document.getElementById('board-paging');
    if (pg) {
      const link = n => `community02.html?${word ? 'q=' + encodeURIComponent(word) + '&' : ''}page=${n}`;
      pg.innerHTML = pages < 2 ? '' : Array.from({ length: pages }, (_, i) => i + 1)
        .map(n => n === page ? `<b aria-current="page">${n}</b>` : `<a href="${link(n)}">${n}</a>`).join('');
    }
  }

  function view(all) {
    const id = parseInt(q.get('id'), 10);
    const k = all.findIndex(p => p.id === id);
    if (k < 0) { viewEl.innerHTML = '<p class="board-empty">없는 게시글입니다. <a href="community02.html">목록으로</a></p>'; return; }
    const p = all[k], newer = all[k - 1], older = all[k + 1];
    document.title = p.title + ' | 홍보자료 | (주)키움인';
    const files = (p.files || []).map(f => `<a href="${esc(f.path)}" download="${esc(f.name)}"><i class="dl"></i><span>${esc(f.name)}</span><small>${kb(f.size)}</small></a>`).join('');
    const nav = (lab, x) => x ? `<a href="community02_view.html?id=${x.id}"><b>${lab}</b><span>${esc(x.title)}</span><em>${dot(x.date)}</em></a>` : `<p><b>${lab}</b><span>${lab}이 없습니다.</span></p>`;
    viewEl.innerHTML = `
      <header class="post-head"><p class="eyebrow">PRESS &amp; NOTICE</p><h2>${esc(p.title)}</h2><p class="post-meta">${dot(p.date)}</p></header>
      <div class="post-body">${p.body}</div>
      ${files ? `<div class="post-files"><b>첨부파일</b><div>${files}</div></div>` : ''}
      <nav class="post-nav" aria-label="이전글 다음글">${nav('이전글', older)}${nav('다음글', newer)}</nav>
      <div class="post-btns"><a class="btn-list" href="community02.html">목록으로</a></div>`;
    viewEl.querySelectorAll('.post-body a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  }
})();
