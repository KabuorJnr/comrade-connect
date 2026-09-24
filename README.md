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
| `VITE_API_URL` | URL of the M-Pesa payment server (defaults to `http://localhost:5000`) |
| `VITE_USE_EMULATORS` | `true` to use the local Auth/Firestore emulators |

### Build & Android

```bash
npm run build
npx cap sync android
npx cap open android
```

### Payment server (M-Pesa Daraja)

```bash
cd server
cp .env.example .env   # fill in your Daraja credentials — never commit .env
npm install
npm run start
```

---

## Data model

All data lives under `artifacts/comrade-connect-184cb/public/data/` in Firestore:

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
