// 메인 영상 장면에 맞춰 글자 바꾸기
(() => {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const v = hero.querySelector('video');
  const scenes = [...hero.querySelectorAll('.scene')];
  const starts = scenes.map((s) => +s.dataset.from);
  const bars = [...hero.querySelectorAll('.sc-nav button')];
  let cur = -1;

  const loopAt = +(hero.dataset.loop || 0);
  // 끝 2초는 첫 장면으로 넘어가는 구간이라 첫 장면 문구를 미리 보여줌
  const sceneAt = (t) => { if (loopAt && t >= loopAt) return 0; let i = 0; starts.forEach((s, k) => { if (t >= s) i = k; }); return i; };

  function show(i) {
    if (i === cur) return;
    scenes.forEach((s, k) => {
      s.classList.remove('on');
      s.classList.toggle('out', k === cur);
    });
    // 다음 프레임에 켜야 들어오는 움직임이 다시 재생됨
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scenes[i].classList.remove('out');
      scenes[i].classList.add('on');
    }));
    cur = i;
  }

  function tick() {
    const t = v.currentTime || 0, d = v.duration || 27;
    const i = sceneAt(t);
    show(i);
    bars.forEach((b, k) => {
      const end = k < starts.length - 1 ? starts[k + 1] : d;
      const p = k < i ? 1 : k > i ? 0 : Math.min(1, (t - starts[k]) / (end - starts[k]));
      b.querySelector('i').style.width = (p * 100) + '%';
    });
    requestAnimationFrame(tick);
  }

  bars.forEach((b, k) => b.addEventListener('click', () => { v.currentTime = starts[k] + 0.05; v.play(); }));
  show(0);
  requestAnimationFrame(tick);
})();

// AI 교육 플랫폼 카드: 숫자 올라가기 + 내용 보기 창
(() => {
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.promo [data-count]').forEach((el, k) => {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = fmt(end); return; }
    setTimeout(() => {
      const t0 = performance.now(), dur = 2200;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(end * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 900 + k * 150);
  });

  const dlg = document.querySelector('.promo-dlg');
  const btn = document.querySelector('.promo-more');
  if (!dlg || !btn) return;
  const open = () => { dlg.show(); };
  btn.addEventListener('click', open);
  const KEY = 'kiumin_popup_hide', today = (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date()); // 한국 시간 기준 날짜 → 다음날 0시에 다시 뜸
  const chk = dlg.querySelector('.op-today');
  const close = () => { if (chk && chk.checked) { try { localStorage.setItem(KEY, today); } catch (e) {} } dlg.close(); };
  dlg.querySelector('.op-close').addEventListener('click', close);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  /* 첫 화면 자동 팝업 (페이지 안 레이어라 팝업 차단과 무관) */
  let hidden = false; try { hidden = localStorage.getItem(KEY) === today; } catch (e) {}
  if (!hidden) setTimeout(() => { if (!dlg.open) open(); }, 1200);
})();
document.querySelectorAll('[data-open-promo]').forEach((b) => b.addEventListener('click', () => document.querySelector('.promo-more').click()));

// 숫자 칸: 작은 숫자에서 빠르게 자라 지금 숫자로 (성장)
(() => {
  const box = document.querySelector('.facts.counter');
  if (!box) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n, pad) => String(n).padStart(pad, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function grow(el, delay) {
    const end = +el.dataset.grow, pad = +(el.dataset.pad || 0);
    if (reduce) { el.textContent = fmt(end, pad); return; }
    const dur = 2600, start = Math.max(1, Math.round(end * 0.02));
    setTimeout(() => {
      const t0 = performance.now(); let last = start;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        // 처음엔 숫자가 마구 빠르게 바뀌다가 끝에서 천천히 멈춤
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        const v = Math.round(start + (end - start) * e);
        el.textContent = fmt(v, pad);
        const speed = Math.abs(v - last) / Math.max(1, end) * 60; last = v;
        el.style.filter = `blur(${Math.min(2.2, speed * 6).toFixed(2)}px)`;
        if (p < 1) requestAnimationFrame(step);
        else { el.style.filter = ''; el.classList.add('done'); }
      };
      requestAnimationFrame(step);
    }, delay);
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    box.classList.add('go');
    box.querySelectorAll('[data-grow]').forEach((el, k) => grow(el, 250 + k * 180));
    io.disconnect();
  }), { threshold: 0.35 });
  io.observe(box);
})();

// 폰에서 다른 앱 갔다 돌아오면 영상이 멈춰 있는 문제: 다시 보이면 이어서 재생
(() => {
  const v = document.querySelector('[data-hero] video');
  if (!v) return;
  v.muted = true; v.playsInline = true;
  const resume = () => { if (document.visibilityState === 'visible' && v.paused) v.play().catch(() => {}); };
  document.addEventListener('visibilitychange', resume);
  addEventListener('pageshow', resume);
  addEventListener('focus', resume);
  // 절전 모드 등으로 자동재생이 막혔으면 첫 터치·스크롤 때 재생
  const kick = () => { resume(); removeEventListener('touchstart', kick); removeEventListener('scroll', kick); };
  addEventListener('touchstart', kick, { passive: true });
  addEventListener('scroll', kick, { passive: true });
  // 멈춘 채 남지 않게 3초마다 한 번 확인
  setInterval(resume, 3000);
})();
