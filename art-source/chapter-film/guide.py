"""Build the shot handoff from the same timeline that drives the rendered film."""
from pathlib import Path
from html import escape
import json

root = Path(__file__).resolve().parent
dist = root.parents[1] / "dist/story-film"
timeline = json.loads((root / "timeline.json").read_text("utf8"))
def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf8")

chapters = dict(rain="雨里的绘本", fell="给工地开路", drain="清理旧木场", drill="打好地基", panels="盖起故事屋", sweep="铺路亮灯", snow="雪天的最后一页")
rules = {
"rain":"给书封设一个转轴。点绘本后先收书签再合上书，雨点不能穿过车棚。把同一本书的封面和书签留给结尾。",
"wish":"轻点图纸上的窗，把图纸和实景中的树冠先后照亮。锁定旧砖房地块和健康大树的位置，后续工序只改变地块。",
"fell":"先夹稳，再从树根切断，整棵树由伐木头扶放，落地再松夹。枝梢和树干同动；树桩留在原位。伐木机关只负责伐倒。",
"mark":"倒木先由工人分段。把印章按上其中一根的端面，抬起后红狐狸留在木纹上。保存这根木料的身份供阅读桌回收。",
"dig":"以斗齿接触地面为界。先扎入，边收小臂边卷斗，满斗后再抬臂。每取一斗就减少相应土量。分出一堆填沟用土。",
"haul":"用参考帧中的重卡尺寸套底盘、驾驶室和车厢。铲斗越过侧板再打开，车内积土逐斗增加。装好后先驶上运输路，到收土场停稳才绕后铰点举厢，卸完降厢。",
"grade":"铲、推杆与车架相接，车底使用四个橡胶轮胎。压下铲刃，贴地推进预留的土，铲前土堆缩小时浅沟同步填满，再抬铲后退。",
"compact":"同一条刚填好的土便道，钢轮经过的路段才压实。完成整段后给重卡放行，把入口状态交给下一镜。",
"carry":"橙色高座抓木机保持履带着地，肩销接大臂、肘销接小臂、腕端接旋转抓爪。夹牢后木料跟随抓爪，接触大卡车承木架再松开。木料留在车上，绑好才可驶离。",
"drain":"先将吸污软管对准井口，启动后降低水面；收管后再由清运车举桶、倒桶和复位。分开污泥和桶装垃圾。",
"demo":"先选择雾炮，让雾覆盖旧墙，再让拆除钳夹住墙段。接触处碎砖向下落到墙脚，保留右侧健康树和邻近地形。",
"rubble":"装载机把地上碎砖送入已停稳的同一辆翻斗车。记录运走的砖量，露出旧房地基；洒水车低位润湿运输路面。",
"drill":"锁住钻孔中心，钻杆沿竖向导轨旋转下降。提钻带出土，孔口留在原处，为钢筋笼设同一个对位中心。",
"cage":"让钢筋笼顶端吊在钩下。先移到上一镜中心，再垂直放笼，落稳才松钩；平移和放绳分别控制。",
"concrete":"搅拌车停稳后，出料槽对准导管。供料时孔内填充状态逐步上升，完成并以时间过渡表现基础养护。",
"panels":"平板车在楼外卸料点停车；塔吊收绳让墙板离开平板，再回转、落钩对准安装位。只在墙板就位固定后释放吊具。",
"pump":"搅拌筒向泵车料斗供料。泵臂每段绕相邻关节展开，软管末端朝下，拖动末端控制浇筑区，料流只从软管口出。",
"window":"吸盘与窗玻璃同步移动，玻璃固定进二楼窗框才释放吸盘。完工时透过玻璃仍能望见保留的大树。",
"desk":"装入做好的桌板再关笼门。吊笼约束在外墙导轨上；抵达二楼且停稳才开门。窗前成桌的边缘保留与木料相同的狐狸印记。",
"sign":"车停在门廊外，两段曲臂绕门廊伸展。工作平台随臂端移动且保持水平，招牌避开窗框，固定后随楼体保留。",
"sweep":"两步共用同一条路。清扫车圆刷经过后移走浮土；在已扫区域让洒布车后喷杆留下均匀结合层。喷杆宽度限定轨迹。",
"pave":"翻斗车向摊铺机料斗供料。摊铺机前进，机后才延长黑色铺面；压路机随后沿新铺段碾压。留出车辆回转和离场空间。",
"stripe":"在已完成的路面标记起点，控制划线车匀速走，喷枪开闭形成间隔。白线留在地面，雪天露出同一处标线。",
"books":"货叉对准托盘叉孔，插入后微抬。托盘随货叉平移，到门口降下接地后再退叉，箱子保持叠放。",
"lamp":"工作斗停在灯头旁，点灯具完成安装。收回工作斗，傍晚暖光照到入口白线上。将这盏灯的位置和光色传给雪景。",
"snow":"斜铲贴地向路肩堆雪，铲后露出原有白线。通行后才让开场的黄色图书车驶入，保持路灯和门口位置。",
"end":"先给窗边阿梨和孩子们，再让孩子点书页。翻到狐狸推门的一页，门后出现伙伴。留下阅读桌的印记、窗外雪和暖灯。"
}
style = "沿用本镜参考帧的暖色厚涂儿童绘本风、纸纹和有体积的金属机械。匹配车头、车轮、工作属具与邻车在同一地平线上的相对尺寸。保持镜位、车辆朝向和已有色板。单独导出需要运动的零件与无字背景。"
continuity = "旧砖房原址建三层故事屋；右侧健康大树贯穿全年。入口枯树的木料从端面狐狸印记追踪到二楼阅读桌。余土去场外收土场，填沟用土留场。黄色图书车、阿梨的青绿外套和狐狸绘本从雨天延续到雪天。"
def clock(seconds):
    return f"{int(seconds)//60:02d}:{seconds%60:05.2f}"
