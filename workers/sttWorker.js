import { pipeline } from "@xenova/transformers";

let transcriber = null;

self.onmessage = async (event) => {
  const { type, data } = event.data;

  if (type === "INIT") {
    console.log("Initializing Whisper Tiny (Xenova)... ⚡");
    transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
    self.postMessage({ type: "READY" });
  }

  if (type === "AUDIO_CHUNK" && transcriber) {
    try {
      const result = await transcriber(data);
      self.postMessage({ type: "TRANSCRIPT", text: result.text });
    } catch (err) {
      console.error("STT Error:", err);
      self.postMessage({ type: "TRANSCRIPT", text: "[Error processing audio]" });
    }
  }
};
