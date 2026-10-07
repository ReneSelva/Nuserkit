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

  if (captureLightbox?.open && lightboxImage) {
    const activeImage = [...galleryImages].find((image) => image.dataset.light === lightboxImage.dataset.light && image.dataset.dark === lightboxImage.dataset.dark);
    if (activeImage) {
      lightboxImage.src = activeImage.src;
      lightboxImage.alt = activeImage.alt;
    }
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

  document.querySelectorAll(".gallery-item .image-shell").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      if (!image) return;

      lightboxImage.src = image.src;
      lightboxImage.dataset.light = image.dataset.light || "";
      lightboxImage.dataset.dark = image.dataset.dark || "";
      lightboxImage.alt = image.alt || `Captura de NurseKit: ${button.getAttribute("aria-label")?.replace("Ampliar captura: ", "") || ""}`;
      captureLightbox.showModal();
    });
  });

  closeButton?.addEventListener("click", () => captureLightbox.close());
  captureLightbox.addEventListener("click", (event) => {
    if (event.target === captureLightbox) captureLightbox.close();
  });
}

document.querySelectorAll(".capture-image").forEach((image) => {
  image.addEventListener("error", () => {
    image.alt = "No se pudo cargar esta captura original de NurseKit.";
  }, { once: true });
});