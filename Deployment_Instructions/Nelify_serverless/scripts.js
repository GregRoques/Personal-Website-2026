"use strict";

/* =============================================================================
   PORTFOLIO SCRIPTS
   Table of Contents:
   1. Constants & Configuration
   2. Initialization
   3. Core Functions
   4. Intersection Observer
   5. Pop-up Component
   6. Contact Form (SweetAlert2)
============================================================================= */


/* =============================================================================
   1. CONSTANTS & CONFIGURATION
============================================================================= */

const POPUP_CONFIG = {
    endDate: new Date(2026, 3, 11),
    imageUrl: "images/popup/popupImage-1.jpg",
    linkUrl: "https://marathon-paris.dossards-solidaires.org/fundraisers/greg-roques?utm_campaign=dossards-solidaires&utm_content=new_action&utm_medium=email-auto&utm_source=kentaa",
    showDelay: 1000,
    autoCloseDelay: 11000
};

const BACKGROUND_IMAGE_IDS = ["sd-background-image", "skills-background-image"];


/* =============================================================================
   2. INITIALIZATION
============================================================================= */

initApp();

/* =============================================================================
   3. CORE FUNCTIONS
============================================================================= */

/**
 * Main application initialization after DOM is fully loaded
 */
function initApp() {

    // Scroll to top of page on image load/reload
    window.onpageshow = () => {
        history.scrollRestoration = "manual";
    };

    // Modify default years-of-experience to actual years of experience
    calculateExperience()
    
    // Prevent image context menu and dragging
    document.querySelectorAll("img").forEach((img) => {
        secureImage(img);
    });

    // Initialize intersection observer
    const hiddenElements = document.querySelectorAll(".hidden, .background-hidden");
    initIntersectionObserver(hiddenElements);
}

/**
 * Prevents saving images
 */
function secureImage(img){
    img.oncontextmenu = (e) => e.preventDefault();
    img.ondragstart = (e) => e.preventDefault();
}

/**
 * Calculates and displays years of ServiceNow experience
 */
function calculateExperience() {
    const startYear = 2019;
    const currentYear = new Date().getFullYear();
    const experience = currentYear - startYear;
    document.getElementById("sn_years_experience").innerHTML = experience.toString();
}


/* =============================================================================
   4. INTERSECTION OBSERVER
============================================================================= */

/**
 * Sets up intersection observer for reveal animations
 * @param {NodeList} elements - Elements to observe
 */
function initIntersectionObserver(elements) {
    const setupObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const { target } = entry;
                const isBackgroundImage = BACKGROUND_IMAGE_IDS.includes(target.id);

                if (isBackgroundImage) {
                    target.classList.add("background-show");
                } else {
                    target.classList.add("show");
                    // Remove hidden class after animation completes
                    setTimeout(() => target.classList.remove("hidden"), 3000);

                    // Handle popup element
                    if (target.id === "popUp") {
                        initPopup();
                    }
                }

                observer.unobserve(target);
            });
        });

        elements.forEach((el) => observer.observe(el));
    };

    const handleScrollToTop = () => {
        if (window.pageYOffset === 0 || window.scrollY === 0) {
            setupObserver();
            window.removeEventListener("scroll", handleScrollToTop);
        }
    };

    // Initialize observer when at top of page, or scroll to top first
    if (window.pageYOffset === 0 || window.scrollY === 0) {
        setupObserver();
    } else {
        window.scrollTo(0, 0);
        window.addEventListener("scroll", handleScrollToTop);
    }
}


/* =============================================================================
   5. POP-UP COMPONENT
============================================================================= */

/**
 * Initializes the popup if within display date range
 */
function initPopup() {
    const currentDate = new Date();

    if (currentDate >= POPUP_CONFIG.endDate) return;

    setTimeout(() => {
        const popUpContainer = document.getElementById("popUp");
        if (!popUpContainer) return;

        popUpContainer.innerHTML = `
            <div class="popUpFrame">
                <div id="popUpCloseButton" class="popUpCloseButton" onclick="closePopUp()">X</div>
                <a href="${POPUP_CONFIG.linkUrl}" target="_blank" rel="noopener noreferrer">
                    <img id="popUpImage" onload="onPopupImageLoad()" class="popUpImage" alt="Pop Up Message" src="${POPUP_CONFIG.imageUrl}">
                </a>
            </div>
        `;
    }, POPUP_CONFIG.showDelay);
}

/**
 * Handles popup image load - triggers fade-in animations
 */
function onPopupImageLoad() {
    const popupImage = document.getElementById("popUpImage");
    const closeButton = document.getElementById("popUpCloseButton");
    
    secureImage(popupImage);
    if (popupImage) popupImage.classList.add("imgFadeIn");
    if (closeButton) closeButton.classList.add("popUpCloseButtonFadeIn");

    // Auto-close popup after animation completes
    setTimeout(() => {
        const popUp = document.getElementById("popUp");
        if (popUp) popUp.remove();
    }, POPUP_CONFIG.autoCloseDelay);
}

/**
 * Closes the popup when X button is clicked
 */
function closePopUp() {
    const popUp = document.getElementById("popUp");
    if (popUp) popUp.remove();
}

// Legacy function name for backwards compatibility with inline HTML
function imgFadeIn() {
    onPopupImageLoad();
}

