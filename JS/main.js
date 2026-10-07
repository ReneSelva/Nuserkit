const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-navigation");

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Abrir menú" : "Cerrar menú");
  navigation?.classList.toggle("is-open", !isOpen);
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Abrir menú");
    navigation.classList.remove("is-open");
  });
});

const year = document.querySelector("#current-year");
if (year) year.textContent = String(new Date().getFullYear());

const faqMoreToggle = document.querySelector(".faq-more-toggle");
const faqMore = document.querySelector("#faq-more");

if (faqMoreToggle && faqMore) {
  faqMoreToggle.addEventListener("click", () => {
    const isExpanded = faqMoreToggle.getAttribute("aria-expanded") === "true";
    const nextExpanded = !isExpanded;

    faqMoreToggle.setAttribute("aria-expanded", String(nextExpanded));
    faqMoreToggle.textContent = nextExpanded ? "Ver menos preguntas" : "Ver más preguntas";
    faqMore.setAttribute("aria-hidden", String(!nextExpanded));
    faqMore.toggleAttribute("inert", !nextExpanded);
    faqMore.classList.toggle("is-expanded", nextExpanded);
  });
}

const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');

const captureThemeLabel = document.querySelector("[data-theme-label]");
const captureStatusSwatch = document.querySelector(".capture-status .theme-swatch");
const galleryModeLabel = document.querySelector("[data-current-mode]");
const galleryImages = document.querySelectorAll(".gallery-item img[data-light][data-dark]");
const captureLightbox = document.querySelector("#capture-lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxFrame = captureLightbox?.querySelector(".lightbox-frame");
const zoomLevelLabel = document.querySelector("#lightbox-zoom-level");
const galleryImageList = [...galleryImages];
let activeGalleryIndex = -1;

function setPageTheme(theme, persist = false) {
  if (theme !== "light" && theme !== "dark") return;

  document.documentElement.dataset.pageTheme = theme;
  if (themeColor) themeColor.content = theme === "dark" ? "#111214" : "#f7f8fc";

  if (themeToggle) {
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", `Cambiar a modo ${isDark ? "claro" : "oscuro"}`);
  }

  if (captureThemeLabel) {
    captureThemeLabel.textContent = theme === "dark" ? "Oscuro" : "Claro";
  }

  if (captureStatusSwatch) {
    captureStatusSwatch.classList.toggle("dark-swatch", theme === "dark");
    captureStatusSwatch.classList.toggle("light-swatch", theme === "light");
  }

  if (galleryModeLabel) {
    galleryModeLabel.textContent = `Modo ${theme === "dark" ? "oscuro" : "claro"}`;
  }

  galleryImages.forEach((image) => {
    image.src = image.dataset[theme === "dark" ? "dark" : "light"];
  });

  if (captureLightbox?.open && lightboxImage && activeGalleryIndex >= 0) {
    lightboxImage.src = galleryImageList[activeGalleryIndex].src;
  }

  if (persist) {
    try {
      localStorage.setItem("nursekit-page-theme", theme);
    } catch {}
  }
}

let savedTheme = null;
try {
  savedTheme = localStorage.getItem("nursekit-page-theme");
} catch {}
setPageTheme(savedTheme || document.documentElement.dataset.pageTheme);

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.pageTheme;
  setPageTheme(currentTheme === "dark" ? "light" : "dark", true);
});

