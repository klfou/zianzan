# 小小工程队 · 工程车拼图

打开首页即可选车。车库只展示挖掘机样板和已重绘的车辆，卡片显示整车和零件数。将零件拖到对应轮廓，或先点零件再点亮起的加号。完成后可以重新拼装或回车库换车。每辆车独立保存拼装进度。选车和选零件会播放中文介绍，可随时静音或点「听介绍」重播。专属录音随游戏分发，其他车辆使用设备的中文朗读。

## 本地试玩

在项目根目录运行静态服务器。

```sh
python -m http.server 8017 --directory dist
```

电脑浏览器打开 http://localhost:8017/ 。同一局域网内的 iPad 可在 Safari 打开电脑的局域网 IP 和端口 8017。

## 项目结构

- `dist/index.html` 是选车和拼装的入口。
- `dist/puzzle/` 包含拼装交互、选车缩略图和车辆目录。
- `dist/drag-only/` 和 `dist/excavator/art/` 提供车辆原画、零件及其安装坐标。
- `scripts/build-puzzle-catalog.py` 使用 Node.js 和 Pillow 从车辆配置生成目录及缩略图。
- `art-source/` 保存制作素材。之前制作的绘本和动画在此留档。

```sh
node --test tests/*.test.mjs
```
