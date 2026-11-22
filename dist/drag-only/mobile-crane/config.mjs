// Three-axle crane, fitted to the user’s cab reference.
const model = {
  "id": "mobile-crane",
  "name": "汽车起重机",
  "guide": "mobile-crane/guide.webp?v=39",
  "assetVersion": 39,
  "guideAlt": "三轴汽车起重机合装图，下方是带驾驶室的轮式底盘、回转总成、伸缩臂总成。任选一件开始。",
  "parts": [
    {
      "offset": [
        0,
        0
      ],
      "silhouette": [
        1,
        1,
        1047,
        332
      ],
      "pivot": [
        746,
        118
      ],
      "pick": [
        535,
        180
      ],
      "id": "carrier",
      "name": "轮式底盘",
      "slot": 0,
      "file": "mobile-crane/carrier.webp",
      "width": 1049,
      "height": 334
    },
    {
      "offset": [
        556,
        -158
      ],
      "silhouette": [
        557,
        -157,
        391,
        284
      ],
      "pivot": [
        746,
        118
      ],
      "pick": [
        745,
        -2
      ],
      "id": "turntable",
      "name": "回转总成",
      "slot": 1,
      "file": "mobile-crane/turntable.webp",
      "width": 393,
      "height": 286
    },
    {
      "offset": [
        -225,
        -159
      ],
      "silhouette": [
        -225,
        -158,
        1149,
        234
      ],
      "pivot": [
        913,
        -57
      ],
      "pick": [
        350,
        -83
      ],
      "id": "boom",
      "name": "伸缩臂总成",
      "slot": 2,
      "file": "mobile-crane/boom.webp",
      "width": 1150,
      "height": 235,
      "outline": [
        [
          -225,
          -51
        ],
        [
          -225,
          -58
        ],
        [
          -213,
          -141
        ],
        [
          -212,
          -146
        ],
        [
          -211,
          -149
        ],
        [
          -210,
          -151
        ],
        [
          -206,
          -155
        ],
        [
          -202,
          -157
        ],
        [
          -198,
          -158
        ],
        [
          -174,
          -158
        ],
        [
          871,
          -86
        ],
        [
          910,
          -76
        ],
        [
          913,
          -75
        ],
        [
          915,
          -74
        ],
        [
          920,
          -69
        ],
        [
          922,
          -65
        ],
        [
          923,
          -62
        ],
        [
          923,
          2
        ],
        [
          920,
          8
        ],
        [
          914,
          14
        ],
        [
          912,
          15
        ],
        [
          909,
          16
        ],
        [
          877,
          24
        ],
        [
          871,
          25
        ],
        [
          832,
          28
        ],
        [
          792,
          31
        ],
        [
          765,
          33
        ],
        [
          -175,
          75
        ],
        [
          -177,
          75
        ],
        [
          -182,
          74
        ],
        [
          -187,
          72
        ],
        [
          -193,
          66
        ],
        [
          -195,
          62
        ]
      ]
    }
  ],
  "joints": [
    null,
    [
      746,
      118
    ],
    [
      913,
      -57
    ]
  ],
  "layers": [
    "carrier",
    "boom",
    "turntable"
  ]
};
model.parts[2].installAngle = 2.5*Math.PI/180;
export default model;
