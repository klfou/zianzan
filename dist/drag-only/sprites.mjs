// Independently generated assemblies, in one common position and scale.
// Axes are registered to the actual collar and hinge in the approved artwork.
export const JOINTS={slew:[1158,575],boom:[922,454]};
export const SPRITES={
  chassis:{file:'chassis.png',offset:[616,552],width:1031,height:330,
    silhouette:[629,565,1006,306],pivot:JOINTS.slew},
  body:{file:'body.png',offset:[841,171],width:760,height:443,
    silhouette:[859,219,725,375],pivot:JOINTS.slew,pick:[1075,350]},
  arm:{file:'arm.png',offset:[15,89],width:951,height:650,
    silhouette:[24,114,921,607],pivot:JOINTS.boom,pick:[609,234],
    outline:[[24,546],[43,497],[55,484],[190,352],[392,161],[432,139],[484,118],[519,114],[527,114],[803,194],[823,204],[872,251],[901,298],[928,352],[944,450],[944,459],[939,471],[926,481],[923,482],[199,720],[143,705],[93,691],[77,680],[44,626],[29,588],[24,564]],
    installAngle:-8*Math.PI/180},
};
