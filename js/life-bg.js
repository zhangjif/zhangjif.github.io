/**
 * 康威生命游戏动态背景
 *
 * 设计要点：
 * - 渲染在固定定位的 canvas 上，作为页面背景层
 * - 半透明、低对比度，不干扰前景内容
 * - 支持响应式（窗口尺寸变化自动重算网格）
 * - 稳定检测：长时间稳定后自动注入新生命，避免画面静止
 * - 性能控制：使用 requestAnimationFrame + 帧率限制
 */
(function () {
  const cfg = (window.CONFIG && window.CONFIG.lifeBackground) || {};

  // 未启用则直接退出
  if (!cfg.enabled) return;

  // ===== 配置 =====
  const CELL_SIZE = cfg.cellSize || 12;       // 每个细胞像素大小
  const COLOR = cfg.color || "#7ec1ff";        // 细胞颜色
  const OPACITY = cfg.opacity != null ? cfg.opacity : 0.55;
  const BG_FADE = cfg.bgFade != null ? cfg.bgFade : 0.12; // 拖尾效果（0=无拖尾, 1=无动态）
  const STEP_INTERVAL = cfg.stepInterval || 180; // 每步间隔(ms)，越小越快
  const MAX_STABLE_STEPS = cfg.maxStableSteps || 200; // 稳定后重新播种

  // ===== 创建 canvas =====
  const canvas = document.createElement("canvas");
  canvas.id = "life-bg-canvas";
  canvas.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:100%",
    "height:100%",
    "z-index:-2",           // 位于遮罩之上、内容之下
    "pointer-events:none",  // 不拦截点击
    "opacity:" + OPACITY
  ].join(";");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // ===== 网格状态 =====
  let cols = 0, rows = 0;
  let grid = null;       // 当前代
  let nextGrid = null;   // 下一代缓冲
  let lastStepTime = 0;
  let stepsSinceChange = 0;

  // ===== 尺寸初始化 =====
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.ceil(window.innerWidth / CELL_SIZE);
    rows = Math.ceil(window.innerHeight / CELL_SIZE);

    // 保留旧数据尽量迁移；尺寸变化时直接重置更简单
    grid = new Uint8Array(cols * rows);
    nextGrid = new Uint8Array(cols * rows);
    seedRandom();
    stepsSinceChange = 0;
  }

  // ===== 随机播种 =====
  function seedRandom(density) {
    density = density != null ? density : 0.32;
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < density ? 1 : 0;
    }
    // 清空画布
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  // ===== 计算邻居数（带边界环绕） =====
  function countNeighbors(x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        // 环绕边界
        const nx = (x + dx + cols) % cols;
        const ny = (y + dy + rows) % rows;
        n += grid[ny * cols + nx];
      }
    }
    return n;
  }

  // ===== 演化一代 =====
  function step() {
    let changed = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const alive = grid[idx];
        const n = countNeighbors(x, y);
        let next = 0;
        // 康威规则
        if (alive) {
          next = (n === 2 || n === 3) ? 1 : 0;
        } else {
          next = (n === 3) ? 1 : 0;
        }
        nextGrid[idx] = next;
        if (next !== alive) changed++;
      }
    }
    // 交换缓冲
    const tmp = grid;
    grid = nextGrid;
    nextGrid = tmp;

    // 稳定检测
    if (changed === 0) {
      stepsSinceChange++;
    } else {
      stepsSinceChange = 0;
    }
    // 长期稳定或过于稀疏时重新播种
    if (stepsSinceChange > MAX_STABLE_STEPS) {
      seedRandom(0.32);
    }
  }

  // ===== 绘制 =====
  function draw() {
    // 拖尾效果：半透明黑色覆盖，造成渐隐
    ctx.fillStyle = `rgba(11, 16, 32, ${BG_FADE})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillStyle = COLOR;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y * cols + x]) {
          ctx.fillRect(
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE - 1,  // 留 1px 间隙
            CELL_SIZE - 1
          );
        }
      }
    }
  }

  // ===== 主循环 =====
  function loop(time) {
    if (time - lastStepTime >= STEP_INTERVAL) {
      step();
      draw();
      lastStepTime = time;
    }
    requestAnimationFrame(loop);
  }

  // ===== 启动 =====
  resize();

  // 防抖处理窗口大小变化
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  // 等待第一帧再启动，确保 DOM 就绪
  requestAnimationFrame(loop);

  // 暴露调试接口（可选）
  window.LifeBg = { resize, seedRandom, step, draw };
})();
