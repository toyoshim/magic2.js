"use strict";function _classCallCheck(t,a){if(!(t instanceof a))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function t(t,a){for(var e=0;e<a.length;e++){var s=a[e];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(t,s.key,s)}}return function(a,e,s){return e&&t(a.prototype,e),s&&t(a,s),a}}();!function(t){var a=Symbol(),e=0,s=1,i=2,r=3,c=4,o=5,n=6,l=7,h=8,v=9,d=11,f=12,u=13,g=14,b=15,p=16,y=17,m=18,w=19,x=20,k=21,P=0,z=1,T=2,S=3,R=4,X=5,Y=6,E=7,A=8,C=1,I=2,M=function(t,a){return t[a]<<8|t[a+1]},O=function(t,a){var e=M(t,a);return e<32768?e:e-65536},_={x:0,y:0,z:0,dx:0,dy:0,dz:0,m:[[0,0,0,0],[0,0,0,0],[0,0,0,0]],setup:function(t,a,e){this.dx=t[S],this.dy=t[R],this.dz=t[X];var s=Math,i=t[P]-a,r=t[z],c=t[T],o=t[Y]/180*s.PI,n=t[E]/180*s.PI,l=t[A]/180*s.PI,h=s.cos(o),v=s.cos(n),d=s.cos(l),f=s.sin(o),u=s.sin(n),g=s.sin(l),b=this.m;b[0][0]=f*u*g+h*d,b[0][1]=g*v,b[0][2]=h*u*g-f*d,b[0][3]=this.dx+i,b[1][0]=f*u*d-g*h,b[1][1]=v*d,b[1][2]=h*u*d+f*g,b[1][3]=this.dy+r,b[2][0]=f*v,b[2][1]=-u,b[2][2]=h*v,b[2][3]=this.dz+c+e},convert:function(t,a,e){var s=t-this.dx,i=a-this.dy,r=e-this.dz,c=this.m;this.x=c[0][0]*s+c[0][1]*i+c[0][2]*r+c[0][3],this.y=c[1][0]*s+c[1][1]*i+c[1][2]*r+c[1][3],this.z=c[2][0]*s+c[2][1]*i+c[2][2]*r+c[2][3]}},F={x:0,y:0,z:0,m:[[0,0,0],[0,0,0],[0,0,0]],setup:function(t,a,e){var s=Math,i=a/180*s.PI*(e<0?-1:1),r=(e+90)/180*s.PI*(e<0?1:-1),c=t/180*s.PI,o=s.cos(i),n=s.cos(r),l=s.cos(c),h=s.sin(i),v=s.sin(r),d=s.sin(c),f=this.m;f[0][0]=-h*v*d+o*l,f[0][1]=-h*n,f[0][2]=h*v*l+o*d,f[1][0]=o*v*d+h*l,f[1][1]=o*n,f[1][2]=-o*v*l+h*d,f[2][0]=-n*d,f[2][1]=v,f[2][2]=n*l},convert:function(t,a,e){var s=this.m;this.x=s[0][0]*t+s[0][1]*a+s[0][2]*e,this.y=s[1][0]*t+s[1][1]*a+s[1][2]*e,this.z=s[2][0]*t+s[2][1]*a+s[2][2]*e}},L=function(){function t(e){_classCallCheck(this,t),this[a]={window:{x:0,y:0,w:0,h:0},orientation:{alpha:0,beta:0,gamma:-90,baseAlpha:void 0},depth:{minz:50,maxz:2e3},cext:!1,color:15,parameters:[0,0,0,0,0,0,0,0,0],data:{pct:0,vertices:new Int16Array(24576),lct:0,indices:new Uint16Array(16384),color:0},translate:{vertices:new Float32Array(24576),indices:new Float32Array(16384)},palette:[{r:0,g:0,b:0,c:"rgba(  0,   0,   0, 1.0)"},{r:85,g:85,b:85,c:"rgba( 85,  85,  85, 1.0)"},{r:0,g:0,b:127,c:"rgba(  0,   0, 127, 1.0)"},{r:0,g:0,b:255,c:"rgba(  0,   0, 255, 1.0)"},{r:127,g:0,b:0,c:"rgba(127,   0,   0, 1.0)"},{r:255,g:0,b:0,c:"rgba(255,   0,   0, 1.0)"},{r:127,g:0,b:127,c:"rgba(127,   0, 127, 1.0)"},{r:255,g:0,b:255,c:"rgba(255,   0, 255, 1.0)"},{r:0,g:127,b:0,c:"rgba(  0, 127,   0, 1.0)"},{r:0,g:255,b:0,c:"rgba(  0, 255,   0, 1.0)"},{r:0,g:127,b:127,c:"rgba(  0, 127, 127, 1.0)"},{r:0,g:255,b:255,c:"rgba(  0, 255, 255, 1.0)"},{r:127,g:127,b:0,c:"rgba(127, 127,   0, 1.0)"},{r:255,g:255,b:0,c:"rgba(255, 255,   0, 1.0)"},{r:170,g:170,b:170,c:"rgba(170, 170, 170, 1.0)"},{r:255,g:255,b:255,c:"rgba(255, 255, 255, 1.0)"}],contexts:e,fgcontext:0,bgcontext:1,clients:[],apage:0,vr:0,updatePalette:function(t){var e=this[a].palette[t];e.c="rgba("+e.r+","+e.g+","+e.b+",1.0)",e.l=.299*e.r+.587*e.g+.114*e.b|0,e.cl="rgba("+e.l+",0,0,1.0)",e.cr="rgba(0,0,"+e.l+",1.0)"}.bind(this),draw:function(t){var e=this[a].data.vertices,s=3*this[a].data.pct,i=this[a].translate.vertices;_.setup(this[a].parameters,t.position,this[a].depth.minz);var r;for(r=0;r<s;r+=3)_.convert(e[r+0],e[r+1],e[r+2]),i[r+0]=_.x,i[r+1]=_.y,i[r+2]=_.z;if(this.vr()){var c=this[a].orientation;for(F.setup(c.alpha+t.alpha,c.beta,c.gamma),r=0;r<s;r+=3)F.convert(i[r+0],i[r+1],i[r+2]),i[r+0]=F.x,i[r+1]=F.y,i[r+2]=F.z}var o=this[a].depth.maxz+this[a].depth.minz;for(r=0;r<s;r+=3){var n=i[r+2];if(!(n<=0||o<n)){var l=n/256;i[r+0]/=l,i[r+1]/=l}}var h=this[a].data.indices,v=2*this[a].data.lct,d=this[a].contexts[this[a].bgcontext];d.save(),d.beginPath(),d.rect(t.base,0,t.width,d.canvas.height),d.clip(),d.closePath(),d.beginPath(),d.strokeStyle=this[a].palette[this[a].data.color][t.color];var f=256*t.scaleX,u=256*t.scaleY,g=t.base+t.width/2,b=u/2,p=f/256,y=u/256;for(r=0;r<v;r+=2){var m=3*h[r+0],w=3*h[r+1],x=i[m+2],k=i[w+2];x<=0||o<x||k<=0||o<k||(d.moveTo(g+i[m+0]*p,b+i[m+1]*y),d.lineTo(g+i[w+0]*p,b+i[w+1]*y))}d.closePath(),d.stroke(),d.restore()}.bind(this)};var s=this[a].contexts[this[a].fgcontext];s.canvas.style.display="block";var i=this[a].contexts[this[a].bgcontext];i.canvas.style.display="none";var r=!0,c=!1,o=void 0;try{for(var n,l=this[a].contexts[Symbol.iterator]();!(r=(n=l.next()).done);r=!0){var h=n.value;h.clearRect(0,0,s.canvas.width,s.canvas.height),h.globalCompositeOperation="lighter"}}catch(t){c=!0,o=t}finally{try{!r&&l.return&&l.return()}finally{if(c)throw o}}}return _createClass(t,[{key:"palette",value:function t(e,s){if(void 0==s)return this[a].palette[e];var i=0==(1&s)?0:4,r=((s>>6&31)<<3)+i,c=((s>>11&31)<<3)+i,o=((s>>1&31)<<3)+i,t=this[a].palette[e];t.r=r,t.g=c,t.b=o,this[a].updatePalette(e)}},{key:"vr",value:function(t){if(void 0===t)return this[a].vr;var e=this[a].vr;this[a].vr=t;for(var s=0;s<16;++s)this[a].updatePalette(s);return e}},{key:"orientation",value:function t(e,s,i){var t=this[a].orientation;void 0===t.baseAlpha&&(t.baseAlpha=e),t.alpha=e-t.baseAlpha,t.beta=s,t.gamma=i}},{key:"context",value:function(t){var e=this[a].vr==C,s=this[a].contexts[0].canvas,i=e&&2==t?s.width/2:0,r=e&&0!=t?s.width/2:s.width,c=e&&0!=t?1:4/3,o=this[a].vr!=I?"c":1==t?"cl":"cr";return{color:o,base:i,width:r,offset:i+(r-s.height*c)/2,position:0==t?0:1==t?-10:10,alpha:0==t?0:1==t?-2:2,aspect:c,scaleX:s.height/256*c,scaleY:s.height/256}}},{key:"vsync",value:function(t){this[a].clients.push(t)}},{key:"line",value:function(t,e){var s=this[a].contexts[this[a].apage],i=t.length;if(this[a].vr){var r=this.context(1);s.strokeStyle=this[a].palette[this[a].color][r.color],s.beginPath(),s.moveTo(t[0]*r.scaleX+r.offset,e[0]*r.scaleY);for(var c=1;c<i;++c)s.lineTo(t[c]*r.scaleX+r.offset,e[c]*r.scaleY);s.stroke();var o=this.context(2);s.strokeStyle=this[a].palette[this[a].color][o.color],s.beginPath(),s.moveTo(t[0]*o.scaleX+o.offset,e[0]*o.scaleY);for(var n=1;n<i;++n)s.lineTo(t[n]*o.scaleX+o.offset,e[n]*o.scaleY);s.stroke()}else{var l=this.context(0);s.strokeStyle=this[a].palette[this[a].color][l.color],s.beginPath(),s.moveTo(t[0]*l.scaleX+l.offset,e[0]*l.scaleY);for(var h=1;h<i;++h)s.lineTo(t[h]*l.scaleX+l.offset,e[h]*l.scaleY);s.stroke()}}},{key:"boxFull",value:function(t,e,s,i){var r=Math.min(t,s),c=Math.min(e,i),o=Math.abs(s-t),n=Math.abs(i-e),l=this[a].contexts[this[a].apage];if(this[a].vr){var h=this.context(1);l.fillStyle=this[a].palette[this[a].color][h.color],l.fillRect(r*h.scaleX+h.offset,c*h.scaleY,o*h.scaleX,n*h.scaleY);var v=this.context(2);l.fillStyle=this[a].palette[this[a].color][v.color],l.fillRect(r*v.scaleX+v.offset,c*v.scaleY,o*v.scaleX,n*v.scaleY)}else{var d=this.context(0);l.fillStyle=this[a].palette[this[a].color][d.color],l.fillRect(r*d.scaleX+d.offset,c*d.scaleY,o*d.scaleX,n*d.scaleY)}}},{key:"setWindow",value:function(t,e,s,i){this[a].window.x=t,this[a].window.y=e,this[a].window.w=s-t,this[a].window.h=i-e}},{key:"cls",value:function(){var t=this[a].contexts[this[a].apage];t.clearRect(0,0,t.canvas.width,t.canvas.height)}},{key:"set3dParameter",value:function(t,e){this[a].parameters[t]=e}},{key:"set3dData",value:function(t,e,s,i,r){this[a].data.pct=t,this[a].data.vertices=e,this[a].data.lct=s,this[a].data.indices=i,this[a].data.color=void 0!==r?r:this[a].color}},{key:"set3dRawData",value:function(t,e){var s=e;this[a].data.pct=M(t,e),e+=2;for(var i=0;i<this[a].data.pct;++i)this[a].data.vertices[3*i+0]=O(t,e+0),this[a].data.vertices[3*i+1]=O(t,e+2),this[a].data.vertices[3*i+2]=O(t,e+4),e+=6;this[a].data.lct=M(t,e),e+=2,this[a].cext?(this[a].data.color=15&M(t,e),e+=2):this[a].data.color=this[a].color;for(var r=0;r<this[a].data.lct;++r)this[a].data.indices[2*r+0]=M(t,e+0),this[a].data.indices[2*r+1]=M(t,e+2),e+=4;return e-s}},{key:"translate3dTo2d",value:function(){this[a].vr?(this[a].draw(this.context(1)),this[a].draw(this.context(2))):this[a].draw(this.context(0))}},{key:"display2d",value:function(){var t=this[a].fgcontext;this[a].fgcontext=this[a].bgcontext,this[a].bgcontext=t;var e=this[a].contexts[this[a].fgcontext],s=this[a].contexts[this[a].bgcontext];if(this[a].vr){var i=this.context(1),r=this.context(2),c=!0,o=!1,n=void 0;try{for(var l,h=this[a].clients[Symbol.iterator]();!(c=(l=h.next()).done);c=!0){var v=l.value;v(e,i),v(e,r)}}catch(t){o=!0,n=t}finally{try{!c&&h.return&&h.return()}finally{if(o)throw n}}s.clearRect(0,0,s.canvas.width,s.canvas.height),s.fillStyle=this[a].palette[0][i.color],s.fillRect(0,0,s.canvas.width,s.canvas.height),s.fillStyle=this[a].palette[0][r.color],s.fillRect(0,0,s.canvas.width,s.canvas.height)}else{var d=this.context(0),f=!0,u=!1,g=void 0;try{for(var b,p=this[a].clients[Symbol.iterator]();!(f=(b=p.next()).done);f=!0){var v=b.value;v(e,d)}}catch(t){u=!0,g=t}finally{try{!f&&p.return&&p.return()}finally{if(u)throw g}}s.clearRect(0,0,s.canvas.width,s.canvas.height),s.fillStyle=this[a].palette[0][d.color],s.fillRect(0,0,s.canvas.width,s.canvas.height)}e.canvas.style.display="block",s.canvas.style.display="none"}},{key:"color",value:function(t){this[a].color=t}},{key:"crt",value:function(t){console.warn("magic2: partially ignoring command CRT, "+t),this[a].cext=0!=(256&t)}},{key:"auto",value:function(t,a){for(var P=!1;;){var z=M(t,a);switch(a+=2,z){case e:for(var T=M(t,a+0),S=[],R=[],X=0;X<T;++X)S.push(M(t,a+2+4*X)),R.push(M(t,a+4+4*X));a+=2+4*T,this.line(S,R);break;case s:throw new Error("magic2: unsupported command SPLINE");case i:throw a+=8,new Error("magic2: unsupported command BOX");case r:throw new Error("magic2: unsupported command TRIANGLE");case c:var Y=M(t,a+0),E=M(t,a+2),A=M(t,a+4),C=M(t,a+6);a+=8,this.boxFull(Y,E,A,C);break;case o:throw new Error("magic2: unsupported command CIRCLE_FULL");case n:var I=M(t,a+0),_=M(t,a+2),F=M(t,a+4),L=M(t,a+6);a+=8,this.setWindow(I,_,F,L);break;case l:var D=M(t,a);a+=2,console.warn("magic2: ignoring command SET_MODE, "+D);break;case h:throw new Error("magic2: unsupported command POINT");case v:this.cls();break;case d:var U=M(t,a+0),N=O(t,a+2);a+=4,this.set3dParameter(U,N);break;case f:a+=this.set3dRawData(t,a);break;case u:this.translate3dTo2d();break;case g:this.display2d(),P=!0;break;case b:return P;case p:var W=M(t,a);a+=2,this.color(W);break;case y:var j=M(t,a);a+=2,this.crt(j);break;case m:break;case w:throw new Error("magic2: AUTO should not be used inside AUTO");case x:var B=M(t,a);a+=2,this.apage(B);break;case k:var G=M(t,a+0),q=M(t,a+2);a+=4,this.depth(G,q);break;default:throw new Error("magic2: unknown command "+z)}}}},{key:"apage",value:function(t){this[a].apage=t}},{key:"depth",value:function(t,e){this[a].depth.minz=t,this[a].depth.maxz=e}}]),t}();t.Magic2=L}("undefined"!=typeof global?global:"undefined"!=typeof module?module.exports:window);