# 🎤 Whisper STT + Gemini LLM + TTS (Next.js App)

This project is a **Next.js + TypeScript** web app that runs **offline for Speech-to-Text (STT)** and partially offline for Text-to-Speech (TTS), while using **Google Gemini** for intelligent responses.  

It demonstrates a **local-first AI pipeline**:

1. **Record voice input** using the browser microphone
2. **Transcribe speech locally** using Whisper Tiny (WASM in Web Worker)
3. **Send transcript to Google Gemini LLM** for a reply
4. **Convert reply to audio** using TTS locally (planned)
5. **Play audio response** in the browser

---

## ⚡ Features

- ✅ Offline **speech-to-text** with Whisper WASM
- ✅ Real-time transcription and LLM response
- ✅ Works offline except for the Gemini API call
- ✅ Service Worker + PWA caching for initial load
- ✅ Displays **latency stats** (STT, LLM, Total)
- ⚠️ Local TTS integration planned (currently logs error due to importScripts issue)

---

## 📂 Project Structure

.
├── components/
│ └── Recorder.tsx # Main UI + Recording, STT, LLM integration
├── workers/
│ ├── sttWorker.js # Handles Whisper WASM transcription
│ └── ttsWorker.js # Handles local TTS (currently WIP)
├── public/
│ ├── manifest.json # PWA manifest
│ ├── service-worker.js # Service worker for offline caching
│ └── lib/
│ └── transformers.min.js # Xenova Transformers UMD
├── pages/
│ ├── _document.tsx # Registers manifest + SW
│ └── index.tsx # Main entry page (imports Recorder)
├── package.json
├── next.config.js
└── README.md

yaml
Copy code

---

## 🔧 Setup & Installation

1. **Clone the repository**

```bash
git clone https://github.com/<your-username>/nextjs-whisper-llm-tts.git
cd nextjs-whisper-llm-tts
Install dependencies

bash
Copy code
npm install
Setup environment variables

Create a .env file in the project root:

ini
Copy code
NEXT_PUBLIC_GEMINI_API_KEY=your_google_generative_ai_api_key
Sign up for Gemini API if you don’t have one:
https://makersuite.google.com/app/apikey

Run the app

bash
Copy code
npm run dev
Visit: http://localhost:3000

📦 Offline Mode
This app uses Service Workers and IndexedDB caching to run offline:

Whisper model files are cached locally

TTS models are also cached (though currently WIP)

LLM calls still require the internet for Gemini

Test Offline Mode
Open the app in Chrome

Check Application → Service Workers

Enable:

✅ Offline mode

✅ Update on reload

✅ Bypass for network

Turn off Wi-Fi

Reload → STT should still work offline

🖥 Usage
Click Start Recording

Speak into your microphone

Wait for transcription to appear

Gemini will generate a reply

(TTS playback will be added later)

⏱ Latency Logging
The app tracks:

STT latency – Time from end of recording to transcript ready

LLM latency – Time taken for Gemini to respond

Total latency – End-to-end response time

Example:

makefile
Copy code
STT: 6.41s
LLM: 1.86s
Total: 8.27s
🚀 Deployment
Push to GitHub

Deploy to Vercel for instant hosting:

bash
Copy code
vercel


📌 Notes
Local TTS currently logs an import error (importScripts issue with Next.js workers).

STT and LLM integration are fully working and offline-ready.
