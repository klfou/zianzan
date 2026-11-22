// The user's approved assembly is the same artwork as the draggable pieces.
export default {
  id:'paver',name:'沥青摊铺机',guide:'paver/guide.webp?v=37',assetVersion:37,
  guideAlt:'沥青摊铺机合装图。三个零件是料斗与履带动力底盘、带顶棚的驾驶操作台和后部摊铺总成。',
  parts:[
    {id:'cab',name:'驾驶操作台',slot:1,file:'paver/cab.webp',offset:[649,-64],width:444,height:353,
      silhouette:[653,-60,437,346],pivot:[790,274],pick:[950,155]},
    {id:'chassis',name:'料斗与履带动力底盘',slot:0,file:'paver/chassis.webp',offset:[0,0],width:1029,height:530,
      silhouette:[5,5,1019,520],pivot:[790,274],pick:[450,300]},
    {id:'screed',name:'后部摊铺总成',slot:2,file:'paver/screed.webp',offset:[754,260],width:659,height:272,
      silhouette:[757,263,653,266],pivot:[772,461],pick:[1230,441]},
  ],
  joints:[null,[790,274],[772,461]],
  layers:['chassis','screed','cab'],
};
