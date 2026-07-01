/**
 * 博客数据存储层（GitHub API 持久化）
 *
 * 数据结构：仓库中 data/posts.json
 * {
 *   "posts": [
 *     {
 *       "id": "xxx",
 *       "title": "标题",
 *       "date": "YYYY-MM-DD",
 *       "type": "text" | "audio" | "video" | "mixed",
 *       "cover": "",
 *       "summary": "摘要",
 *       "content": "Markdown 正文",
 *       "audio": "",
 *       "video": ""
 *     }
 *   ]
 * }
 *
 * - 访客（无 Token）：通过 raw.githubusercontent.com 读取
 * - 管理员（有 Token）：通过 GitHub Contents API 读写
 */
(function () {
  const cfg = (window.CONFIG && window.CONFIG.blogStore) || {};
  const owner = cfg.owner || "";
  const repo = cfg.repo || "";
  const branch = cfg.branch || "main";
  const dataFile = cfg.dataFile || "data/posts.json";

  // ===== Token 管理 =====
  const tokenKey =
    (window.CONFIG.admin && window.CONFIG.admin.tokenKey) ||
    "homepage_github_token";

  function getToken() {
    return sessionStorage.getItem(tokenKey) || "";
  }
  function setToken(token) {
    sessionStorage.setItem(tokenKey, token);
  }
  function clearToken() {
    sessionStorage.removeItem(tokenKey);
  }

  // ===== 工具：UTF-8 安全的 base64 编解码 =====
  function encodeBase64(str) {
    // 处理 Unicode：先转 UTF-8 字节再 base64
    return btoa(unescape(encodeURIComponent(str)));
  }
  function decodeBase64(b64) {
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      return atob(b64);
    }
  }

  // ===== raw URL（公开读取） =====
  function rawUrl() {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dataFile}?t=${Date.now()}`;
  }

  // ===== API URL（需鉴权） =====
  function apiUrl() {
    return `https://api.github.com/repos/${owner}/${repo}/contents/${dataFile}`;
  }

  /**
   * 读取博客列表（访客可用，无需 Token）
   * 失败时返回 null，调用方可回退到 CONFIG.posts
   */
  async function listPosts() {
    try {
      const res = await fetch(rawUrl(), { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && Array.isArray(data.posts)) return data.posts;
      return null;
    } catch (e) {
      console.warn("store.listPosts 失败:", e.message);
      return null;
    }
  }

  /**
   * 获取单个文章（按 id）
   */
  async function getPost(id) {
    const posts = await listPosts();
    if (!posts) return null;
    return posts.find((p) => p.id === id) || null;
  }

  /**
   * 内部：通过 Contents API 获取文件元信息（含 sha）
   */
  async function getFileMeta() {
    const token = getToken();
    if (!token) throw new Error("未设置 GitHub Token，无法写入");
    const res = await fetch(apiUrl(), {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json"
      }
    });
    if (res.status === 404) return null; // 文件不存在
    if (!res.ok) throw new Error(`获取文件元信息失败: ${res.status}`);
    return res.json();
  }

  /**
   * 内部：写入 posts.json（创建或更新）
   * @param {Array} posts 完整的博客数组
   * @param {string} commitMsg 提交信息
   */
  async function writePosts(posts, commitMsg) {
    const token = getToken();
    if (!token) throw new Error("未设置 GitHub Token，无法写入");

    const meta = await getFileMeta();
    const body = {
      message: commitMsg,
      content: encodeBase64(JSON.stringify({ posts }, null, 2)),
      branch: branch
    };
    if (meta && meta.sha) body.sha = meta.sha; // 更新需要 sha

    const res = await fetch(apiUrl(), {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`写入失败: ${res.status} ${err.message || ""}`);
    }
    return res.json();
  }

  /**
   * 新增博客
   */
  async function createPost(post) {
    const posts = (await listPosts()) || [];
    // 校验 id 唯一
    if (posts.some((p) => p.id === post.id)) {
      throw new Error(`id "${post.id}" 已存在，请使用其他 id`);
    }
    posts.push(post);
    await writePosts(posts, `新增博客: ${post.title}`);
    return post;
  }

  /**
   * 更新博客
   */
  async function updatePost(id, updates) {
    const posts = (await listPosts()) || [];
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`未找到 id 为 "${id}" 的博客`);
    // 如果 id 变更，检查新 id 唯一
    if (updates.id && updates.id !== id) {
      if (posts.some((p) => p.id === updates.id)) {
        throw new Error(`新 id "${updates.id}" 已存在`);
      }
    }
    posts[idx] = Object.assign({}, posts[idx], updates);
    await writePosts(posts, `更新博客: ${posts[idx].title}`);
    return posts[idx];
  }

  /**
   * 删除博客
   */
  async function deletePost(id) {
    const posts = (await listPosts()) || [];
    const target = posts.find((p) => p.id === id);
    if (!target) throw new Error(`未找到 id 为 "${id}" 的博客`);
    const remaining = posts.filter((p) => p.id !== id);
    await writePosts(remaining, `删除博客: ${target.title}`);
    return true;
  }

  // 暴露 API
  window.BlogStore = {
    listPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    getToken,
    setToken,
    clearToken
  };
})();
