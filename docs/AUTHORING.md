# 写作与改动指南

这一页回答两个问题:怎么改已有的一章,怎么加新的一章。硬性契约在 [src/CONTRACT.md](../src/CONTRACT.md),这里给的是流程和例子。

---

## 一、一章的文件长什么样

`parts/06-train.html` 的结构:

```html
<section class="ch" id="ch-06-train" data-num="06" data-title="训练循环">
  <header class="ch-head">
    <div class="ch-eyebrow"><span class="dot"></span>第 06 章 · 核心</div>
    <h1 class="ch-title">训练循环</h1>
    <p class="ch-sub">一句话副标题。</p>
    <div class="ch-rule"></div>
  </header>

  <div class="prereq">
    <b>读前</b><span>第 3 章的梯度、第 4 章的隐藏层</span>
    <b>可跳过</b><span>6.9 的 PyTorch 代码块</span>
  </div>

  <p class="lead">开篇 2—4 句,直接给问题。</p>

  <h3><span class="h3-n">6.1</span>小节标题</h3>
  <p>正文……</p>

  <!-- 演示 -->
  <div class="demo" id="d-06-race">
    <div class="demo-bar"><span class="live">交互</span><span>三种优化器赛跑</span><span class="sp"></span><span class="tag">实时训练</span></div>
    <div class="demo-body">
      <div class="canvas-wrap"><canvas id="cv-06-race"></canvas></div>
      <div class="controls">
        <div class="ctl"><label for="s-06-lr">学习率 <output id="o-06-lr">0.05</output></label>
          <input id="s-06-lr" type="range" min="0.001" max="0.5" step="0.001" value="0.05"></div>
        <button class="btn primary" id="b-06-run">开始</button>
      </div>
    </div>
    <div class="demo-hint">三张图是同一份数据、同一初始权重,只有优化器不同。</div>
  </div>

  <!-- 测验 -->
  <div class="quiz" data-id="q-06-1">
    <p class="q">问题?</p>
    <div class="opts">
      <button class="opt" data-k="A" data-why="错在哪。">错项</button>
      <button class="opt" data-k="B" data-ok data-why="对在哪。">对项</button>
      <button class="opt" data-k="C" data-why="错在哪。">错项</button>
    </div>
    <div class="quiz-fb"></div>
  </div>

  <div class="ch-foot">
    <span class="state" data-state></span><span class="sp"></span>
    <a class="btn" href="#ch-07-generalize">下一章 →</a>
  </div>
</section>

<script>
defineDemo('d-06-race', function (root) {
  const { ctx, w, h } = NN.fitCanvas(root.querySelector('#cv-06-race'), 300);
  const plot = new NN.Plot(root.querySelector('#cv-06-race'), {
    xLabel: '步数', yLabel: '损失',
    series: [{ name: '训练', color: '--c1', data: [] }]
  });
  const ticker = NN.createTicker(root, function () { /* 每帧一步 */ });
  ticker.start();
});
</script>
```

要点:

- 一个文件 = 一个 `<section>`,后面跟一个 `<script>`
- `<script>` 里**只允许**调用 `defineDemo`,不许有任何顶层 DOM 操作
- 演示的 id(`d-06-race`)和 `defineDemo` 的第一个参数必须逐字一致
- 每个 `.quiz` 要有全局唯一的 `data-id`,恰好一个 `.opt[data-ok]`,每个选项都要有 `data-why`

---

## 二、可用的 CSS

不要自造 class,也不要写 `<style>` 或内联 style。清单在 [src/CONTRACT.md](../src/CONTRACT.md) 第 2 节,常用的有:

| 用途 | 写法 |
|---|---|
| 开篇 | `<p class="lead">` |
| 小节 | `<h3><span class="h3-n">6.1</span>标题</h3>` |
| 两栏 / 三栏 | `<div class="grid-2">` / `grid-3` |
| 卡片 | `<div class="card"><div class="card-h">标签</div>…</div>` |
| 提示块 | `<div class="callout key|tip|warn"><b>标题</b>…</div>` |
| 公式 | `<div class="math">…</div>`,变量用 `<var>` |
| 代码 | `<div class="code-wrap"><div class="code-bar">python<span class="sp"></span><button class="code-btn">复制</button></div><pre class="code"><code>…</code></pre></div>` |
| 表格 | `<div class="tbl-wrap"><table>…</table></div>` |
| 折叠 | `<details class="fold"><summary>…</summary><div class="fold-body">…</div></details>` |
| 前置标注 | `<div class="prereq"><b>读前</b><span>…</span><b>可跳过</b><span>…</span></div>` |

`check.mjs` 会扫描所有 `class="…"`,不在清单里的会报出来。

---

## 三、写一个演示

### 训练类的标准写法

