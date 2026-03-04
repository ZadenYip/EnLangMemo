# Dictionary 窗口拖拽与缩放实现说明

本文档详细解释词典浮窗组件（`DictionaryComponent`）如何实现窗口的拖拽移动和缩放功能。

---

## 一、整体概述

词典窗口是一个可以自由拖拽移动、自由缩放大小的浮动窗口。用户可以：

1. **拖拽顶部工具栏**来移动窗口位置
2. **拖拽右下角手柄**来调整窗口大小
3. 窗口始终被限制在屏幕可见区域内，不会跑到屏幕外面
4. **拖拽和缩放操作互斥**，防止冲突

---

## 二、核心状态变量

在 `dictionary.component.ts` 中，有以下关键状态：

```typescript
// 窗口左上角坐标（相对于视口）
readonly windowPosition = signal({ left: 24, top: 24 });
// 窗口尺寸（宽高，单位：像素）
readonly windowSize = signal({ width: 960, height: 640 });

// 约束常量
private readonly minWindowWidth = 620;   // 窗口最小宽度
private readonly minWindowHeight = 420;  // 窗口最小高度

// 交互状态标记
private isDragging = false;   // 是否正在拖拽
private isResizing = false;   // 是否正在缩放

// 拖拽起始快照
private dragStartPointerX = 0;
private dragStartPointerY = 0;
private dragStartLeft = 0;
private dragStartTop = 0;

// 缩放起始快照
private resizeStartPointerX = 0;
private resizeStartPointerY = 0;
private resizeStartWidth = 0;
private resizeStartHeight = 0;
private resizeStartLeft = 0;
private resizeStartTop = 0;
```

---

## 三、模板绑定

在 `dictionary.component.html` 中，窗口根节点直接绑定位置和尺寸：

```html
<div
  #dictionaryWindow
  class="dictionary-page"
  [style.left.px]="windowPosition().left"
  [style.top.px]="windowPosition().top"
  [style.width.px]="windowSize().width"
  [style.height.px]="windowSize().height"
>
```

拖拽区域（顶部工具栏）：
```html
<div class="dictionary-window-toolbar" (pointerdown)="onWindowDragStart($event)">
```

缩放手柄（右下角）：
```html
<div class="window-resize-handle" (pointerdown)="onResizeStart($event)"></div>
```

---

## 四、拖拽流程详解（从点击到松开）

### 第一步：用户按下鼠标（触发 `onWindowDragStart`）

当用户在顶部工具栏按下鼠标左键时，触发 `onWindowDragStart(event)` 函数：

```typescript
onWindowDragStart(event: PointerEvent): void {
    // 1. 如果正在缩放，不启动拖拽（互斥保护）
    if (this.isResizing) {
        return;
    }

    // 2. 只响应鼠标左键
    if (event.button !== 0) {
        return;
    }

    // 3. 如果点击的是按钮（如关闭按钮），不触发拖拽
    const target = event.target as HTMLElement | null;
    if (target?.closest('button')) {
        return;
    }

    // 4. 阻止默认拖拽行为（如文本选择）
    event.preventDefault();
    
    // 5. 进入拖拽模式并记录起始状态
    this.isDragging = true;
    this.dragStartPointerX = event.clientX;
    this.dragStartPointerY = event.clientY;
    this.dragStartLeft = this.windowPosition().left;
    this.dragStartTop = this.windowPosition().top;
}
```

**关键改进**：增加了 `isResizing` 检查，确保缩放和拖拽操作互斥。

### 第二步：用户移动鼠标（触发 `onPointerMove`）

`onPointerMove` 方法优先处理缩放，使用提前返回避免同时触发拖拽：

```typescript
@HostListener('document:pointermove', ['$event'])
onPointerMove(event: PointerEvent): void {
    // 如果正在缩放，处理完后直接返回，不执行拖拽
    if (this.handleResizeMove(event)) {
        return;
    }
    this.handleDragMove(event);
}
```

拖拽移动由 `handleDragMove` 处理：

```typescript
private handleDragMove(event: PointerEvent): void {
    if (!this.isDragging) {
        return;
    }

    // 1. 计算鼠标移动的距离
    const deltaX = event.clientX - this.dragStartPointerX;
    const deltaY = event.clientY - this.dragStartPointerY;
    
    // 2. 计算新位置并限制在视口范围内
    const nextPosition = this.clampPositionToViewport({
        left: this.dragStartLeft + deltaX,
        top: this.dragStartTop + deltaY,
    });
    
    // 3. 更新窗口位置
    this.windowPosition.set(nextPosition);
}
```

**作用**：实时计算新位置并更新窗口，同时确保窗口不会被拖出屏幕。

### 第三步：用户松开鼠标（触发 `onPointerUp`）

