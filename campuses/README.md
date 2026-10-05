# Campuses

Each folder here is one branded build of the app — its own name, colours, icon, Android app id and
data. Every campus inherits everything from [`default/campus.json`](./default/campus.json) and only
needs to list what is different.

## Add a campus

```bash
npm run campus -- new egerton "Egerton Connect" "Egerton"
```

That creates `campuses/egerton/campus.json`. Edit it, optionally drop a logo in
`campuses/egerton/logo.png`, then:

```bash
npm run campus -- dev egerton        # preview in the browser
npm run campus -- apk egerton        # build release/egerton/Egerton-Connect-1.0.0-debug.apk
```

Push the folder to GitHub and the **Android APK** workflow builds its APK automatically.

## Settings

| Key | What it does |
| --- | --- |
| `appName` | Name on the home screen, header and browser tab |
| `campusName` | Short campus name used in text, e.g. "JKUAT feed" |
| `tagline` | One-line description on the market page and in search results |
| `android.appId` | Unique Android id, e.g. `com.comradeconnect.egerton`. Lowercase, dots, no dashes. **Never change it after publishing** — Android treats a new id as a different app |
| `android.versionName` / `android.versionCode` | Version shown to users / whole number that must go up with every Play Store upload |
| `theme.primary` | Brand colour for buttons, highlights and the icon background (hex, e.g. `#15803d`) |
| `theme.background` | Splash screen and status bar colour |
| `dataNamespace` | Which data the campus sees. Campuses with different namespaces have separate listings, sellers and feeds even on the same Firebase project. Changing it hides existing data |
| `currency` | Currency label shown on prices |
| `categories` | Listing categories, in order |
| `locations` | Suggested places (hostels, gates, estates) offered when typing a location |
| `pro.enabled` / `pro.price` | Optional M-Pesa "Seller Pro" upgrade and its monthly price |
| `paymentsApiUrl` | URL of the deployed `server/` for M-Pesa. Pro upgrades are hidden in the app until this is set |
| `firebase` | Firebase web config. Only set this if the campus has its own Firebase project (then also enable Email/Password + Anonymous sign-in there and deploy `firestore.rules`) |

## Logo

`logo.png` should be a square PNG (1024×1024 works well) of a light/white symbol on a **transparent**
background. It is placed on `theme.primary` for the launcher icon and on `theme.background` for the
splash screen. Campuses without a logo use `default/logo.png`.
