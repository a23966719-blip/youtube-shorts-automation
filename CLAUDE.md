# CLAUDE.md

## Project Overview

Butcher shop POP price tag & advertising poster generator (정육점 POP 가격표 & 광고 포스터 자동 생성기). A client-side web app that lets butcher shop owners create professional price tags and posters, then download as PNG or print directly from the browser.

**Live site:** https://a23966719-blip.github.io/youtube-shorts-automation/

## Tech Stack

- **Frontend:** Vanilla HTML5 / CSS3 / JavaScript (no framework)
- **External lib:** html2canvas (loaded via CDN) for canvas-to-image conversion
- **Testing:** Jest + jsdom
- **Deployment:** GitHub Pages (via `.github/workflows/static.yml` and `deploy.yml`), also configured for Netlify (`netlify.toml`)
- **Data:** `pop_data.json` for product data, `localStorage` for saved images and products

## Project Structure

```
index.html          # Single-page app entry point (Korean language)
js/app.js           # All application logic (~790 lines)
css/style.css       # All styles (~1050 lines)
tests/app.test.js   # Jest tests using jsdom (~660 lines)
pop_data.json       # Product/pricing reference data
jest.config.js      # Jest config (testEnvironment: node, tests in tests/)
package.json        # Only devDependencies: jest, jsdom
netlify.toml        # Netlify deploy config with security headers
.github/workflows/  # GitHub Pages deployment workflows
```

## Build & Test Commands

```bash
npm install          # Install dependencies (jest + jsdom only)
npm test             # Run tests: jest --verbose
```

There is no build step — the app is served as static files directly.

## Architecture Notes

- **Single-file app:** All JS logic lives in `js/app.js`, initialized via `DOMContentLoaded`
- **No modules/bundler:** Uses `var` declarations and global functions exposed on `window`
- **Template system:** 10 price tag templates (classic-red, premium-black, fresh-green, etc.) applied via CSS classes
- **Product storage:** Products saved to `localStorage` with key-based CRUD operations
- **Image handling:** File upload + Google image search integration; images stored as base64 in localStorage with a 10-item limit
- **Test approach:** Tests create a full jsdom environment, inject the HTML, mock `html2canvas`/`window.print`/`alert`, then run `app.js` via `eval`. Tests expose internal variables through `window.__test__`

## Known Issues

- 25 of 37 tests currently fail — the test file references functions (e.g., `saveImageToStorage`) that are not exposed on `window` in the current `app.js`
- The repo name (`youtube-shorts-automation`) does not match the actual project content (butcher shop poster generator)

## Development Guidelines

- All UI text is in Korean
- No build/transpile step — edit source files directly
- When adding new functions that tests need to access, expose them on `window` or via `window.__test__`
- The app uses `var` and function declarations (not ES modules) to remain compatible with direct script loading
- Security headers are configured in `netlify.toml` (CSP, X-Frame-Options, etc.)
