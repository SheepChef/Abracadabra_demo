if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let a={};const l=e=>n(e,t),u={module:{uri:t},exports:a,require:l};s[t]=Promise.all(i.map((e=>u[e]||l(e)))).then((e=>(r(...e),a)))}}define(["./workbox-7ac4974e"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/bg-CjkYdVK5.webp",revision:null},{url:"assets/favicon-aOK6_042.ico",revision:null},{url:"assets/index-36mmE2rx.js",revision:null},{url:"assets/index-kawgJGu9.css",revision:null},{url:"assets/mdui-round-DrirKXBx.woff2",revision:null},{url:"assets/SamsungSans-Regular-BsRQoNIc.ttf",revision:null},{url:"index.html",revision:"6a2883c076b606f3d7a64f2cf7c85544"},{url:"registerSW.js",revision:"402b66900e731ca748771b6fc5e7a068"},{url:"manifest.webmanifest",revision:"bb69ddda7143ce9786815542f7f773ee"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/\.(?:png|jpg|jpeg|svg)$/,new e.NetworkFirst({cacheName:"wisbayar-images",plugins:[new e.ExpirationPlugin({maxEntries:30})]}),"GET"),e.registerRoute(/.*\.js.*/,new e.StaleWhileRevalidate({cacheName:"wisbayar-js",plugins:[new e.ExpirationPlugin({maxEntries:30,maxAgeSeconds:2592e3}),new e.CacheableResponsePlugin({statuses:[200]})]}),"GET"),e.registerRoute(/.*\.css.*/,new e.StaleWhileRevalidate({cacheName:"wisbayar-css",plugins:[new e.ExpirationPlugin({maxEntries:20,maxAgeSeconds:2592e3}),new e.CacheableResponsePlugin({statuses:[200]})]}),"GET"),e.registerRoute(/.*\.html.*/,new e.StaleWhileRevalidate({cacheName:"wisbayar-html",plugins:[new e.ExpirationPlugin({maxEntries:20,maxAgeSeconds:2592e3}),new e.CacheableResponsePlugin({statuses:[200]})]}),"GET")}));
