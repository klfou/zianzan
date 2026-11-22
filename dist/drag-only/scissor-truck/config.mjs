// Approved v2 artwork. Upper-part scales are uniformly baked into the
// sprites (rounded to the nearest pixel); physical pins share coordinates.
export default {
  id:'scissor-truck',name:'车载剪叉式高空作业车',guide:'scissor-truck/guide.webp?v=34',assetVersion:34,
  guideAlt:'车载剪叉式高空作业车合装图，下面是车头和轮式底盘、剪叉升降总成、作业平台。任选一件开始。',
  parts:[
    {id:'chassis',name:'车头与轮式底盘',slot:0,file:'scissor-truck/chassis.webp',offset:[0,0],width:1950,height:785,
      silhouette:[5,10,1940,774],pivot:[953,350],pick:[1200,600]},
    {id:'scissor',name:'剪叉升降总成',slot:1,file:'scissor-truck/scissor.webp',offset:[921,-145],width:744,height:540,
      silhouette:[923,-143,740,536],pivot:[953,350],pick:[1290,170]},
    {id:'platform',name:'作业平台',slot:2,file:'scissor-truck/platform.webp',offset:[696,-599],width:1194,height:486,
      silhouette:[699,-597,1188,482],pivot:[953,-128],pick:[1250,-166]},
  ],
  joints:[null,[953,350],[953,-128]],
  layers:['chassis','scissor','platform'],
};
