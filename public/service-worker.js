const CACHE_NAME = "ai-voice-cache-v1";
const ASSETS_TO_CACHE = [
  "/models/whisper/config.json",
  "/models/whisper/encoder.onnx",
  "/models/whisper/decoder.onnx",
  "/models/whisper/tokenizer.json",
  "/models/tts/config.json",
  "/models/tts/encoder.onnx",
  "/models/tts/decoder.onnx",
  "/models/tts/vocab.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
