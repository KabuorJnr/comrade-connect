# Build configs

Each folder here is one **build** of the Android/web app. Universities themselves are *not* set up
here: the super admin adds them in the app, and each university's admins customise their own
name, colours, logo, categories, locations and map from the app's **Admin** tab, with no rebuild.

| Folder | Builds |
| --- | --- |
| `default/` | **ChuoHub**, the national app. Users pick their university. |
| `jkuat/` | Example dedicated app that opens straight into the university with ID `jkuat`. |

Every folder inherits from [`default/campus.json`](./default/campus.json) and only lists what differs.

## Settings

| Key | What it does |
| --- | --- |
| `appName` | App name on the home screen and in the app |
| `university` | `null` for the national app; a university ID to lock the build to one university |
| `tagline` | Text on the university picker and in search results |
| `android.appId` | Unique Android ID, e.g. `com.chuohub.app`. **Never change it after publishing**: Android treats a new ID as a different app |
| `android.versionName` / `android.versionCode` | Version shown to users / whole number that must go up with every Play Store upload |
| `theme.primary` | Default brand colour (universities override it) and launcher-icon background |
| `theme.background` | Splash screen and status-bar colour |
| `currency` | Currency label on prices |
| `categories` | Default categories for newly added universities |
| `map` | Country map centre/zoom and the tile server (`tileUrl`, `attribution`) |
| `pro` / `paymentsApiUrl` | Optional M-Pesa Seller Pro; hidden until the payment server URL is set |
| `firebase` | Firebase web config |

`logo.png` (square, white symbol on a transparent background) becomes the launcher icon and splash
screen. Folders without one use `default/logo.png`.

## Dedicated university app

```bash
npm run campus -- new egerton "ChuoHub Egerton" "Egerton"
npm run campus -- apk egerton
```

The super admin must first add a university with the ID `egerton` in the app.
