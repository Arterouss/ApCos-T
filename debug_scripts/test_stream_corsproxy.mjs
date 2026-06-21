import crypto from 'crypto';
import fetch from 'node-fetch';

async function sha1(str) {
  const hash = crypto.createHash('sha1');
  hash.update(str);
  return hash.digest('hex');
}

async function test() {
  const iwaraId = "kawayidfa";
  const proxyBase = "https://corsproxy.io/?";
  const infoUrl = `https://api.iwara.tv/video/${iwaraId}`;
  
  console.log("Fetching info via corsproxy...");
  let res = await fetch(proxyBase + encodeURIComponent(infoUrl));
  let info = await res.json();
  console.log(info.fileUrl);
  
  const fileUrl = info.fileUrl;
  const fileId = info.file.id;
  const fullUrl = fileUrl.startsWith("//") ? "https:" + fileUrl : fileUrl;
  const parsedUrl = new URL(fullUrl);
  const expires = parsedUrl.searchParams.get("expires");
  
  const xVersion = await sha1(`${fileId}_${expires}_5nFp9kmbNnHdAFhaqMvt`);
  console.log("X-Version:", xVersion);
  
  console.log("Fetching sources...");
  res = await fetch(proxyBase + encodeURIComponent("https:" + fileUrl), {
    headers: { "X-Version": xVersion }
  });
  console.log(await res.text());
}
test().catch(console.error);
