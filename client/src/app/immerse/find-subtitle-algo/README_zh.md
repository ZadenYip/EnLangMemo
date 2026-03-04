# 字幕模块部分

## 视频播放时高亮对应字幕

决定哪个字幕的高亮的算法在 SubtitleManager 的 nextSubtitleIds 方法。查找的算法结合了线性扫描和区间树，根据 B+ 树启发来的思路设计出来的。

### 数据结构

SubtitleManager 维护了 3 个数据结构进行查找要高亮的字幕：
1. subtitleList: 按照字幕的开始时间排序的字幕数组
2. subtitleTree: 区间树，存储了字幕的开始时间和结束时间区间
3. nextActiveIndex: 下一个可能高亮字幕在 subtitleList 中的索引

### 算法

先根据 nextActiveIndex 获取下一个可能高亮的字幕
1. 如果没有下一个字幕了，返回空集合。
2. 如果当前视频时间已经超过了 nextActiveIndex 指向的字幕时间区间了，则使用区间树查找任意一个覆盖当前时间的字幕，利用该字幕的 ID 进行线性扫描，找到所有覆盖当前时间的字幕 ID。
