// Red-cutter revision. The same three sprites and transforms form the review board.
export default {
  id:'tbm',name:'盾构机',guide:'tbm/guide.webp?v=38',assetVersion:38,
  guideAlt:'盾构机合装图，下方是红色旋转刀盘、白色盾体主机和黄色护栏的后配套台车。',
  parts:[
    {id:'cutter',name:'旋转刀盘',slot:0,file:'tbm/cutter.webp',offset:[0,0],width:399,height:534,
      silhouette:[1,1,397,532],pivot:[310,267],pick:[175,249]},
    {id:'shield',name:'盾体主机',slot:1,file:'tbm/shield.webp',offset:[42,0],width:764,height:530,
      silhouette:[43,1,763,528],pivot:[310,267],pick:[528,235]},
    {id:'gantry',name:'后配套台车',slot:2,file:'tbm/gantry.webp',offset:[602,137],width:1060,height:391,
      silhouette:[603,137,1059,391],pivot:[766,372],pick:[1115,305]},
  ],
  joints:[null,[310,267],[766,372]],
  layers:['gantry','shield','cutter'],
};
