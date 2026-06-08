import assert from "node:assert/strict";
import test from "node:test";
import {
  commitFiles,
  githubEnvironmentStatus,
  readFile,
  validateGithubAccess,
} from "../api/_lib/github.js";

process.env.GITHUB_TOKEN = "github-test-token";
process.env.GITHUB_OWNER = "owner";
process.env.GITHUB_REPO = "repo";
process.env.GITHUB_BRANCH = "main";

function response(body, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("dosyayı GitHub Contents API üzerinden server-side okur", async (context) => {
  const originalFetch = global.fetch;
  context.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options) => {
    assert.match(url, /\/repos\/owner\/repo\/contents\/index\.html\?ref=main$/);
    assert.equal(options.headers.Authorization, "Bearer github-test-token");
    return response({
      type: "file",
      content: Buffer.from("<html>test</html>").toString("base64"),
    });
  };

  assert.equal(await readFile("index.html"), "<html>test</html>");
});

test("birden çok HTML dosyasını tek atomik commit ile main branch'e gönderir", async (context) => {
  const originalFetch = global.fetch;
  const calls = [];
  context.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url, options = {}) => {
    calls.push({ url, method: options.method || "GET", body: options.body });
    assert.equal(options.headers.Authorization, "Bearer github-test-token");

    if (url.endsWith("/git/ref/heads/main")) return response({ object: { sha: "head-sha" } });
    if (url.endsWith("/git/commits/head-sha")) return response({ tree: { sha: "base-tree" } });
    if (url.endsWith("/git/blobs")) {
      const body = JSON.parse(options.body);
      return response({ sha: `blob-${Buffer.from(body.content, "base64").toString("utf8").length}` });
    }
    if (url.endsWith("/git/trees")) return response({ sha: "new-tree" });
    if (url.endsWith("/git/commits")) return response({ sha: "new-commit-sha" });
    if (url.endsWith("/git/refs/heads/main")) return response({ object: { sha: "new-commit-sha" } });
    return response({ message: "unexpected" }, 404);
  };

  const result = await commitFiles(
    { "index.html": "<html>one</html>", "surec.html": "<html>two</html>" },
    "İletişim bilgilerini güncelle",
  );

  assert.equal(result.shortSha, "new-com");
  assert.equal(result.branch, "main");
  assert.equal(calls.filter((call) => call.url.endsWith("/git/blobs")).length, 2);
  assert.equal(calls.filter((call) => call.url.endsWith("/git/commits") && call.method === "POST").length, 1);
  assert.equal(calls.at(-1).method, "PATCH");
});

test("GitHub ortam değişkenlerinin güvenli durumunu döndürür", () => {
  assert.deepEqual(githubEnvironmentStatus(), {
    tokenConfigured: true,
    owner: "owner",
    repo: "repo",
    branch: "main",
  });
  assert.doesNotMatch(JSON.stringify(githubEnvironmentStatus()), /github-test-token/);
});

for (const scenario of [
  {
    name: "401 durumunda geçersiz token hatasını ayrıntılandırır",
    status: 401,
    message: "Bad credentials",
    expected: /GitHub API 401: Token geçersiz/,
  },
  {
    name: "403 durumunda token yetki hatasını ayrıntılandırır",
    status: 403,
    message: "Resource not accessible by personal access token",
    expected: /GitHub API 403: Tokenın bu işlem için yetkisi yok/,
  },
  {
    name: "404 durumunda depo bulunamadı hatasını ayrıntılandırır",
    status: 404,
    message: "Not Found",
    expected: /GitHub API 404: Depo bulunamadı/,
  },
]) {
  test(scenario.name, async (context) => {
    const originalFetch = global.fetch;
    context.after(() => {
      global.fetch = originalFetch;
    });
    global.fetch = async () => response({ message: scenario.message }, scenario.status);

    await assert.rejects(
      validateGithubAccess(),
      (error) => {
        assert.match(error.message, scenario.expected);
        assert.equal(error.githubStatus, scenario.status);
        assert.equal(error.githubMessage, scenario.message);
        assert.equal(error.details.environment.tokenConfigured, true);
        assert.doesNotMatch(JSON.stringify(error.details), /github-test-token/);
        return true;
      },
    );
  });
}

test("branch bulunamazsa branch adını hata mesajında gösterir", async (context) => {
  const originalFetch = global.fetch;
  context.after(() => {
    global.fetch = originalFetch;
  });
  global.fetch = async (url) => {
    if (url.endsWith("/repos/owner/repo")) return response({ full_name: "owner/repo" });
    return response({ message: "Not Found" }, 404);
  };

  await assert.rejects(
    validateGithubAccess(),
    (error) => {
      assert.match(error.message, /"main" branch'i bulunamadı/);
      assert.equal(error.githubStatus, 404);
      assert.equal(error.details.request.context, "branch");
      return true;
    },
  );
});
