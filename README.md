# TruDoc AI — Starter App

A local React + FastAPI starter for document text extraction and preliminary risk indicators.

## What this first version does
- Uploads PDF or TXT files.
- Extracts readable text.
- Checks for basic contract-risk phrases and simple consistency indicators.
- Returns a transparent, rule-based risk score with explanations.

## Important limitations
This starter does **not** prove that a document is authentic, fake, or AI-generated. The score is a heuristic based on simple rules, not a probability or legal opinion. It does not yet perform image forensics, compare against an authoritative issuer, or detect AI writing reliably. Scanned PDFs without selectable text may return little or no text.

## Requirements
- Python 3.10+
- Node.js 18+ (recommended)

## 1. Start the backend
Open a terminal in the `backend` folder:

```bash
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

Windows Command Prompt:
```bat
.venv\Scripts\activate.bat
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Then install and start:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend API: http://127.0.0.1:8000  
API docs: http://127.0.0.1:8000/docs

## 2. Start the frontend
Open a second terminal in the `frontend` folder:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

## Troubleshooting
- If `python` is not recognized, install Python and enable “Add Python to PATH”.
- If `npm` is not recognized, install Node.js LTS and reopen VS Code.
- If upload fails, make sure the backend is running on port 8000.
- If the PDF is scanned, OCR is not included in this first version. Add OCR in a later phase.
- Do not upload sensitive real contracts to an untrusted or public deployment. This local demo processes files in memory and does not intentionally save uploads.
