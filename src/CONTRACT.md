# 编写契约 —— 《神经网络讲义》

你负责写**其中一章**。下面是全部硬性约定,违反任何一条都会被后续校验打回。

---

## 0. 这本书是什么

- 读者:**完全零基础**的成年人。高中数学忘光了也要能读。但不要写哄小孩的话。
- 目标:读完能自己设计、训练一个小网络,并且看懂当代大模型在做什么。
- 风格:像一位耐心的工程师在黑板前讲解。**具体、可验证、有数字**。每引入一个概念,先给直觉,再给公式,再给一个能动手的演示。
- 语言:**简体中文**。术语第一次出现时给英文原名,例如 `梯度(gradient)`。
- 语气:第二人称"你"。不要用"我们"堆砌。不要写"值得注意的是""总而言之""让我们一起"这类填充句。
- 不要emoji。不要用"🚀""✨"这类符号。

## 1. 文件约定

- 一个文件 = 一章 = 一个 `<section class="ch" id="...">` 元素。
- **不要写** `<!doctype>`、`<html>`、`<head>`、`<body>`、`<style>`。只写 section 及其后的一个 `<script>`。
- 允许在 `<script>` 里调用 `defineDemo(id, fn)` 注册交互;不允许任何 DOM 查询写在 script 顶层(只写在 fn 里)。
- 所有 id 全局唯一。演示元素 id 用 `d-<章号>-<短名>`,测验 id 用 `q-<章号>-<序号>`。

这是骨架:

```html
<section class="ch" id="ch-04-mlp" data-num="04" data-title="多层网络">
  <header class="ch-head">
    <div class="ch-eyebrow"><span class="dot"></span>第 04 章 · 核心</div>
    <h1 class="ch-title">多层网络</h1>
    <p class="ch-sub">一句话说清本章要解决的问题,20—40 字。</p>
    <div class="ch-rule"></div>
  </header>

  <p class="lead">开篇 2—4 句。直接给出本章的核心问题,不要铺垫。</p>

  <h3><span class="h3-n">4.1</span>小节标题</h3>
  <p>正文……</p>

  <!-- 演示 -->
  <div class="demo" id="d-04-xor">
    <div class="demo-bar"><span class="live">交互</span><span>隐藏层如何切开异或</span><span class="sp"></span><span class="tag">点一下试试</span></div>
    <div class="demo-body">
      <div class="canvas-wrap"><canvas id="cv-04-xor" height="320"></canvas></div>
      <div class="controls">
        <div class="ctl"><label for="s-04-h">隐藏神经元 <output id="o-04-h">8</output></label>
          <input id="s-04-h" type="range" min="1" max="32" value="8" step="1"></div>
        <button class="btn primary" id="b-04-train">开始训练</button>
      </div>
    </div>
    <div class="demo-hint">一句话说明怎么操作、会看到什么。</div>
  </div>

  <!-- 测验 -->
  <div class="quiz" data-id="q-04-1">
    <p class="q">问题?</p>
    <div class="opts">
      <button class="opt" data-k="A" data-why="为什么错。">错项</button>
      <button class="opt" data-k="B" data-ok data-why="为什么对。">对项</button>
      <button class="opt" data-k="C" data-why="为什么错。">错项</button>
    </div>
    <div class="quiz-fb"></div>
  </div>

  <div class="ch-foot">
    <span class="state" data-state></span>
    <span class="sp"></span>
    <a class="btn" href="#ch-05-backprop">下一章 →</a>
  </div>
</section>

<script>
defineDemo('d-04-xor', function(root){
  // 在这里初始化。root 是整个 .demo 元素。
});
</script>
```

## 2. 可用的 CSS 类(只能用这些,不要自造 style)

正文:`p`、`p.lead`、`h3`(内含 `<span class="h3-n">4.1</span>`)、`h4`、`ul.list`、`ol.list`、`ol.steps`、`strong`、`em`、`code`、`a`

块:

