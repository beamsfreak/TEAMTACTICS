# 泛美FC战术手册

9人制 3-2-3 足球战术手机网页，包含基本站位、进攻策略、防守策略及九个位置的攻防行为卡。

网页动画使用 HTML、CSS、JavaScript 和 SVG，无需安装依赖或执行构建。

## 页面

- `index.html`：基本阵型与职责
- `attack.html`：六种进攻策略
- `defense.html`：基本防守站位与策略
- `roles.html`：全队九个位置行为卡

## GitHub Pages

仓库 Settings → Pages：Source 选择 Deploy from a branch，Branch 选择 main，Folder 选择 /(root)。实际发布网址以 Pages 设置页为准。

所有网页文件放在根目录，`.nojekyll` 用于直接发布静态网页。

## 新增课程与动画分支

第二课现有六套基本进攻、三种破解高压方案、五种受阻与第二点处理。第五课 `setpieces.html` 提供攻防角球、攻防任意球、后场界外球与防对方快开六段动画。第三课和第四课提供相关场景入口，`references.html` 列出官方参考资料与本队适配说明。

共用时间线引擎为 `attack-model.js`；`attack-extra.js` 补充高压和受阻分支，`setpieces-model.js` 定义定位球场景。动画是本队训练示例，具体比赛规则以赛事规定为准。

运行模型检查：`node --test tests/*.test.cjs`。检查全程/分步播放、暂停/继续、拖动和重置、十八名球员、球与人的连续运动、号码遮挡及地面传球线路。
