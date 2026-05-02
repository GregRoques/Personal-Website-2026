"use strict";

/* =============================================================================
   PORTFOLIO SCRIPTS
   Table of Contents:
   1. Constants & Configuration
   2. Initialization
   3. Core Functions
   4. Intersection Observer
   5. Contact Form (SweetAlert2)
============================================================================= */


/* =============================================================================
   1. CONSTANTS & CONFIGURATION
============================================================================= */

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