if (captureLightbox && typeof captureLightbox.showModal === "function" && lightboxImage) {
  const closeButton = captureLightbox.querySelector(".lightbox-close");
  const previousButton = captureLightbox.querySelector(".lightbox-prev");
  const nextButton = captureLightbox.querySelector(".lightbox-next");
  const zoomOutButton = captureLightbox.querySelector(".zoom-out");
  const zoomInButton = captureLightbox.querySelector(".zoom-in");
  const zoomResetButton = captureLightbox.querySelector(".zoom-reset");
  let closeTimer = 0;
  let isClosing = false;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let touchStartX = null;
  let touchStartY = null;
  let touchStartZoom = 1;
  let touchWasPinching = false;

  const resetZoomGesture = () => {
    isDragging = false;
    pinchStartDistance = 0;
    pinchStartZoom = 1;
    touchStartX = null;
    touchStartY = null;
    touchStartZoom = 1;
    touchWasPinching = false;
    lightboxFrame?.classList.remove("is-dragging");
  };

  const updateZoom = (nextZoom) => {
    zoomLevel = Math.max(1, Math.min(3, nextZoom));
    if (zoomLevel === 1) {
      panX = 0;
      panY = 0;
    }

    const maxPanX = lightboxFrame ? lightboxFrame.clientWidth * (zoomLevel - 1) / 2 : 0;
    const maxPanY = lightboxFrame ? lightboxFrame.clientHeight * (zoomLevel - 1) / 2 : 0;
    panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
    panY = Math.max(-maxPanY, Math.min(maxPanY, panY));

    lightboxImage.style.setProperty("--zoom", String(zoomLevel));
    lightboxImage.style.setProperty("--pan-x", `${panX}px`);
    lightboxImage.style.setProperty("--pan-y", `${panY}px`);
    lightboxFrame?.classList.toggle("is-zoomed", zoomLevel > 1);
    if (zoomLevelLabel) zoomLevelLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
    if (zoomOutButton) zoomOutButton.disabled = zoomLevel <= 1;
    if (zoomInButton) zoomInButton.disabled = zoomLevel >= 3;
  };

  const showGalleryImage = (index, direction = 0) => {
    const image = galleryImageList[index];
    if (!image) return;

    activeGalleryIndex = index;
    resetZoomGesture();
    updateZoom(1);
    lightboxImage.src = image.src;
    lightboxImage.dataset.light = image.dataset.light || "";
    lightboxImage.dataset.dark = image.dataset.dark || "";
    lightboxImage.alt = image.alt || `Captura de NurseKit: ${image.closest(".gallery-item")?.querySelector("figcaption")?.textContent || ""}`;

    if (lightboxCaption) {
      const caption = image.closest(".gallery-item")?.querySelector("figcaption")?.textContent || "";
      lightboxCaption.textContent = `${caption} · ${index + 1} de ${galleryImageList.length}`;
    }

    if (direction) {
      captureLightbox.classList.remove("is-sliding-next", "is-sliding-prev");
      void captureLightbox.offsetWidth;
      captureLightbox.classList.add(direction > 0 ? "is-sliding-next" : "is-sliding-prev");
    }
  };

  const moveGallery = (direction) => {
    if (isClosing || galleryImageList.length < 2 || activeGalleryIndex < 0) return;
    const nextIndex = (activeGalleryIndex + direction + galleryImageList.length) % galleryImageList.length;
    showGalleryImage(nextIndex, direction);
  };

  const closeLightbox = () => {
    if (!captureLightbox.open || isClosing) return;
    isClosing = true;
    captureLightbox.inert = true;
    captureLightbox.classList.remove("is-sliding-next", "is-sliding-prev");
    captureLightbox.classList.add("is-closing");
    const closeDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    closeTimer = window.setTimeout(() => captureLightbox.close(), closeDelay);
  };

  zoomOutButton?.addEventListener("click", () => updateZoom(zoomLevel - 0.25));
  zoomInButton?.addEventListener("click", () => updateZoom(zoomLevel + 0.25));
  zoomResetButton?.addEventListener("click", () => updateZoom(1));

  lightboxFrame?.addEventListener("wheel", (event) => {
    event.preventDefault();
    updateZoom(zoomLevel + (event.deltaY < 0 ? 0.2 : -0.2));
  }, { passive: false });

  lightboxFrame?.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(".lightbox-zoom")) return;
    if (event.pointerType === "touch" || zoomLevel <= 1 || event.button !== 0) return;
    event.preventDefault();
    isDragging = true;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    panStartX = panX;
    panStartY = panY;
    lightboxFrame.classList.add("is-dragging");
    lightboxFrame.setPointerCapture(event.pointerId);
  });
  lightboxFrame?.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    panX = panStartX + event.clientX - pointerStartX;
    panY = panStartY + event.clientY - pointerStartY;
    updateZoom(zoomLevel);
  });
  const stopDragging = () => {
    isDragging = false;
    lightboxFrame?.classList.remove("is-dragging");
  };
  lightboxFrame?.addEventListener("pointerup", stopDragging);
  lightboxFrame?.addEventListener("pointercancel", stopDragging);
  lightboxFrame?.addEventListener("lostpointercapture", stopDragging);
  document.addEventListener("pointerup", stopDragging);
  document.addEventListener("pointercancel", stopDragging);

  lightboxFrame?.addEventListener("touchstart", (event) => {
    if (event.target instanceof Element && event.target.closest(".lightbox-zoom")) return;
    if (event.touches.length >= 2) {
      touchWasPinching = true;
      pinchStartDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      pinchStartZoom = zoomLevel;
    } else if (zoomLevel > 1 && event.touches.length === 1 && touchStartX !== null && touchStartY !== null) {
      panStartX = panX;
      panStartY = panY;
    }
  }, { passive: true });
  lightboxFrame?.addEventListener("touchmove", (event) => {
    if (event.touches.length >= 2 && pinchStartDistance > 0) {
      event.preventDefault();
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      updateZoom(pinchStartZoom * distance / pinchStartDistance);
    } else if (zoomLevel > 1 && event.touches.length === 1 && touchStartX !== null && touchStartY !== null) {
      event.preventDefault();
      panX = panStartX + event.touches[0].clientX - touchStartX;
      panY = panStartY + event.touches[0].clientY - touchStartY;
      updateZoom(zoomLevel);
    }
  }, { passive: false });
  document.querySelectorAll(".gallery-item .image-shell").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      if (!image) return;

      window.clearTimeout(closeTimer);
      isClosing = false;
      captureLightbox.inert = false;
      captureLightbox.classList.remove("is-closing", "is-sliding-next", "is-sliding-prev");
      showGalleryImage(galleryImageList.indexOf(image));
      captureLightbox.showModal();
    });
  });

  previousButton?.addEventListener("click", () => moveGallery(-1));
  nextButton?.addEventListener("click", () => moveGallery(1));
  closeButton?.addEventListener("click", closeLightbox);
  captureLightbox.addEventListener("click", (event) => {
    if (event.target === captureLightbox) closeLightbox();
  });
  captureLightbox.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });
  captureLightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveGallery(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveGallery(1);
    }
  });

  captureLightbox.addEventListener("touchstart", (event) => {
    if (event.touches.length >= 2) {
      touchWasPinching = true;
      touchStartX = null;
      touchStartY = null;
      return;
    }

    if (event.target instanceof Element && event.target.closest(".lightbox-zoom, .lightbox-nav, .lightbox-close")) {
      touchStartX = null;
      touchStartY = null;
      return;
    }

    const touch = event.touches[0];
    touchStartX = touch?.clientX ?? null;
    touchStartY = touch?.clientY ?? null;
    touchStartZoom = zoomLevel;
    if (zoomLevel > 1 && event.target instanceof Element && event.target.closest(".lightbox-frame")) {
      panStartX = panX;
      panStartY = panY;
    }
  }, { passive: true });
  captureLightbox.addEventListener("touchend", (event) => {
    if (touchWasPinching) {
      if (event.touches.length === 0) {
        touchWasPinching = false;
        touchStartX = null;
        touchStartY = null;
        touchStartZoom = 1;
      }
      return;
    }

    if (event.touches.length > 0) return;
    const endTouch = event.changedTouches[0];
    if (touchStartZoom !== 1 || touchStartX === null || touchStartY === null || !endTouch) {
      touchStartX = null;
      touchStartY = null;
      touchStartZoom = 1;
      return;
    }

    const deltaX = endTouch.clientX - touchStartX;
    const deltaY = endTouch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    touchStartZoom = 1;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      moveGallery(deltaX < 0 ? 1 : -1);
    }
  }, { passive: true });
  captureLightbox.addEventListener("close", () => {
    window.clearTimeout(closeTimer);
    captureLightbox.inert = false;
    captureLightbox.classList.remove("is-closing", "is-sliding-next", "is-sliding-prev");
    isClosing = false;
    activeGalleryIndex = -1;
    resetZoomGesture();
    updateZoom(1);
  });
}

document.querySelectorAll(".capture-image").forEach((image) => {
  image.addEventListener("error", () => {
    image.alt = "No se pudo cargar esta captura original de NurseKit.";
  }, { once: true });
});