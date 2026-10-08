import {build,transform} from 'esbuild';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const dir=resolve('dist/hijos-standalone');
mkdirSync(dir,{recursive:true});
await build({
  entryPoints:['src/app/tehiceesto/hijos-standalone-entry.tsx'],
  bundle:true,platform:'browser',format:'iife',target:['es2022'],jsx:'automatic',
  alias:{'next/link':resolve('scripts/hijos-standalone-link.tsx')},
  define:{'process.env.NODE_ENV':'"production"'},
  outfile:join(dir,'app.js'),minify:true,legalComments:'none',
  logLevel:'warning',
});
const layout=readFileSync('src/app/tehiceesto/layout.tsx','utf8');
const names=[...layout.matchAll(/import "\.\/([^"]+\.css)";/g)].map(m=>m[1]);
const sheets=['src/app/globals.css',...names.map(name=>'src/app/tehiceesto/'+name)];
const css=sheets.map(path=>readFileSync(path,'utf8')).join('\n\n');
const output=await transform(css,{loader:'css',minify:true,legalComments:'none',target:'chrome110'});
writeFileSync(join(dir,'app.css'),output.code);
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071522"><title>Hijos | Te Hice Esto</title><meta name="description" content="Una historia emocionante de infancia, recuerdos y amor para regalar"><link rel="stylesheet" href="./app.css"></head><body><div id="hijos-root"></div><script src="./app.js" defer></script></body></html>';
writeFileSync(join(dir,'index.html'),html);
console.log(JSON.stringify({files:sheets,jsBytes:readFileSync(join(dir,'app.js')).length,cssBytes:output.code.length,htmlBytes:html.length}));
