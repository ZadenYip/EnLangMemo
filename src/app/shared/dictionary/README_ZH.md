# 字典

字典的窗口实现是用一个在根元素下添加字典对应的元素实现的，这样子所有组件/section都可以访问到字典组件。
```app.component.html
...其他内容
  <main class="main-content">
      <router-outlet></router-outlet>
    <app-dictionary></app-dictionary>
  </main>
```
