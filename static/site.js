(() => {
    document.documentElement.classList.add("js-enabled");

    const body = document.body;
    const menuButton = document.querySelector("[data-menu-button]");
    const menuPanel = document.querySelector("[data-menu-panel]");
    const menuOverlay = document.querySelector("[data-menu-overlay]");
    const menuClose = document.querySelector("[data-menu-close]");

    const closeMenu = () => {
        if (!menuPanel || !menuOverlay || !menuButton) {
            return;
        }
        menuPanel.classList.remove("is-open");
        menuOverlay.classList.remove("is-visible");
        body.classList.remove("menu-open");
        menuButton.setAttribute("aria-expanded", "false");
    };

    if (menuButton && menuPanel && menuOverlay) {
        menuButton.addEventListener("click", () => {
            const isOpen = menuPanel.classList.toggle("is-open");
            menuOverlay.classList.toggle("is-visible", isOpen);
            body.classList.toggle("menu-open", isOpen);
            menuButton.setAttribute("aria-expanded", String(isOpen));
        });

        menuOverlay.addEventListener("click", closeMenu);
        if (menuClose) {
            menuClose.addEventListener("click", closeMenu);
        }
        menuPanel.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", (event) => {
            if (!menuPanel.classList.contains("is-open")) {
                return;
            }
            if (menuPanel.contains(event.target) || menuButton.contains(event.target)) {
                return;
            }
            closeMenu();
        });
    }

    document.querySelectorAll("[data-current-year]").forEach((el) => {
        el.textContent = new Date().getFullYear();
    });

    const today = new Date().getDay();
    document.querySelectorAll(".hours-list").forEach((list) => {
        const todayItem = list.querySelector(`[data-day="${today}"]`);
        if (todayItem) {
            todayItem.classList.add("is-today");
        }
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElements = document.querySelectorAll("[data-reveal]");
    const staggerGroups = document.querySelectorAll("[data-stagger]");

    staggerGroups.forEach((group) => {
        const step = Number(group.getAttribute("data-stagger")) || 0.08;
        const items = group.querySelectorAll("[data-reveal]");

        items.forEach((item, index) => {
            if (!item.style.getPropertyValue("--delay")) {
                item.style.setProperty("--delay", `${(index * step).toFixed(2)}s`);
            }
        });
    });

    if (!prefersReducedMotion && revealElements.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );

        revealElements.forEach((el) => {
            observer.observe(el);
        });
    } else {
        revealElements.forEach((el) => el.classList.add("visible"));
    }

    const lightboxLinks = Array.from(document.querySelectorAll("[data-lightbox]"));

    if (lightboxLinks.length) {
        const groups = new Map();

        lightboxLinks.forEach((link) => {
            const group = link.getAttribute("data-lightbox") || "default";
            if (!groups.has(group)) {
                groups.set(group, []);
            }
            groups.get(group).push(link);
        });

        const lightbox = document.createElement("div");
        lightbox.className = "lightbox";
        lightbox.innerHTML = `
            <div class="lightbox__content" role="dialog" aria-modal="true" aria-label="Anteprima immagine">
                <button class="lightbox__close" type="button" aria-label="Chiudi">X</button>
                <button class="lightbox__arrow lightbox__arrow--prev" type="button" aria-label="Immagine precedente"><</button>
                <img class="lightbox__image" alt="">
                <button class="lightbox__arrow lightbox__arrow--next" type="button" aria-label="Immagine successiva">></button>
            </div>
        `;
        document.body.appendChild(lightbox);

        const lightboxImage = lightbox.querySelector(".lightbox__image");
        const closeButton = lightbox.querySelector(".lightbox__close");
        const prevButton = lightbox.querySelector(".lightbox__arrow--prev");
        const nextButton = lightbox.querySelector(".lightbox__arrow--next");

        let activeGroup = [];
        let activeIndex = 0;

        const updateNavigation = () => {
            const hasMultiple = activeGroup.length > 1;
            prevButton.style.display = hasMultiple ? "grid" : "none";
            nextButton.style.display = hasMultiple ? "grid" : "none";
        };

        const updateLightboxImage = (index) => {
            const link = activeGroup[index];
            if (!link) {
                return;
            }

            const img = link.querySelector("img");
            const source = link.getAttribute("href") || (img ? img.getAttribute("src") : "");

            if (!source) {
                return;
            }

            lightboxImage.setAttribute("src", source);
            lightboxImage.setAttribute("alt", img ? img.getAttribute("alt") || "Immagine ingrandita" : "Immagine ingrandita");
            activeIndex = index;
            updateNavigation();
        };

        const openLightbox = (groupName, index) => {
            activeGroup = groups.get(groupName) || [];
            updateLightboxImage(Math.max(index, 0));
            body.classList.add("lightbox-open");
            lightbox.classList.add("is-open");
        };

        const closeLightbox = () => {
            lightbox.classList.remove("is-open");
            body.classList.remove("lightbox-open");
        };

        const showPrev = () => {
            if (activeGroup.length < 2) {
                return;
            }
            const nextIndex = (activeIndex - 1 + activeGroup.length) % activeGroup.length;
            updateLightboxImage(nextIndex);
        };

        const showNext = () => {
            if (activeGroup.length < 2) {
                return;
            }
            const nextIndex = (activeIndex + 1) % activeGroup.length;
            updateLightboxImage(nextIndex);
        };

        lightboxLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const group = link.getAttribute("data-lightbox") || "default";
                const groupItems = groups.get(group) || [];
                const index = Math.max(0, groupItems.indexOf(link));
                openLightbox(group, index);
            });
        });

        closeButton.addEventListener("click", closeLightbox);
        prevButton.addEventListener("click", showPrev);
        nextButton.addEventListener("click", showNext);

        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (!lightbox.classList.contains("is-open")) {
                return;
            }
            if (event.key === "Escape") {
                closeLightbox();
            }
            if (event.key === "ArrowLeft") {
                showPrev();
            }
            if (event.key === "ArrowRight") {
                showNext();
            }
        });
    }

    const imageSliders = document.querySelectorAll("[data-image-slider]");

    imageSliders.forEach((slider) => {
        const slides = Array.from(slider.querySelectorAll(".media-tile"));

        if (!slides.length) {
            return;
        }

        slides[0].classList.add("is-active");

        if (prefersReducedMotion) {
            slides.forEach((slide) => slide.classList.add("is-active"));
            return;
        }

        const sliderObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle("is-active", entry.isIntersecting);
                });
            },
            { root: slider, threshold: 0.6 }
        );

        slides.forEach((slide) => sliderObserver.observe(slide));
    });

    const btnAboutToggle = document.getElementById("btn-about-toggle");
    const aboutExpandedText = document.getElementById("about-expanded-text");

    if (btnAboutToggle && aboutExpandedText) {
        btnAboutToggle.addEventListener("click", () => {
            const isExpanded = btnAboutToggle.getAttribute("aria-expanded") === "true";
            
            if (isExpanded) {
                btnAboutToggle.setAttribute("aria-expanded", "false");
                aboutExpandedText.classList.remove("is-expanded");
                btnAboutToggle.querySelector("span").textContent = "Leggi di più";
            } else {
                btnAboutToggle.setAttribute("aria-expanded", "true");
                aboutExpandedText.classList.add("is-expanded");
                btnAboutToggle.querySelector("span").textContent = "Mostra meno";
            }
        });
    }
})();
