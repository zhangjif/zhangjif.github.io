/**
 * 公共脚本：音乐、导航、页脚年份
 * 被 index / blog / post / admin 页面共享
 * 动态背景由 life-bg.js 负责
 */
(function () {
  const cfg = window.CONFIG || {};
  const bg = cfg.background || {};

  // ===== 导航名称 =====
  const navName = document.getElementById("nav-name");
  if (navName && cfg.profile && cfg.profile.name) {
    navName.textContent = cfg.profile.name;
  }

  // ===== 页脚年份 =====
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== 背景音乐播放器 =====
  const bgmPlayer = document.getElementById("bgm-player");
  const bgmToggle = document.getElementById("bgm-toggle");
  if (bg.music && bgmPlayer && bgmToggle) {
    const audio = new Audio(bg.music);
    audio.volume = bg.musicVolume != null ? bg.musicVolume : 0.4;
    audio.loop = !!bg.musicLoop;

    let isPlaying = false;
    const setPlaying = (state) => {
      isPlaying = state;
      bgmToggle.classList.toggle("playing", state);
    };

    bgmToggle.addEventListener("click", () => {
      if (isPlaying) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play().then(() => setPlaying(true)).catch(() => {
          alert("浏览器阻止了自动播放，请再次点击播放按钮。");
        });
      }
    });

    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("ended", () => { if (!audio.loop) setPlaying(false); });

    // 尝试自动播放（多数浏览器会被拦截，需用户交互）
    if (bg.musicAutoplay) {
      const tryAutoplay = () => {
        audio.play().then(() => setPlaying(true)).catch(() => {
          // 首次交互时再尝试
          const resume = () => {
            audio.play().then(() => setPlaying(true)).catch(() => {});
            document.removeEventListener("click", resume);
            document.removeEventListener("keydown", resume);
          };
          document.addEventListener("click", resume, { once: true });
          document.addEventListener("keydown", resume, { once: true });
        });
      };
      tryAutoplay();
    }
  } else if (bgmPlayer) {
    // 未配置音乐则隐藏播放器
    bgmPlayer.style.display = "none";
  }
})();
