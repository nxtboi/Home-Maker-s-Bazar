# Home Maker's Bazar

**Home Maker's Bazar** is a fully functional, highly polished, and responsive full-stack e-commerce application designed especially by house makers, for house makers. It features a bilingual experience (English & Hindi), a powerful admin management panel, a simulated Razorpay payment gateway, a real-time order status tracker, and an integrated customer support desk.

---

## 🚀 Key Features

### 🛒 1. Dynamic Catalog & Smart Filtering
- **Seamless Browsing**: Clean grid layout displaying category-wise curated items (Electronics, Home Decoration, Furniture, Kitchenware, etc.).
- **Smart Filters**: Quick filter by search keywords, category tags, price range, and stock availability.
- **Micro-interactions**: Elegant hover states, cart count badge animations, and responsive layout scaling.

### 🛡️ 2. Advanced Admin Dashboard
- **Product Management**: Complete CRUD operations (Create, Read, Update, Delete) for products.
- **Order Management**: Track global customer checkouts, update delivery steps in real time, and mark payment status (paid, pending, refunded).
- **Ticket Desk**: Review user inquiries and submit answers that instantly reflect in the user's support dashboard.

### 💳 3. Simulated Razorpay Gateway
- **Interactive Gateway**: Immersive payment pop-up replicating the production Razorpay interface.
- **Payment Verification**: Fully handles standard cards, UPI payment simulation, and auto-generates sequential order IDs for tracking.

### 📦 4. Real-time Order Tracking
- **Interactive Tracking**: Enter your unique Order ID (e.g., `ORD-9876`) to see the current state of your purchase.
- **Milestones**: Beautiful step-by-step progress checklist (Placed ➡️ Processing ➡️ Out for Delivery ➡️ Delivered ➡️ Returned).

### 💬 5. Bilingual Support & FAQ Desk
- **Dual Language**: Instant toggle between Hindi (hi) and English (en) for the entire application interface.
- **FAQ Categories**: Dynamically sort common queries by Payment, Returns, Delivery, or Products.
- **Support Tickets**: Users can submit custom support messages and review response logs.

---

## 💾 State Persistence Engine

To guarantee a highly robust and offline-resilient experience, **Home Maker's Bazar** implements a hybrid storage architecture:

1. **Durable API Persistence**: All core product updates, order changes, and support replies sync through real-time API endpoints connected to the backend database (`db.json`).
2. **Client-Side Fallback (`localStorage`)**:
   - **Local Product Store**: Products created, updated, or deleted by the administrator are synchronized instantly to the browser's local cache (`ab_products`). If the backend container spins down or runs offline, the app seamlessly falls back to your locally populated catalogue.
   - **Active View Persistence**: The application caches your active tab (`ab_active_tab`) and active admin panel category (`ab_admin_tab`). This ensures that after adding or editing a product, the app does not refresh to the home page, but instead preserves your current spot inside the **Manage Products** page.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Express (TypeScript server configured to bundle to CommonJS inside `dist/` with esbuild)
- **Database**: File-based `db.json` database on the server, paired with browser `localStorage` client-side caches.

---

## 🚀 How to Run the App Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
*The dev server automatically boots both the Express API endpoints and Vite on port `3000`.*

### 3. Build for Production
```bash
npm run build
```
*Compiles the frontend assets into `dist/` and compiles the backend server into standard, self-contained CommonJS inside `dist/server.cjs`.*

### 4. Production Start
```bash
npm run start
```
