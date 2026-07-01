/**
 * 主页逻辑：个人信息、GitHub 仓库、论文、博客预览
 */
(function () {
  const cfg = window.CONFIG || {};
  const p = cfg.profile || {};

  // ===== 填充个人信息 =====
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };
  setText("hero-name", p.name);
  setText("hero-title", p.title);
  setText("hero-bio", p.bio);

  const avatar = document.getElementById("hero-avatar");
  if (avatar && p.avatar) {
    avatar.src = p.avatar;
    avatar.onerror = () => {
      // 头像加载失败时使用占位图
      avatar.src =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">' +
          '<rect width="100%" height="100%" fill="#2a3556"/>' +
          '<text x="50%" y="50%" font-size="60" fill="#7ec1ff" ' +
          'text-anchor="middle" dominant-baseline="central">' +
          (p.name ? p.name.charAt(0).toUpperCase() : "?") +
          "</text></svg>"
        );
    };
  }

  // 社交链接
  const socialBox = document.getElementById("hero-social");
  if (socialBox && p.social) {
    const items = [
      { key: "github", label: "GitHub" },
      { key: "googleScholar", label: "Google Scholar" },
      { key: "twitter", label: "Twitter" },
      { key: "linkedin", label: "LinkedIn" }
    ];
    let html = "";
    items.forEach((it) => {
      if (p.social[it.key]) {
        html += `<a href="${p.social[it.key]}" target="_blank" rel="noopener">${it.label}</a>`;
      }
    });
    if (p.email) {
      html += `<a href="mailto:${p.email}">Email</a>`;
    }
    socialBox.innerHTML = html;
  }

  // ===== GitHub 仓库展示 =====
  const gh = cfg.github || {};
  const repoGrid = document.getElementById("repo-grid");
  const ghLink = document.getElementById("gh-profile-link");

  if (ghLink && gh.username) {
    ghLink.href = `https://github.com/${gh.username}`;
  }

  // 语言颜色映射（部分常用语言）
  const langColors = {
    Python: "#3572A5", JavaScript: "#f1e05a", TypeScript: "#3178c6",
    HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219", "C++": "#f34b7d",
    C: "#555555", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584",
    Ruby: "#701516", Shell: "#89e051", Vue: "#41b883", Jupyter: "#DA5B0B",
    MDX: "#fcb32c", Dart: "#00B4AB", Kotlin: "#A97BFF", Swift: "#F05138",
    PHP: "#4F5D95", Scala: "#c22d40", Lua: "#000080", R: "#198CE7"
  };

  async function loadRepos() {
    if (!gh.username) {
      repoGrid.innerHTML =
        '<p class="loading-tip">请在 config.js 中设置 github.username</p>';
      return;
    }
    try {
      const sortMap = {
        stars: "sort=stars",
        updated: "sort=updated",
        name: "sort=full_name"
      };
      const url =
        `https://api.github.com/users/${gh.username}/repos?per_page=${gh.perPage || 6}` +
        `&${sortMap[gh.sort] || sortMap.stars}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("GitHub API 请求失败: " + res.status);
      let repos = await res.json();

      if (!gh.showForks) repos = repos.filter((r) => !r.fork);
      repos = repos.slice(0, gh.perPage || 6);

      if (repos.length === 0) {
        repoGrid.innerHTML = '<p class="loading-tip">暂无公开仓库</p>';
        return;
      }

      repoGrid.innerHTML = repos
        .map((r) => {
          const lang = r.language || "—";
          const color = langColors[lang] || "#888";
          return `
            <a class="repo-card" href="${r.html_url}" target="_blank" rel="noopener">
              <div class="repo-name">${escapeHtml(r.name)}</div>
              <div class="repo-desc">${escapeHtml(r.description || "暂无描述")}</div>
              <div class="repo-meta">
                <span><span class="repo-lang" style="background:${color}"></span>${lang}</span>
                <span>★ ${r.stargazers_count}</span>
                <span>⑂ ${r.forks_count}</span>
              </div>
            </a>`;
        })
        .join("");
    } catch (e) {
      repoGrid.innerHTML =
        `<p class="loading-tip">仓库加载失败：${escapeHtml(e.message)}<br>` +
        `可能是 GitHub API 限流，请稍后再试。</p>`;
    }
  }
  loadRepos();

  // ===== 论文列表 =====
  const paperList = document.getElementById("paper-list");
  if (paperList && Array.isArray(cfg.papers)) {
    if (cfg.papers.length === 0) {
      paperList.innerHTML = '<p class="loading-tip">暂无论文</p>';
    } else {
      paperList.innerHTML = cfg.papers
        .map((p) => {
          const links = (p.links || [])
            .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
            .join("");
          const imgHtml =
            p.image ? `<img src="${p.image}" alt="" style="max-width:100%;border-radius:8px;margin-bottom:10px"/>` : "";
          return `
            <div class="paper-card">
              ${imgHtml}
              <span class="paper-venue">${escapeHtml(p.venue || "")} ${p.year || ""}</span>
              <h3 class="paper-title">${escapeHtml(p.title)}</h3>
              <p class="paper-authors">${escapeHtml(p.authors || "")}</p>
              <p class="paper-abstract">${escapeHtml(p.abstract || "")}</p>
              <div class="paper-links">${links}</div>
            </div>`;
        })
        .join("");
    }
  }

  // ===== 博客预览（取前 3 篇） =====
  // 优先从 GitHub 仓库 data/posts.json 读取，失败回退到 config.posts
  const postPreview = document.getElementById("post-preview");
  if (postPreview) {
    renderPostPreview();
  }
  async function renderPostPreview() {
    let list = null;
    if (window.BlogStore) list = await BlogStore.listPosts();
    if (!list) list = Array.isArray(cfg.posts) ? cfg.posts : [];
    const previewPosts = list.slice(0, 3);
    if (previewPosts.length === 0) {
      postPreview.innerHTML = '<p class="loading-tip">暂无文章</p>';
    } else {
      postPreview.innerHTML = previewPosts.map(renderPostCard).join("");
    }
  }

  // ===== 工具函数 =====
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // 渲染博客卡片（供主页预览与列表页共用，挂到 window）
  // 使用函数声明以便提升，可在上方调用
  function renderPostCard(post) {
    const cover =
      post.cover
        ? `<img class="post-cover" src="${post.cover}" alt="cover"/>`
        : `<div class="post-cover" style="display:flex;align-items:center;justify-content:center;font-size:40px;">${
            { text: "📝", audio: "🎙", video: "🎬", mixed: "📚" }[post.type] || "📝"
          }</div>`;
    return `
      <a class="post-card" href="post.html?id=${encodeURIComponent(post.id)}">
        ${cover}
        <div class="post-body">
          <span class="post-tag ${post.type}">${
            { text: "文字", audio: "语音", video: "视频", mixed: "混合" }[post.type] || "文字"
          }</span>
          <div class="post-title">${escapeHtml(post.title)}</div>
          <div class="post-summary">${escapeHtml(post.summary || "")}</div>
          <div class="post-date">${post.date || ""}</div>
        </div>
      </a>`;
  }
  // 挂到 window 供 blog.js 复用
  window.renderPostCard = renderPostCard;
})();
