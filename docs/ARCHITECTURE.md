# 架构说明

成品是一个自包含的 HTML 文件。没有框架、没有打包器、没有第三方 JS 依赖。这一页讲清楚它由哪几块拼成、运行时怎么工作、有哪些坑。

---

## 一、构建管线

```
src/head.html ─┐
src/top.html  ─┼─ build.mjs ─→ index.html
parts/*.html  ─┤
src/end.html  ─┘
```

`build.mjs` 做的事:

1. 读 `src/head.html`,按 `<style>` 切成两半:一半是 `<title>`/`<meta>`/字体 `<link>`,一半是 CSS
2. 读 `src/top.html`(外壳:`<div class="app">`、顶栏、侧栏、`<main id="content">`、演示注册桩)
3. 按**文件名排序**读 `parts/*.html`,用 `\n\n` 拼接
4. 读 `src/end.html`(核心运行时 + 收尾标签)
5. 包进 `<!doctype html><html><head>…</head><body>…</body></html>`

输出只有一个文件。构建是确定性的:同样的输入逐字节产出同样的输出,所以 `git diff` 能真实反映内容改动。

**注意:排序是字典序**。`00-start.html` < `00s-symbols.html` < `01-neuron.html` < … < `ap-a-math.html`。新增章节时文件名必须落在这个序列的正确位置。

---

## 二、页面骨架

```
body
└── .app
    ├── header.topbar        品牌、进度条、主题按钮、手机端菜单按钮
    ├── .shell (grid 两列)
    │   ├── aside.sidebar    章节导航(手机端变抽屉)
    │   ├── .scrim           手机端遮罩(桌面端 display:none)
    │   └── main#content
    │       ├── 19 个 <section class="ch">   同一时刻只有一个可见
    │       └── <script>     每个章节自带的演示注册
    └── footer.foot
```

桌面端 `.shell` 是 `268px minmax(0,1fr)` 双列;≤960px 时侧栏变成 `position:fixed` 的抽屉,主内容单列。

> 踩过的坑:`.scrim` 如果不是 `display:none`,它会作为 grid 子元素占掉第二列,把 `<main>` 挤进隐式的第三列、推到视口外。桌面端正文整块消失、手机端反而正常,就是这个原因。

---

## 三、运行时模块(都在 `src/end.html` 的一个 IIFE 里)

| 模块 | 提供什么 |
|---|---|
| 工具 | `$` `$$` `clamp` `lerp` `fmt` `cssVar` `token` `mulberry32` `randn` `hexToRgb` `mix` `rgba` `fitCanvas` `el` |
| `Theme` | 读/写 `data-theme`,`localStorage` 键 `nn-theme`,`on(fn)` 订阅,切换后广播 |
| `Plot` | 折线/散点,自动取范围、nice ticks、图例、终点直标、悬停十字线与提示框;`ResizeObserver` 自适应;DPR 上限 2 |
| `barChart` | 横向条形图 |
| `drawMatrix` | 二维热力图,支持顺序色与发散色(权重有正负时用发散) |
| `drawNet` | 网络结构图,边宽按权重绝对值、正负分色 |
| `renderBoundary` | 2D 决策边界:离屏 canvas 逐格前向再放大,叠加数据点 |
| `MLP` | 前向 / 反向传播 / SGD / 动量 / Adam / `clone` / `accuracy` / `loss` / `paramCount` |
| `Data` | `spiral` `blobs` `moons` `circle` `xor` `split` `bounds` |
| 演示注册 | `defineDemo(id, fn)` + `initDemos(scope)` |
| `createTicker` | rAF 循环:页面隐藏或元素不可见时自动跳过 |
| 进度 | `State`、`loadState`/`saveState`、`BADGES`、`refreshProgress` |
| 测验 | `initQuiz` 事件委托与判分 |
| 路由 | `SECTIONS`、`showSection`、`hashchange` |
| 启动 | `boot(hotData)`,兼容 `window.claude.hot` 热更新 |

全部通过 `window.NN` 暴露给章节脚本。

### `NN.MLP` 的实现要点