```typescript
@HostListener('document:pointerup')
onPointerUp(): void {
    this.isDragging = false;
    this.isResizing = false;
}
```

**作用**：同时重置拖拽和缩放状态，确保状态干净。

---

## 五、缩放流程详解（从点击到松开）

### 第一步：用户按下缩放手柄（触发 `onResizeStart`）

```typescript
onResizeStart(event: PointerEvent): void {
    // 1. 只响应鼠标左键
    if (event.button !== 0) {
        return;
    }

    // 2. 先规范化当前窗口状态（防止第一帧跳动）
    this.normalizeWindowBounds();
    
    // 3. 阻止默认行为和事件冒泡
    event.preventDefault();
    event.stopPropagation();
    
    // 4. 进入缩放模式并记录起始状态
    this.isResizing = true;
    this.resizeStartPointerX = event.clientX;
    this.resizeStartPointerY = event.clientY;
    this.resizeStartWidth = this.windowSize().width;
    this.resizeStartHeight = this.windowSize().height;
    this.resizeStartLeft = this.windowPosition().left;
    this.resizeStartTop = this.windowPosition().top;
}
```

**关键点**：调用 `event.stopPropagation()` 防止事件冒泡到工具栏触发拖拽。

### 第二步：用户移动鼠标（触发 `handleResizeMove`）

```typescript
private handleResizeMove(event: PointerEvent): boolean {
    if (!this.isResizing) {
        return false;
    }
    
    // 1. 计算鼠标移动的距离
    const deltaX = event.clientX - this.resizeStartPointerX;
    const deltaY = event.clientY - this.resizeStartPointerY;
    
    // 2. 获取视口尺寸（使用 clientWidth/Height 不包含滚动条）
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // 3. 计算允许的最大尺寸（基于起始位置，不能超出屏幕）
    const maxWidth = Math.max(
        this.minWindowWidth,
        viewportWidth - this.resizeStartLeft,
    );
    const maxHeight = Math.max(
        this.minWindowHeight,
        viewportHeight - this.resizeStartTop,
    );
    
    // 4. 计算新尺寸并限制在 [最小值, 最大值] 范围内
    const nextSize = {
        width: Math.min(
            Math.max(this.resizeStartWidth + deltaX, this.minWindowWidth),
            maxWidth,
        ),
        height: Math.min(
            Math.max(this.resizeStartHeight + deltaY, this.minWindowHeight),
            maxHeight,
        ),
    };
    
    // 5. 更新窗口尺寸
    this.windowSize.set(nextSize);
    return true;  // 返回 true 表示已处理缩放
}
```

**关键改进**：
- 返回 `boolean` 值，让 `onPointerMove` 知道是否已处理缩放
- 使用 `document.documentElement.clientWidth/Height` 获取不含滚动条的视口尺寸
- 最大尺寸计算使用 `Math.max()` 确保至少为最小窗口尺寸

### 第三步：用户松开鼠标（触发 `onPointerUp`）

同拖拽流程，`isResizing` 被重置为 `false`。

---

## 六、边界约束函数

### `clampPositionToViewport(position)`

**作用**：限制窗口位置，确保整个窗口都在屏幕可见区域内。

```typescript
private clampPositionToViewport(position: { left: number; top: number }): {
    left: number;
    top: number;
} {
    const size = this.windowSize();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    
    // 计算允许的最大 left/top 值（窗口不能超出右下边界）
    const maxLeft = Math.max(0, viewportWidth - size.width);
    const maxTop = Math.max(0, viewportHeight - size.height);
    
    return {
        left: Math.min(Math.max(position.left, 0), maxLeft),
        top: Math.min(Math.max(position.top, 0), maxTop),
    };
}
```

**说明**：使用 `document.documentElement.clientWidth/Height` 而不是 `window.innerWidth/Height`，因为前者不包含滚动条宽度，计算更精确。

### `clampSizeToViewport(size)`

**作用**：限制窗口尺寸，确保不小于最小宽高，也不超过从当前位置到屏幕边缘的可用空间。

```typescript
private clampSizeToViewport(size: { width: number; height: number }): {
    width: number;
    height: number;
} {
    const position = this.windowPosition();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    
    const maxWidth = Math.max(
        this.minWindowWidth,
        viewportWidth - position.left,
    );
    const maxHeight = Math.max(
        this.minWindowHeight,
        viewportHeight - position.top,
    );

    return {
        width: Math.min(
            Math.max(size.width, this.minWindowWidth),
            maxWidth,
        ),
        height: Math.min(
            Math.max(size.height, this.minWindowHeight),
            maxHeight,
        ),
    };
}
```

### `normalizeWindowBounds()`

**作用**：统一规范化入口，**先调整尺寸，再调整位置**（顺序很重要）。

