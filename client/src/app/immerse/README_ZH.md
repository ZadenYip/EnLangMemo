# 结构

组件结构如下：

```
ImmerseComponent
  ├── SubtitlePanel
  │     ├── SubtitleItemComponent
  │     ├── SubtitleItemComponent
  │     └── ...
  └── VideoComponent
```

# SubtitleService 与 SubtitleManager

SubtitleService 和 SubtitleManager 负责字幕数据的管理与处理。

## SubtitleService

SubtitleService 主要功能如下：

1. 给主进程输入字幕文件路径，流式返回字幕数据存进 SubtitleManager。对应函数是 loadSubtitles()
2. 接受 VideoComponent 的视频播放时间更新的时间传递给 SubtitleManager 获取下一组应该高亮的字幕ID。对应函数是 nextSubtitleIds()
3. 通过 activeIDs signal 提供给 SubtitlePanel 获取当前高亮字幕 ID 列表

## SubtitleManager

SubtitleManager 本质就是一个数据结构，对外主要功能如下：

1. 给 SubtitleSerivice 提供其从主进程加载完字幕后将字幕进行 add 进行管理
2. 获取下一组应该高亮的 SubtitleItem 的 ID 以便 SubtitleService 进行高亮