# 语音博客示例

这是一篇带有语音内容的博客文章。页面顶部会显示音频播放器，你可以点击播放收听。

## 使用说明

在 `js/config.js` 中这样配置语音文章：

```javascript
{
  id: "audio-post-demo",
  title: "语音博客示例",
  date: "2024-06-10",
  type: "audio",
  summary: "这是一篇带有语音内容的博客文章示例。",
  content: "assets/posts/audio-demo.md",
  audio: "assets/posts/audio-demo.mp3"
}
```

把你的语音文件（如 `audio-demo.mp3`）放到 `assets/posts/` 目录下即可。

## 适用场景

- 播客记录
- 演讲录音
- 语音笔记
- 访谈音频

> 提示：请将示例中的 `audio-demo.mp3` 替换为你自己的音频文件。
