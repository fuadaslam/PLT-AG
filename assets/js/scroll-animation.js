(() => {
  const stages = [
    { from: 0,    to: 0.28, heading: 'Pure from Nature',          sub: 'Every ingredient sourced from the earth, carefully selected for your crops.' },
    { from: 0.28, to: 0.56, heading: 'Scientifically Formulated', sub: 'Backed by ICAR research and validated through rigorous field testing.' },
    { from: 0.56, to: 0.82, heading: 'For Every Crop',            sub: "From paddy fields to spice gardens — solutions tailored for Kerala's diverse agriculture." },
    { from: 0.82, to: 1.01, heading: 'Growth You Can Trust',      sub: 'Trusted by over 50,000 farmers across Kerala and beyond.' },
  ];

  function init() {
    const section = document.getElementById('pltScrollSection');
    if (!section) return;

    const frames = Array.from(section.querySelectorAll('.plt-frame'));
    const headingEl = document.getElementById('pltScrollHeading');
    const subEl = document.getElementById('pltScrollSub');
    const barEl = document.getElementById('pltScrollBar');
    const FRAME_COUNT = frames.length;

    let currentFrame = 0;
    let raf = null;
    let targetProgress = 0;

    function showFrame(index) {
      if (index === currentFrame) return;
      frames[currentFrame].classList.remove('active');
      frames[index].classList.add('active');
      currentFrame = index;
    }

    function updateText(progress) {
      const stage = stages.find(s => progress >= s.from && progress < s.to) || stages[stages.length - 1];
      if (headingEl.dataset.current === stage.heading) return;
      headingEl.classList.add('fade-out');
      subEl.classList.add('fade-out');
      setTimeout(() => {
        headingEl.textContent = stage.heading;
        subEl.textContent = stage.sub;
        headingEl.dataset.current = stage.heading;
        headingEl.classList.remove('fade-out');
        subEl.classList.remove('fade-out');
      }, 220);
    }

    function tick() {
      raf = null;
      const progress = targetProgress;
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(progress * (FRAME_COUNT - 1))));
      showFrame(frameIndex);
      updateText(progress);
      if (barEl) barEl.style.width = (progress * 100) + '%';
    }

    function onScroll() {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const scrollable = section.offsetHeight - window.innerHeight;
      const scrolled = window.scrollY - sectionTop;
      targetProgress = Math.max(0, Math.min(1, scrolled / scrollable));
      if (!raf) raf = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
