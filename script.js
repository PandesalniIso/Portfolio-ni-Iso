(function () {
  "use strict";

  /* ============================================
     THEME TOGGLE (persisted in localStorage)
     ============================================ */
  var root = document.documentElement;
  var toggleBtn = document.getElementById('themeToggle');
  var icons = toggleBtn.querySelectorAll('.icon');

  function reflectToggle() {
    var current = root.getAttribute('data-theme');
    icons.forEach(function (icon) {
      icon.classList.toggle('is-active', icon.dataset.mode === current);
    });
    toggleBtn.setAttribute('aria-pressed', current === 'dark');
  }

  toggleBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
    reflectToggle();
  });

  reflectToggle();

  /* ============================================
     STICKY NAV SHADOW ON SCROLL
     + clear all nav highlights when back near the top
     ============================================ */
  var nav = document.getElementById('siteNav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));

  function clearActive() {
    navLinks.forEach(function (l) { l.classList.remove('active'); });
  }

  function onScrollNav() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    // When the hero is in view (near the very top), no nav link should be highlighted.
    if (y < 120) { clearActive(); }
  }
  document.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ============================================
     SMOOTH SCROLL — nav links + brand go to their
     section, offset for the sticky nav height.
     ============================================ */
  Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  });

  /* ============================================
     SCROLLSPY — highlight current nav link
     Only activates for about/quiz/exam/lab.
     Clears all when hero (#hero) is visible.
     ============================================ */
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.dataset.nav); })
    .filter(Boolean);

  var heroSection = document.getElementById('hero');

  // Observer for the hero — clears all active states when hero is visible
  var heroObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { clearActive(); }
    });
  }, { rootMargin: '0px 0px -50% 0px', threshold: 0 });

  if (heroSection) { heroObserver.observe(heroSection); }

  var spyObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = document.querySelector('.nav-links a[data-nav="' + entry.target.id + '"]');
      if (!link) return;
      if (entry.isIntersecting) {
        clearActive();
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(function (s) { spyObserver.observe(s); });

  /* ============================================
     RECORD DATA — add a new activity by adding
     one object to the matching array below.
     ============================================ */
  var recordData = {
    quiz: [
      { title: 'Quiz 1', meta: '18/20 pts', image: 'Quiz 1.png', alt: 'Quiz 1 result screenshot' }
    ],
    exam: [],
    lab: []
  };

  var wipCopy = {
    quiz: 'More quizzes will be added here as they are completed.',
    exam: 'More exams will be added here as they are completed.',
    lab: 'More lab activities will be added here as they are completed.'
  };

  /* ============================================
     CAROUSEL — builds markup from data, then
     handles sliding, arrows, and dot state.
     ============================================ */
  function buildCarousel(container) {
    var key = container.dataset.carousel;
    var items = recordData[key] || [];

    var viewport = document.createElement('div');
    viewport.className = 'carousel-viewport';

    var track = document.createElement('div');
    track.className = 'carousel-track';

    items.forEach(function (item) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.innerHTML =
        '<div class="record-card">' +
          '<img src="' + item.image + '" alt="' + item.alt + '" loading="lazy">' +
          '<div class="record-caption"><strong>' + item.title + '</strong><span>' + item.meta + '</span></div>' +
        '</div>';
      track.appendChild(slide);
    });

    // WIP end slide
    var wipSlide = document.createElement('div');
    wipSlide.className = 'carousel-slide';
    wipSlide.innerHTML =
      '<div class="record-card wip">' +
        '<div class="wip-dots"><span></span><span></span><span></span></div>' +
        '<strong>More to come</strong>' +
        '<span>' + (wipCopy[key] || 'More items will be added here soon.') + '</span>' +
      '</div>';
    track.appendChild(wipSlide);

    viewport.appendChild(track);

    var prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-arrow prev';
    prevBtn.setAttribute('aria-label', 'Previous ' + key + ' item');
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';

    var nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-arrow next';
    nextBtn.setAttribute('aria-label', 'Next ' + key + ' item');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

    var dots = document.createElement('div');
    dots.className = 'carousel-dots';
    var totalSlides = items.length + 1;
    var dotButtons = [];
    for (var i = 0; i < totalSlides; i++) {
      var dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      (function (idx) {
        dot.addEventListener('click', function () { goTo(idx); });
      })(i);
      dots.appendChild(dot);
      dotButtons.push(dot);
    }

    container.appendChild(viewport);
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    container.appendChild(dots);

    if (totalSlides <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      dots.style.display = 'none';
    }

    var current = 0;

    function render() {
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dotButtons.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === totalSlides - 1;
    }

    function goTo(index) {
      current = Math.max(0, Math.min(totalSlides - 1, index));
      render();
    }

    prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); });

    // basic swipe support on touch devices
    var touchStartX = null;
    viewport.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 40) goTo(current + (delta < 0 ? 1 : -1));
      touchStartX = null;
    });

    render();
  }

  document.querySelectorAll('[data-carousel]').forEach(buildCarousel);
})();