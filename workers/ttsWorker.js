console.log("🔊 Initializing TTS Worker...");

let ttsPipeline = null;

self.onmessage = async (event) => {
  const { type, text } = event.data;

  if (type === "INIT") {
    try {
      // ✅ Load from public/lib (accessible as /lib/transformers.min.js)
      importScripts("/lib/transformers.min.js");

      const transformersLib = self.transformers || (self.window && self.window.transformers);
      if (!transformersLib) throw new Error("Transformers library not found after importScripts.");

      const { pipeline } = transformersLib;

      ttsPipeline = await pipeline("text-to-speech", "Xenova/xtts-v1");
      self.postMessage({ type: "READY" });
      console.log("TTS Worker ready ✅");
    } catch (err) {
      console.error("❌ Failed to initialize TTS:", err);
      self.postMessage({ type: "ERROR", message: "TTS init failed" });
    }
    return;
  }

  if (type === "SPEAK" && ttsPipeline && typeof text === "string" && text.trim()) {
    try {
      const output = await ttsPipeline(text);
      const wavBlob = float32ToWavBlob(output.audio);
      self.postMessage({ type: "AUDIO", blob: wavBlob });
    } catch (err) {
      console.error("TTS Error:", err);
      self.postMessage({ type: "ERROR", message: "TTS generation failed" });
    }
  }
};

function float32ToWavBlob(float32Array) {
  const wavBuffer = encodeWAV(float32Array, 24000);
  return new Blob([wavBuffer], { type: "audio/wav" });
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);
  return buffer;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
