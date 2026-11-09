// Tell IndexNow engines (Bing, which feeds Copilot and ChatGPT search, plus Yandex, Naver, Seznam, Yep) that
// pages changed. Run after a deploy is live:  npm run indexnow
// The key is public by design: IndexNow checks it at https://saans.me/<key>.txt.
import { readdirSync } from "node:fs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://saans.me";
const keyFile = readdirSync(new URL("../public", import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("no IndexNow key file in public/");
const key = keyFile.slice(0, -4);

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) throw new Error("sitemap has no URLs");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} for ${urlList.length} URLs`);
if (res.status >= 400) process.exit(1);
