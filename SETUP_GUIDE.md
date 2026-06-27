# Quick Start & Setup Guide - EventSphere AI

This package is pre-configured with the active database, Supabase, and Stripe developer accounts. You do **not** need to set up a new database or configure keys.

---

## 📋 Prerequisites

Ensure you have **Node.js** (v18.x or later recommended) installed on the target PC:
- [Download Node.js](https://nodejs.org/)

---

## 🚀 Setup & Launch (One-Click Config)

### Step 1: Copy Project Files
Copy this entire `eventsphere-ai-shareable` folder to the target PC.

### Step 2: Install Project Dependencies
Open your terminal (PowerShell, Command Prompt, or bash), navigate (`cd`) to this directory, and install the NPM packages:
```bash
npm install
```

### Step 3: Run the Application
Start the local development server immediately:
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🛠️ Build Check (Production Verification)
To compile and test a production optimization build on the target machine:
```bash
npm run build
```
This confirms TypeScript validation, Next.js optimization, and layout compilation work flawlessly out-of-the-box.
