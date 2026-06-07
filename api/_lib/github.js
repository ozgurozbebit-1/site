const API_ROOT = "https://api.github.com";

function env(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`${name} ortam değişkeni tanımlı değil.`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

function config() {
  return {
    token: env("GITHUB_TOKEN"),
    owner: env("GITHUB_OWNER"),
    repo: env("GITHUB_REPO"),
    branch: env("GITHUB_BRANCH"),
  };
}

async function github(path, options = {}) {
  const { token } = config();
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "ozgur-ozbebit-admin",
      ...options.headers,
    },
  });

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(`GitHub işlemi başarısız oldu (${response.status}).`);
    error.statusCode = response.status === 401 || response.status === 403 ? 502 : 500;
    error.githubStatus = response.status;
    error.githubMessage = body?.message;
    throw error;
  }
  return body;
}

export async function readFile(path) {
  const { owner, repo, branch } = config();
  const data = await github(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
  if (data.type !== "file" || !data.content) {
    const error = new Error(`${path} GitHub deposunda bulunamadı.`);
    error.statusCode = 500;
    throw error;
  }
  return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
}

export async function readFiles(paths) {
  const entries = await Promise.all(paths.map(async (path) => [path, await readFile(path)]));
  return Object.fromEntries(entries);
}

export async function commitFiles(files, message) {
  const { owner, repo, branch } = config();
  const encodedBranch = encodeURIComponent(branch);
  const ref = await github(`/repos/${owner}/${repo}/git/ref/heads/${encodedBranch}`);
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
  };
}