- 权重用 `Float64Array`,He 初始化(`sqrt(2/fan_in)`),种子可复现
- 前向缓存每层的 `z` 与激活 `a`,反向直接用
- 最后一层把损失导数折进 δ:softmax+交叉熵时 `δ = p − y`,线性+MSE 时 `δ = a − t`
- 隐层反向:`δ = (Wᵀδ_next) ⊙ act'(z)`
- 优化器状态每个参数一份,切换优化器时重置
- 支持批量:对一个 batch 累加梯度后除以 batch size 再更新

已知简化:没有权重衰减、没有 dropout、没有批量归一化——这些概念在正文里讲,但没有在引擎里实现,避免演示代码复杂化。

---

## 四、路由与进度

**路由**只用 `location.hash` 的纯 `#id` 形式:

```
#ch-04-mlp → showSection('ch-04-mlp')
```

`showSection` 做五件事:隐藏其余 section、显示目标、初始化该章的演示(只做一次)、更新侧栏高亮、滚回顶部。滚回顶部会重复一次(`requestAnimationFrame` 里再滚一次),因为浏览器的原生锚点滚动可能发生在处理函数之后,把标题顶到吸附顶栏底下。

**进度**的判定很直接:一章里**所有** `.quiz[data-id]` 都答对过,这一章就算完成。状态存 `localStorage` 的 `nn-course-v1`:

```json
{"quiz":{"q-04-1":true},"chapters":{"ch-04-mlp":true},"badges":{}}
```

完成时弹 toast、点亮徽章、更新顶栏进度条。`localStorage` 读写全部包在 try/catch 里,隐私模式下失败也不影响使用。

---

## 五、演示的生命周期

1. `src/top.html` 在章节之前定义了注册桩:`window.DEMOS = {}` 和 `window.defineDemo`
2. 每个章节文件末尾的 `<script>` 在解析时调用 `defineDemo('d-04-xor', fn)`,**只注册不执行**
3. 首次切到该章时 `initDemos` 调用对应 `fn(root)`,`root` 是那个 `.demo` 元素
4. `fn` 里通常创建 `Plot` 或 canvas,并启动一个 `createTicker`
5. 单个演示抛错不会影响其他:异常被捕获,面板里追加一行"这个演示没能启动",正文照常显示

**为什么演示要懒加载**:19 章全在 DOM 里,如果一次性初始化,首屏要跑几十个 canvas 和训练循环。

---

## 六、性能预算

- 一次只渲染一章,其余 `hidden`(display:none),布局和绘制成本只算当前章
- 演示首次进入才初始化
- 训练在 rAF 里分步,每帧 1—10 步
- `createTicker` 在 `document.hidden` 或元素 `offsetParent === null` 时跳过计算
- canvas 的 DPR 上限锁 2,避免 4K 屏上 4 倍像素
- 决策边界默认 44×44 格;超过 4000 个参数的模型,第 13 章每帧步数从 8 降到 3

---

## 七、已知技术债

| 项 | 说明 | 影响 |
|---|---|---|
| 单文件 860 KB | 19 章 + 22 个内联脚本全部在首屏解析 | 首次打开约 100–200 ms 的解析时间 |
| 没有代码分割 | 章节内容是 HTML 片段,不是模块 | 无法按需加载 |
| 侧栏导航手写 | 新增章节要同时改 `src/top.html` | 容易漏改 |
| 引擎功能有限 | 没有 dropout / BN / 权重衰减 | 第 7 章的演示用正则效果近似 |
| 无测试 | 只有 `check.mjs` 的结构检查,没有行为测试 | 改动演示逻辑需要手动点一遍 |
| 临时文件污染 | 写作过程中智能体曾在 `parts/` 留下 `.tmp.html`、`_*.txt` | 构建按扩展名过滤,但会干扰人工检查 |

---

## 八、改动时的安全线

- 不要改 `NN.*` 的函数签名——19 章里到处在调用
- 不要给 `.demo` 换 id,除非同步改 `defineDemo`
- `parts/` 里只放以 `.html` 结尾、以 `<section class="ch"` 开头的文件
- 改完一定跑 `node build.mjs && node check.mjs`
