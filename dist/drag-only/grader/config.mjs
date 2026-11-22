// The rebuilt chassis centers the main beam between both axles.
export default {
  id:'grader',name:'平地机',guide:'grader/guide.webp?v=42',assetVersion:42,
  guideAlt:'平地机合装图。三块是带中置刮刀的六轮底盘、驾驶室与发动机舱、独立前推板。',
  parts:[
    {id:'front',name:'独立前推板',slot:2,file:'grader/front.webp',offset:[-37,193],width:500,height:213,
      silhouette:[-33,197,492,206],pivot:[227,252],pick:[200,334]},
    {id:'chassis',name:'六轮底盘与中置刮刀',slot:0,file:'grader/chassis.webp',offset:[0,0],width:1465,height:407,
      silhouette:[5,4,1456,399],pivot:[227,252],pick:[560,93]},
    {id:'cab',name:'驾驶室与发动机舱',slot:1,file:'grader/cab.webp',offset:[767,-280],width:636,height:378,
      silhouette:[771,-277,629,371],pivot:[1010,87],pick:[1060,-125]},
  ],
  joints:[null,[227,252],[1010,87]],
  layers:['chassis','cab','front'],
};
