# A'TIN Panay Community Hub & Exclusive Merch

Official web application for **A'TIN Panay x Team KAAL BlockScreening Exclusive Merchandise & Fan Community Hub**.

## 🚀 How to Run in VS Code

### 1. Open in VS Code
- Open Visual Studio Code.
- Go to **File > Open Folder...** and select this extracted project directory (or in your terminal run `code .`).

### 2. Install Dependencies
Open the integrated terminal in VS Code (`Ctrl + ~` or `Cmd + ~`) and execute:
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000`.

### 4. Production Build
To create an optimized production build:
```bash
npm run build
```
Static assets will be compiled into the `dist/` directory.

---

## 🛠️ Project Tech Stack
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React (`lucide-react`)
- **State & Data:** React Context (`AppContext.tsx`) with localStorage backup and mock order tracking

## 📂 Project Structure
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Core layout and modal orchestration
- `src/components/` - Sub-components:
  - `Navbar.tsx` - Navigation, cart counter, order tracking, admin portal link
  - `HeroBanner.tsx` - Hero banner with custom lavender concert artwork & A'TIN Panay branding
  - `CountdownTimer.tsx` - Pre-order cutoff countdown
  - `FeaturedMerchandise.tsx` - Merch catalog with category filters and search
  - `ProductCard.tsx` - Responsive merchandise cards with size selections
  - `CollectionsSection.tsx` - SB19 capsule archives
  - `FanProjectsSection.tsx` - Community charity & streaming projects
  - `TeamKAALCornerSection.tsx` - Team KAAL literature, stories & PDFs
  - `Footer.tsx` - Community footer with event details
  - Modals: `ProductDetailModal.tsx`, `CartDrawer.tsx`, `CheckoutModal.tsx`, `ETicketModal.tsx`, `OrderTrackerModal.tsx`, `AdminDashboard.tsx`, `CustomerDashboard.tsx`
- `src/types.ts` - Shared TypeScript data models
- `src/context/AppContext.tsx` - Central state store for merchandise, cart, orders, users, and pre-orders

---

## 💡 Recommended VS Code Extensions
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
