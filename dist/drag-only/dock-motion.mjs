const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function turn([x,y],[a,b],angle) {
  const u=x-a,v=y-b,C=Math.cos(angle),S=Math.sin(angle);
  return [a+u*C-v*S,b+u*S+v*C];
}
// Advance a rigid piece toward its joint. The grab point remains under the
// cursor outside the magnet zone; nothing jumps when entering or leaving it.
export function approach({point,grab,pivot,initialAngle,goal,scale,radius=[116,93],enabled=true}) {
  const from=turn(grab,pivot,initialAngle), make=(q,a)=>({x:point.x-q[0]*scale,y:point.y-q[1]*scale,angle:a});
  const raw=make(from,initialAngle);
  if(!enabled)return {pose:raw,ready:false,blend:0};
  const distance=(x,y)=>Math.hypot(x/Math.max(40,scale*radius[0]),y/Math.max(36,scale*radius[1]));
  const d=distance(raw.x-goal.x,raw.y-goal.y);
  const mounted=turn(grab,pivot,goal.angle);
  const dx=point.x-goal.x-mounted[0]*scale,dy=point.y-goal.y-mounted[1]*scale;
  const gd=distance(dx,dy), a=Math.min(d,gd);
  const blend=smooth((1.63-a)/1.45);
  const angle=initialAngle+(goal.angle-initialAngle)*blend, gripPose=make(turn(grab,pivot,angle),angle);
  // When the physical connector leads the pointer, keep it stable during rotation.
  const around=smooth((d-gd+0.26)/.52);
  const rigid={x:raw.x+(gripPose.x-raw.x)*around,y:raw.y+(gripPose.y-raw.y)*around};
  const pull=blend;
  const pose={x:rigid.x+(goal.x-rigid.x)*pull,y:rigid.y+(goal.y-rigid.y)*pull,angle};
  return {pose,ready:a<=.71,blend};
}
