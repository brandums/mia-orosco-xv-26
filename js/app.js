(function () {
  "use strict";

  const WHATSAPP_NUMBER = "";
  const PHOTO_LINK = "";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", () => {
    $$("img[title]").forEach((img) => img.removeAttribute("title"));
    injectRuntimeStyles();
    setupViewportHeight();
    applyUrlOptions();
    setupEntrance();
    setupMusicButton();
    setupScrollAnimations();
    setupElementorLottie();
    setupElementorSlides();
    setupCountdown();
    setupCalendarButton();
    setupMapModal();
    setupElementorLightbox();
    setupOptionalButtons();
  });

  function applyUrlOptions() {
    const params = new URLSearchParams(window.location.search);
    if ((params.get("ocultar") || "").toLowerCase() === "si") {
      document.body.classList.add("ocultar-cuerpo");
    }
  }

  function injectRuntimeStyles() {
    if ($("#local-runtime-styles")) return;
    const style = document.createElement("style");
    style.id = "local-runtime-styles";
    style.textContent = `
      @keyframes localFadeIn { from { opacity: 0; transform: translate3d(0, 18px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
      @keyframes localZoomIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
      .animated { animation-duration: .9s; animation-fill-mode: both; }
      .fadeIn, .fadeInUp { animation-name: localFadeIn; }
      .zoomIn { animation-name: localZoomIn; }
      .e-lottie__animation svg, .e-lottie__container svg { width: 100%; height: 100%; display: block; }
      .elementor-widget-lottie .e-lottie__animation:empty { min-height: 64px; }
    `;
    document.head.appendChild(style);
  }

  function setupViewportHeight() {
    const setViewportHeight = () => {
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty("--v2-viewport-height", `${Math.ceil(viewportHeight)}px`);
    };

    setViewportHeight();
    window.addEventListener("resize", setViewportHeight, { passive: true });
    window.addEventListener("orientationchange", () => window.setTimeout(setViewportHeight, 250), { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setViewportHeight, { passive: true });
      window.visualViewport.addEventListener("scroll", setViewportHeight, { passive: true });
    }
  }

  function setupEntrance() {
    const overlay =
      $("#v2-capa-bloqueo") ||
      $("#contenedor-a-ocultar") ||
      $("[data-settings*='position&quot;:&quot;fixed'][id]");
    const buttonCandidates = overlay
      ? [
          overlay.querySelector(".v2-boton-entrar a, .v2-boton-entrar button, .v2-boton-entrar [role='button']"),
          ...$$("a, button, [role='button']", overlay).filter((el) => /ingresar|entrar/i.test(el.textContent || "")),
          overlay.querySelector("#boton-ocultar")
        ]
      : [];
    let enterButtons = Array.from(new Set(buttonCandidates.filter(Boolean)));
    if (!enterButtons.length && overlay) {
      enterButtons = [overlay];
      overlay.style.cursor = "pointer";
      overlay.setAttribute("role", overlay.getAttribute("role") || "button");
      overlay.setAttribute("tabindex", overlay.getAttribute("tabindex") || "0");
      overlay.setAttribute("aria-label", overlay.getAttribute("aria-label") || "Ingresar a la invitación");
    }
    const audio = $("#v2-musica") || $("audio");
    const musicButton = $("#v2-boton-control");
    if (!overlay || !enterButtons.length) return;

    document.body.classList.add("v2-entrada-bloqueada");
    document.body.style.overflow = "hidden";
    let opened = false;
    const tryPlayAudio = () => {
      if (!audio) return;
      audio.loop = true;
      audio.muted = false;
      audio.volume = 1;
      audio.preload = "auto";
      audio.setAttribute("playsinline", "");
      try { audio.load(); } catch (_) {}
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          const retry = () => {
            audio.play().catch(() => {});
            document.removeEventListener("pointerdown", retry);
            document.removeEventListener("keydown", retry);
          };
          document.addEventListener("pointerdown", retry, { once: true });
          document.addEventListener("keydown", retry, { once: true });
        });
      }
    };
    const openInvitation = (event) => {
      if (opened) return;
      opened = true;
      event.preventDefault();
      tryPlayAudio();
      const requestFullscreen =
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen ||
        document.documentElement.msRequestFullscreen ||
        document.documentElement.mozRequestFullScreen;
      if (requestFullscreen) {
        window.setTimeout(() => {
          Promise.resolve(requestFullscreen.call(document.documentElement)).catch(() => {});
        }, 250);
      }
      if (musicButton) {
        musicButton.style.display = "flex";
        window.setTimeout(() => { musicButton.style.opacity = "1"; }, 100);
      }
      overlay.classList.add("v2-abrir");
      overlay.style.pointerEvents = "none";
      window.setTimeout(() => {
        document.body.classList.remove("v2-entrada-bloqueada");
        document.body.style.overflow = "auto";
      }, 1000);
      window.setTimeout(() => { overlay.style.display = "none"; }, 1500);
    };
    enterButtons.forEach((button) => {
      button.addEventListener("click", openInvitation, { once: true });
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") openInvitation(event);
      }, { once: true });
    });
  }

  function setupMusicButton() {
    const audio = $("#v2-musica");
    const button = $("#v2-boton-control");
    if (!audio || !button) return;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (audio.paused) {
        audio.play().catch(() => {});
        button.classList.remove("paused");
      } else {
        audio.pause();
        button.classList.add("paused");
      }
    });
  }

  function setupScrollAnimations() {
    const animatedElements = $$(".elementor-invisible[data-settings*='animation']");
    const showAnimated = (element) => {
      const settings = element.getAttribute("data-settings") || "";
      const animation = settings.includes("zoomIn") ? "zoomIn" : "fadeIn";
      element.classList.remove("elementor-invisible");
      element.classList.add("animated", animation);
    };
    if (!("IntersectionObserver" in window)) {
      animatedElements.forEach(showAnimated);
      $$(".zoom-animar").forEach((el) => el.classList.add("zoom-in"));
      return;
    }
    const animatedObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showAnimated(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    animatedElements.forEach((element) => animatedObserver.observe(element));

    const zoomObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("zoom-in", entry.isIntersecting);
        entry.target.classList.toggle("zoom-out", !entry.isIntersecting);
      });
    }, { threshold: 0.25 });
    $$(".zoom-animar").forEach((element) => zoomObserver.observe(element));
  }

  function loadScriptOnce(src) {
    const existing = document.querySelector(`script[data-dynamic-src="${src}"]`);
    if (existing) {
      return existing.dataset.loaded === "true"
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
          });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.dataset.dynamicSrc = src;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  function parseSettings(element) {
    const raw = element?.getAttribute("data-settings");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (_) {
      try {
        const decoded = raw
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, "&");
        return JSON.parse(decoded);
      } catch (_) {
        return {};
      }
    }
  }

  function setupElementorLottie() {
    const widgets = $$(".elementor-widget-lottie[data-settings]");
    if (!widgets.length) return;

    const render = () => {
      if (!window.lottie) return;
      widgets.forEach((widget) => {
        if (widget.dataset.lottieRendered === "true") return;
        const settings = parseSettings(widget);
        const url = settings?.source_json?.url;
        const container = $(".e-lottie__animation", widget) || $(".elementor-widget-container", widget);
        if (!url || !container) return;
        widget.dataset.lottieRendered = "true";
        container.innerHTML = "";
        container.style.minHeight = container.style.minHeight || "64px";
        container.style.width = container.style.width || "100%";
        try {
          const animation = window.lottie.loadAnimation({
            container,
            renderer: settings.renderer || "svg",
            loop: settings.loop === "yes" || settings.loop === true,
            autoplay: true,
            path: url
          });
          const speed = Number(settings?.play_speed?.size || 1);
          if (Number.isFinite(speed) && speed > 0 && animation.setSpeed) animation.setSpeed(speed);
        } catch (_) {
          widget.dataset.lottieRendered = "error";
        }
      });
    };

    if (window.lottie) {
      render();
    } else {
      loadScriptOnce("js/lottie.min.js").then(render).catch(() => {});
    }
  }

  function setupElementorSlides() {
    $$("[data-settings*='background_slideshow_gallery']").forEach((section) => {
      const settings = parseSettings(section);
      const gallery = Array.isArray(settings.background_slideshow_gallery) ? settings.background_slideshow_gallery : [];
      const urls = gallery.map((item) => item && item.url).filter(Boolean);
      if (urls.length < 2 || section.dataset.slideshowReady === "true") return;
      section.dataset.slideshowReady = "true";
      let index = 0;
      const duration = Math.max(1500, Number(settings.background_slideshow_slide_duration || 3000));
      section.style.backgroundImage = `url("${urls[0]}")`;
      section.style.backgroundSize = section.style.backgroundSize || "cover";
      section.style.backgroundPosition = section.style.backgroundPosition || "center";
      window.setInterval(() => {
        index = (index + 1) % urls.length;
        section.style.backgroundImage = `url("${urls[index]}")`;
      }, duration);
    });

    $$(".elementor-slides-wrapper .swiper-wrapper").forEach((wrapper) => {
      const slides = $$(".swiper-slide", wrapper);
      if (slides.length < 2 || wrapper.dataset.simpleSliderReady === "true") return;
      wrapper.dataset.simpleSliderReady = "true";
      let index = 0;
      wrapper.style.position = wrapper.style.position || "relative";
      slides.forEach((slide, i) => {
        slide.style.transition = "opacity .6s ease";
        slide.style.opacity = i === 0 ? "1" : "0";
        slide.style.position = i === 0 ? "relative" : "absolute";
        slide.style.inset = "0";
        slide.style.pointerEvents = i === 0 ? "auto" : "none";
      });
      window.setInterval(() => {
        const previous = index;
        index = (index + 1) % slides.length;
        slides[previous].style.opacity = "0";
        slides[previous].style.position = "absolute";
        slides[previous].style.pointerEvents = "none";
        slides[index].style.opacity = "1";
        slides[index].style.position = "relative";
        slides[index].style.pointerEvents = "auto";
      }, 3000);
    });
  }

  function setupCountdown() {
    $$(".elementor-countdown-wrapper[data-date]").forEach((wrapper) => {
      const target = Number(wrapper.dataset.date) * 1000;
      if (!Number.isFinite(target)) return;
      const fields = {
        days: $(".elementor-countdown-days", wrapper),
        hours: $(".elementor-countdown-hours", wrapper),
        minutes: $(".elementor-countdown-minutes", wrapper),
        seconds: $(".elementor-countdown-seconds", wrapper),
      };
      const pad = (value) => String(Math.max(0, value)).padStart(2, "0");
      const tick = () => {
        const diff = Math.max(0, target - Date.now());
        const total = Math.floor(diff / 1000);
        if (fields.days) fields.days.textContent = pad(Math.floor(total / 86400));
        if (fields.hours) fields.hours.textContent = pad(Math.floor((total % 86400) / 3600));
        if (fields.minutes) fields.minutes.textContent = pad(Math.floor((total % 3600) / 60));
        if (fields.seconds) fields.seconds.textContent = pad(total % 60);
      };
      tick();
      window.setInterval(tick, 1000);
    });
  }

  function setupCalendarButton() {
    $$(".elementor-button, .gb-button").forEach((button) => {
      if (!normalizeText(button.textContent).includes("agendar evento")) return;
      button.setAttribute("href", "#");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        downloadCalendarFile();
      });
    });
  }

  function downloadCalendarFile() {
    const eventDate = getCountdownDate() || new Date(Date.now() + 86400000);
    const title = document.title || "Evento";
    const location = getFirstLocation();
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Invitacion local//HTML//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${Date.now()}-${slugify(title)}@local`,
      `DTSTAMP:${toUtcStamp(new Date())}`,
      `DTSTART:${toLocalIcsStamp(eventDate)}`,
      `DTEND:${toLocalIcsStamp(new Date(eventDate.getTime() + 5 * 60 * 60 * 1000))}`,
      `SUMMARY:${escapeIcs(title)}`,
      "DESCRIPTION:Invitación digital",
      `LOCATION:${escapeIcs(location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(title) || "evento"}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function setupMapModal() {
    const modal = createMapModal();
    document.body.appendChild(modal.root);
    $$(".elementor-button, .gb-button").forEach((button) => {
      const holder = button.closest("[data-coords]");
      const coords = holder?.getAttribute("data-coords");
      if (!coords) return;
      const text = normalizeText(button.textContent);
      const href = button.getAttribute("href") || "";
      const shouldOpen = href.includes("popup") || ["ubicacion", "llegar", "destino"].some((word) => text.includes(word));
      if (!shouldOpen) return;
      button.setAttribute("href", "#");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        modal.open(coords);
      });
    });
  }

  function createMapModal() {
    const root = document.createElement("div");
    root.className = "local-map-modal";
    root.hidden = true;
    root.innerHTML = `
      <div class="local-map-modal__dialog" role="dialog" aria-modal="true" aria-label="Ubicación del evento">
        <button class="local-map-modal__close" type="button" aria-label="Cerrar mapa">×</button>
        <iframe class="local-map-modal__frame" loading="lazy" title="Ubicación del evento"></iframe>
      </div>`;
    const frame = $(".local-map-modal__frame", root);
    const closeButton = $(".local-map-modal__close", root);
    const onKeydown = (event) => { if (event.key === "Escape") close(); };
    const close = () => {
      root.hidden = true;
      frame.removeAttribute("src");
      document.removeEventListener("keydown", onKeydown);
    };
    const open = (coords) => {
      frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(coords)}&t=m&z=16&output=embed`;
      root.hidden = false;
      closeButton.focus();
      document.addEventListener("keydown", onKeydown);
    };
    closeButton.addEventListener("click", close);
    root.addEventListener("click", (event) => { if (event.target === root) close(); });
    return { root, open, close };
  }

  function setupElementorLightbox() {
    const links = $$("a[href*='action%3Dlightbox'], a[href*='action=lightbox']");
    const items = [];
    links.forEach((link) => {
      const settings = parseElementorLightbox(link.getAttribute("href") || "");
      if (!settings?.url) return;
      const item = {
        src: settings.url,
        alt: link.querySelector("img")?.getAttribute("alt") || "",
      };
      const index = items.push(item) - 1;
      link.setAttribute("href", "#");
      link.addEventListener("click", (event) => {
        event.preventDefault();
        openLightbox(items, index);
      });
    });
  }

  function parseElementorLightbox(href) {
    try {
      const decoded = decodeURIComponent(href);
      const query = decoded.replace(/^#elementor-action:?/, "");
      const params = new URLSearchParams(query);
      if (params.get("action") !== "lightbox") return null;
      const encoded = params.get("settings");
      return encoded ? JSON.parse(atob(encoded)) : null;
    } catch (_) {
      return null;
    }
  }

  function openLightbox(items, initialIndex) {
    if (!items.length) return;
    let index = initialIndex;
    let root = $(".local-lightbox");
    if (!root) {
      root = document.createElement("div");
      root.className = "local-lightbox";
      root.hidden = true;
      root.innerHTML = `
        <button class="local-lightbox__close" type="button" aria-label="Cerrar">×</button>
        <button class="local-lightbox__nav local-lightbox__nav--prev" type="button" aria-label="Anterior">‹</button>
        <figure class="local-lightbox__figure"><img class="local-lightbox__img" alt=""></figure>
        <button class="local-lightbox__nav local-lightbox__nav--next" type="button" aria-label="Siguiente">›</button>`;
      document.body.appendChild(root);
    }
    const img = $(".local-lightbox__img", root);
    const closeButton = $(".local-lightbox__close", root);
    const prevButton = $(".local-lightbox__nav--prev", root);
    const nextButton = $(".local-lightbox__nav--next", root);
    const render = () => {
      const item = items[index];
      img.src = item.src;
      img.alt = item.alt || "";
      prevButton.hidden = items.length < 2;
      nextButton.hidden = items.length < 2;
    };
    const close = () => {
      root.hidden = true;
      img.removeAttribute("src");
      document.removeEventListener("keydown", onKeydown);
    };
    const step = (delta) => {
      index = (index + delta + items.length) % items.length;
      render();
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    closeButton.onclick = close;
    prevButton.onclick = () => step(-1);
    nextButton.onclick = () => step(1);
    root.onclick = (event) => { if (event.target === root) close(); };
    render();
    root.hidden = false;
    closeButton.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function setupOptionalButtons() {
    $$(".elementor-button, .gb-button").forEach((button) => {
      const text = normalizeText(button.textContent);
      const href = button.getAttribute("href");
      if (text.includes("compartir fotos") || text.includes("compartir tus fotos")) {
        button.setAttribute("href", "#");
        button.addEventListener("click", (event) => {
          event.preventDefault();
          if (PHOTO_LINK) window.open(PHOTO_LINK, "_blank", "noopener");
          else showToast("Configura PHOTO_LINK en js/app.js para compartir fotos.");
        });
      }
      if ((text.includes("confirmar asistencia") || text === "enviar") && (!href || href === "#")) {
        button.setAttribute("href", "#");
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const message = buildConfirmationMessage();
          if (WHATSAPP_NUMBER) window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
          else showToast("Configura WHATSAPP_NUMBER en js/app.js para enviar por WhatsApp.");
        });
      }
    });
  }

  function buildConfirmationMessage() {
    const fields = $$("input, textarea, select")
      .filter((field) => field.type !== "hidden" && field.type !== "submit" && field.type !== "button")
      .map((field) => {
        const label = field.getAttribute("placeholder") || field.getAttribute("name") || field.getAttribute("id") || "Dato";
        return `${label}: ${field.value || ""}`;
      })
      .filter(Boolean);
    return [`Hola, confirmo mi asistencia a ${document.title || "el evento"}.`, ...fields].join("\n");
  }

  function getCountdownDate() {
    const seconds = Number($(".elementor-countdown-wrapper[data-date]")?.dataset.date);
    return Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
  }

  function getFirstLocation() {
    const coords = $("[data-coords]")?.getAttribute("data-coords") || "";
    return decodeURIComponent(coords.replace(/\+/g, " "));
  }

  function showToast(message) {
    let toast = $(".local-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "local-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
  }

  function normalizeText(value) {
    return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function escapeIcs(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function toUtcStamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function toLocalIcsStamp(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  function slugify(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
})();
