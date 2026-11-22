// Installation reproduces the approved guide, including the rigid arm rotation.
export default {
  "id": "wheeled-excavator",
  "name": "轮式挖掘机",
  "guide": "wheeled-excavator/guide.webp?v=49",
  "assetVersion": 49,
  "guideAlt": "轮式挖掘机拆装图：轮式底盘、驾驶室和发动机一体的上车体、带铲斗的机械臂。",
  "fitWholeAssembly": true,
  "parts": [
    {
      "id": "chassis",
      "name": "轮式底盘",
      "slot": 0,
      "file": "wheeled-excavator/chassis.webp",
      "offset": [
        0,
        0
      ],
      "width": 927,
      "height": 285,
      "silhouette": [
        1,
        1,
        925,
        284
      ],
      "pivot": [
        541,
        28
      ],
      "pick": [
        610,
        135
      ],
      "ownTrayScale": true
    },
    {
      "id": "upper",
      "name": "回转上车体",
      "slot": 1,
      "file": "wheeled-excavator/upper.webp",
      "offset": [
        253,
        -310
      ],
      "width": 680,
      "height": 356,
      "silhouette": [
        254,
        -309,
        678,
        354
      ],
      "pivot": [
        541,
        28
      ],
      "pick": [
        649,
        -111
      ],
      "ownTrayScale": true
    },
    {
      "id": "arm",
      "name": "机械臂",
      "slot": 2,
      "file": "wheeled-excavator/arm.webp",
      "offset": [
        -479,
        -392
      ],
      "width": 822,
      "height": 360,
      "silhouette": [
        -478,
        -391,
        820,
        358
      ],
      "pivot": [
        298,
        -77
      ],
      "pick": [
        -160,
        -265
      ],
      "ownTrayScale": true,
      "installAngle": -27.5*Math.PI/180,
      "outline": [
        [
          337,
          -104
        ],
        [
          341,
          -63
        ],
        [
          341,
          -62
        ],
        [
          340,
          -57
        ],
        [
          339,
          -56
        ],
        [
          332,
          -55
        ],
        [
          316,
          -53
        ],
        [
          304,
          -52
        ],
        [
          288,
          -51
        ],
        [
          -385,
          -34
        ],
        [
          -395,
          -34
        ],
        [
          -402,
          -36
        ],
        [
          -405,
          -37
        ],
        [
          -438,
          -50
        ],
        [
          -448,
          -54
        ],
        [
          -450,
          -55
        ],
        [
          -454,
          -58
        ],
        [
          -464,
          -68
        ],
        [
          -467,
          -72
        ],
        [
          -470,
          -77
        ],
        [
          -473,
          -83
        ],
        [
          -475,
          -88
        ],
        [
          -476,
          -91
        ],
        [
          -477,
          -95
        ],
        [
          -478,
          -102
        ],
        [
          -478,
          -110
        ],
        [
          -477,
          -116
        ],
        [
          -476,
          -120
        ],
        [
          -474,
          -126
        ],
        [
          -470,
          -134
        ],
        [
          -468,
          -137
        ],
        [
          -464,
          -142
        ],
        [
          -397,
          -217
        ],
        [
          -338,
          -277
        ],
        [
          -266,
          -349
        ],
        [
          -258,
          -355
        ],
        [
          -228,
          -377
        ],
        [
          -225,
          -379
        ],
        [
          -220,
          -382
        ],
        [
          -211,
          -386
        ],
        [
          -205,
          -388
        ],
        [
          -201,
          -389
        ],
        [
          -195,
          -390
        ],
        [
          -184,
          -391
        ],
        [
          -180,
          -391
        ],
        [
          -151,
          -387
        ],
        [
          159,
          -309
        ],
        [
          166,
          -307
        ],
        [
          173,
          -304
        ],
        [
          177,
          -302
        ],
        [
          233,
          -270
        ],
        [
          238,
          -267
        ],
        [
          246,
          -261
        ],
        [
          256,
          -252
        ],
        [
          257,
          -251
        ],
        [
          260,
          -247
        ],
        [
          302,
          -189
        ],
        [
          311,
          -172
        ],
        [
          319,
          -156
        ],
        [
          324,
          -142
        ]
      ]
    }
  ],
  "joints": [
    null,
    [
      541,
      28
    ],
    [
      298,
      -77
    ]
  ],
  "layers": [
    "chassis",
    "upper",
    "arm"
  ]
};
