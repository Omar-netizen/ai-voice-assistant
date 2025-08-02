"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");

  const [latency, setLatency] = useState<{ stt: number; llm: number; total: number } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sttWorkerRef = useRef<Worker | null>(null);
  const ttsWorkerRef = useRef<Worker | null>(null);

  // Timing trackers
  const sttStartTime = useRef<number>(0);
  const sttEndTime = useRef<number>(0);
  const llmStartTime = useRef<number>(0);

  useEffect(() => {
    // Initialize STT Worker
    const sttWorker = new Worker(new URL("../workers/sttWorker.js", import.meta.url));
    sttWorkerRef.current = sttWorker;

    sttWorker.onmessage = async (event: MessageEvent<{ type: string; text?: string }>) => {
      const { type, text } = event.data;

      if (type === "READY") {
        console.log("Whisper Worker is ready ✅");
      }

      if (type === "TRANSCRIPT" && text) {
        sttEndTime.current = Date.now();
        const sttLatency = (sttEndTime.current - sttStartTime.current) / 1000;

        if (!text.trim() || text.trim().startsWith("[")) {
          console.warn("🗑 Ignored non-speech segment:", text);
          return;
        }

        console.log("Transcript:", text);
        setTranscript((prev) => prev + " " + text);

        llmStartTime.current = Date.now();
        const reply = await getLLMResponse(text);
        const llmLatency = (Date.now() - llmStartTime.current) / 1000;

        console.log("🤖 Gemini Reply:", reply);
        setAiReply(reply);

        // Update latency info
        setLatency({ stt: sttLatency, llm: llmLatency, total: sttLatency + llmLatency });

        // Send reply to TTS worker
        ttsWorkerRef.current?.postMessage({ type: "SPEAK", text: reply });
      }
    };

    sttWorker.postMessage({ type: "INIT" });

    // Initialize TTS Worker
    const ttsWorker = new Worker(new URL("../workers/ttsWorker.js", import.meta.url));
    ttsWorkerRef.current = ttsWorker;

    ttsWorker.onmessage = (event: MessageEvent<{ type: string; blob?: Blob; message?: string }>) => {
      const { type, blob } = event.data;
      if (type === "READY") {
        console.log("TTS Worker ready ✅");
      }
      if (type === "AUDIO" && blob) {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
      }
    };

    ttsWorker.postMessage({ type: "INIT" });

    return () => {
      sttWorker.terminate();
      ttsWorker.terminate();
    };
  }, []);

  async function blobToFloat32Array(blob: Blob): Promise<Float32Array> {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const audioCtx = new AudioContextClass();

    try {
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const channelData = decoded.getChannelData(0);

      const targetSampleRate = 16000;
      const resampleRatio = decoded.sampleRate / targetSampleRate;
      const newLength = Math.floor(channelData.length / resampleRatio);
      const resampledData = new Float32Array(newLength);

      for (let i = 0; i < newLength; i++) {
        resampledData[i] = channelData[Math.floor(i * resampleRatio)];
      }

      return resampledData;
    } catch (err) {
      console.error("❌ Unable to decode audio data:", err);
      return new Float32Array(0);
    }
  }

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    sttStartTime.current = Date.now(); // Start STT timer
    setTranscript("");
    setAiReply("");
    setLatency(null);

    mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      if (audioChunksRef.current.length === 0) return;
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      const float32Audio = await blobToFloat32Array(blob);

      if (float32Audio.length === 0) {
        console.warn("❌ Skipping empty or invalid audio.");
        return;
      }

      sttWorkerRef.current?.postMessage(
        { type: "AUDIO_CHUNK", data: float32Audio },
        [float32Audio.buffer]
      );
    };

    mediaRecorder.start();
    setRecording(true);
    console.log("🎤 Recording started...");
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    console.log("🛑 Recording stopped...");
  };

  async function getLLMResponse(userInput: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(userInput);
      return result.response.text();
    } catch (err) {
      console.error("LLM Error:", err);
      return "[Error generating response]";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl text-gray-700 font-bold mb-6">🎤 Whisper STT + Gemini LLM + TTS</h1>

      <button
        onClick={recording ? handleStopRecording : handleStartRecording}
        className={`px-6 py-3 rounded-lg text-white font-semibold ${recording ? "bg-red-500" : "bg-green-500"}`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      <div className="mt-6 w-full max-w-2xl space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xl text-gray-600 font-semibold mb-2">📝 Transcript</p>
          <p className="text-gray-700 whitespace-pre-line">{transcript || "..."}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xl text-gray-600 font-semibold mb-2">🤖 Gemini Reply</p>
          <p className="text-gray-700 whitespace-pre-line">{aiReply || "..."}</p>
        </div>

        {latency && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-blue-600 mb-2">⏱ Latency Info</h4>
            <p className="font-semibold text-gray-800">STT: {latency.stt.toFixed(2)}s</p>
            <p className="font-semibold text-gray-800">LLM: {latency.llm.toFixed(2)}s</p>
            <p className="font-semibold text-gray-800">Total: {latency.total.toFixed(2)}s</p>
          </div>
        )}
      </div>
    </div>
  );
}
