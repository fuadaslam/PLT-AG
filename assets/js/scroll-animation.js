(() => {
  const FRAME_COUNT = 9;
  const FRAME_BASE = 'assets/img/plt-frames/frame_';

  const stages = [
    { from: 0,    to: 0.28, heading: 'Pure from Nature',          sub: 'Every ingredient sourced from the earth, carefully selected for your crops.' },
    { from: 0.28, to: 0.56, heading: 'Scientifically Formulated', sub: 'Backed by ICAR research and validated through rigorous field testing.' },
    { from: 0.56, to: 0.82, heading: 'For Every Crop',            sub: "From paddy fields to spice gardens — solutions tailored for Kerala’s diverse agriculture." },
    { from: 0.82, to: 1.01, heading: 'Growth You Can Trust',      sub: 'Trusted by over 50,000 farmers across Kerala and beyond.' },
  ];

  function init() {
    const canvas = document.getElementById('pltScrollCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const section = document.getElementById('pltScrollSection');
    const headingEl = document.getElementById('pltScrollHeading');
    const subEl = document.getElementById('pltScrollSub');
    const barEl = document.getElementById('pltScrollBar');

    const images = [];
    let loadedCount = 0;
    let currentFrame = -1;
    let raf = null;
    let targetProgress = 0;
    let renderedProgress = -1;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawFrame(currentFrame < 0 ? 0 : currentFrame);
    }

    function drawFrame(index) {
      const img = images[index];
      if (!img || !img.complete) return;
      const cw = canvas.width, ch = canvas.height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const x = (cw - iw * scale) / 2;
      const y = (ch - ih * scale) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, x, y, iw * scale, ih * scale);
      currentFrame = index;
    }

    function updateText(progress) {
      const stage = stages.find(s => progress >= s.from && progress < s.to) || stages[stages.length - 1];
      if (headingEl.dataset.current !== stage.heading) {
        headingEl.classList.add('fade-out');
        subEl.classList.add('fade-out');
        setTimeout(() => {
          headingEl.textContent = stage.heading;
          subEl.textContent = stage.sub;
          headingEl.dataset.current = stage.heading;
          headingEl.classList.remove('fade-out');
          subEl.classList.remove('fade-out');
        }, 250);
      }
    }

    function tick() {
      raf = null;
      const progress = targetProgress;

      if (Math.abs(progress - renderedProgress) < 0.0001) return;
      renderedProgress = progress;

      const frameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(progress * (FRAME_COUNT - 1))));
      if (frameIndex !== currentFrame) drawFrame(frameIndex);

      updateText(progress);
      if (barEl) barEl.style.width = (progress * 100) + '%';
    }

    function onScroll() {
      const sectionTop = section.offsetTop;
      const scrollable = section.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - sectionTop;
      targetProgress = Math.max(0, Math.min(1, scrolled / scrollable));

      if (!raf) raf = requestAnimationFrame(tick);
    }

    // Preload frames 002–010
    for (let i = 2; i <= 10; i++) {
      const img = new Image();
      const num = String(i).padStart(3, '0');
      img.src = `${FRAME_BASE}${num}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) {
          resize();
        }
      };
      images.push(img);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { resize(); }, { passive: true });
    resize();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