```typescript
private normalizeWindowBounds(): void {
    if (!this.dictionaryWindow()) {
        return;
    }
    // 先规范尺寸，因为位置计算依赖于尺寸
    this.windowSize.set(this.clampSizeToViewport(this.windowSize()));
    this.windowPosition.set(
        this.clampPositionToViewport(this.windowPosition()),
    );
}
```

**触发时机**：
- 组件初始化后（`ngAfterViewInit`）
- 开始缩放前（`onResizeStart`）
- 浏览器窗口尺寸变化时（`onWindowResize`）

---

## 七、初始化流程

```typescript
ngAfterViewInit(): void {
    const windowRef = this.dictionaryWindow();
    if (!windowRef) {
        return;
    }
    
    // 读取初始渲染后的实际位置和尺寸
    const rect = windowRef.nativeElement.getBoundingClientRect();
    this.windowPosition.set({
        left: rect.left,
        top: rect.top,
    });
    this.windowSize.set({
        width: rect.width,
        height: rect.height,
    });
    
    // 确保初始状态符合约束
    this.normalizeWindowBounds();
}
```

**作用**：将 CSS 渲染的初始状态同步到响应式信号中，确保后续操作基于正确的初始值。

---

## 八、流程图总结

```
┌─────────────────────────────────────────────────────────────────┐
│                          拖拽流程                                │
├─────────────────────────────────────────────────────────────────┤
│  用户按下工具栏                                                  │
│      ↓                                                          │
│  onWindowDragStart()                                            │
│    ├─ 检查 isResizing（互斥保护）                                │
│    ├─ 检查是否为左键点击                                         │
│    ├─ 检查是否点击按钮                                           │
│    └─ 记录起始位置 → isDragging = true                          │
│      ↓                                                          │
│  用户移动鼠标                                                    │
│      ↓                                                          │
│  onPointerMove()                                                │
│    ├─ handleResizeMove() → 返回 false（未缩放）                  │
│    └─ handleDragMove()                                          │
│        └─ 计算位移 → clampPositionToViewport → 更新位置         │
│      ↓                                                          │
│  用户松开鼠标                                                    │
│      ↓                                                          │
│  onPointerUp() → isDragging = false                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          缩放流程                                │
├─────────────────────────────────────────────────────────────────┤
│  用户按下右下角手柄                                              │
│      ↓                                                          │
│  onResizeStart()                                                │
│    ├─ normalizeWindowBounds()（规范化状态）                      │
│    ├─ stopPropagation()（防止触发拖拽）                          │
│    └─ 记录起始尺寸和位置 → isResizing = true                    │
│      ↓                                                          │
│  用户移动鼠标                                                    │
│      ↓                                                          │
│  onPointerMove()                                                │
│    └─ handleResizeMove() → 返回 true（已处理，跳过拖拽）         │
│        └─ 计算位移 → clamp尺寸 → 更新 windowSize                │
│      ↓                                                          │
│  用户松开鼠标                                                    │
│      ↓                                                          │
│  onPointerUp() → isResizing = false                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 九、CSS 关键点

```scss
.dictionary-page {
  position: fixed;        // 固定定位，脱离文档流
  // left/top/width/height 由 Angular 动态绑定
  overflow: hidden;       // 防止缩放时出现滚动条
}

.window-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: se-resize;      // 显示东南方向缩放光标
}
```

---

## 十、常见问题

### Q: 为什么缩放时窗口会跳动？

**原因**：缩放起点和当前状态不一致，或窗口本身已越界。

**解决**：在 `onResizeStart` 开始前先调用 `normalizeWindowBounds()` 规范化状态。

### Q: 为什么窗口会跑出屏幕？

**检查**：
1. `handleDragMove` 是否调用了 `clampPositionToViewport`
2. `onWindowResize` 是否调用了 `normalizeWindowBounds()`

### Q: 为什么拖拽和缩放会同时触发？

**解决方案**：
1. `onResizeStart` 中调用 `event.stopPropagation()` 阻止事件冒泡
2. `onWindowDragStart` 中检查 `this.isResizing` 状态，如果正在缩放则不启动拖拽
3. `onPointerMove` 中 `handleResizeMove()` 返回 `true` 后提前返回，不执行拖拽

### Q: 为什么用 `document.documentElement.clientWidth` 而不是 `window.innerWidth`？

**原因**：
- `window.innerWidth` 包含滚动条宽度
- `document.documentElement.clientWidth` 只包含内容区域宽度（不含滚动条）
- 对于浮窗布局，使用 `clientWidth` 更精确，避免窗口被滚动条遮挡

### Q: 为什么 `handleResizeMove` 返回 boolean？

**原因**：让 `onPointerMove` 知道缩放是否已处理。如果返回 `true`，则跳过拖拽逻辑，实现互斥效果。

