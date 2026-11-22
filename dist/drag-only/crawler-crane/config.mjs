// Three complete mechanical modules from the reviewed assembly.
export default {
  id:'crawler-crane',name:'履带式起重机',guide:'crawler-crane/guide.webp?v=47',assetVersion:47,
  guideAlt:'履带式起重机合装图。三块是双履带底盘、带驾驶室和配重的回转总成、带吊钩的格构吊臂。',
  fitWholeAssembly:true,
  parts:[
    {id:'chassis',name:'履带行走底盘',slot:0,file:'crawler-crane/chassis.webp',offset:[0,0],width:1025,height:302,
      silhouette:[0,0,1025,302],pivot:[510,16],pick:[650,210],ownTrayScale:true},
    {id:'cab',name:'回转上车总成',slot:1,file:'crawler-crane/cab.webp',offset:[191,-377],width:660,height:411,
      silhouette:[191,-377,660,411],pivot:[510,16],pick:[610,-153],ownTrayScale:true},
    {id:'boom',name:'格构吊臂总成',slot:2,file:'crawler-crane/boom.webp',offset:[-419,-608],width:656,height:635,
      silhouette:[-418,-608,655,635],pivot:[214,-35],pick:[-67,-278],ownTrayScale:true},
  ],
  joints:[null,[510,16],[214,-35]],
  layers:['chassis','cab','boom'],
};
