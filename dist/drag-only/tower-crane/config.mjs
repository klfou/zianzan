// The tall mast must not shrink the wider pieces in their starting bays.
export default {
  id:'tower-crane',name:'平头塔吊',guide:'tower-crane/guide.webp?v=46',assetVersion:46,
  guideAlt:'平头塔吊合装图。右侧三件是配重底座、格构塔身、带吊钩和后配重的回转起重总成。',
  fitWholeAssembly:true,
  parts:[
    {id:'base',name:'配重底座',slot:0,file:'tower-crane/base.webp',offset:[749,871],width:711,height:299,
      silhouette:[749,872,710,298],pivot:[1101,932],pick:[1105,1010],ownTrayScale:true},
    {id:'mast',name:'格构塔身',slot:1,file:'tower-crane/mast.webp',offset:[1041,183],width:131,height:773,
      silhouette:[1042,184,129,771],pivot:[1101,932],pick:[1050,570],ownTrayScale:true,looseGrabPadding:12},
    {id:'top',name:'回转起重总成',slot:2,file:'tower-crane/top.webp',offset:[0,0],width:1509,height:319,
      silhouette:[1,1,1507,317],pivot:[1076,198],pick:[1064,60],ownTrayScale:true},
  ],
  joints:[null,[1101,932],[1076,198]],
  layers:['base','mast','top'],
};
