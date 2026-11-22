// The two drills comprise one mechanically joined front attachment.
export default {
  id:'drill-jumbo',name:'双臂凿岩台车',guide:'drill-jumbo/guide.webp?v=44',assetVersion:44,
  guideAlt:'双臂凿岩台车合装图。三件是轮式行走底盘、驾驶室与动力舱、双凿岩臂总成。',
  parts:[
    {id:'booms',name:'双凿岩臂总成',slot:2,file:'drill-jumbo/booms.webp',offset:[-929,-75],width:1005,height:264,
      silhouette:[-929,-75,1005,264],pivot:[35,131],pick:[-320,22]},
    {id:'chassis',name:'轮式行走底盘',slot:0,file:'drill-jumbo/chassis.webp',offset:[0,0],width:663,height:244,
      silhouette:[0,1,663,242],pivot:[35,131],pick:[440,140]},
    {id:'cab',name:'驾驶室与动力舱',slot:1,file:'drill-jumbo/cab.webp',offset:[62,-249],width:600,height:319,
      silhouette:[63,-249,599,319],pivot:[363,37],pick:[196,-118]},
  ],
  joints:[null,[35,131],[363,37]],
  layers:['chassis','cab','booms'],
};
