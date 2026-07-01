/**
 * 博客逻辑：列表页渲染 + 文章详情页渲染
 * 包含一个轻量 Markdown 解析器（无需外部依赖）
 */
(function () {
  const cfg = window.CONFIG || {};
  const posts = cfg.posts || [];

  // 判断当前页面：列表页 or 详情页
  const isDetailPage = !!document.getElementById("post-detail-container");

  if (isDetailPage) {
    renderPostDetail();
  } else {
    renderPostList();
  }

  // ===== 博客列表页 =====
  // 优先从 GitHub 仓库 data/posts.json 读取，失败回退到 config.posts
  async function renderPostList() {
    const grid = document.getElementById("post-grid");
    if (!grid) return;
    grid.innerHTML = '<p class="loading-tip">正在加载文章...</p>';

    let list = null;
    if (window.BlogStore) list = await BlogStore.listPosts();
    if (!list) list = posts; // 回退到 config.posts

    if (!list || list.length === 0) {
      grid.innerHTML = '<p class="loading-tip">暂无文章</p>';
      return;
    }
    // 按日期倒序
    const sorted = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    grid.innerHTML = sorted
      .map((post) => {
        if (typeof window.renderPostCard === "function") {
          return window.renderPostCard(post);
        }
        return "";
      })
      .join("");
  }

  // ===== 文章详情页 =====
  async function renderPostDetail() {
    const container = document.getElementById("post-detail-container");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      container.innerHTML = '<p class="empty-tip">未指定文章，请从博客列表进入。</p>';
      return;
    }

    // 优先从 GitHub 仓库获取，回退到 config.posts
    let post = null;
    if (window.BlogStore) post = await BlogStore.getPost(id);
    if (!post) post = posts.find((p) => p.id === id);
    if (!post) {
      container.innerHTML = `<p class="empty-tip">未找到文章 (id=${escapeHtml(id)})。</p>`;
      return;
    }

    document.title = `${post.title} - 个人主页`;

    // 加载正文内容
    // content 可能是：内联 Markdown 文本（来自 posts.json）或文件路径（来自 config.posts 旧数据）
    let contentHtml = "";
    if (post.content) {
      if (isContentFile(post.content)) {
        // 文件路径：fetch 加载
        try {
          const res = await fetch(post.content);
          if (res.ok) {
            const raw = await res.text();
            contentHtml = parseMarkdown(raw);
          } else {
            contentHtml = `<p>正文文件无法加载 (HTTP ${res.status})。</p>`;
          }
        } catch (e) {
          contentHtml = `<p>正文加载失败：${escapeHtml(e.message)}。</p>`;
        }
      } else {
        // 内联 Markdown 文本（来自 posts.json）
        contentHtml = parseMarkdown(post.content);
      }
    }

    // 媒体（语音 / 视频）
    let mediaHtml = "";
    if (post.type === "audio" && post.audio) {
      mediaHtml = `
        <div class="media-box">
          <audio controls preload="metadata" src="${post.audio}"></audio>
        </div>`;
    } else if (post.type === "video" && post.video) {
      mediaHtml = `
        <div class="media-box">
          <video controls preload="metadata" src="${post.video}"></video>
        </div>`;
    } else if (post.type === "mixed") {
      if (post.audio) {
        mediaHtml += `
          <div class="media-box">
            <audio controls preload="metadata" src="${post.audio}"></audio>
          </div>`;
      }
      if (post.video) {
        mediaHtml += `
          <div class="media-box">
            <video controls preload="metadata" src="${post.video}"></video>
          </div>`;
      }
    }

    const typeLabel =
      { text: "文字", audio: "语音", video: "视频", mixed: "混合" }[post.type] || "文字";

    container.innerHTML = `
      <div class="post-detail-header">
        <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
        <div class="post-detail-meta">
          <span class="post-tag ${post.type}">${typeLabel}</span>
          <span>${post.date || ""}</span>
        </div>
      </div>
      ${mediaHtml}
      <div class="post-content">${contentHtml}</div>
    `;
  }

  // 判断 content 是文件路径还是内联 Markdown 文本
  function isContentFile(content) {
    if (!content) return false;
    return (
      /^https?:\/\//.test(content) ||
      /\.md$/i.test(content) ||
      /\.html$/i.test(content) ||
      content.startsWith("assets/")
    );
  }

  // ===== 轻量 Markdown 解析器 =====
  // 支持：标题、代码块、行内代码、引用、有序/无序列表、链接、图片、加粗/斜体、分隔线、段落
  function parseMarkdown(md) {
    // 先转义 HTML，防止注入
    let text = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = text.split(/\r?\n/);
    let html = "";
    let i = 0;
    let inCode = false;
    let codeLang = "";
    let codeBuf = [];
    let listType = null; // 'ul' | 'ol'

    const flushList = () => {
      if (listType) {
        html += `</${listType}>\n`;
        listType = null;
      }
    };

    while (i < lines.length) {
      let line = lines[i];

      // 代码块围栏 ```
      const fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        if (!inCode) {
          inCode = true;
          codeLang = fence[1] || "";
          codeBuf = [];
          flushList();
        } else {
          inCode = false;
          html += `<pre><code class="language-${escapeHtml(codeLang)}">${codeBuf.join("\n")}</code></pre>\n`;
        }
        i++;
        continue;
      }
      if (inCode) {
        codeBuf.push(line);
        i++;
        continue;
      }

      // 空行
      if (/^\s*$/.test(line)) {
        flushList();
        i++;
        continue;
      }

      // 标题
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushList();
        const level = h[1].length;
        html += `<h${level}>${inline(h[2])}</h${level}>\n`;
        i++;
        continue;
      }

      // 分隔线
      if (/^(\*\*\*|---|___)\s*$/.test(line)) {
        flushList();
        html += `<hr/>\n`;
        i++;
        continue;
      }

      // 引用
      if (/^>\s?/.test(line)) {
        flushList();
        const quote = line.replace(/^>\s?/, "");
        html += `<blockquote>${inline(quote)}</blockquote>\n`;
        i++;
        continue;
      }

      // 无序列表
      if (/^[-*+]\s+/.test(line)) {
        if (listType !== "ul") {
          flushList();
          html += `<ul>\n`;
          listType = "ul";
        }
        html += `<li>${inline(line.replace(/^[-*+]\s+/, ""))}</li>\n`;
        i++;
        continue;
      }

      // 有序列表
      if (/^\d+\.\s+/.test(line)) {
        if (listType !== "ol") {
          flushList();
          html += `<ol>\n`;
          listType = "ol";
        }
        html += `<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>\n`;
        i++;
        continue;
      }

      // 普通段落
      flushList();
      // 合并连续的段落行
      let para = line;
      while (
        i + 1 < lines.length &&
        !/^\s*$/.test(lines[i + 1]) &&
        !/^```/.test(lines[i + 1]) &&
        !/^(#{1,6})\s+/.test(lines[i + 1]) &&
        !/^>\s?/.test(lines[i + 1]) &&
        !/^[-*+]\s+/.test(lines[i + 1]) &&
        !/^\d+\.\s+/.test(lines[i + 1]) &&
        !/^(\*\*\*|---|___)\s*$/.test(lines[i + 1])
      ) {
        i++;
        para += " " + lines[i];
      }
      html += `<p>${inline(para)}</p>\n`;
      i++;
    }

    // 收尾
    if (inCode) {
      html += `<pre><code>${codeBuf.join("\n")}</code></pre>\n`;
    }
    flushList();
    return html;
  }

  // 行内格式：加粗、斜体、行内代码、链接、图片
  function inline(s) {
    // 图片 ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img alt="$1" src="$2"/>');
    // 链接 [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // 加粗 **text**
    s = s.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
    // 斜体 *text*
    s = s.replace(/\*([^\*]+)\*/g, "<em>$1</em>");
    // 行内代码 `code`
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    return s;
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
