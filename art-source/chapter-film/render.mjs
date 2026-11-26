// Run after prepare.py and layers.py. Requires Playwright, Edge/Chromium and ffmpeg.
import {createServer} from "node:http";
import {createReadStream,existsSync,statSync,mkdirSync,writeFileSync,renameSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import {spawn} from "node:child_process";
import {once} from "node:events";
const {chromium}=createRequire(import.meta.url)("playwright");
const source=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(source,"../..");
const out=path.join(repo,"dist/story-film"),keyframes=path.join(source,"keyframes");
mkdirSync(out,{recursive:true});mkdirSync(keyframes,{recursive:true});
const server=createServer((req,res)=>{
 const uri=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 if(uri==="/"){res.setHeader("Content-Type","text/html; charset=utf-8");res.end('<meta charset=utf-8><canvas id="movie"></canvas>');return}
 const f=path.resolve(repo,"."+uri);
 if(!f.startsWith(repo+path.sep)||!existsSync(f)||!statSync(f).isFile()){res.writeHead(404);res.end();return}
 res.setHeader("Content-Type",({".mjs":"text/javascript",".json":"application/json",".webp":"image/webp",".png":"image/png"})[path.extname(f)]||"application/octet-stream");createReadStream(f).pipe(res);
});
server.listen(0,"127.0.0.1");await once(server,"listening");
let browser,child;
try {
 browser=await chromium.launch({channel:process.env.FILM_BROWSER||"msedge",headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on("pageerror",e=>console.error(e));
 await page.goto("http://127.0.0.1:"+server.address().port);
 const shots=await page.evaluate(async()=>{window.film=await import("/art-source/chapter-film/film.mjs");return film.start()});
 const temp=path.join(out,"building.partial.mp4");
 child=spawn(process.env.FFMPEG||"ffmpeg",["-hide_banner","-loglevel","warning","-y","-f","image2pipe","-framerate","20","-c:v","mjpeg","-i","pipe:0","-i",path.join(source,"narration.wav"),"-map","0:v","-map","1:a","-c:v","libx264","-preset","fast","-crf","19","-pix_fmt","yuv420p","-c:a","aac","-b:a","96k","-movflags","+faststart",temp],{stdio:["pipe","ignore","inherit"],windowsHide:true});
 const finished=once(child,"close");
 for(const [i,s] of shots.entries()){
   const keys=new Map([[0,"start"],[Math.floor(s.frames*.55),"action"],[s.frames-1,"end"]]);
   for(let start=0;start<s.frames;start+=10){
     const frames=await page.evaluate(([i,start,count])=>Array.from({length:count},(_,j)=>film.frame(i,start+j)),[i,start,Math.min(10,s.frames-start)]);
     for(const [j,uri] of frames.entries()){
       const buf=Buffer.from(uri,"base64");
       if(keys.has(start+j))writeFileSync(path.join(keyframes,s.id+"-"+keys.get(start+j)+".jpg"),buf);
       if(!child.stdin.write(buf))await once(child.stdin,"drain");
     }
   }
   console.log((i+1)+"/"+shots.length,s.id);
 }
 child.stdin.end();const [status]=await finished;if(status!==0)throw Error("ffmpeg exit "+status);
 renameSync(temp,path.join(out,"first-light.mp4"));
}finally{child?.kill();await browser?.close();server.close()}

