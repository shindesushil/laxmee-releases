# Laxmee website and releases

The website at [laxmee.in](https://laxmee.in) (GitHub Pages) and release files.
Laxmee's app source is private; this repository holds only the site.

- `index.html`, `privacy.html`, `terms.html`: static pages. All SEO and Open Graph tags are in
  the HTML itself, so WhatsApp, LinkedIn and X see them without running JavaScript.
- `assets/`: stylesheet, script, self-hosted fonts (subset WOFF2) and artwork from the app.
- `og/laxmee-og.png`: the 1200 × 630 share image.
- `latest.json`: read by installed apps to find the newest version.
- `tools/`: rebuild the assets from the app's brand files (`npm run assets`) and the share image
  (`npm run og`, needs `python -m http.server 8123` running in this folder and Microsoft Edge).
