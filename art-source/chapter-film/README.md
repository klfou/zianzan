# 旧木场的第一盏灯

打开同目录的 game-prompts.html 可离线翻看 27 个镜头、逐镜旁白、81 张实际渲染帧，以及补画素材和制作交互时分别使用的提示词。game-prompts.json 可按镜头 ID 读取，image-prompts.json 保存了创作原画时的指令。复刻同一关时，优先复用随包保存的画面和已对齐的零件。

## 素材位置

- masters 存放五张原始画稿。panels 存放裁切后的场景和前后景分层，layers.json 保存活动图层的边界和运动范围。
- shared 存放本片实际使用的车辆、道路、属具和关节运动代码的快照。film.mjs 负责组合场景、镜头与字幕。
- voices 存放每镜一条普通话旁白及选定的五秒音色样本。narration.wav 是对齐到画面的总音轨。timeline.json 以 20 帧每秒记录各镜起点与时长。
- 故事片使用 1280 × 720 的画幅。画面上方为 626 像素高的绘图区，余下空间用于字幕。

## 从保存的素材重新出片

将压缩包按原目录结构解开。在解压目录运行以下命令。需要 Node.js、Playwright、Edge 和 FFmpeg。可用 FFMPEG 环境变量指定可执行文件位置，FILM_BROWSER 可覆盖 Playwright 浏览器渠道。

```sh
node art-source/chapter-film/render.mjs
```

输出为 dist/story-film/first-light.mp4，同时更新 keyframes。仅修改游戏交付提示词时，运行 python art-source/chapter-film/guide.py 即可，无须重新出片。

更换画稿或旁白后，先运行 prepare.py 整理裁片、音轨和时间轴，再运行 layers.py 提取活动图层，然后运行 guide.py 和 render.mjs。预处理需要 Pillow、NumPy 和 OpenCV。修改轮式推土机原画时，应同步校准 shared 中保存的铲刃和车身分层。只有重新配音才需安装本地 Qwen3-TTS、PyTorch、SoundFile 和模型权重。narrate.py 默认复用已有 WAV，并从 LOCALAPPDATA/LittleBuilders/models 加载模型。
