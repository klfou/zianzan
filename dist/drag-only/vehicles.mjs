import batch52 from './city-fleet-v52.mjs?v=52';
import batch51 from './fleet-v51.mjs?v=51';
import {SPRITES,JOINTS} from './sprites.mjs?v=17';
import dozer from './dozer/config.mjs?v=33';
import crane from './mobile-crane/config.mjs?v=39';
import scissorTruck from './scissor-truck/config.mjs?v=34';
import paver from './paver/config.mjs?v=37';
import tbm from './tbm/config.mjs?v=38';
import harvester from './harvester/config.mjs?v=43';
import grader from './grader/config.mjs?v=42';
import drillJumbo from './drill-jumbo/config.mjs?v=44';
import miningTruck from './mining-truck/config.mjs?v=45';
import towerCrane from './tower-crane/config.mjs?v=46';
import crawlerCrane from './crawler-crane/config.mjs?v=47';
import concretePump from './concrete-pump/config.mjs?v=48';
import wheeledExcavator from './wheeled-excavator/config.mjs?v=49';
import reachStacker from './reach-stacker/config.mjs?v=50';

export const VEHICLES=[
  {
    id:'excavator',name:'挖掘机',guide:'excavator-guide.webp?v=26',
    guideAlt:'履带式挖掘机合装图，下面是履带底盘、上车体和机械臂三件零件。任选一件开始。',
    parts:[
      {...SPRITES.chassis,id:'chassis',name:'履带底盘',pick:[1120,756]},
      {...SPRITES.body,id:'body',name:'上车体'},
      {...SPRITES.arm,id:'arm',name:'机械臂'},
    ],
    joints:[null,JOINTS.slew,JOINTS.boom],
    layers:['chassis','body','arm'],
  },
  {
    id:'tipper',name:'自卸翻斗车',guide:'tipper/guide.webp?v=29',
    guideAlt:'自卸翻斗车合装图，下面是轮式底盘、驾驶室、翻斗货厢三个零件。任选一件开始。',
    // Assembly order for the joint graph is cab—chassis—bed. Tray and paint
    // order are independent. These offsets are the approved board's offsets.
    parts:[
      {id:'cab',name:'驾驶室',slot:1,file:'tipper/cab.webp',offset:[2,-215],width:436,height:437,
        silhouette:[7,-211,426,429],pivot:[342,132],pick:[235,-55]},
      {id:'chassis',name:'轮式底盘',slot:0,file:'tipper/chassis.webp',offset:[0,0],width:1374,height:416,
        silhouette:[4,5,1365,407],pivot:[760,118],pick:[802,218]},
      {id:'bed',name:'翻斗货厢',slot:2,file:'tipper/bed.webp',offset:[426,-190],width:948,height:318,
        silhouette:[430,-185,939,308],pivot:[1237,120],pick:[960,-36]},
    ],
    joints:[null,[342,132],[1237,120]],
    layers:['chassis','bed','cab'],
  },
  {
    id:'mixer',name:'混凝土搅拌车',guide:'mixer/guide.webp?v=30',assetVersion:30,
    guideAlt:'混凝土搅拌车合装图，下面是轮式底盘、驾驶室、搅拌总成三个零件。任选一件开始。',
    // Cab—chassis—mixer. These positions and the rigid rotation of the
    // mixer subframe reproduce the approved review board without stretching.
    parts:[
      {id:'cab',name:'驾驶室',slot:1,file:'mixer/cab.webp',offset:[0,-276],width:457,height:489,
        silhouette:[5,-271,447,479],pivot:[330,123],pick:[210,-86]},
      {id:'chassis',name:'轮式底盘',slot:0,file:'mixer/chassis.webp',offset:[0,0],width:1426,height:363,
        silhouette:[5,5,1416,353],pivot:[720,85],pick:[680,166]},
      {id:'drum',name:'搅拌总成',slot:2,file:'mixer/mixer.webp',offset:[458,-358],width:953,height:451,
        silhouette:[463,-353,943,441],pivot:[508,80],pick:[980,-175],installAngle:-1.7*Math.PI/180},
    ],
    joints:[null,[330,123],[508,80]],
    layers:['chassis','drum','cab'],
  },
  {
    id:'roller',name:'单钢轮压路机',guide:'roller/guide.webp?v=36',assetVersion:36,
    guideAlt:'单钢轮压路机合装图，下面是前钢轮总成、驾驶室和后动力底盘三个零件。任选一件开始。',
    // Approved side-view revision. Uniform fit of drum and cab is baked into their sprites.
    parts:[
      {id:'drum',name:'前钢轮总成',slot:0,file:'roller/drum.webp',offset:[0,177],width:520,height:337,
        silhouette:[4,181,512,329],pivot:[501,311],pick:[222,350]},
      {id:'rear',name:'后动力底盘',slot:2,file:'roller/rear.webp',offset:[474,0],width:834,height:516,
        silhouette:[479,5,825,506],pivot:[709,201],pick:[951,370]},
      {id:'cab',name:'驾驶室',slot:1,file:'roller/cab.webp',offset:[485,-180],width:423,height:411,
        silhouette:[489,-176,414,403],pivot:[709,201],pick:[692,36]},
    ],
    joints:[null,[501,311],[709,201]],
    layers:['rear','drum','cab'],
  },
  {
    id:'loader',name:'轮式装载机',guide:'loader/guide.webp?v=32',assetVersion:32,
    guideAlt:'轮式装载机合装图，下面是轮式底盘、驾驶室和铲斗总成三个零件。任选一件开始。',
    // Cab—chassis—bucket. The offsets, bucket angle and layer order are
    // identical to the approved review board.
    parts:[
      {id:'cab',name:'驾驶室',slot:1,file:'loader/cab.webp',offset:[455,-203],width:396,height:367,
        silhouette:[459,-199,388,360],pivot:[650,141],pick:[650,-55]},
      {id:'chassis',name:'轮式底盘',slot:0,file:'loader/chassis.webp',offset:[0,0],width:1128,height:499,
        silhouette:[5,5,1118,489],pivot:[650,141],pick:[800,220]},
      {id:'bucket',name:'铲斗总成',slot:2,file:'loader/bucket.webp',offset:[-252,63],width:689,height:420,
        silhouette:[-248,67,681,412],pivot:[422,116],pick:[-40,360],installAngle:-5*Math.PI/180},
    ],
    joints:[null,[650,141],[422,116]],
    layers:['chassis','cab','bucket'],
  },
  dozer,crane,scissorTruck,paver,tbm,harvester,grader,drillJumbo,miningTruck,towerCrane,crawlerCrane,concretePump,wheeledExcavator,reachStacker,
  ...batch51,
  ...batch52,
];
