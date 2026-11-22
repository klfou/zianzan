// V14: exactly two independently moving objects in mounted image geometry.
// This draft imports the actual V13 paths with their shared, identical seam.
// For integration copy V13 modules nearby or inline the exported constants.
import { ARM as MOUNTED_ARM, CAB } from './mounted-a.mjs?v=14';
import { ENGINE } from './mounted-b.mjs?v=14';

const c0='L1126 161 L1128 164 L1130.5 184 L1130.5 239 L1130.5 265.5';
const e0='L1130.5 239 L1130.5 184 L1128 164 L1126 161 L1124 140 Z';
if (!CAB.path.includes(c0) || !ENGINE.path.includes(e0))
  throw Error('V13 shared upper-body seam drifted');
const engine = ENGINE.path.replace(/^M1124 140 /,'').replace(e0,'').trim();
export const ARM = MOUNTED_ARM;
export const BODY = {
  id:'body',
  // Keep this box fixed for all drag and seated states, plus revealed nose.
  bounds:[863,82,427,192],
  reference:[1051,198],
  path:CAB.path.replace(c0,engine)
};

// Local reveal drawn behind V13 body at all positions. The next clip to
// ARM.path guarantees it cannot replace original pixels once arm snaps.
export const AUX = Object.freeze({
  path:'M866 248 Q866 241 871 241 L880 241 L892 244 Q902 240 908 233 L909 225 Q910 220 914 220 Q923 220 930 227 L939 234 L947 240 L950 258 L944 265 L926 264 L909 262 L894 263 L880 263 L871 262 Q866 258 866 248 Z',
  // crop in the edited 2171×724 file, followed by placement in native V13
  extraction:[990,327,170,100],
  source:[0,0,170,100],
  target:[856.48,206.72,115.6,72],
});
