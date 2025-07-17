# CREB.Ai – The AI-Powered Real Estate Matchmaking Platform

**CREB.Ai** is the first Tinder-style, AI-driven web platform for Commercial Real Estate (CRE). We make it effortless for buyers, sellers, and brokers to connect, negotiate, and close CRE deals—faster and smarter than ever.

[User-Side Demo Video Link](https://drive.google.com/file/d/1bZ9EH54e9UQ8XkcSmhKRtkgeRvQE8mDb/view?usp=sharing)

[Admin-Side Demo Video Link](https://drive.google.com/file/d/1jqdzbQGxXbpMcHkCGqiFTaHasMMw2xJ6/view?usp=sharing)

---

## 🚀 What Makes CREB.Ai Unique?

- **Swipe to Match:** Instantly match with properties and interested parties, just like dating apps—no more cold calls or missed leads.
- **AI Lease Agent:** Built-in AI assistant answers your questions and helps generate lease contracts, reducing legal headaches and manual paperwork.
- **Real-Time Chat:** Secure, real-time messaging the moment a match happens—deal directly, negotiate, and collaborate.
- **Automated Contracts & E-sign:** Generate, share, and sign NYC-compliant leases right within the platform—no extra tools needed.
- **One Platform, All Roles:** Designed for buyers, owners, and brokers with custom flows for each user type.

---

## 🏆 Why CREB.Ai Is the Only Solution You Need

- **Cuts CRE deal time from weeks to hours**—AI speeds up every step, from finding the right match to signing the contract.
- **Eliminates inefficiency:** No more long email chains, phone tag, or paperwork errors.
- **Levels the playing field:** AI helps small owners/brokers close deals like industry giants.

---

## 🔥 Key Features

- **AI Chatbot:** Built using a local LLM (OpenAI-compatible, privacy-first).
- **Smart Matching:** Only see properties or users that fit your preferences.
- **Secure, Real-Time Chat:** Every match gets a private chat room.
- **Property Management:** Upload, edit, and manage your listings with ease.
- **Contract Generation:** Auto-fill lease templates; review, edit, and e-sign securely.
- **Activity Dashboard:** Track all your listings, matches, and active deals in one place.

---

## 💡 How It Works

1. **Sign Up & Create Profile**  
   Select your role (Buyer, Seller, Broker), set your preferences.

2. **Browse & Swipe**  
   Like/dislike properties; owners/brokers see interested buyers instantly.

3. **Get Matched**  
   Mutual interest? Start chatting instantly.

4. **AI Lease Agent**  
   Ask the AI questions, generate leases, get instant support.

5. **Close the Deal**  
   Auto-generate a NYC-compliant lease and e-sign—all in-platform.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Node.js (API routes), Supabase (Auth & DB)
- **Database:** PostgreSQL (Supabase)
- **AI Engine:** Local LLM (Qwen 2.5 VL-7b) via LM Studio, OpenAI-compatible API
- **E-Signature:** Built-in contract generation & PDF support

---

## ⚡ Database Schema (Simplified)

- **users:** All platform users (auth, profile)
- **properties:** Listings with images, specs, owner/broker info
- **matches:** Tracks interest and deal status between users and properties
- **messages:** Real-time chat for matched users
- **ai_chat_history:** Logs user-AI conversations
![Database Schema Diagram](https://github.com/ykshah1309/creb-ai/blob/main/db_schema.png)

---

## 🚨 Why CREB.Ai Wins

CREB.Ai brings the power of AI to CRE, making the process as easy as swiping right. No other platform offers real-time matching, negotiation, and AI lease generation in one seamless package. It's fast, smart, and built for the future of real estate.

---

> **Built for The Okada & Company Hackathon – CRE x AI Agent Challenge**

# CREB.Ai – Setup & Run Instructions

## Prerequisites

- Node.js (v18 or later recommended)  
- npm (comes with Node.js)  
- Supabase account & project configured  
- LM Studio running locally with Qwen 2.5 VL-7b model (or an alternative OpenAI-compatible LLM)  
- Create a `.env.local` file with necessary environment variables  

---

Steps to Run:

1. Clone the repository
   git clone <repo-url>
   cd <repo-folder>

2. Install dependencies
   npm install

3. Set up environment variables
   Create a file named .env.local with:
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   HUGGINGFACE_API_TOKEN=<your-llm-api-token-if-any>
   NEXTAUTH_URL=http://localhost:3000

4. Configure Supabase
   - Import provided SQL schema
   - Add admin user manually (admin@example.com) in users table

5. Start local Supabase (optional)
   supabase start

6. Run development server
   npm run dev

7. Run LM Studio with your LLM model
   Ensure the OpenAI-compatible API endpoint is running and reachable.

8. Access app
   Open http://localhost:3000
   - Log in as admin or regular user
   - Admin redirected to admin dashboard, others to user dashboard

Dependencies Installed by npm install:
- next
- react
- react-dom
- @chakra-ui/react
- @chakra-ui/icons
- react-icons
- supabase-js
- chart.js
- react-chartjs-2
- typescript (if TS project)
- others from package.json

That’s it! You should now be able to run and test CREB.Ai locally.

📝 Changelog
v1.1 (2025-07)
Core Platform
Redesigned dashboard for improved UX, with horizontally scrollable, animated property panels for My Listings, Other Properties, and Matches.

Added modal popups for all property cards, including detailed info, “Like/Match,” “Reject,” and “Undo” actions.

Improved rejection logic: rejected properties automatically reappear when the user runs out of new properties to view.

Cards now feature smooth zoom-in hover animation and consistent, modern UI.

Listings & Verification
Verification Flow:

Added “Request Verification” button to each listing on My Listings page.

Property verification requests are now sent to the admin dashboard for approval.

Admin can approve requests; verified listings show a verification badge.

Enhanced My Listings with new card layout, property modals, and clear action buttons (Edit, Delete, View, Request Verification).

Matching & Messaging
Swipe-to-like/Match flow with instant match creation and updates via Supabase.

Added Undo for rejected listings via the popup.

Upgraded Matches page:

Left pane for incoming likes and all accepted matches.

Real-time chat for each match.

Lease generation and contract e-sign built into chat.

Profile & Auth
Fully redesigned profile page with improved avatar handling and editable display name.

Added Logout button to admin dashboard for secure session control.

Admin Dashboard
Admin-only analytics dashboard with rich charts and KPIs:

Total users, listings, matches, rent analytics.

Pie/Doughnut charts for property types/locations.

Bar chart for user signups by month.

Financial summary for quick business insights.

Verification Requests:

Admin panel shows all pending property verification requests with one-click approve flow.

Only admin (by email) can see this page.

Database & Demo Data
DB Schema:

Added verification_status (text) and is_verified (boolean) to properties table.

Demo Data:

Added SQL for diverse properties, matches, and users to populate the dashboard and analytics for demo purposes.
