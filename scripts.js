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
   7. Instagram Feed
============================================================================= */


/* =============================================================================
   1. CONSTANTS & CONFIGURATION
============================================================================= */

const CONTACT_API_URL = `${window.location.protocol}//${window.location.hostname}/personaldata`;
const INSTAGRAM_API_URL = `${window.location.protocol}//${window.location.hostname}/instagram`;

// Local Testing
//const INSTAGRAM_API_URL = `http:localhost:2000/instagram`;
//const CONTACT_API_URL = `http:localhost:2000/personaldata`


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

    // Fetch Instagram data on load
    fetchInstagramData();

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


/* =============================================================================
   6. CONTACT FORM (SWEETALERT2)
============================================================================= */

/**
 * Opens a SweetAlert2 contact form. Validates inputs, submits to the backend,
 * and prevents duplicate submissions within the same session.
 */
async function openContactForm() {
    if (sessionStorage.getItem("contactSent")) {
        Swal.fire({
            icon: "info",
            title: "Already Sent",
            text: "You have already submitted a message this session.",
            confirmButtonColor: "#62D84E",
        });
        return;
    }

    const result = await Swal.fire({
        title: "Contact Me",
        html:
            '<input id="swal-name" class="swal2-input" placeholder="Name" type="text" maxlength="100">' +
            '<input id="swal-email" class="swal2-input" placeholder="Email" type="email">' +
            '<input id="swal-phone" class="swal2-input" placeholder="Phone (optional)" type="tel" maxlength="10">' +
            '<input id="swal-subject" class="swal2-input" placeholder="Subject" type="text" maxlength="200">' +
            '<textarea id="swal-message" class="swal2-textarea" placeholder="Message" maxlength="5000"></textarea>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#62D84E",
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async () => {
            const name = document.getElementById("swal-name").value.trim();
            const email = document.getElementById("swal-email").value.trim();
            const phone = document.getElementById("swal-phone").value.trim();
            const subject = document.getElementById("swal-subject").value.trim();
            const message = document.getElementById("swal-message").value.trim();

            if (!name || !email || !subject || !message) {
                Swal.showValidationMessage("All fields are required.");
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                Swal.showValidationMessage("Please enter a valid email address.");
                return false;
            }

            if (phone && !/^\d{10}$/.test(phone)) {
                Swal.showValidationMessage("Phone number must be exactly 10 digits.");
                return false;
            }

            const formattedPhone = phone
                ? `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
                : "";

            try {
                const response = await fetch(CONTACT_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone: formattedPhone, subject, message }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Failed to send message.");
                }

                return data;
            } catch (error) {
                Swal.showValidationMessage(
                    error.message === "Failed to fetch"
                        ? "Network error. Please check your connection."
                        : error.message || "Failed to send message."
                );
                return false;
            }
        },
    });

    if (result.isConfirmed) {
        sessionStorage.setItem("contactSent", "true");
        Swal.fire({
            icon: "success",
            title: "Message Sent!",
            text: "Thank you for reaching out. I will get back to you soon.",
            confirmButtonColor: "#62D84E",
        });
    }
}


/* =============================================================================
   7. INSTAGRAM FEED
============================================================================= */

/** @type {{ userName: string, posts: Array }} */
let instaData = { userName: "", posts: [] };

/** @type {number} Index of the currently open post in the modal */
let instaModalIndex = 0;

/** @type {number} Index of the current child image within a carousel post */
let instaChildIndex = 0;

/**
 * @description Fetches Instagram post data from the backend API.
 * Renders the Instagram section if valid data is returned;
 * keeps the section hidden otherwise.
 */
async function fetchInstagramData() {
    try {
        const response = await fetch(INSTAGRAM_API_URL);
        if (!response.ok) return;

        const data = await response.json();
        const { userName, posts } = data;

        if (!posts || !Array.isArray(posts) || posts.length < 1) return;

        instaData = data;
        renderInstagramSection(userName, posts);
    } catch {
        // Silently fail — section stays hidden
    }
}

/**
 * @description Renders the Instagram section with post images,
 * the Bootstrap carousel for mobile, and the username link.
 * Shows the section and registers new elements with the Intersection Observer.
 * @param {string} userName - Instagram username from the API.
 * @param {Array<Object>} posts - Array of post objects.
 */
function renderInstagramSection(userName, posts) {
    const section = document.getElementById("instagram");
    const feed = document.getElementById("insta-feed");
    const carouselInner = document.getElementById("insta-carousel-inner");
    const handleLink = document.getElementById("insta-handle-link");

    if (!section || !feed || !carouselInner || !handleLink) return;

    // Build desktop feed cards
    const feedHtml = posts.map((post, i) =>
        `<div class="insta-card hidden" onclick="openInstaPopup(${i})">
            <img src="${post.mediaUrl}" alt="Instagram post ${i + 1}" loading="lazy">
        </div>`
    ).join("");

    feed.innerHTML = feedHtml;

    // Build mobile carousel items
    const carouselHtml = posts.map((post, i) =>
        `<div class="carousel-item${i === 0 ? " active" : ""} text-center" onclick="openInstaPopup(${i})">
            <img src="${post.mediaUrl}" alt="Instagram post ${i + 1}" loading="lazy">
        </div>`
    ).join("");

    carouselInner.innerHTML = carouselHtml;

    // Set username link
    handleLink.href = `https://www.instagram.com/${userName}/`;
    handleLink.textContent = `@${userName}`;

    // Show section
    section.style.display = "";

    // Secure new images and register with Intersection Observer
    section.querySelectorAll("img").forEach((img) => secureImage(img));

    const newHiddenElements = section.querySelectorAll(".hidden");
    if (newHiddenElements.length > 0) {
        initIntersectionObserver(newHiddenElements);
    }
}

/**
 * @description Opens the Instagram popup modal for a specific post.
 * Displays the post image (or first carousel child), caption, and date.
 * @param {number} index - Index of the post in the instaData.posts array.
 */
function openInstaPopup(index) {
    const { userName, posts } = instaData;
    if (!posts || index < 0 || index >= posts.length) return;

    instaModalIndex = index;
    instaChildIndex = 0;

    const post = posts[index];
    const modal = document.getElementById("insta-modal");
    const modalImage = document.getElementById("insta-modal-image");
    const modalUsername = document.getElementById("insta-modal-username");
    const modalDate = document.getElementById("insta-modal-date");
    const modalPage = document.getElementById("insta-modal-page");
    const modalCaption = document.getElementById("insta-modal-caption-text");
    const navLeft = document.getElementById("insta-modal-nav-left");
    const navRight = document.getElementById("insta-modal-nav-right");

    // Set content
    modalUsername.href = post.permalink;
    modalUsername.textContent = `@${userName}`;
    modalDate.textContent = post.date;
    modalCaption.textContent = post.caption ? ` ${post.caption}` : "";

    // Set image — show first child if carousel, else main image
    const hasChildren = post.children && post.children.length > 0;
    modalImage.src = hasChildren ? post.children[0] : post.mediaUrl;

    // Show/hide carousel nav
    navLeft.style.display = hasChildren ? "" : "none";
    navRight.style.display = hasChildren ? "" : "none";

    // Update page indicator
    modalPage.textContent = hasChildren
        ? ` 1/${post.children.length}: `
        : "";

    // Secure modal image
    secureImage(modalImage);

    // Show modal
    modal.style.display = "";
    document.body.style.overflow = "hidden";
}

/**
 * @description Navigates between child images in a carousel post.
 * @param {number} direction - -1 for previous, 1 for next.
 */
function navigateInstaChild(direction) {
    const post = instaData.posts[instaModalIndex];
    if (!post || !post.children || post.children.length === 0) return;

    const total = post.children.length;
    instaChildIndex = (instaChildIndex + direction + total) % total;

    const modalImage = document.getElementById("insta-modal-image");
    const modalPage = document.getElementById("insta-modal-page");

    modalImage.src = post.children[instaChildIndex];
    modalPage.textContent = ` ${instaChildIndex + 1}/${total}: `;
}

/**
 * @description Closes the Instagram popup modal. Triggered by clicking
 * the "X" button or clicking outside the modal container.
 * @param {Event} event - The click event.
 * @param {boolean} [force=false] - Force close regardless of click target.
 */
function closeInstaPopup(event, force) {
    if (!force && event.target !== event.currentTarget) return;

    const modal = document.getElementById("insta-modal");
    modal.style.display = "none";
    document.body.style.overflow = "";
}
