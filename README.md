# 🎵 Miku X Eva Dual Persona AI  
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green.svg)
![React](https://img.shields.io/badge/React-Frontend-blue.svg)
![Vite](https://img.shields.io/badge/Vite-Bundler-lightblue.svg)
![Groq](https://img.shields.io/badge/Groq-LLM_API-black.svg)

---

## ✨ Overview

**Miku X Eva Dual Persona AI** is a lightweight AI chat application featuring two distinct conversational personas—Miku and Eva—powered by the Groq LLM. The backend uses FastAPI while the frontend is built with React/Vite. The system demonstrates:

- Isolated conversational memory for each persona
- Persona-specific system prompts and behaviors
- RESTful API communication with a modern frontend
- Groq LLM integration for dynamic responses

---

## 🚀 Features

- 🎤 Dual persona chat (Miku & Eva)  
- 🧠 Independent history per user/persona  
- 🔗 Groq LLM integration with configurable prompts  
- 🌐 REST API with CORS for frontend compatibility  
- 💾 In‑memory history (easily replaceable with a database)  
- 🎨 React/Vite frontend with modular components

---

## 🏗 System Architecture

User → Frontend → FastAPI Backend → Groq LLM → Response → Store → Return to User

### 🧠 Memory Logic Explained

1. User sends a message via frontend.
2. Backend receives a message through `/chat`.
3. History for the specified persona (`miku` or `eva`) is retrieved from in-memory store.
4. System prompt + conversation history + new question are sent to Groq.
5. LLM generates a response.
6. Message and reply are appended to the persona's history.
7. Response is returned to the frontend.

This ensures:
- Context continuity  
- Persona-specific behavior rules  
- Simple extensibility to persistent storage

---

## 🛠 Tech Stack

### Backend
- Python 3.11+
- FastAPI
- Uvicorn
- Groq Chat Completions

### Frontend
- React
- Vite
- JavaScript/CSS/HTML

---

## 📂 Project Structure

```
Miku X Eva/
│
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       └── hooks/
└── requirements.txt
```

---

## 📦 Requirements

Install Python 3.11+ and dependencies in `requirements.txt`:

```
# example
fastapi
uvicorn
groq
python-dotenv
pydantic
```

---

## 🔐 Environment Variables

Create a `.env` file in the root with:

```
GROQ_API_KEY=your_api_key_here
```

Do not commit this file to version control.

---

## ▶ Run Locally (Windows)

1. Open PowerShell in project root

2. Create & activate virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\activate  # Windows
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Start backend:

```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

5. Start frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in a browser.

---

## 🌐 API Endpoints

### GET /
Health check endpoint.

Response:

```json
{
  "status": "Miku × Eva — Dual Persona Core Active",
  "version": "3.0.0"
}
```

---

### POST /chat

Request:

```json
{
  "user_id": "string",
  "question": "string",
  "mode": "miku" | "eva"  // defaults to "miku"
}
```

Response:

```json
{
  "response": "string",
  "user_id": "string",
  "mode": "string"
}
```

---

### DELETE /chat/{user_id}

Clears both personas' history for a user.

---

### DELETE /chat/{user_id}/{mode}

Clears history for a single persona.

---

## 💾 Data Storage

Currently in-memory dictionaries (`miku_conversations`, `eva_conversations`) store histories with structure:

- `role` ("user" or "assistant")
- `content` (message text)

Replace with a database for persistence.

---

## 🚢 Deployment (High-Level)

1. Deploy backend (e.g., Render, AWS, Azure).
2. Set `GROQ_API_KEY` as environment variable.
3. Run production server:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

4. Host frontend via Netlify/Vercel or same server.

---

## 🔒 Security & Operational Notes

- Do not commit `.env`.
- Add authentication before public deployment.
- Monitor Groq API usage.
- Consider rate limiting and database security.

---

## 🧪 Testing

```powershell
curl -X POST "http://127.0.0.1:8000/chat" -H "Content-Type: application/json" -d "{\"user_id\":\"test\",\"question\":\"Hello\"}"
```

---

# 📜 License

This project is licensed under the MIT License.

---

## 🙏 Thank You

Thank you for exploring **Miku X Eva Dual Persona AI**!

This project demonstrates practical architecture with:

- Persona-specific system prompts  
- Groq LLM usage  
- Frontend-backend separation  
- Easy deployment readiness