- `<div class="grid-2">` / `grid-3` —— 等分栏,窄屏自动堆叠
- `<div class="card"><div class="card-h">标签</div>…</div>`
- `<div class="callout key"><b>核心</b>…</div>` —— 变体:`key`(核心结论)、`tip`(正确做法)、`warn`(常见错误)
- `<div class="math">…</div>` —— 居中公式,内部用 `<var>` 表示变量;`<div class="math math-note">` 用于左侧注记
- `<div class="code-wrap"><div class="code-bar">python<span class="sp"></span><button class="code-btn">复制</button></div><pre class="code"><code>…</code></pre></div>` —— 复制按钮由核心脚本自动接线,**你只要写这个结构**
- `<div class="stat-row"><div class="stat"><b>12,800</b><span>参数量</span></div></div>`
- `<div class="tbl-wrap"><table>…</table></div>`
- `<details class="fold"><summary>点开看推导</summary><div class="fold-body">…</div></details>`
- `<span class="tag">`、`<span class="pill">`、`<span class="kbd">`

演示面板(必须完整使用这套结构):

```html
<div class="demo" id="d-XX-name">
  <div class="demo-bar"><span class="live">交互</span><span>标题</span><span class="sp"></span><span class="tag">提示</span></div>
  <div class="demo-body">…</div>
  <div class="demo-hint">操作说明</div>
</div>
```

控件:

- `<div class="ctl"><label for="x">标签 <output id="y">值</output></label><input id="x" type="range" …></div>`
- `<button class="btn">`、`<button class="btn primary">`、`<button class="btn sm">`
- `<div class="seg"><button aria-pressed="true">A</button><button aria-pressed="false">B</button></div>`(自己处理点击与 pressed 状态)
- 画布统一包 `<div class="canvas-wrap"><canvas id="…" height="320"></canvas></div>`

测验:见上面骨架。**每个 `.quiz` 必须**有 `data-id`(全局唯一)、恰好一个 `.opt[data-ok]`、每个 opt 都要 `data-why`、`data-k` 用 A/B/C/D。每章至少 2 个。

章末:`<div class="ch-foot"><span class="state" data-state></span><span class="sp"></span><a class="btn" href="#下一章">下一章 →</a></div>`(最后一章换成"回到首页")。

## 3. 可用的 JS API(全部挂在 `window.NN` 或直接全局)

```js
// 画布:自动处理 DPR 与宽度,返回 {ctx, w, h}(逻辑像素)
const {ctx, w, h} = NN.fitCanvas(canvas, height);   // 或直接用 canvas 的高度

// 折线/散点图
const plot = new NN.Plot(canvas, {
  xLabel:'训练步数', yLabel:'损失',
  series:[{name:'训练', color:'--c1', data:[[0,1],[1,.8]]},
          {name:'验证', color:'--c2', data:[[0,1.2],[1,1.1]]}],
  height: 260
});
plot.set({series:[...]});        // 更新数据并重绘
// color 用 '--c1' '--c2' '--c3' '--c4';主题切换会自动重绘

// 横向条形图
NN.barChart(canvas, [{label:'MLP', value:0.82},{label:'CNN',value:0.91, color:'--c2'}], {max:1, height:120});

// 矩阵热力图(权重、注意力、卷积核、图片)
NN.drawMatrix(canvas, {
  data: [[0.1,-0.4],[0.7,0.2]],       // 二维数组
  diverging:true,                      // true 用于有正负的权重;false 用于 0..1 的激活
  rowLabels:['行1','行2'], colLabels:['列1','列2'],
  showVals:true
});

// 网络结构图
NN.drawNet(canvas, {
  sizes:[2,3,1],                       // 每层节点数
  weights:[[[.4,-.2],[.1,.9],[.7,.3]],[[.5,.2,-.6]]], // 可选:第 l 层 [输出][输入]
  showWeights:true,
  activations:[[0.2,0.8],[0.5,0.1,0.9],[0.44]],
  highlight:[1,1],
  height:240
});

// 决策边界(2D 分类器必备)
NN.renderBoundary(canvas, net, {
  points: trainData, bounds:[[-2,2],[-2,2]], height:320, soft:true
});

// 微型神经网络
const net = new NN.MLP([2,16,16,3], {act:'relu', out:'softmax', seed:1});
net.forward([0.3,-0.2]).acts;     // 各层激活值
net.predict([0.3,-0.2]);          // 类别下标(softmax)或标量
net.step(batch, 0.01, {opt:'adam'});   // batch = [{x:[..], y:类别下标}]
net.loss(data); net.accuracy(data); net.clone(); net.paramCount();

// 数据集
const pts = NN.Data.spiral(240, 3, seed);   // 也可 blobs / moons / circle / xor
const {train, test} = NN.Data.split(pts, 0.8, 7);
NN.Data.bounds(pts);

// 动画循环:只在演示可见时触发,自动限帧
const ticker = NN.createTicker(root, function(t){ /* 每帧渲染 */ });
ticker.start(); ticker.stop();

// 其它
NN.toast('训练完成');
NN.clamp(v,a,b); NN.lerp(a,b,t); NN.fmt(v,2);
NN.token('--accent');              // 读当前主题的 CSS 变量
NN.Theme.on(fn);                   // 主题变化后重绘自定义画布
NN.mulberry32(seed)();             // 可复现随机数 0..1
NN.randn(rng);                     // 正态分布
```

