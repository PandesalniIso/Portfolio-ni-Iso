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
     COPY EMAIL TO CLIPBOARD
     ============================================ */
  var copyEmailBtn = document.getElementById('copyEmail');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', function () {
      var email = copyEmailBtn.dataset.email;

      function showCopied() {
        copyEmailBtn.classList.add('is-copied');
        var textEl = copyEmailBtn.querySelector('.contact-text');
        var original = textEl.textContent;
        textEl.textContent = 'Copied!';
        setTimeout(function () {
          textEl.textContent = original;
          copyEmailBtn.classList.remove('is-copied');
        }, 1500);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(showCopied);
      } else {
        // Fallback for older/unsupported browsers
        var temp = document.createElement('textarea');
        temp.value = email;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(temp);
        showCopied();
      }
    });
  }

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
      { title: 'Quiz 1', meta: '18/20 pts', file: 'Quiz 1.png', alt: 'Quiz 1 result screenshot' }
    ],
    exam: [],
    lab: [
      { title: 'Lab 1', meta: 'Click here to download the file', file: 'Macarayon_Lab1.pdf', bg: 'lab1-cover.png', alt: 'Lab 1 Activity' }
    ]
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

    // File extensions that should show as a downloadable attachment card
    // instead of being rendered as an <img>.
    var fileExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'txt'];

    function isDownloadableFile(src) {
      var ext = (src.split('.').pop() || '').toLowerCase();
      return fileExts.indexOf(ext) !== -1;
    }

    // Samples a background image's average brightness so the caption text
    // can automatically switch to a light or dark, always-legible variant —
    // regardless of what's underneath the blur or which theme is active.
    function applyAutoContrast(imgSrc, cardEl) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          var size = 16; // downscale for a fast, cheap average
          canvas.width = size;
          canvas.height = size;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, size, size);
          var data = ctx.getImageData(0, 0, size, size).data;
          var total = 0;
          for (var i = 0; i < data.length; i += 4) {
            // perceived luminance
            total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          var avg = total / (data.length / 4);
          cardEl.classList.add(avg < 130 ? 'bg-dark' : 'bg-light');
        } catch (err) {
          // Canvas read can fail (e.g. cross-origin image without CORS headers) —
          // silently keep the default theme-based text color in that case.
        }
      };
      img.src = imgSrc;
    }

    items.forEach(function (item) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide';

      if (isDownloadableFile(item.file)) {
        var ext = item.file.split('.').pop().toUpperCase();
        // Optional: set item.bg (in recordData) to a path/URL for a blurred
        // background image behind the card. If omitted, a plain surface color is used.
        var bgLayer = item.bg
          ? '<div class="file-bg" style="background-image:url(\'' + item.bg + '\')"></div>'
          : '';
        slide.innerHTML =
          '<a class="record-card record-file" href="' + item.file + '" download>' +
            bgLayer +
            '<div class="file-content">' +
              '<div class="file-icon">' + ext + '</div>' +
              '<div class="record-caption"><strong>' + item.title + '</strong><span>' + item.meta + '</span></div>' +
              '<span class="file-download-hint">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>' +
                'Download' +
              '</span>' +
            '</div>' +
          '</a>';

        if (item.bg) {
          applyAutoContrast(item.bg, slide.querySelector('.record-file'));
        }
      } else {
        slide.innerHTML =
          '<div class="record-card">' +
            '<img src="' + item.file + '" alt="' + item.alt + '" loading="lazy">' +
            '<div class="record-caption"><strong>' + item.title + '</strong><span>' + item.meta + '</span></div>' +
          '</div>';
      }

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
