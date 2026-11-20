// (주)키움인 메인 — 움직임
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 숫자 카운트 */
  const fmt = (n, pad) => String(n).padStart(pad, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function countUp(el) {
    const end = +el.dataset.count, pad = +(el.dataset.pad || 0);
    if (reduce) { el.textContent = fmt(end, pad); return; }
    const dur = 1800, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(end * e), pad);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* 스크롤 등장 (20%만 보여도 시작) */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv, [data-slider]').forEach((el) => io.observe(el));

  /* 헤더: 내리면 숨고, 올리면 나타남 */
  const hdr = document.getElementById('hdr');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    hdr.classList.toggle('shadow', y > 10);
    /* 헤더는 항상 고정 (숨기지 않음) */
    lastY = y;
  }, { passive: true });

  /* 메가메뉴 */
  const body = document.body, burger = document.querySelector('.burger');
  const gnbBtns = document.querySelectorAll('.gnb button');
  function openMega(id) {
    body.classList.add('mega-open');
    burger.setAttribute('aria-expanded', 'true');
    document.querySelector('.mega').setAttribute('aria-hidden', 'false');
    gnbBtns.forEach((b) => b.classList.toggle('on', b.dataset.mega === id));
    document.querySelectorAll('.mega section').forEach((s) => s.classList.toggle('focus', s.id === id));
  }
  function closeMega() {
    body.classList.remove('mega-open');
    burger.setAttribute('aria-expanded', 'false');
    document.querySelector('.mega').setAttribute('aria-hidden', 'true');
    gnbBtns.forEach((b) => b.classList.remove('on'));
  }
  /* 상단 메뉴: 각 메뉴 바로 아래 작은 드롭다운 (전체 메뉴는 오른쪽 ≡ 버튼) */
  gnbBtns.forEach((b) => {
    const wrap = document.createElement('div'); wrap.className = 'gi';
    b.parentNode.insertBefore(wrap, b); wrap.appendChild(b);
    const src = document.getElementById(b.dataset.mega);
    const dd = document.createElement('div'); dd.className = 'dd';
    dd.innerHTML = src ? src.querySelector('ul').outerHTML : '';
    const here = location.pathname.split('/').pop();
    dd.querySelectorAll('a').forEach((a) => { const h = a.getAttribute('href').split('#')[0]; if (h === here) { if (!a.getAttribute('href').includes('#')) a.classList.add('cur'); b.classList.add('cur'); } });
    wrap.appendChild(dd);
    b.setAttribute('aria-expanded', 'false');
    const close = () => { wrap.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); };
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const o = !wrap.classList.contains('open');
      document.querySelectorAll('.gnb .gi.open').forEach((w) => w.classList.remove('open'));
      if (body.classList.contains('mega-open')) closeMega();
      wrap.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o));
    });
    wrap.addEventListener('mouseleave', () => { close(); wrap.classList.remove('shut'); });
    dd.addEventListener('click', () => { close(); wrap.classList.add('shut'); if (document.activeElement) document.activeElement.blur(); });
    wrap.addEventListener('mouseenter', () => document.querySelectorAll('.gnb .gi.open').forEach((w) => { if (w !== wrap) w.classList.remove('open'); }));
  });
  document.addEventListener('click', () => document.querySelectorAll('.gnb .gi.open').forEach((w) => w.classList.remove('open')));
  addEventListener('keydown', (e) => e.key === 'Escape' && document.querySelectorAll('.gnb .gi.open').forEach((w) => w.classList.remove('open')));
  burger.addEventListener('click', () => body.classList.contains('mega-open') ? closeMega() : openMega(null));
  document.querySelector('.scrim').addEventListener('click', closeMega);
  addEventListener('keydown', (e) => e.key === 'Escape' && closeMega());

  /* 슬라이더: 화살표·점·끌기 */
  document.querySelectorAll('[data-slider]').forEach((sec) => {
    const track = sec.querySelector('.track'), items = [...track.children];
    const dotsWrap = sec.querySelector('.dots'), prev = sec.querySelector('.prev'), next = sec.querySelector('.next');
    const stepW = () => items[0].getBoundingClientRect().width + 16;
    const over = () => track.scrollWidth - track.clientWidth;
    const pages = () => over() < 8 ? 1 : Math.ceil((over() - 8) / stepW()) + 1;
    function buildDots() {
      dotsWrap.innerHTML = '';
      sec.querySelector('.ctrl').style.visibility = pages() > 1 ? '' : 'hidden';
      for (let i = 0; i < pages(); i++) {
        const d = document.createElement('button');
        d.setAttribute('aria-label', `${i + 1}번째로 이동`);
        d.onclick = () => track.scrollTo({ left: i * stepW() });
        dotsWrap.appendChild(d);
      }
      sync();
    }
    function sync() {
      const i = Math.round(track.scrollLeft / stepW());
      [...dotsWrap.children].forEach((d, k) => d.classList.toggle('on', k === i));
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4;
    }
    prev.onclick = () => track.scrollBy({ left: -stepW() });
    next.onclick = () => track.scrollBy({ left: stepW() });
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    addEventListener('resize', buildDots);
    track.lastElementChild.addEventListener('transitionend', (e) => e.propertyName === 'transform' && buildDots());
    buildDots();

    // 마우스로 끌기
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = track.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; track.classList.add('drag'); }
      track.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('drag');
        const i = Math.round(track.scrollLeft / stepW());
        track.scrollTo({ left: i * stepW() });
      }
    });
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  });

  /* 첫 화면 영상: 스크롤하면 살짝 느리게 */
  const vid = document.querySelector('.stage-media video');
  if (vid && !reduce) {
    vid.addEventListener('animationend', () => {
      addEventListener('scroll', () => {
        const y = Math.min(scrollY, 700);
        vid.style.transform = `translateY(${y * 0.06}px) scale(1.15)`;
      }, { passive: true });
    }, { once: true });
  }
})();

/* 화면 오른쪽 고정 TOP 버튼 (모든 페이지 공통) */
(() => {
  const b = document.createElement('a');
  b.className = 'ftop'; b.href = '#top'; b.setAttribute('aria-label', '맨 위로');
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg><span>TOP</span>';
  b.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(b);
  const on = () => b.classList.toggle('show', window.scrollY > 500);
  window.addEventListener('scroll', on, { passive: true }); on();
})();