注意:
- `new NN.MLP([...], {out:'softmax'})` 用于分类,`{out:'linear'}` 用于回归(输出层 1 个节点)。
- 训练必须在 `requestAnimationFrame` 或 `setInterval` 里分步进行,**不要写 `for` 循环训练几千步**——会冻住页面。每个 tick 训练 1—10 个 batch。
- 主题切换后折线图会自动重绘;你自己用 canvas 画的那些,要 `NN.Theme.on(() => redraw())`。

## 4. 硬性质量要求

每章必须包含:

1. **≥ 1500 中文字**的正文(不含代码)。上限约 3500,别注水。
2. **≥ 2 个可交互演示**,必须是"拖动/点击后画面真的变"的那种,不能是静态图。
3. **≥ 2 个测验**,每个 3—4 个选项,每个错项都要有 `data-why` 解释**错在哪**。
4. **≥ 1 个 `.callout warn`**,讲一个真实存在的常见误解。
5. **≥ 1 段可在本地复现的代码**(PyTorch 或纯 numpy 伪代码),用 `code-wrap` 结构。
6. 章末的下一章链接。

写作要求:

- 每个公式后面用一句普通话解释它在说什么。
- 给具体数字,不给"很多""很大"。例如"这个网络有 13,002 个参数,在 600 个样本上训练 200 步"。
- 演示的初始状态必须有内容(预先画好一个训练到一半的模型),不能是一块空白等用户点。
- 术语首次出现给出英文,并加入 `code` 或括注。

## 5. 禁止事项

- 禁止 `<style>`、`style="..."` 内联样式、`<link>`、`<script src>`、`fetch`、`import`。
- 禁止 `alert`/`confirm`/`prompt`、`document.write`、`localStorage`(进度由核心脚本管)。
- 禁止 emoji、禁止 `<img src="http...">`(如需图片,用 canvas 画)。
- 禁止在 `document` 上做全局查询(如 `document.querySelector('#x')`)——只在传入的 `root` 内查。
- 不要在 script 顶层执行任何 DOM 操作;只调用 `defineDemo(...)`。
- 不要修改核心文件,只写自己的 `parts/*.html`。

## 6. 手机宽度

演示区在 400px 宽时必须可用。宽表格自己放进 `.tbl-wrap`;画布宽度自适应;控件用 `flex-wrap`(`.controls` 已经处理)。不要固定像素宽度超过 360。

## 7. 校验清单(提交前自己过一遍)

- [ ] section 的 `id` / `data-num` / `data-title` 与分配给你的一致
- [ ] 所有 `class` 都在第 2 节清单里
- [ ] 每个 `.demo` 有 id,且对应 `defineDemo(id, fn)` 存在,id 完全一致
- [ ] 每个 `.quiz` 有唯一 `data-id`、恰好一个 `data-ok`
- [ ] 没有 `<style>`、没有内联 style、没有外部资源
- [ ] script 里没有顶层 DOM 访问
- [ ] 演示在首次显示时能自己跑起来
