// The same three mechanical modules and composition as the approved guide.
export default {
  id:'concrete-pump',name:'混凝土泵车',guide:'concrete-pump/guide.webp?v=48',assetVersion:48,
  guideAlt:'混凝土泵车合装图。三个部件是带车头的行驶底盘、带料斗的泵送总成、带输送管和末端软管的折叠臂。',
  fitWholeAssembly:true,
  parts:[
    {id:'carrier',name:'行驶底盘',slot:0,file:'concrete-pump/carrier.webp',offset:[0,0],width:1376,height:475,
      silhouette:[1,1,1374,473],pivot:[950,204],pick:[210,230]},
    {id:'pump',name:'泵送总成',slot:1,file:'concrete-pump/pump.webp',offset:[441,45],width:900,height:212,
      silhouette:[441,46,899,211],pivot:[950,204],pick:[955,176]},
    {id:'boom',name:'折叠臂',slot:2,file:'concrete-pump/boom.webp',offset:[477,-66],width:962,height:166,
      silhouette:[478,-65,961,165],pivot:[547,91],pick:[800,-23]},
  ],
  joints:[null,[950,204],[547,91]],
  layers:['carrier','pump','boom'],
};
