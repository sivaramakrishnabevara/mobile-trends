# 📱 Mobile Trends (Madhura Nagar, Vijayawada) - Full Stack Web Application

A full-stack, ultra-responsive web application built for **Mobile Trends** (Near SBI Main Road, Pasupu Thota, Madhura Nagar, Vijayawada).

## 🚀 Live Local Links
- **Customer Website:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔑 Admin Portal Credentials
| Field | Value |
|---|---|
| **Staff Email** | `admin@mobiletrends.com` |
| **Password** | `admin123` |

*(Can also be changed anytime in [data/db.json](file:///c:/Users/LENOVO/OneDrive/Desktop/New%20folder%20%282%29/data/db.json) or via the Settings tab in the Admin portal)*

---

## ✨ Features Included

### 1. 🎨 Customer Front-End & Animations
- **Modern Cyber-Glow Aesthetics:** Custom glassmorphic cards, luminous gradients, ambient floating orbs, and micro-animations.
- **Store Status Pill:** Real-time Indian Standard Time (IST) detector indicating whether the shop in Madhura Nagar is **🟢 OPEN NOW** or **🔴 CLOSED**.
- **Dark / Light Mode Toggle:** Smooth theme transition with persistent user preference stored in `localStorage`.
- **Smart Repair Cost Estimator:** Select smartphone brand (Apple, Samsung, OnePlus, Xiaomi, Vivo, Oppo) and issue to get instant repair estimates and turnaround times.
- **Service Booking Modal:** Native `<dialog closedby="any">` modal allowing customers to schedule repairs and immediately receive a unique Ticket ID (e.g., `MT-8492`).
- **Live Device Repair Tracker:** Customers enter their Ticket ID or Phone Number to view live progress through 5 visual stages:
  1. *Received (Check-in)*
  2. *Diagnosing*
  3. *In Repair*
  4. *Ready for Pickup*
  5. *Delivered*
- **Curated Accessories & Telecom Catalog:** GaN chargers, 9D curved tempered glass, shockproof cases, TWS earbuds, and Panasonic cordless phones with direct 1-click **WhatsApp order button**.
- **Location & Contact:** Interactive Google Map embed, full landmark description (*Beside State Bank of India Main Road branch*), Direct Call button (`+91 93941 11121`), and Google Maps directions link.
- **Verified Customer Reviews:** Showcases the **4.2 / 5 rating on Justdial** (128+ verified reviews) + interactive "Write a Review" submission form.

### 2. 🛡️ Staff Admin Dashboard (`/admin`)
- **Protected Authentication:** Token-based session management and secure API endpoints.
- **KPI Metrics:** Live counts for Total Inquiries, In-Progress Bench Repairs, Completed Devices, and Stock Count.
- **Repair Tickets Pipeline:**
  - Search tickets by customer name, phone number, or Ticket ID.
  - Filter by status (`Received`, `Diagnosing`, `In Repair`, `Ready for Pickup`, `Delivered`).
  - Update status and add technician remarks visible to customers in their live tracker.
- **Stock & Inventory Control:** Add new accessories, update prices/stock, and delete items.
- **Repair Services Catalog:** Add new repair services, adjust pricing ranges, turnaround times, and warranty badges.
- **Store Settings Management:** Edit the top announcement banner, phone numbers, store address, landmark notes, and business hours.

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js REST API, JSON persistent store (`data/db.json`)
- **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Design System), Modern ES6 JavaScript
- **Dialog Architecture:** Modern `<dialog closedby="any">` with fallback per web guidance
- **Icons & Media:** Unicode symbols, Unsplash curated mobile hardware photography

---

## 🏃 How to Run Locally

If the server is stopped, you can start it anytime using:
```bash
npm start
```
or with automatic reload:
```bash
npm run dev
```
