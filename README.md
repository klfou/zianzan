# 小小工程队

一个面向孩子的 2.5D 工程车辆拼装网页游戏。当前版本提供 79 款车辆，涵盖建筑、采矿、道路施工、消防救援、城市服务和机场特种车辆。拖动车辆零件到对应位置即可吸附；拼装前后使用同一套透明素材。

[在线试玩](https://little-builders-three-piece.jhf7svmn45.chatgpt.site/)

## 本地运行

此项目是静态网站，无需安装前端依赖。在仓库根目录启动：

```bash
python3 -m http.server 8000 --directory dist
```

浏览器打开 http://localhost:8000/。支持鼠标和触控。

## 运行测试

```bash
node --test tests/*.test.mjs
```

- `dist/`：可直接部署的网页、游戏逻辑和车辆素材。
- `tests/`：拼装坐标、布局和素材加载测试。
- `art-source/`、`scripts/`：部分原始素材和制作工具。
