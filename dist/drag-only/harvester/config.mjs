// The original teal harvester uses the same three pieces as its approved guide.
export default {
  id:'harvester',name:'轮式伐木机',guide:'harvester/guide.webp?v=43',assetVersion:43,
  guideAlt:'青绿色轮式伐木机合装图，下方是铰接式八轮底盘、驾驶室与发动机、带黄色采伐头的折叠液压臂。',
  parts:[
    {id:'chassis',name:'铰接式八轮底盘',slot:0,file:'harvester/chassis.webp',offset:[0,0],width:1249,height:336,
      silhouette:[0,1,1249,334],pivot:[515,7],pick:[225,205]},
    {id:'cab',name:'驾驶室与发动机',slot:1,file:'harvester/cab.webp',offset:[219,-502],width:844,height:516,
      silhouette:[219,-501,844,514],pivot:[515,7],pick:[792,-188]},
    {id:'boom',name:'折叠臂与采伐头',slot:2,file:'harvester/boom.webp',offset:[-445,-599],width:710,height:654,
      silhouette:[-445,-599,710,654],pivot:[242,-72],pick:[-234,-450]},
  ],
  joints:[null,[515,7],[242,-72]],
  layers:['chassis','cab','boom'],
};
