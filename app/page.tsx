// app/page.tsx

import Recorder from "../components/Recorder";


export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <Recorder />
    </main>
  );
}
