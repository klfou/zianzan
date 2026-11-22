// Coordinates and depth follow the approved V5 art.
export default {
  "id": "reach-stacker",
  "name": "港口集装箱正面吊",
  "guide": "reach-stacker/guide.webp?v=50",
  "assetVersion": 50,
  "guideAlt": "港口集装箱正面吊合装图：轮式底盘与驾驶室、伸缩臂与吊具、蓝色集装箱。",
  "fitWholeAssembly": true,
  "parts": [
    {
      "id": "chassis",
      "name": "轮式底盘与驾驶室",
      "slot": 0,
      "file": "reach-stacker/chassis.webp",
      "offset": [
        0,
        0
      ],
      "width": 896,
      "height": 575,
      "silhouette": [
        0,
        0,
        896,
        574
      ],
      "pivot": [
        677,
        177
      ],
      "pick": [
        480,
        340
      ],
      "ownTrayScale": true
    },
    {
      "id": "boom-spreader",
      "name": "伸缩臂与吊具",
      "slot": 1,
      "file": "reach-stacker/boom-spreader.webp",
      "offset": [
        -677,
        -267
      ],
      "width": 1392,
      "height": 566,
      "silhouette": [
        -677,
        -267,
        1391,
        565
      ],
      "pivot": [
        677,
        177
      ],
      "pick": [
        225,
        6
      ],
      "ownTrayScale": true
    },
    {
      "id": "container",
      "name": "集装箱",
      "slot": 2,
      "file": "reach-stacker/container.webp",
      "offset": [
        -665.882505,
        -38.55674
      ],
      "width": 813,
      "height": 265,
      "silhouette": [
        -665.882505,
        -38.55674,
        813,
        265
      ],
      "pivot": [
        -260,
        -19
      ],
      "pick": [
        -372,
        85
      ],
      "ownTrayScale": true
    }
  ],
  "joints": [
    null,
    [
      677,
      177
    ],
    [
      -260,
      -19
    ]
  ],
  "layers": [
    "chassis",
    "container",
    "boom-spreader"
  ]
};
