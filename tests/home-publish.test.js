import assert from "node:assert/strict";
import fs from "node:fs";
import { Readable } from "node:stream";
import test from "node:test";
import { createSessionCookie } from "../api/_lib/auth.js";
import homePublishHandler from "../api/admin/home-publish.js";

process.env.ADMIN_PASSWORD = "uzun-ve-guvenli-parola";
process.env.ADMIN_SESSION_SECRET = "12345678901234567890123456789012";
process.env.GITHUB_TOKEN = "github-test-token";
process.env.GITHUB_OWNER = "owner";
process.env.GITHUB_REPO = "repo";
process.env.GITHUB_BRANCH = "main";
process.env.VERCEL_DEPLOYMENTS_URL = "https://vercel.com/team/project/deployments";

const home = {
  eyebrow: "Erişkin Psikiyatrisi",
  heroTitle: "Commit sonrası doğrulanan hero başlığı",
  heroDescription: "Commit sonrası doğrulanan yeni meta açıklaması.",
  appointmentButton: "Randevu Al",
  servicesButton: "Çalışma Alanları",
  approachTitle: "Yaklaşım başlığı",
  approachDescription: "Yaklaşım açıklaması.",
  processTitle: "Süreç başlığı",
  processDescription: "Süreç açıklaması.",
};

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function request(body, cookie) {
  return Object.assign(Readable.from([Buffer.from(JSON.stringify(body))]), {
    method: "POST",
    headers: {
      origin: "https://site.example",
      host: "site.example",
      "x-forwarded-host": "site.example",
      "x-forwarded-proto": "https",
      cookie,
    },
  });
}

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk) {
      this.body = chunk ? JSON.parse(chunk) : null;
    },
  };
}

test("ana sayfa yayınında index.html commit sonrası yeniden okunup doğrulanır", async (context) => {
  const originalFetch = global.fetch;
  const originalHtml = fs.readFileSync("index.html", "utf8");
  let committedHtml = "";
  const contentRefs = [];
  context.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options = {}) => {
    if (url.endsWith("/repos/owner/repo")) return response({ full_name: "owner/repo" });
    if (url.includes("/contents/index.html")) {
      const ref = new URL(url).searchParams.get("ref");
      contentRefs.push(ref);
      return response({
        type: "file",
        content: Buffer.from(ref === "home-commit-sha" ? committedHtml : originalHtml).toString("base64"),
      });
    }
    if (url.endsWith("/git/ref/heads/main")) return response({ object: { sha: "head-sha" } });
    if (url.endsWith("/git/commits/head-sha")) return response({ tree: { sha: "base-tree" } });
    if (url.endsWith("/git/blobs")) {
      committedHtml = Buffer.from(JSON.parse(options.body).content, "base64").toString("utf8");
      return response({ sha: "index-blob" });
    }
    if (url.endsWith("/git/trees")) return response({ sha: "new-tree" });
    if (url.endsWith("/git/commits")) return response({ sha: "home-commit-sha" });
    if (url.endsWith("/git/refs/heads/main")) return response({ object: { sha: "home-commit-sha" } });
    if (url.endsWith("/commits/home-commit-sha")) {
      return response({ files: [{ filename: "index.html" }] });
    }
    return response({ message: "unexpected" }, 404);
  };

  const cookie = createSessionCookie({
    headers: { host: "site.example", "x-forwarded-proto": "https" },
  }).split(";")[0];
  const res = responseRecorder();
  await homePublishHandler(request({ confirm: true, home }, cookie), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.commit.sha, "home-commit-sha");
  assert.deepEqual(res.body.commit.files, ["index.html"]);
  assert.deepEqual(contentRefs, ["main", "home-commit-sha"]);
  assert.match(committedHtml, /Commit sonrası doğrulanan hero başlığı/);
  assert.match(committedHtml, /<meta name="description" content="Commit sonrası doğrulanan yeni meta açıklaması\.">/);
  assert.match(committedHtml, /SITE_CONTACT_START/);
});
