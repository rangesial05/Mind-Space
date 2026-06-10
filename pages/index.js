// pages/index.js  —  serves the MindSpace frontend
export default function Home() {
  return null; // HTML is in /public/index.html, served directly by Next.js static hosting
}

// Actually we'll use a custom _document or just serve from public.
// Redirect root to the static app.
export async function getServerSideProps({ res }) {
  res.writeHead(302, { Location: "/app.html" });
  res.end();
  return { props: {} };
}
