# Greg Roques — Personal Website

A single-page website for Greg Roques, Senior ServiceNow Developer & Software Engineer based in Atlanta, GA. Built with vanilla HTML, CSS, and JavaScript — no build tools or frameworks required. Includes a Node.js/Express backend for contact form email delivery and Instagram feed integration.

**Live site:** [gregroques.com](https://gregroques.com)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Frontend](#frontend)
- [Backend](#backend)
- [Features](#features)
- [SEO & Social Metadata](#seo--social-metadata)
- [Deployment](#deployment)

---

## Overview

The site serves as a professional portfolio showcasing ServiceNow expertise, certifications, and technical skills. It is a single-page application with scroll-triggered animations, a responsive layout, a SweetAlert2-powered contact form, an Instagram feed with popup modal, and strong SEO/social-sharing metadata. The backend handles contact form submissions via Nodemailer with Gmail SMTP and serves cached Instagram posts fetched daily from the Instagram Graph API.

---

## Tech Stack

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Markup      | HTML5                                          |
| Styling     | CSS3, Bootstrap 5.2.2                          |
| Scripting   | Vanilla JavaScript (ES6+, strict mode)         |
| Contact Form| SweetAlert2                                    |
| Fonts       | Google Fonts — Fredoka One, Lato, Roboto       |
| Analytics   | Google Analytics (gtag.js)                     |
| Backend     | Node.js, Express                               |
| Email       | Nodemailer (Gmail SMTP)                        |
| Instagram   | Instagram Graph API, node-cron, axios          |
| Security    | Helmet, CORS, express-rate-limit, express-validator, xss |

---

## Project Structure

```
├── index.html                    # Main HTML document
├── styles.css                    # All styles (organized by section)
├── scripts.js                    # Application logic, animations, contact form & Instagram feed
├── .htaccess                     # Apache rewrite rules & redirects
├── .gitignore                    # Git ignore rules
├── images/
│   ├── myPic.jpg                 # Profile photo
│   ├── socialLink.png            # Open Graph / Twitter Card share image
│   ├── backgrounds/              # Section parallax background images
│   ├── icons/                    # Footer icons (LinkedIn, GitHub, location, ServiceNow)
│   ├── logos/                    # Site logo & favicon
│   ├── popup/                    # Pop-up promotional image
│   ├── snow-certs/               # ServiceNow & Google certification badges
│   └── technologies/             # Skill/technology logo icons
├── Deployment_Instructions/
│   ├── inital_setup_aws.txt      # Initial server setup commands (Apache)
│   ├── config_and_htaccess.txt   # Apache VirtualHost & .htaccess reference
│   └── nginx_gregroques.conf     # Nginx server config (Lightsail alternative)
└── backend/
    ├── index.js                  # Express server entry point
    ├── package.json              # Dependencies & scripts
    ├── .env                      # Environment variables (not committed)
    ├── .gitignore                # Backend-specific ignore rules
    ├── routes/
    │   ├── personalData.js       # POST /personaldata — contact form handler
    │   └── instagram.js          # GET /instagram — cached Instagram feed
    └── util/
        ├── instaToken.json       # Persisted Instagram access token (not committed)
        └── instaCache.json       # Cached Instagram posts (not committed)
```

---

## Frontend

### Page Sections

1. **Intro** — Profile photo and name with animated title lines
2. **Experience** — ServiceNow competencies over a blurred background image (years calculated dynamically from 2019)
3. **Certifications** — Badge display (flex row on desktop, Bootstrap carousel on mobile): CSA, CAD, CIS-HRSD, CIS-CSM, Google Generative AI Leader
4. **Skills** — Responsive grid of technology icons with staggered reveal animations
5. **Instagram** — Five most recent Instagram posts displayed as clickable cards (desktop) or auto-rotating Bootstrap carousel (mobile), with a popup modal for viewing full posts and carousel navigation
6. **Footer** — Contact form trigger, Resume link, LinkedIn, GitHub, ServiceNow University profile

### Setup

No build step required. Serve the root directory with any static file server or place files directly in the web server document root.

1. Replace `[GTAG_GOES_HERE]` in `index.html` with the Google Analytics measurement ID
2. Update the `CONTACT_API_URL` and `INSTAGRAM_API_URL` constants in `scripts.js` if the backend runs at a different address

---

## Backend

The backend is a Node.js/Express API that handles two responsibilities:

1. **Contact form** — Receives form submissions and sends them as emails via Nodemailer (Gmail SMTP)
2. **Instagram feed** — Fetches, caches, and serves the 5 most recent Instagram posts via the Instagram Graph API, with automatic daily refresh and token renewal

### Prerequisites

- **Node.js** v18+ and **npm**

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=2000
NODE_ENV=production
CORS_ORIGIN=https://gregroques.com
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
EMAIL_TO=destination@email.com
```

> **Note:** `GMAIL_APP_PASSWORD` is a Google App Password, not your regular Gmail password. Generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

The Instagram access token is stored in `util/instaToken.json` and is managed automatically by the backend (auto-refreshed before expiration).

### Running

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server starts on port 2000 by default (configurable via the `PORT` env variable).

### API Endpoints

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| POST   | `/personaldata`  | Submit contact form (name, email, phone, subject, message) |
| GET    | `/instagram`     | Returns cached Instagram posts and username |
| GET    | `/health`        | Health check — returns `{ status: "ok" }` |

### Instagram Feed Details

- **Daily cron job** (3:00 AM server time) fetches the 5 most recent posts from the Instagram Graph API
- Posts are also fetched on server startup so the cache is immediately available
- **Token auto-renewal** — the long-lived access token is refreshed automatically when it's within 10 days of expiration
- **Disk persistence** — both the token and cached posts are saved to JSON files in `util/` so data survives server restarts
- **Error notifications** — API failures and token expiration trigger email alerts via Nodemailer

### Security

- **Helmet** — secure HTTP headers
- **CORS** — restricted to the `CORS_ORIGIN` env variable
- **Rate limiting** — 50 requests/15 min globally, 5 submissions/15 min on the contact endpoint
- **express-validator** — input validation (required fields, email format, max lengths)
- **xss** — sanitizes all user input against XSS

---

## Features

### Contact Form (SweetAlert2)
Clicking "Email" in the footer opens a SweetAlert2 modal with fields for Name, Email, Phone (optional), Subject, and Message. The form validates email format and phone length client-side, submits to the backend API, and displays success/error feedback. After a successful submission, further sends are blocked for the remainder of the browser session.

### Instagram Feed
The Instagram section fetches cached post data from the backend API on page load. On desktop, posts display as a row of clickable image cards that wrap to the next line as the viewport narrows. On mobile (below 768px), posts display in an auto-rotating Bootstrap carousel. Clicking any post opens a popup modal showing the full image, caption, date, and username with a link to the original post. Carousel posts (multiple images) include left/right navigation arrows within the modal.

### Scroll-Triggered Animations
Uses the **Intersection Observer API** to reveal elements as they enter the viewport. Each section has staggered `transition-delay` values so items animate in sequence (blur + slide-in for text, scale for images, fade for backgrounds).

### Configurable Pop-Up Component
A timed promotional pop-up that slides in from the bottom-right corner. Configured via `POPUP_CONFIG` in `scripts.js`:
- `endDate` — date after which the pop-up stops appearing
- `showDelay` / `autoCloseDelay` — timing for display and auto-dismiss
- Includes a manual close button with coordinated fade animations

### Responsive Design
Four breakpoints via CSS media queries:
| Breakpoint   | Behavior                                                  |
| ------------ | --------------------------------------------------------- |
| Desktop      | Flex row layout, full cert badge display, Instagram card grid |
| ≤ 767px      | Centered text, cert & Instagram carousels replace flex rows |
| ≤ 414px      | Reduced heading/icon sizes, smaller pop-up and Instagram cards |
| ≤ 305px      | Further reduced pop-up size                               |

### Accessibility
- **Skip links** in the header for keyboard navigation (Contact Info, View Resume)
- `prefers-reduced-motion` media query disables transitions for users who prefer reduced motion
- Semantic HTML with `alt` attributes on all images

### Image Protection
Context menus and drag events are disabled on all images via JavaScript to discourage casual saving.

### Routing
- `/resume` redirects to a published Google Doc
- 404 errors redirect to the homepage

---

## SEO & Social Metadata

- **Canonical URL**, meta description, keywords, and author tags
- **Geotags** for Atlanta, GA (geo.region, geo.position, ICBM)
- **Open Graph** tags for Facebook/LinkedIn sharing (title, description, image at 1200x630)
- **Twitter Card** (summary_large_image)
- **JSON-LD Structured Data** (`@type: Person`) with name, job title, location, and social profile links
- **Robots** meta tag set to `index, follow`

---

## Deployment

### Frontend

Place the project files (excluding `backend/` and `node_modules/`) in the web server document root (e.g., `/var/www/gregroques`).

#### Option A: Nginx (Lightsail)

A ready-to-use Nginx config is provided at `Deployment_Instructions/nginx_gregroques.conf`.

1. Install Nginx:
   ```bash
   sudo apt update && sudo apt install nginx
   ```
2. Copy the config and enable it:
   ```bash
   sudo cp nginx_gregroques.conf /etc/nginx/sites-available/gregroques.com
   sudo ln -s /etc/nginx/sites-available/gregroques.com /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx
   ```
3. Install SSL via Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d gregroques.com -d www.gregroques.com
   ```
4. Replace `[GTAG_GOES_HERE]` in `index.html` with the Google Analytics measurement ID

#### Option B: Apache

1. Ensure `mod_rewrite`, `mod_headers`, `mod_proxy`, and `mod_proxy_http` are enabled:
   ```bash
   sudo a2enmod rewrite headers proxy proxy_http
   ```
2. Configure VirtualHost entries for HTTP (:80) and HTTPS (:443) — see `Deployment_Instructions/config_and_htaccess.txt`
3. Run Certbot for SSL certificate provisioning:
   ```bash
   sudo apt install certbot python3-certbot-apache
   sudo certbot --apache
   ```
4. Replace `[GTAG_GOES_HERE]` in `index.html` with the Google Analytics measurement ID

### Backend

1. Install dependencies:
   ```bash
   cd backend && npm install
   ```
2. Configure the `.env` file with Gmail credentials and CORS origin
3. Use PM2 to run the server in production:
   ```bash
   sudo npm install pm2@latest -g
   pm2 start index.js --name portfolio-api
   pm2 startup
   pm2 save
   ```