entries = []
sections = []
for i, s in enumerate(timeline):
    ident, sheet, cell = s["id"], s["sheet"], s["cell"]
    start, end = s["startFrame"]/s["fps"], (s["startFrame"]+s["frames"])/s["fps"]
    plate = f"panels/{sheet}-{cell}.webp" if sheet not in ("rig","fleet") else None
    refs = [f"keyframes/{ident}-{phase}.jpg" for phase in ("start","action","end")]
    assets = [plate] if plate else ["film.mjs","shared/excavator/work-films.mjs","shared/excavator/field.mjs"]
    if ident in ("dig","haul"): assets.append("shared/excavator/art/model.json")
    if ident=="haul": assets.append("shared/excavator/art/tipper.json")
    machine_files = {
        "fell":["shared/drag-only/harvester/boom.webp","shared/excavator/art/bare-tree.webp"],
        "grade":["shared/excavator/art/wheel-base.webp","shared/excavator/art/wheel-blade.webp"],
        "compact":["shared/drag-only/roller/drum.webp"],
        "carry":["shared/excavator/art/log-handler.webp","shared/excavator/art/grapple-jaw.webp","shared/excavator/art/stake-rack.webp","shared/excavator/art/sawn-log.webp"]
    }
    assets.extend(machine_files.get(ident,[]))
    if plate: assets += [f"masters/{sheet}.png"]
    for suffix in ("clean","layer"):
        rel=f"panels/{ident}-{suffix}.webp"
        if (root/rel).is_file(): assets.append(rel)
    if ident=="end": assets.append("panels/hearts-5.webp")
    if ident=="desk": assets.append("panels/road-4.webp")
    art = f"以所附三张成片帧为视觉基准，绘制《{s['title']}》的可分层游戏素材。角色或机械为{s['cast']}。开场构图为{s['start']}。需要画清的动作是{s['motion']}。末态保留{s['result']}。"+style
    handoff = timeline[i+1]["title"] if i+1<len(timeline) else "全片结束，可重播或回到游戏"
    game = f"将《{s['title']}》改为可触摸的绘本场景。载入状态“{s['start']}”。孩子的操作是“{s['touch']}”。{rules[ident]} 完成条件为“{s['result']}”。完成后进入“{handoff}”。操作可以重试，退出时停止本镜的声音和动作。复用所附普通话音轨。"
    row=dict(id=ident,title=s["title"],startSeconds=start,endSeconds=end,visualReferences=refs,referenceFrames=[s["startFrame"]+j for j in (0,int(s["frames"]*.55),s["frames"]-1)],assets=assets,voice=f"voices/{ident}.wav",narration=s["line"],imagePrompt=art,gamePrompt=game,done=s["result"],next=handoff)
    entries.append(row)
    pics="".join(f'<figure><a href="{r}"><img loading="lazy" src="{r}" alt="{s["title"]} {label}"></a><figcaption>{label} · {clock(frame/s["fps"])}</figcaption></figure>' for r,frame,label in zip(refs,row["referenceFrames"],("起始帧","过程帧","结束帧")))
    links="　".join(f'<a href="{r}">{r}</a>' for r in assets)
    sections.append(f'<article id="{ident}"><h2>{i+1:02d}　{s["title"]}</h2><p>{clock(start)} – {clock(end)}　·　{s["cast"]}</p><div class="frames">{pics}</div><p>“{s["line"]}”　<a href="{row["voice"]}">听本镜旁白</a></p><h3>补画素材时使用</h3><p>{escape(art)}</p><h3>制作游戏时使用</h3><p>{escape(game)}</p><details><summary>查看本镜源素材</summary><p>{links}</p></details></article>')
save(dist/"chapters.json",[dict(title=chapters[s["id"]],start=s["startFrame"]/s["fps"]) for s in timeline if s["id"] in chapters])
save(root/"game-prompts.json",dict(title="旧木场的第一盏灯",continuity=continuity,style=style,shots=entries))
toc=" ".join(f'<a href="#{s["id"]}">{s["title"]}</a>' for s in timeline)
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>旧木场的第一盏灯 · 游戏复刻手册</title><style>*{box-sizing:border-box}body{margin:auto;padding:28px 16px;max-width:1080px;background:#fbf5e7;color:#2e443b;font:17px/1.7 system-ui,sans-serif}h1,h2,h3{line-height:1.3}h3{font-size:1.05rem;margin-bottom:0}h3+p{margin-top:.3em}article{padding:21px 0;border-bottom:2px solid #dbcba8}a{color:#286050;text-underline-offset:.18em;overflow-wrap:anywhere}nav{display:flex;gap:4px 14px;flex-wrap:wrap}.frames{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}figure{margin:0}img{display:block;width:100%;border-radius:6px}figcaption{font-size:.85rem}summary{cursor:pointer}@media(max-width:550px){.frames{grid-template-columns:1fr}}</style><main><h1>旧木场的第一盏灯</h1><p>逐镜游戏复刻手册 · 27 镜 · 1280 × 720 · 每秒 20 帧</p><p>制作一关时，把该镜头的三张参考帧、源素材和对应提示词一起交给 AI。已有零件优先直接复用。起始、过程、结束图来自实际渲染，过程帧取在镜头时长的 55%。绘本运镜中的触摸操作和补画动作是游戏制作说明。</p><p>'''
(root/"game-prompts.html").write_text(html+continuity+'</p><p><a href="game-prompts.json">机器可读的逐镜提示词</a>　<a href="image-prompts.json">原画生成时使用的提示词</a>　<a href="timeline.json">精确时间轴</a></p><nav>'+toc+'</nav>'+''.join(sections)+'</main></html>',"utf8")
