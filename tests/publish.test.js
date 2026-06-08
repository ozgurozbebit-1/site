import assert from "node:assert/strict";
import fs from "node:fs";
import { Readable } from "node:stream";
import test from "node:test";
import { createSessionCookie } from "../api/_lib/auth.js";
import { HTML_FILES } from "../api/_lib/contact.js";
import publishHandler from "../api/admin/publish.js";

process.env.ADMIN_PASSWORD = "uzun-ve-guvenli-parola";
process.env.ADMIN_SESSION_SECRET = "12345678901234567890123456789012";
process.env.GITHUB_TOKEN = "github-test-token";
process.env.GITHUB_OWNER = "owner";
process.env.GITHUB_REPO = "repo";
process.env.GITHUB_BRANCH = "main";
process.env.VERCEL_DEPLOYMENTS_URL = "https://vercel.com/team/project/deployments";
process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.example.com";

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

test("yayın endpoint'i tüm HTML dosyalarını tek commit ile günceller", async (context) => {
  const originalFetch = global.fetch;
  const blobBodies = [];
  const contentReads = [];
  context.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options = {}) => {
    if (url.endsWith("/repos/owner/repo")) return response({ full_name: "owner/repo" });
    if (url.includes("/contents/")) {
      const ref = new URL(url).searchParams.get("ref");
      const encodedPath = url.match(/\/contents\/([^?]+)/)[1];
      const path = decodeURIComponent(encodedPath);
      contentReads.push({ path, ref });
      const published = blobBodies[HTML_FILES.indexOf(path)];
      return response({
        type: "file",
        content: Buffer.from(ref === "publish-commit-sha" ? published : fs.readFileSync(path, "utf8")).toString("base64"),
      });
    }
    if (url.endsWith("/git/ref/heads/main")) return response({ object: { sha: "head-sha" } });
    if (url.endsWith("/git/commits/head-sha")) return response({ tree: { sha: "base-tree" } });
    if (url.endsWith("/git/blobs")) {
      const body = JSON.parse(options.body);
      blobBodies.push(Buffer.from(body.content, "base64").toString("utf8"));
      return response({ sha: `blob-${blobBodies.length}` });
    }
    if (url.endsWith("/git/trees")) return response({ sha: "new-tree" });
    if (url.endsWith("/git/commits")) return response({ sha: "publish-commit-sha" });
    if (url.endsWith("/git/refs/heads/main")) return response({ object: { sha: "publish-commit-sha" } });
    if (url.endsWith("/commits/publish-commit-sha")) {
      return response({ files: HTML_FILES.map((filename) => ({ filename })) });
    }
    return response({ message: "unexpected" }, 404);
  };

  const cookieHeader = createSessionCookie({
    headers: { host: "site.example", "x-forwarded-proto": "https" },
  }).split(";")[0];
  const req = request({
    confirm: true,
    contact: {
      phone: "555 111 22 33",
      whatsapp: "555 444 33 22",
      email: "yeni@example.com",
      address: "Yeni Mahalle, Didim / Aydın",
      instagram: "https://instagram.com/ornek",
      linkedin: "https://linkedin.com/in/ornek",
    },
  }, cookieHeader);
  const res = responseRecorder();

  await publishHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.commit.branch, "main");
  assert.equal(res.body.commit.sha, "publish-commit-sha");
  assert.equal(res.body.commit.githubUrl, "https://github.com/owner/repo/commit/publish-commit-sha");
  assert.deepEqual(res.body.commit.files, HTML_FILES);
  assert.equal(res.body.updatedFileCount, HTML_FILES.length);
  assert.equal(res.body.vercelDeployCheckUrl, "https://vercel.com/team/project/deployments");
  assert.equal(res.body.productionUrl, "https://www.example.com");
  assert.equal(contentReads.length, HTML_FILES.length * 2);
  assert.deepEqual(
    contentReads.filter(({ ref }) => ref === "publish-commit-sha").map(({ path }) => path).sort(),
    [...HTML_FILES].sort(),
  );
  assert.equal(blobBodies.length, HTML_FILES.length);
  assert.deepEqual(res.body.updatedFiles, HTML_FILES);
  assert.deepEqual(res.body.verifiedFiles.sort(), [...HTML_FILES].sort());

  for (const path of ["index.html", "depresyon-duygudurum.html", "anksiyete-bozukluklari.html"]) {
    const html = blobBodies[HTML_FILES.indexOf(path)];
    assert.ok(html.includes(">555 111 22 33</a>"), `${path} telefon metnini içermeli`);
    assert.ok(html.includes(">yeni@example.com</a>"), `${path} e-posta metnini içermeli`);
    assert.ok(html.includes('href="tel:+905551112233"'), `${path} tel bağlantısını içermeli`);
    assert.ok(html.includes('href="mailto:yeni@example.com"'), `${path} mailto bağlantısını içermeli`);
  }

  const committedIndex = blobBodies[HTML_FILES.indexOf("index.html")];
  assert.doesNotMatch(committedIndex, /g(?:ü|u)ncelleniyor/i);
  assert.match(committedIndex, />555 111 22 33<\/a>/);
  assert.match(committedIndex, />yeni@example\.com<\/a>/);

  assert.ok(blobBodies.every((html) => html.includes("Yeni Mahalle, Didim / Aydın")));
  assert.ok(blobBodies.every((html) => html.includes('"telephone":"555 111 22 33"')));
  assert.ok(blobBodies.every((html) => html.includes("https://wa.me/905554443322")));
  assert.ok(blobBodies.every((html) => html.includes("https://instagram.com/ornek")));
  assert.ok(blobBodies.every((html) => html.includes("https://linkedin.com/in/ornek")));
});
