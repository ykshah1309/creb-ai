# CREB.Ai – The AI-Powered Real Estate Matchmaking Platform

**CREB.Ai** is the first Tinder-style, AI-driven web platform for Commercial Real Estate (CRE). We make it effortless for buyers, sellers, and brokers to connect, negotiate, and close CRE deals—faster and smarter than ever.

[User-Side Demo Video](https://drive.google.com/file/d/1bZ9EH54e9UQ8XkcSmhKRtkgeRvQE8mDb/view?usp=sharing)  
[Admin-Side Demo Video](https://drive.google.com/file/d/1jqdzbQGxXbpMcHkCGqiFTaHasMMw2xJ6/view?usp=sharing)

---

## 🚀 What Makes CREB.Ai Unique?

- **Swipe to Match:** Instantly match with properties and interested parties, just like dating apps.
- **AI Lease Agent:** Built-in AI assistant to answer questions and generate lease contracts.
- **Real-Time Chat:** Secure messaging as soon as a match happens—negotiate, collaborate, close.
- **Automated Contracts & E-sign:** NYC-compliant leases generated and signed in-platform.
- **All Roles, One Platform:** Custom flows for buyers, owners, and brokers.

---

## 🏆 Why CREB.Ai Is the Only Solution You Need

- **Cuts deal time from weeks to hours**—AI and automation at every step.
- **No inefficiency:** End endless emails, calls, and paperwork errors.
- **Small teams win:** AI levels the playing field for smaller owners/brokers.

---

## 🔥 Key Features

- **AI Chatbot** (privacy-first, OpenAI-compatible)
- **Smart Matching** (custom logic)
- **Real-Time Messaging**
- **One-Click Lease Generation & E-Sign**
- **Property Management** (upload, edit, verify)
- **Business Analytics** (admin dashboard)
- **Verification Workflow** (increase trust)

---

## 💡 How It Works

1. **Sign Up & Create Profile**: Select your role, set your preferences.
2. **Browse & Swipe**: Like/dislike properties—owners/brokers see interested buyers instantly.
3. **Get Matched**: Mutual likes open a real-time chat.
4. **AI Lease Agent**: Generate leases or get instant support from AI.
5. **Close the Deal**: E-sign the lease, all in one place.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, TypeScript, Chakra UI, Tailwind CSS
- **Backend:** Node.js (API routes), Supabase (Auth & DB)
- **Database:** PostgreSQL (Supabase)
- **AI Engine:** Local LLM (Qwen 2.5 VL-7b) via LM Studio or OpenAI-compatible API
- **E-Signature:** Built-in PDF and contract workflows

---

## ⚡ Database Schema (Simplified)

- **users:** Auth & profile
- **properties:** Listings with owner/broker info, images, verification status
- **matches:** Like/match status between users/properties
- **messages:** Real-time chat between matches
- **ai_chat_history:** User-AI interactions

![Database Schema Diagram](https://github.com/ykshah1309/creb-ai/blob/main/db_schema.png)

---

## 📝 Changelog

### v1.1 (2025-07)

#### Core Platform
- Dashboard UI overhaul: Scrollable, animated panels for listings and matches
- Instant property detail modals: Like/Match, Reject, Undo—all in place
- Smarter rejection: See previously rejected properties again when new ones run out

#### Listings & Verification
- “Request Verification” button for every user listing
- Admin dashboard: Approve verification requests, show verified badge instantly
- Improved property management UI (edit/delete/view/verify)

#### Matching & Messaging
- Swipe-to-match and instant match creation
- Real-time chat, lease generation, e-signature built in
- Undo for rejected listings

#### Profile & Auth
- Redesigned profile page: avatar and display name editing
- Admin logout button for secure sessions

#### Admin Dashboard & Analytics
- Full analytics: User growth, listings, matches, revenue, and KPIs
- Live charts: user signups, listings by type/location
- Quick financial summary
- Admin-only panel for approving property verification requests

#### Database & Demo Data
- Added `verification_status` and `is_verified` to `properties`
- Included demo data for properties, users, matches to populate analytics

> For earlier changes, see repo history.

---

## 🚨 Why CREB.Ai Wins

CREB.Ai brings AI to CRE, making the process as easy as swiping right. No other platform offers real-time matching, negotiation, and AI-powered lease generation in one place. It's fast, smart, and trust-driven.

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

## 📝 Changelog

### v1.1 (2025-07)

#### Core Platform
- Dashboard UI overhaul: Horizontally scrollable, animated panels for listings and matches.
- Property popups: Instantly view details, like, reject, or undo—no page reloads.
- Smart rejection logic: Rejected listings reappear when new matches run out.

#### Listings & Verification
- “Request Verification” button for all user listings.
- Admin dashboard: Review and approve verification requests. Verified badge appears instantly.
- Improved property management: Cleaner card layout, intuitive edit/delete/view/verify actions.

#### Matching & Messaging
- Swipe-to-match for all users.
- Instant match creation, undo for rejections, and chat opens automatically.
- Real-time chat, lease generation, and e-signature in every match.

#### Profile & Auth
- Redesigned profile page with live avatar updates and editable display name.
- Secure logout from admin panel.

#### Admin Dashboard & Analytics
- Full analytics for business ops: User growth, property/match KPIs, location/type breakdowns.
- Live charts (bar, pie, doughnut) for user signups, listings by location/type, and revenue stats.
- Financial summary at a glance.

#### Database & Demo Data
- DB: Added `verification_status` and `is_verified` to properties for verification workflows.
- Included demo data for properties, users, and matches to power the dashboard and analytics.

> For previous updates, see repo history.
