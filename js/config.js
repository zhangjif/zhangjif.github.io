/**
 * 个人主页配置文件
 * 只需修改本文件即可定制你的主页，无需改动其他代码
 */
const CONFIG = {
  // ===== 个人信息 =====
  profile: {
    name: "张济凡",
    title: "Magnus Zhang",          // 头衔
    avatar: "assets/images/avatar.jpg", // 头像路径（可替换）
    bio: "专注于强化学习，时序算法的系统研究与应用。",
    email: "1547127246@qq.com",
    social: {
      github: "https://github.com/zhangjif",
      googleScholar: "https://scholar.google.com/citations?user=xxxx",
      twitter: "https://twitter.com/Magnus04",
      linkedin: ""
    }
  },

  // ===== GitHub 仓库展示 =====
  github: {
    username: "zhangjif",   // 你的 GitHub 用户名（用于自动拉取仓库）
    sort: "stars",                      // 排序方式: stars / updated / name
    perPage: 6,                         // 展示数量
    showForks: false,                   // 是否展示 fork 的仓库
    pinnedOnly: false                   // true: 仅展示置顶仓库; false: 按 sort 排序展示
  },

  // ===== 博客管理（GitHub API 持久化） =====
  // 博客数据存储在仓库的 data/posts.json，访客通过 raw URL 读取
  // 管理员通过 admin.html 用 Token 进行增删改
  blogStore: {
    owner: "zhangjif",      // 仓库所有者（你的 GitHub 用户名）
    repo: "zhangjif.github.io",    // 仓库名（即 GitHub Pages 仓库）
    branch: "main",                     // 分支名
    dataFile: "data/posts.json"         // 博客数据文件路径（相对仓库根）
  },

  // ===== 管理界面访问控制 =====
  // 注意：纯前端密码校验非强安全，仅用于挡住普通访客。
  // 真正的操作凭证是 GitHub Token（在管理界面输入，存 sessionStorage）。
  // 如需更强安全，请使用后端服务。
  admin: {
    // 管理密码：建议改成你自己的复杂密码。此处为明文（弱安全）。
    password: "04128899",
    // sessionStorage 的 key
    authKey: "homepage_admin_auth",
    tokenKey: "homepage_github_token"
  },

  // ===== 背景设置 =====
  background: {
    // 背景图片：替换 assets/images/bg.jpg 即可更换
    image: "assets/images/bg.jpg",
    // 背景图片遮罩透明度 (0-1)，数值越小背景越暗
    overlay: 0.55,
    // 背景音乐：替换 assets/audio/bgm.mp3 即可更换，留空则不播放
    music: "assets/audio/bgm.mp3",
    // 是否自动播放背景音乐（注意：浏览器策略通常禁止自动播放，需用户点击开启）
    musicAutoplay: false,
    // 背景音乐音量 (0-1)
    musicVolume: 0.4,
    // 是否循环播放
    musicLoop: true
  },

  // ===== 康威生命游戏动态背景 =====
  // 启用后会在静态背景图之上叠加动态细胞演化
  lifeBackground: {
    enabled: true,            // 是否启用
    cellSize: 12,             // 每个细胞像素大小（越小越精细但越耗 CPU）
    color: "#7ec1ff",         // 细胞颜色（建议与主题色一致）
    opacity: 0.5,             // canvas 整体透明度（0-1，越低越不干扰前景）
    bgFade: 0.12,             // 拖尾效果：每帧覆盖的暗色透明度（0=无拖尾全清空，越大拖尾越短）
    stepInterval: 180,        // 演化间隔（ms），越小越快，建议 100-300
    maxStableSteps: 200       // 稳定多少代后重新播种（避免画面静止）
  },

  // ===== 论文列表 =====
  // 手动添加你的论文，按需增删
  papers: [
    {
      title: "Stability and Convergence Analysis of Reinforcement Learning Algorithms in Complex Environments",
      authors: "First author",
      venue: "Advances in Computer and Communications, Hill Publishing",
      year: 2025,
      abstract: "",
      links: [
        { label: "Journal", url: "https://www.hillpublisher.com/advances-in-computer-and-communications" }
      ],
      // 可选：论文配图
      image: ""
    },
    {
      title: "Multi-Agent Reinforcement Learning for Cooperative Decision-Making in Power System Fault Diagnosis",
      authors: "First author",
      venue: "Clausius Scientific Press, Vol. 9 Num. 1",
      year: 2025,
      abstract: "",
      links: [
        { label: "Paper", url: "https://doi.org/10.23977/cpcs.2025.090106" }
      ],
      // 可选：论文配图
      image: ""
    },
  ],

  // ===== 博客文章列表 =====
  // 每篇文章支持三种类型：text（纯文字）、audio（语音）、video（视频）、mixed（混合）
  // 文章正文存储在 assets/posts/ 目录下的 .md 或 .html 文件
  posts: [
    {
      id: "welcome",
      title: "欢迎来到我的博客",
      date: "2024-06-01",
      type: "text",
      cover: "",                          // 封面图，可留空
      summary: "这是博客的第一篇文章，介绍本站功能与使用方法。",
      content: "assets/posts/welcome.md"  // 正文文件路径
    },
    {
      id: "audio-post-demo",
      title: "语音博客示例",
      date: "2024-06-10",
      type: "audio",
      cover: "",
      summary: "这是一篇带有语音内容的博客文章示例。",
      content: "assets/posts/audio-demo.md",
      audio: "assets/posts/audio-demo.mp3"  // 语音文件路径
    },
    {
      id: "video-post-demo",
      title: "视频博客示例",
      date: "2024-06-15",
      type: "video",
      cover: "",
      summary: "这是一篇带有视频内容的博客文章示例。",
      content: "assets/posts/video-demo.md",
      video: "assets/posts/video-demo.mp4"  // 视频文件路径
    }
  ]
};

// 暴露给全局
window.CONFIG = CONFIG;
