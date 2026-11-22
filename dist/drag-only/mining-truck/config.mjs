// Two independent parts. The assembled cab occludes the front edge of the bed.
export default {
  id:'mining-truck',name:'巨型矿用卡车',guide:'mining-truck/guide.webp?v=45',assetVersion:45,
  guideAlt:'巨型矿用卡车两件合装图，下方是带驾驶室、登车梯和巨轮的车体，以及独立货斗。',
  parts:[
    {id:'lower',name:'矿用车体总成',slot:0,file:'mining-truck/lower.webp',offset:[-54,-205],width:1046,height:514,
      silhouette:[-53,-204,1045,512],pivot:[940,25],pick:[342,141]},
    {id:'bed',name:'矿用货斗总成',slot:1,file:'mining-truck/bed.webp',offset:[-158,-250],width:1170,height:319,
      silhouette:[-158,-250,1170,319],pivot:[940,25],pick:[711,-91]},
  ],
  joints:[null,[940,25]],
  layers:['lower','bed'],
  foreground:{part:'lower',with:'bed',maxX:551},
};
