# ✨ AI eLearning Storyboard Generator

A full-stack web app for generating intelligent, branded, level-specific eLearning storyboards using the **Google Gemini API**. Designed for L&D professionals, instructional designers, and content creators.

Built with:
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Deployment**: Firebase (frontend) & Cloud Run (backend)

---

## 🚀 Features

✅ Generate structured, scene-by-scene eLearning storyboards  
✅ Choose module **type** (e.g. onboarding, compliance, product, soft skills)  
✅ Choose **tone** (e.g. friendly, formal, humorous)  
✅ Choose **language** (e.g. English AU, Spanish, Mandarin)  
✅ Choose **complexity level (1–4)** — from static to fully interactive  
✅ Apply **branding** (fonts, colours) to match your company style  
✅ Export as **PDF** with beautifully styled output  
✅ Supports **SCORM-compatible** content structure  
✅ Fully responsive UI and intuitive form interface  
✅ Ready for **Firebase Hosting** and **Cloud Run** deployment  

---

## 🧠 AI-Powered Storyboarding

Leverages Gemini 1.5 Pro for intelligent prompt processing. Storyboards are dynamically created based on best-practice learning design principles, instructional flow, media usage, tone of voice, and visual structure.

---

## 🛠️ Getting Started (Run Locally)

### Prerequisites

- Node.js (v18 or later)
- NPM or Yarn
- Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/chrisgaborit/tailwind-react-starter.git
cd tailwind-react-starter

---

## 🛠️ Project Troubleshooting History & Supabase Backend Integration

> **Context:**  
> This section tracks major technical lessons and the integration journey for the Node.js backend and Supabase Postgres DB.  
> Share this with future devs or paste into ChatGPT if you ever get stuck — it’s your “project memory”!

### Debugging a Node.js Backend to Supabase Connection

**Initial State & Goal:**  
Node.js/Express backend on localhost:8080, REST API `/api/storyboards` for saving JSON to a Supabase-hosted Postgres DB.

#### Debugging Journey (Problems & Solutions)

1. **Network Connection Failure**
    - Error: `getaddrinfo ENOTFOUND ...supabase.co`
    - Solution: Switched to Transaction Pooler string (IPv4).

2. **Authentication & Region Mismatch**
    - Error: `Tenant or user not found`
    - Solution: Correct password & fixed DB region in .env.

3. **Schema Mismatch (Missing Columns)**
    - Error: `column "created_by" does not exist`
    - Solution: Added columns in Supabase Table Editor.

4. **Schema Mismatch (Incorrect Data Type)**
    - Error: `invalid input syntax for type timestamp: "test@learno.com"`
    - Solution: Changed column type from timestamp to text.

**Final Working Configuration**
- `.env` contains:
    ```env
    DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@[REGION_HOSTNAME]:6543/postgres"
    ```
- Table schema: `id (uuid, pk)`, `content (jsonb)`, `tags (text[])`, `level (int4)`, `is_best_example (bool)`, `created_by (text)`
- `{"success":true}` on POST = connected!

---

*Keep this updated whenever you solve a major integration issue or change infra!*
