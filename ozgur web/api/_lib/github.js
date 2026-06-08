const API_ROOT = "https://api.github.com";

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`${name} ortam değişkeni tanımlı değil.`);
    error.statusCode = 500;
    error.code = "MISSING_GITHUB_ENV";
    error.details = {
      environment: githubEnvironmentStatus(),
      missingVariable: name,
    };
    throw error;
  }
  return value;
}

export function githubEnvironmentStatus() {
  return {
    tokenConfigured: Boolean(process.env.GITHUB_TOKEN?.trim()),
    owner: process.env.GITHUB_OWNER?.trim() || null,
    repo: process.env.GITHUB_REPO?.trim() || null,
    branch: process.env.GITHUB_BRANCH?.trim() || null,
  };
}

function config() {
  return {
    token: env("GITHUB_TOKEN"),
    owner: env("GITHUB_OWNER"),
    repo: env("GITHUB_REPO"),
    branch: env("GITHUB_BRANCH"),
  };
}

function githubErrorMessage(status, body, context, branch) {
  const apiMessage = body?.message || "GitHub API mesajı alınamadı.";

  if (status === 401) {
    return `GitHub API 401: Token geçersiz veya süresi dolmuş. GitHub mesajı: ${apiMessage}`;
  }
  if (status === 403) {
    return `GitHub API 403: Tokenın bu işlem için yetkisi yok. Contents: Read and write iznini kontrol edin. GitHub mesajı: ${apiMessage}`;
  }
  if (status === 404 && context === "repository") {
    return `GitHub API 404: Depo bulunamadı veya token depoya erişemiyor. GitHub mesajı: ${apiMessage}`;
  }
  if (status === 404 && context === "branch") {
    return `GitHub API 404: "${branch}" branch'i bulunamadı. GitHub mesajı: ${apiMessage}`;
  }
  if (status === 404) {
    return `GitHub API 404: İstenen GitHub kaynağı bulunamadı. GitHub mesajı: ${apiMessage}`;
  }
  return `GitHub API ${status}: ${apiMessage}`;
}

async function github(path, options = {}, context = "request") {
  const { token } = config();
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ozgur-ozbebit-admin",
        ...options.headers,
      },
    });
  } catch (cause) {
    const error = new Error(`GitHub API bağlantısı kurulamadı: ${cause.message}`);
    error.statusCode = 502;
    error.code = "GITHUB_NETWORK_ERROR";
    error.details = {
      environment: githubEnvironmentStatus(),
      request: { method: options.method || "GET", path, context },
    };
    throw error;
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const { branch } = config();
    const error = new Error(githubErrorMessage(response.status, body, context, branch));
    error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
    error.code = "GITHUB_API_ERROR";
    error.githubStatus = response.status;
    error.githubMessage = body?.message || null;
    error.details = {
      environment: githubEnvironmentStatus(),
      github: {
        status: response.status,
        message: body?.message || null,
        documentationUrl: body?.documentation_url || null,
      },
      request: {
        method: options.method || "GET",
        path,
        context,
      },
    };
    throw error;
  }
  return body;
}

export async function validateGithubAccess() {
  const { owner, repo, branch } = config();
  const status = githubEnvironmentStatus();

  console.info("[github] Ortam değişkenleri okundu", status);
  await github(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {}, "repository");
  await github(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branch)}`,
    {},
    "branch",
  );

  return status;
}

export async function readFile(path, ref) {
  const { owner, repo, branch } = config();
  const targetRef = ref || branch;
  const data = await github(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(targetRef)}`,
    {},
    "file",
  );
  if (data.type !== "file" || !data.content) {
    const error = new Error(`${path} GitHub deposunda bulunamadı.`);
    error.statusCode = 500;
    throw error;
  }
  return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
}

export async function readFiles(paths, ref) {
  const entries = await Promise.all(paths.map(async (path) => [path, await readFile(path, ref)]));
  return Object.fromEntries(entries);
}

export async function readCommitFiles(sha) {
  const { owner, repo } = config();
  const commit = await github(`/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}`, {}, "commit");
  return (commit.files || []).map((file) => file.filename);
}

export async function commitFiles(files, message) {
  const { owner, repo, branch } = config();
  const encodedBranch = encodeURIComponent(branch);
  const ref = await github(`/repos/${owner}/${repo}/git/ref/heads/${encodedBranch}`, {}, "branch");
  const headSha = ref.object.sha;
  const headCommit = await github(`/repos/${owner}/${repo}/git/commits/${headSha}`);

  const treeEntries = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const blob = await github(`/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: Buffer.from(content, "utf8").toString("base64"),
          encoding: "base64",
        }),
      });
      return { path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );

  const tree = await github(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: treeEntries }),
  });

  const commit = await github(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [headSha],
    }),
  });

  await github(`/repos/${owner}/${repo}/git/refs/heads/${encodedBranch}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return {
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    branch,
    repository: `${owner}/${repo}`,
    files: Object.keys(files),
    githubUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
  };
}
