# Komradi

**The comrades' marketplace.**

Komradi (from *comrade*, what Kenyan university students call each other) puts students, merchants and
traders at every university in one place. One app runs for the whole country: people pick their university, register, and buy and sell
there. Each university is customised by its own admins.

**Get the Android app:** [latest release](https://github.com/KabuorJnr/comrade-connect/releases/latest)

---

## What it does

**For students, merchants and traders**
- Pick your university, then **register** as a Student, Merchant or Trader (phone, location, shop name).
- **Sell for free**: products or services with a photo, price (fixed or negotiable), category, location
  and an optional **map pin** for where to meet. Edit, mark sold, relist or delete your listings.
- **Browse** with search, category and type filters and sorting, in a grid or on a **map**.
- **Contact sellers** by call or WhatsApp; get **directions** to a listing's pin.
- **Sellers directory** with shop pages and verified badges.
- **Campus feed** for updates, events and notices, with likes.
- Optional **Seller Pro** via M-Pesa.

**For university admins** (Admin tab, only for that university)
- Branding: name, short name, tagline, brand colour and logo, with live preview. Changes apply instantly.
- Listing categories, campus locations and the campus map centre.
- Verify trusted sellers, remove listings and posts, and appoint or remove other admins.
- Stats: active listings, sellers, verified sellers, posts.

**For the super admin** (the app owner, one account)
- Add universities, hide or show them, and act as admin of every university.

---

## Roles

| Role | How someone gets it | Can |
| --- | --- | --- |
| **Super admin** | A record in Firestore created by hand in the Firebase console (below) | Add/hide universities; everything a university admin can do, everywhere |
| **University admin** | The super admin or another admin of that university taps **Make admin** on their shop | Customise that university; verify sellers; remove listings/posts; manage its admins |
| **Member** | Registers in the app | Sell, post, contact sellers |
| **Guest** | Opens the app | Browse |

No one can make themselves an admin from inside the app; the database rules enforce this.

---

## Setup

### 1. Firebase (project `comrade-connect-184cb`)

1. Firebase console → **Authentication → Sign-in method**: enable **Email/Password** and **Anonymous**
   (anonymous lets guests browse).
2. Deploy the database rules:
   ```bash
   firebase deploy --only firestore:rules --project data
   ```
   (`data` is an alias for `comrade-connect-184cb` in `.firebaserc`.)

### 2. Make yourself the super admin (once)

1. Firebase console → **Authentication → Users → Add user**: enter your email and a password.
2. Copy the new account's **User UID** from that list.
3. **Firestore Database → Start collection** `platformAdmins` → **Document ID**: paste the UID → add
   any field (e.g. `note` = `super admin`) → **Save**.
4. Open the app → **Sign in** (top right of the university screen) with that email and password.
   You now see **Add a university**, and an **Admin** tab in every university.

(If you already have an account in the app, **Me → Copy my account ID** gives you the UID for step 3.)

### 3. Add universities and their admins

1. On the university screen tap **Add a university** (name, short name; the ID is generated).
2. Open it → **Admin** tab → set colour, logo, tagline, categories, locations and the campus map.
3. Ask the university's admin to register there, then open **Sellers → their shop → Make admin**.

Existing listings from the first version live under the ID `comrade-connect-184cb`. To keep them, add a
university with that ID.

---

## Develop

```bash
npm install
npm run dev
```

Offline, against the Firebase emulators:

```bash
firebase emulators:start --only auth,firestore --project data
VITE_USE_EMULATORS=true npm run dev
```

| Variable | Purpose |
| --- | --- |
| `CAMPUS` | Which build config in `campuses/` to use (defaults to `default`) |
| `VITE_API_URL` | M-Pesa payment server URL (overrides `paymentsApiUrl`) |
| `VITE_USE_EMULATORS` | `true` to use the local Auth/Firestore emulators |

### Build configs

[`campuses/`](./campuses/README.md) holds **build-time** settings: app name, Android app ID, icon,
default colour, default categories and map tiles. `campuses/default` is the national Komradi app.
A folder can also set `"university": "<id>"` to build a dedicated app that opens straight into one
university (see `campuses/jkuat`). Everything a university customises lives in the database and is
edited by its admins in the app; no rebuild is needed.

### Maps

Maps use [Leaflet](https://leafletjs.com/) with OpenStreetMap tiles, so no API key is needed. OpenStreetMap's
free tile servers are for light use; before a large launch, point `map.tileUrl` in
`campuses/default/campus.json` at a tile provider (e.g. MapTiler, Stadia Maps, Thunderforest).

---

## Android app

**Easiest: GitHub builds it.** The **Android APK** workflow builds an APK for every folder in
`campuses/`. Run it from the *Actions* tab (*Run workflow*, keep *publish* ticked) and the APKs are
attached to **[Releases](https://github.com/KabuorJnr/comrade-connect/releases/latest)**. Pushes to
`main` publish automatically.

**On your computer** (Android Studio / Android SDK and JDK 21):

```bash
npm run campus -- apk default            # → release/default/Komradi-1.0.0-debug.apk
npm run campus -- apk default --release  # signed APK + AAB for the Play Store
npm run campus -- android default        # brand + sync only, then: npx cap open android
```

Debug APKs install directly on a phone (allow "install unknown apps"). For the Play Store, create a
keystore once and keep it safe; every update must be signed with the same one:

```bash
keytool -genkey -v -keystore komradi.jks -alias komradi -keyalg RSA -keysize 2048 -validity 10000
```

Locally, set `CC_KEYSTORE_FILE`, `CC_KEYSTORE_PASSWORD`, `CC_KEY_ALIAS`, `CC_KEY_PASSWORD` before
`--release`. On GitHub, add repository secrets `CC_KEYSTORE_BASE64` (`base64 -w0 komradi.jks`),
`CC_KEYSTORE_PASSWORD`, `CC_KEY_ALIAS`, `CC_KEY_PASSWORD`, then run the workflow with *release* ticked.

The `android/` folder is committed with the `default` branding. Building another config rewrites the
icons and `capacitor.config.json`; don't commit those changes.

### Payment server (M-Pesa Daraja)

```bash
cd server
cp .env.example .env   # fill in your Daraja credentials; never commit .env
npm install
npm run start
```

---

## Data model (Firestore)

| Path | Contents | Who can write |
| --- | --- | --- |
| `platformAdmins/{uid}` | Super admin marker | Firebase console only |
| `universities/{id}` | name, shortName, tagline, theme, logo, categories, locations, map, status | super admin; that university's admins (not `status`) |
| `universities/{id}/admins/{uid}` | University admins | super admin and that university's admins |
| `users/{uid}` | Home university | the user |
| `artifacts/{id}/public/data/profiles/{uid}` | Seller profile, `verified`, `isPro` | the owner; admins set `verified` only |
| `artifacts/{id}/public/data/services` | Listings, optional `geo` pin | the seller; admins can delete |
| `artifacts/{id}/public/data/community_posts` | Feed posts, likes | the author; anyone registered can like; admins can delete |

Rules: [`firestore.rules`](./firestore.rules).

---

## Project structure

```
/
├─ android/            # Capacitor Android project
├─ campuses/           # Build configs (national app + optional single-university apps)
├─ scripts/            # campus.mjs build tool
├─ server/             # Express backend for M-Pesa
├─ src/
│  ├─ App.jsx          # Sign-in, university selection, theming
│  ├─ Marketplace.jsx  # Tabs and screens for the selected university
│  ├─ components/      # UI kit, forms, listing & post cards, maps
│  ├─ views/           # Market, Sellers, Feed, Admin, Profile, University picker
│  └─ lib/             # Firebase paths, university context, helpers
├─ firestore.rules     # Security rules
└─ .github/workflows/  # Android APK builds + Firebase Hosting
```

---

## License

[MIT](LICENSE) © KabuorJnr