```js
defineDemo('d-XX-name', function (root) {
  const net = new NN.MLP([2, 16, 16, 3], { act: 'relu', out: 'softmax', seed: 7 });
  const data = NN.Data.spiral(240, 3, 5);
  const { train, test } = NN.Data.split(data, 0.8, 3);

  const ticker = NN.createTicker(root, function () {
    for (let i = 0; i < 4; i++) {
      const batch = [];
      for (let k = 0; k < 32; k++) batch.push(train[(Math.random() * train.length) | 0]);
      net.step(batch, 0.03, { opt: 'adam' });
    }
    // 每帧重绘一次,不要每步都重绘
    NN.renderBoundary(cv, net, { points: data, bounds: bounds, res: 44 });
  });
  ticker.start();
});
```

规则:

- **绝不**在 `fn` 里写 `for (let i = 0; i < 5000; i++)` 训练——会冻住页面
- 每帧做的事要能在 16 ms 内跑完(实测数据见 README 的性能表)
- 演示的初始状态必须有内容:预训练一段、预置数据、预置曲线,不要给一块空白
- 主题切换后自己画的 canvas 要 `NN.Theme.on(redraw)` 重绘;`NN.Plot` 会自动重绘

### 常用 API

```js
NN.MLP(sizes, {act, out, seed})   net.forward(x) / predict(x) / step(batch, lr, {opt}) / loss(data) / accuracy(data)
NN.Plot(canvas, {series, xLabel, yLabel, height})   plot.set({series})
NN.drawMatrix(canvas, {data, diverging, rowLabels, colLabels, showVals})
NN.drawNet(canvas, {sizes, weights, activations, highlight})
NN.renderBoundary(canvas, net, {points, bounds, res, soft})
NN.barChart(canvas, [{label, value, color}], {max, height})
NN.createTicker(root, fn)   ticker.start() / stop()
NN.Data.spiral(n, k, seed) / blobs / moons / circle / xor    NN.Data.split(points, ratio, seed)
NN.theme/token/toast/fmt/clamp
```

完整签名见 [docs/ARCHITECTURE.md](ARCHITECTURE.md) 第三节。

---

## 四、加一章

1. 在 `parts/` 新建文件,文件名要让字典序落在正确位置,例如 `15-agents.html`
2. 写 `<section class="ch" id="ch-15-agents" data-num="15" data-title="智能体">`
3. 在 `src/top.html` 的侧栏加一行导航:

```html
<a class="nav-link" href="#ch-15-agents" data-ch="ch-15-agents">
  <span class="nav-num">15</span><span class="nav-title">智能体</span>
  <svg class="nav-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 13 4 4L19 7"/></svg>
</a>
```

4. 在 `src/end.html` 的 `BADGES` 里加一个徽章(可省略,但不加就没有完成提示)
5. 上一章的 `.ch-foot` 链接指向它
6. `node build.mjs && node check.mjs`

---

## 五、自检清单

提交前过一遍:

- [ ] `node check.mjs` 输出 0 个语法错误、无重复 id、无"演示未注册"
- [ ] 每章至少 2 个演示、2 个测验
- [ ] 每个演示的初始状态有内容,不是空白
- [ ] 新增的术语首次出现给了中文读法与英文名
- [ ] 本章开头有 `read前 / 可跳过` 标注
- [ ] 跨章引用(如"第 9 章会讲到")指向的章节确实讲了
- [ ] 没有 `<style>`、内联 style、外部资源、`alert`、`localStorage`
- [ ] `parts/` 里没有 `.tmp.html`、`_*.txt` 之类的临时文件

---

## 六、这个项目真实踩过的坑

写这一节是因为它们都发生过,而且大多不是靠"小心"能避免的:

| 坑 | 后果 | 怎么防 |
|---|---|---|
| 智能体在 `parts/` 留下 `00body.tmp.html` | 构建把临时文件当章节,18 章变 20 章,id 全重复 | 构建只收 `.html` 但不过滤命名;人工检查 `ls parts/` |
| 章节脚本在顶层访问 DOM | 元素还没创建,整章脚本报错 | 只在 `defineDemo` 回调里查 DOM,且用传入的 `root` |
| 演示 id 与 `defineDemo` 差一个字符 | 演示永远不启动,而且没有任何报错 | `check.mjs` 会列出未注册的演示 |
| 修一章时删掉了"重复"内容 | 两章都缺一块,读者读到断层 | 修之前先确认删的是真重复,还是别的章节的引用来源 |
| 跨章引用写死小节号 | 改版后指向不存在的小节 | 改章节结构时全局搜"第 X 章"和数字小节号 |
| 在 `.demo` 里用固定像素宽 | 手机端横向溢出 | 画布一律放进 `.canvas-wrap`,宽度自适应 |
