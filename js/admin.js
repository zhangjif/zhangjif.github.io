/**
 * 博客管理界面逻辑
 * 功能：密码登录、Token 设置、博客列表、新增/编辑/删除
 */
(function () {
  const adminCfg = (window.CONFIG && window.CONFIG.admin) || {};
  const PASSWORD = adminCfg.password || "admin123";
  const AUTH_KEY = adminCfg.authKey || "homepage_admin_auth";

  // ===== DOM 元素 =====
  const $ = (id) => document.getElementById(id);
  const loginSection = $("login-section");
  const adminSection = $("admin-section");
  const editorSection = $("editor-section");
  const pwdStep = $("pwd-step");
  const tokenStep = $("token-step");
  const pwdBtn = $("pwd-btn");
  const tokenBtn = $("token-btn");
  const adminPwd = $("admin-pwd");
  const adminToken = $("admin-token");
  const loginError = $("login-error");
  const tbody = $("post-tbody");
  const postCount = $("post-count");
  const toast = $("toast");

  // 当前编辑状态
  let editingId = null; // null 表示新建

  // ===== 提示条 =====
  let toastTimer = null;
  function showToast(msg, type = "info") {
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  // ===== 登录流程 =====
  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }
  function hasToken() {
    return !!BlogStore.getToken();
  }

  function showLogin() {
    loginSection.classList.remove("hidden");
    adminSection.classList.add("hidden");
    editorSection.classList.add("hidden");
    if (isAuthed()) {
      pwdStep.classList.add("hidden");
      tokenStep.classList.remove("hidden");
    } else {
      pwdStep.classList.remove("hidden");
      tokenStep.classList.add("hidden");
    }
  }

  function showAdmin() {
    loginSection.classList.add("hidden");
    adminSection.classList.remove("hidden");
    editorSection.classList.add("hidden");
    loadList();
  }

  // 密码校验
  pwdBtn.addEventListener("click", () => {
    const val = adminPwd.value.trim();
    if (val === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      loginError.textContent = "";
      pwdStep.classList.add("hidden");
      tokenStep.classList.remove("hidden");
      adminToken.focus();
      // 如已有 Token，直接进入
      if (hasToken()) showAdmin();
    } else {
      loginError.textContent = "密码错误";
    }
  });
  adminPwd.addEventListener("keydown", (e) => {
    if (e.key === "Enter") pwdBtn.click();
  });

  // Token 保存
  tokenBtn.addEventListener("click", () => {
    const val = adminToken.value.trim();
    if (!val) {
      loginError.textContent = "请输入 Token";
      return;
    }
    BlogStore.setToken(val);
    loginError.textContent = "";
    showAdmin();
  });
  adminToken.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tokenBtn.click();
  });

  // 切换密码（重新输密码）
  $("logout-pwd").addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    adminPwd.value = "";
    pwdStep.classList.remove("hidden");
    tokenStep.classList.add("hidden");
  });

  // 更换 Token
  $("change-token-btn").addEventListener("click", () => {
    BlogStore.clearToken();
    sessionStorage.setItem(AUTH_KEY, "1"); // 保留密码登录态
    showLogin();
  });

  // ===== 博客列表加载 =====
  async function loadList() {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">加载中...</td></tr>';
    try {
      const posts = await BlogStore.listPosts();
      if (!posts) {
        tbody.innerHTML =
          '<tr class="empty-row"><td colspan="5">暂无博客（数据文件尚未创建，点击「新建博客」创建第一篇）</td></tr>';
        postCount.textContent = "0";
        return;
      }
      renderList(posts);
    } catch (e) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">加载失败：${escapeHtml(e.message)}</td></tr>`;
    }
  }

  function renderList(posts) {
    postCount.textContent = posts.length;
    if (posts.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">暂无博客</td></tr>';
      return;
    }
    // 按日期倒序
    const sorted = [...posts].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    tbody.innerHTML = sorted
      .map(
        (p) => `
      <tr>
        <td>${escapeHtml(p.title || "")}</td>
        <td><span class="badge ${p.type || "text"}">${
          { text: "文字", audio: "语音", video: "视频", mixed: "混合" }[p.type] || "文字"
        }</span></td>
        <td>${p.date || ""}</td>
        <td style="color:#9fb3d1;font-family:monospace;font-size:12px;">${escapeHtml(p.id || "")}</td>
        <td>
          <button class="btn btn-secondary btn-sm" data-edit="${escapeHtml(p.id)}">编辑</button>
          <button class="btn btn-danger btn-sm" data-del="${escapeHtml(p.id)}">删除</button>
        </td>
      </tr>`
      )
      .join("");
  }

  // 列表事件委托（编辑/删除）
  tbody.addEventListener("click", async (e) => {
    const editId = e.target.getAttribute("data-edit");
    const delId = e.target.getAttribute("data-del");
    if (editId) openEditor(editId);
    if (delId) await handleDelete(delId);
  });

  // 刷新
  $("reload-btn").addEventListener("click", loadList);

  // ===== 编辑器 =====
  $("new-post-btn").addEventListener("click", () => openEditor(null));

  $("cancel-btn").addEventListener("click", () => {
    showAdmin();
  });

  // Markdown 工具栏
  document.querySelectorAll(".editor-toolbar button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ta = $("f-content");
      const md = btn.getAttribute("data-md");
      const wrap = btn.getAttribute("data-wrap");
      const newline = btn.getAttribute("data-newline") === "true";
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = ta.value.substring(start, end);
      let insert;
      if (wrap) {
        insert = wrap + (sel || "文字") + wrap;
        ta.setRangeText(insert, start, end, "end");
      } else if (newline) {
        insert = `\n${md}\n`;
        ta.setRangeText(insert, start, end, "end");
      } else {
        insert = md + (sel || "文字");
        ta.setRangeText(insert, start, end, "end");
      }
      ta.focus();
    });
  });

  function openEditor(id) {
    editingId = id;
    const form = $("post-form");
    form.reset();
    $("delete-btn").style.display = id ? "inline-block" : "none";
    $("editor-title").textContent = id ? "编辑博客" : "新建博客";

    if (id) {
      // 加载现有数据
      BlogStore.listPosts().then((posts) => {
        const post = (posts || []).find((p) => p.id === id);
        if (!post) {
          showToast("未找到该博客", "error");
          return;
        }
        $("f-title").value = post.title || "";
        $("f-id").value = post.id || "";
        $("f-id").disabled = true; // 编辑时不允许改 id（避免引用断裂）
        $("f-date").value = post.date || "";
        $("f-type").value = post.type || "text";
        $("f-summary").value = post.summary || "";
        $("f-cover").value = post.cover || "";
        $("f-audio").value = post.audio || "";
        $("f-video").value = post.video || "";
        $("f-content").value = post.content || "";
      });
    } else {
      // 新建：默认日期为今天
      $("f-id").disabled = false;
      $("f-date").value = new Date().toISOString().slice(0, 10);
    }

    adminSection.classList.add("hidden");
    editorSection.classList.remove("hidden");
  }

  // 保存（新增/更新）
  $("post-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = $("save-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "保存中...";

    const data = {
      title: $("f-title").value.trim(),
      id: $("f-id").value.trim(),
      date: $("f-date").value,
      type: $("f-type").value,
      summary: $("f-summary").value.trim(),
      cover: $("f-cover").value.trim(),
      audio: $("f-audio").value.trim(),
      video: $("f-video").value.trim(),
      content: $("f-content").value
    };

    try {
      let result;
      if (editingId) {
        result = await BlogStore.updatePost(editingId, data);
        showToast("更新成功", "success");
      } else {
        result = await BlogStore.createPost(data);
        showToast("创建成功", "success");
      }
      // 显示 commit 链接，方便用户去 GitHub 验证
      if (result && result.commitUrl) {
        console.log("GitHub Commit:", result.commitUrl);
        console.log("文件位置:", result.fileUrl);
        setTimeout(() => {
          showToast("已提交到 GitHub，点刷新查看列表", "info");
        }, 1500);
      }
      // 返回列表，会自动用 API（带 token）重新读取，立即看到新博客
      showAdmin();
    } catch (err) {
      showToast("保存失败: " + err.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "保存";
    }
  });

  // 删除
  async function handleDelete(id) {
    if (!confirm(`确定删除这篇博客吗？（id=${id}）此操作不可撤销。`)) return;
    try {
      await BlogStore.deletePost(id);
      showToast("删除成功", "success");
      loadList();
    } catch (err) {
      showToast("删除失败: " + err.message, "error");
    }
  }

  // 编辑器内删除按钮
  $("delete-btn").addEventListener("click", async () => {
    if (!editingId) return;
    await handleDelete(editingId);
    showAdmin();
  });

  // ===== 初始化 =====
  if (isAuthed() && hasToken()) {
    showAdmin();
  } else {
    showLogin();
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
