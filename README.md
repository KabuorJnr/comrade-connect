# ComradeConnect

**Your number one app.**

_ComradeConnect_ is a modern, React-based cross-platform application designed to serve as a campus marketplace for student services, community updates, and seller discovery. With an intuitive UI, Firebase integration, and M-Pesa Daraja payment support, ComradeConnect connects students and campus entrepreneurs in one vibrant ecosystem.

---

## Features

- 🌐 Modern UI built with React and TailwindCSS
- 🚀 Super-fast development with Vite and HMR
- 📱 Mobile-ready (Capacitor & Android support)
- 🔒 Authentication and real-time data via Firebase
- 💬 Campus marketplace & community newsfeed
- 💸 M-Pesa Daraja payment integration (backend)
- ⚙️ Linting and robust developer tooling

---

## Tech Stack

- **Frontend:** JavaScript (React 18, Vite)
- **Styling:** TailwindCSS, PostCSS
- **Mobile:** Capacitor, Android
- **Backend:** Node.js (Express), M-Pesa Daraja API, Axios
- **Cloud:** Firebase (Hosting, Auth, Database, Firestore, etc.)

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- Yarn or npm
- Android Studio (for Android builds)
- Firebase project

### Setup & Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/KabuorJnr/comrade-connect.git
    cd comrade-connect
    ```

2. **Install dependencies**
    ```bash
    npm install   # or yarn install
    ```

3. **Configure Firebase**
    - Update the `firebase.json` and `.firebaserc` with your credentials.

4. **Run the frontend app**
    ```bash
    npm run dev
    ```

5. **Build for production**
    ```bash
    npm run build
    ```

6. **Android (Capacitor)**
    ```bash
    npx cap sync android
    npx cap open android
    # Build and run from Android Studio
    ```

7. **Backend Server (M-Pesa Daraja)**
    ```bash
    cd server
    npm install
    npm run start
    ```

---

## File Structure

```
/
├─ android/            # Capacitor Android native project
├─ server/             # Express backend for M-Pesa & API
├─ src/                # React client source code
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
