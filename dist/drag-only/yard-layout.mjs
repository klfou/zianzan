// Plan around the crawler, rather than moving it when a loose part needs room.
export function yardLayout(w,h,chassis,body,arm){
  const compact=w/h<1.1, padding=Math.max(6,Math.min(w*.027,24));
  const ground=h*(compact?.721:.746);
  const bodyGround=h*(compact?.958:.978);
  const armGround=h*(compact?.949:.970);
  const k=Math.min(w/2480,(bodyGround-ground-h*.010)/body[3])*.978;
  const center=w*.613;
  const [bx,by,bw,bh]=chassis;
  const track={x:center-(bx+bw*.5)*k,y:ground-(by+bh)*k};
  const [ax,ay,aw,ah]=arm;
  const armLeft=Math.max(padding,Math.min(w*.133,center-(bw*.5+aw)*k-padding*.66));
  const [ux,uy,uw,uh]=body;
  return {k,track,
    arm:{x:armLeft-ax*k,y:armGround-(ay+ah)*k},
    body:{x:w*.868-(ux+uw)*k,y:bodyGround-(uy+uh)*k}
  };
}
