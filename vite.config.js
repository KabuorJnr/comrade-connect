import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadCampus, publicCampus, hexToRgbTriplet } from './scripts/campus-config.mjs'

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// Pick the campus with CAMPUS=<id> (see campuses/README.md). Defaults to "default".
const campus = loadCampus()

const campusHtml = {
  name: 'campus-html',
  transformIndexHtml(html) {
    return html
      .replaceAll('%CAMPUS_APP_NAME%', escapeHtml(campus.appName))
      .replaceAll('%CAMPUS_TAGLINE%', escapeHtml(campus.tagline))
      .replaceAll('%CAMPUS_BACKGROUND%', campus.theme.background)
      .replace(
        '</head>',
        `  <style>:root{--brand:${hexToRgbTriplet(campus.theme.primary)};--brand-light:${hexToRgbTriplet(campus.theme.primaryLight)}}</style>\n  </head>`,
      )
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), campusHtml],
  define: {
    __CAMPUS__: JSON.stringify(publicCampus(campus)),
  },
})
