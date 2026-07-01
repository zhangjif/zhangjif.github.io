# 视频博客示例

这是一篇带有视频内容的博客文章。页面顶部会显示视频播放器，支持播放控制。

## 使用说明

在 `js/config.js` 中这样配置视频文章：

```javascript
{
  id: "video-post-demo",
  title: "视频博客示例",
  date: "2024-06-15",
  type: "video",
  summary: "这是一篇带有视频内容的博客文章示例。",
  content: "assets/posts/video-demo.md",
  video: "assets/posts/video-demo.mp4"
}
```

把你的视频文件（如 `video-demo.mp4`）放到 `assets/posts/` 目录下即可。

## 适用场景

- 研究成果演示
- 算法可视化
- 教程视频
- 项目展示

## 混合内容

如果你想在一篇文章中同时包含语音和视频，将 `type` 设为 `mixed`，并同时填写 `audio` 和 `video` 字段：

```javascript
{
  id: "mixed-post",
  title: "混合内容示例",
  type: "mixed",
  content: "assets/posts/mixed.md",
  audio: "assets/posts/audio.mp3",
  video: "assets/posts/video.mp4"
}
```

> 提示：请将示例中的 `video-demo.mp4` 替换为你自己的视频文件。
