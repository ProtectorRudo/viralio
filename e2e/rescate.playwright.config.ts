import {defineConfig} from "@playwright/test";

export default defineConfig({
 testDir:".",
 testMatch:"rescate.spec.ts",
 fullyParallel:false,
 retries:0,
 reporter:"list",
 expect:{timeout:10000},
 timeout:90000,
 use:{baseURL:"http://127.0.0.1:4173",browserName:"chromium",trace:"retain-on-failure",
  launchOptions:{args:["--enable-webgl","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}},
 webServer:{
  command:"python3 -m http.server 4173 --directory showcase --bind 127.0.0.1",
  url:"http://127.0.0.1:4173/",
  reuseExistingServer:false,
  timeout:15000,
 },
 projects:[{name:"mobile-rescue",use:{viewport:{width:390,height:844},hasTouch:true,isMobile:true}},{name:"desktop-rescue",use:{viewport:{width:1280,height:820}}}],
});
