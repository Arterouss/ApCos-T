import fetch from "node-fetch";

async function getRealIp() {
  const dohUrl = "https://cloudflare-dns.com/dns-query?name=pornavhd.com&type=A";
  try {
    const res = await fetch(dohUrl, {
      headers: { "accept": "application/dns-json" }
    });
    const data = await res.json();
    console.log("Real IPs:", data.Answer);
  } catch(e) {
    console.error("DoH Failed:", e.message);
  }
}
getRealIp();
