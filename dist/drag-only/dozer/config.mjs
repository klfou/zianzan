// Exact approved review-board registration; cab and blade scales baked
// uniformly into lossless WebP dimensions (rounded to whole pixels).
export default {
  id:'dozer',name:'履带推土机',guide:'dozer/guide.webp?v=33',assetVersion:33,
  guideAlt:'履带推土机合装图，下面是履带动力底盘、驾驶室和推土铲总成三个零件。任选一件开始。',
  parts:[
    {id:'cab',name:'驾驶室',slot:1,file:'dozer/cab.webp',offset:[525,-223],width:390,height:383,
      silhouette:[531,-216,377,370],pivot:[700,141],pick:[709,-76]},
    {id:'chassis',name:'履带动力底盘',slot:0,file:'dozer/chassis.webp',offset:[0,0],width:1031,height:500,
      silhouette:[8,8,1015,485],pivot:[700,141],pick:[742,300]},
    {id:'blade',name:'推土铲总成',slot:2,file:'dozer/blade.webp',offset:[-421,274],width:885,height:335,
      silhouette:[-414,281,871,322],pivot:[442,387],pick:[-190,429]},
  ],
  joints:[null,[700,141],[442,387]],
  layers:['chassis','cab','blade'],
};
