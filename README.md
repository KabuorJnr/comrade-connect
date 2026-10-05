# ComradeConnect

**Your number one app.**

_ComradeConnect_ is a modern, React-based cross-platform application designed to serve as a campus marketplace for student services, community updates, and seller discovery. With an intuitive UI, Firebase integration, and M-Pesa Daraja payment support, ComradeConnect connects students and campus entrepreneurs in one vibrant ecosystem.

---

## What it does

ComradeConnect puts campus **students, merchants and traders in one place**:

- **Register an account** (email + password) as a Student, Merchant or Trader, with a phone number, location and shop name.
- **Sell online for free** — post products or services with a photo, price (fixed or negotiable), category and location. Edit, mark as sold, relist or delete your own listings.
- **Browse the marketplace** — search, filter by products/services and category, sort by newest or price. Guests can browse; signing in is required to see contact actions.
- **Contact sellers** by phone call or WhatsApp straight from a listing.
- **Seller directory** — every registered seller with their shop page and active listings.
- **Campus feed** — registered users can post general updates, events and notices, and like posts.
- **Seller Pro (optional)** — Ksh 250/month via M-Pesa STK push for a verified badge and priority placement.

---

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Mobile:** Capacitor (Android)
- **Data & auth:** Firebase Authentication + Cloud Firestore (project `comrade-connect-184cb`)
- **Hosting:** Firebase Hosting (project `comrade-connect-2e29c`)
- **Payments backend:** Node.js / Express + M-Pesa Daraja API (`server/`)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm i -g firebase-tools`)
- Android Studio (for Android builds)

### One-time Firebase setup (project `comrade-connect-184cb`)

1. In the Firebase console → **Authentication → Sign-in method**, enable **Email/Password** and **Anonymous** (anonymous is used so guests can browse).
2. Deploy the Firestore security rules:
    ```bash
    firebase deploy --only firestore:rules --project data
    ```
   (`data` is an alias for `comrade-connect-184cb` in `.firebaserc`.)

### Run locally

```bash
npm install
npm run dev
```

To develop fully offline against the Firebase emulators:

```bash
firebase emulators:start --only auth,firestore --project data
VITE_USE_EMULATORS=true npm run dev
```

### Environment variables (frontend)

| Variable | Purpose |
| --- | --- |
| `CAMPUS` | Which campus folder to build (defaults to `default`) |
| `VITE_API_URL` | URL of the M-Pesa payment server (overrides `paymentsApiUrl` in the campus config) |
| `VITE_USE_EMULATORS` | `true` to use the local Auth/Firestore emulators |

### Campuses (white-label builds)

The app can be branded for any campus: name, colours, logo, Android app id, categories, campus
locations and its own separate data. Each campus is one folder in [`campuses/`](./campuses/README.md):

```bash
npm run campus -- list                                   # show campuses
npm run campus -- new egerton "Egerton Connect" "Egerton"  # create one
npm run campus -- dev jkuat                              # run the web app as JKUAT
```

`npm run dev` / `npm run build` use the `default` campus unless `CAMPUS=<id>` is set.

### Android app

**Easiest: let GitHub build it.** Every push that touches the app runs the **Android APK** workflow,
which builds an APK for each campus. Open the run under the repo's *Actions* tab and download
`<campus>-android` from *Artifacts*. To build one campus, or a signed release, use *Run workflow*.

**On your computer** (needs Android Studio / the Android SDK and JDK 21):

```bash
npm run campus -- apk jkuat              # → release/jkuat/JKUAT-Connect-1.0.0-debug.apk
npm run campus -- apk jkuat --release    # signed APK + AAB for the Play Store (see below)
npm run campus -- android jkuat          # only brand + sync, then: npx cap open android
```

Debug APKs can be installed directly on a phone (allow "install unknown apps"). Each campus has its
own app id, so several campus apps can be installed side by side.

**Release signing.** Create a keystore once and keep it safe — you need the same one for every update:

```bash
keytool -genkey -v -keystore comradeconnect.jks -alias comradeconnect -keyalg RSA -keysize 2048 -validity 10000
```

Locally, set `CC_KEYSTORE_FILE`, `CC_KEYSTORE_PASSWORD`, `CC_KEY_ALIAS` and `CC_KEY_PASSWORD` before
`--release`. On GitHub, add repository secrets `CC_KEYSTORE_BASE64` (output of `base64 -w0 comradeconnect.jks`),
`CC_KEYSTORE_PASSWORD`, `CC_KEY_ALIAS` and `CC_KEY_PASSWORD`, then run the workflow with *release* ticked.

The files under `android/` are committed with the `default` campus branding. Building another campus
rewrites the icons and `capacitor.config.json`; don't commit those changes.

### Payment server (M-Pesa Daraja)

```bash
cd server
cp .env.example .env   # fill in your Daraja credentials — never commit .env
npm install
npm run start
```

---

## Data model

All data lives under `artifacts/<dataNamespace>/public/data/` in Firestore (`comrade-connect-184cb` for the default campus):

| Collection | Contents | Who can write |
| --- | --- | --- |
| `profiles/{uid}` | name, role, business name, phone, location, bio, `isPro` | the owner (cannot set `isPro`) |
| `services` | listings: kind, title, description, category, price, photo, seller info, status | the seller |
| `community_posts` | type, content, author, likes | the author; any registered user can like |

Rules are in [`firestore.rules`](./firestore.rules).

---

## File Structure

```
/
├─ android/            # Capacitor Android native project
├─ campuses/           # One folder per campus: branding, app id, data namespace
├─ scripts/            # campus.mjs build tool
├─ server/             # Express backend for M-Pesa & API
├─ src/
│  ├─ components/      # Forms, modals, listing & post cards
│  ├─ views/           # Market, Sellers, Feed, Profile screens
│  └─ lib/             # Firebase setup and helpers
├─ firestore.rules     # Firestore security rules
├─ public/             # Static public assets
├─ .github/            # GitHub/workflow configs
├─ package.json        # Project metadata and scripts
└─ index.html          # Main HTML entry point
```

---

## Scripts

- `npm run dev` — Start development server (Vite + React)
- `npm run build` — Build frontend for production
- `npm run preview` — Preview built production app locally
- `npm run lint` — Run ESLint checks

_Server (inside `/server`):_

- `npm run start` — Start backend server
- `npm run dev` — Start backend server with watch mode

---

## Contributing

Pull requests and stars are always welcome! For significant changes, please open an issue first to discuss what you would like to change. See the [CONTRIBUTING](./.github) guidelines if available.

---

## License

[MIT](LICENSE) © KabuorJnr

---

## Acknowledgements

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Firebase](https://firebase.google.com/)
- [Capacitor](https://capacitorjs.com/)
- [M-Pesa Daraja API](https://developer.safaricom.co.ke/)
- [Tailwind CSS](https://tailwindcss.com/)

---

> _Empowering every student, one campus connection at a time._
