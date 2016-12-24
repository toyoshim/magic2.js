// Copyright 2016 Takashi Toyoshima <toyoshim@gmail.com>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function (global) {
'use strict';

// A special symbol to hide private members.
const _ = Symbol();

// MAGIC2 Commands.
const C_LINE = 0x00;
const C_SPLINE = 0x01;
const C_BOX = 0x02;
const C_TRIANGLE = 0x03;
const C_BOX_FULL = 0x04;
const C_CIRCLE_FULL = 0x05;
const C_SET_WINDOW = 0x06;
const C_SET_MODE = 0x07;
const C_POINT = 0x08;
const C_CLS = 0x09;
const C_SET_3D_PARAMETER = 0x0b;
const C_SET_3D_DATA = 0x0c;
const C_TRANSLATE_3D_TO_2D = 0x0d;
const C_DISPLAY_2D = 0x0e;
const C_DONE = 0x0f;
const C_COLOR = 0x10;
const C_CRT = 0x11;
const C_INIT = 0x12;
const C_AUTO = 0x13;
const C_APAGE = 0x14;
const C_DEPTH = 0x15;

// 3D Parameters.
const P_CX = 0;
const P_CY = 1;
const P_CZ = 2;
const P_DX = 3;
const P_DY = 4;
const P_DZ = 5;
const P_HEAD = 6;
const P_PITCH = 7;
const P_BANK = 8;

// VR mode.
const V_NORMAL = 0;
const V_SPLIT = 1;
const V_COLOR = 2;

/**
 * Decodes an unsigned 16-bit number in big endian.
 * @param {Uint8Array} memory memory image
 * @param {Number} addr memory address
 * @param {Number} read value
 */
const mem_read_u16be = function (memory, addr) {
  return (memory[addr] << 8) | memory[addr + 1];
};

/**
 * Decodes a signed 16-bit number in big endian.
 * @param {Uint8Array} memory memory image
 * @param {Number} addr memory address
 * @param {Number} read value
 */
const mem_read_s16be = function (memory, addr) {
  const u16be = mem_read_u16be(memory, addr);
  if (u16be < 0x8000)
    return u16be;
  return u16be - 0x10000;
};

const translate = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
  dx: 0.0,
  dy: 0.0,
  dz: 0.0,
  m: [[ 0.0, 0.0, 0.0, 0.0 ],
      [ 0.0, 0.0, 0.0, 0.0 ],
      [ 0.0, 0.0, 0.0, 0.0 ]],

  setup: function (parameters, position, minz) {
    this.dx = parameters[P_DX];
    this.dy = parameters[P_DY];
    this.dz = parameters[P_DZ];

    const math = Math;
    const cx = parameters[P_CX] - position;
    const cy = parameters[P_CY];
    const cz = parameters[P_CZ];
    const rh = parameters[P_HEAD] / 180 * math.PI;
    const rp = parameters[P_PITCH] / 180 * math.PI;
    const rb = parameters[P_BANK] / 180 * math.PI;
    const ch = math.cos(rh);
    const cp = math.cos(rp);
    const cb = math.cos(rb);
    const sh = math.sin(rh);
    const sp = math.sin(rp);
    const sb = math.sin(rb);
    const m = this.m;
    m[0][0] = sh * sp * sb + ch * cb;
    m[0][1] = sb * cp;
    m[0][2] = ch * sp * sb - sh * cb;
    m[0][3] = this.dx + cx;
    m[1][0] = sh * sp * cb - sb * ch;
    m[1][1] = cp * cb;
    m[1][2] = ch * sp * cb + sh * sb;
    m[1][3] = this.dy + cy;
    m[2][0] = sh * cp;
    m[2][1] = -sp;
    m[2][2] = ch * cp;
    m[2][3] = this.dz + cz + minz;
  },

  convert: function (sx, sy, sz) {
    var x = sx - this.dx;
    var y = sy - this.dy;
    var z = sz - this.dz;
    var m = this.m;
    this.x = m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3];
    this.y = m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3];
    this.z = m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3];
  }
};

// TODO: Composite ctranslation and camera matrix.
const camera = {
  x: 0.0,
  y: 0.0,
  z: 0.0,
  m: [[ 0.0, 0.0, 0.0 ],
      [ 0.0, 0.0, 0.0 ],
      [ 0.0, 0.0, 0.0 ]],

  setup: function (alpha, beta, gamma) {
    const math = Math;
    const a = beta / 180 * math.PI * ((gamma < 0) ? -1 : 1);
    const b = (gamma + 90) / 180 * math.PI * ((gamma < 0) ? 1 : -1);
    const c = alpha / 180 * math.PI;
    const ca = math.cos(a);
    const cb = math.cos(b);
    const cc = math.cos(c);
    const sa = math.sin(a);
    const sb = math.sin(b);
    const sc = math.sin(c);
    const m = this.m;
    m[0][0] = -sa * sb * sc + ca * cc;
    m[0][1] = -sa * cb;
    m[0][2] =  sa * sb * cc + ca * sc;
    m[1][0] =  ca * sb * sc + sa * cc;
    m[1][1] =  ca * cb;
    m[1][2] = -ca * sb * cc + sa * sc;
    m[2][0] = -cb * sc;
    m[2][1] =  sb;
    m[2][2] =  cb * cc;
  },

  convert: function (x, y, z) {
    var m = this.m;
    this.x = m[0][0] * x + m[0][1] * y + m[0][2] * z;
    this.y = m[1][0] * x + m[1][1] * y + m[1][2] * z;
    this.z = m[2][0] * x + m[2][1] * y + m[2][2] * z;
  }
};

class Magic2 {
  // constructor
  // @param {CanvasRenderingContext2D} context
  constructor (contexts) {
    this[_] = {
      // private members
      window: {
        x: 0,
        y: 0,
        w: 0,
        h: 0
      },
      orientation: {
        alpha: 0.0,
        beta: 0.0,
        gamma: -90.0,
        baseAlpha: undefined
      },
      depth: {
        minz: 50,
        maxz: 2000,
      },
      cext: false,
      color: 15,
      parameters: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      data: {
        pct: 0,
        vertices: new Int16Array(8192 * 3),
        lct: 0,
        indices: new Uint16Array(8192 * 2),
        color: 0
      },
      translate: {
        vertices: new Float32Array(8192 * 3),
        indices: new Float32Array(8192 * 2)
      },
      palette: [
        { r:   0, g:   0, b:   0, c: 'rgba(  0,   0,   0, 1.0)' },  //  0
        { r:  85, g:  85, b:  85, c: 'rgba( 85,  85,  85, 1.0)' },  //  1
        { r:   0, g:   0, b: 127, c: 'rgba(  0,   0, 127, 1.0)' },  //  2
        { r:   0, g:   0, b: 255, c: 'rgba(  0,   0, 255, 1.0)' },  //  3
        { r: 127, g:   0, b:   0, c: 'rgba(127,   0,   0, 1.0)' },  //  4
        { r: 255, g:   0, b:   0, c: 'rgba(255,   0,   0, 1.0)' },  //  5
        { r: 127, g:   0, b: 127, c: 'rgba(127,   0, 127, 1.0)' },  //  6
        { r: 255, g:   0, b: 255, c: 'rgba(255,   0, 255, 1.0)' },  //  7
        { r:   0, g: 127, b:   0, c: 'rgba(  0, 127,   0, 1.0)' },  //  8
        { r:   0, g: 255, b:   0, c: 'rgba(  0, 255,   0, 1.0)' },  //  9
        { r:   0, g: 127, b: 127, c: 'rgba(  0, 127, 127, 1.0)' },  // 10
        { r:   0, g: 255, b: 255, c: 'rgba(  0, 255, 255, 1.0)' },  // 11
        { r: 127, g: 127, b:   0, c: 'rgba(127, 127,   0, 1.0)' },  // 12
        { r: 255, g: 255, b:   0, c: 'rgba(255, 255,   0, 1.0)' },  // 13
        { r: 170, g: 170, b: 170, c: 'rgba(170, 170, 170, 1.0)' },  // 14
        { r: 255, g: 255, b: 255, c: 'rgba(255, 255, 255, 1.0)' }   // 15
      ],
      contexts: contexts,
      fgcontext: 0,
      bgcontext: 1,
      clients: [],
      apage: 0,
      vr: 0,
      updatePalette: function (i) {
        const palette = this[_].palette[i];
        palette.c =
            'rgba(' + palette.r + ',' + palette.g + ',' + palette.b + ',1.0)';
        palette.l =
            (0.299 * palette.r + 0.587 * palette.g + 0.114 * palette.b) | 0;
        palette.cl = 'rgba(' + palette.l + ',0,0,1.0)';
        palette.cr = 'rgba(0,0,' + palette.l + ',1.0)';
      }.bind(this),
      draw: function (context) {
        var src = this[_].data.vertices;
        var pctx3 = this[_].data.pct * 3;
        var vertices = this[_].translate.vertices;
        translate.setup(this[_].parameters, context.position, this[_].depth.minz);
        var i;
        for (i = 0; i < pctx3; i += 3) {
          translate.convert(src[i + 0], src[i + 1], src[i + 2]);
          vertices[i + 0] = translate.x;
          vertices[i + 1] = translate.y;
          vertices[i + 2] = translate.z;
        }
        if (this.vr()) {
          var orientation = this[_].orientation;
          camera.setup(orientation.alpha + context.alpha, orientation.beta, orientation.gamma);
          for (i = 0; i < pctx3; i += 3) {
            camera.convert(vertices[i + 0], vertices[i + 1], vertices[i + 2]);
            vertices[i + 0] = camera.x;
            vertices[i + 1] = camera.y;
            vertices[i + 2] = camera.z;
          }
        }

        // Perspective
        var maxz = this[_].depth.maxz;
        for (i = 0; i < pctx3; i += 3) {
          var nz = vertices[i + 2];
          if (nz <= 0 || maxz < nz)
            continue;
          var d = nz / 256;
          vertices[i + 0] /= d;
          vertices[i + 1] /= d;
        }
        // Draw
        var indices = this[_].data.indices;
        var lctx2 = this[_].data.lct * 2;
        var c = this[_].contexts[this[_].bgcontext];
        c.save();
        c.beginPath();
        c.rect(context.base, 0, context.width, c.canvas.height);
        c.clip();
        c.closePath();
        c.beginPath();
        c.strokeStyle = this[_].palette[this[_].data.color][context.color];
        var w = 256 * context.scaleX;
        var h = 256 * context.scaleY;
        var ox = context.base + context.width / 2;
        var oy = h / 2;
        // FIXME: Use window information
        var zx = w / 256;
        var zy = h / 256;
        for (i = 0; i < lctx2; i += 2) {
          var s = indices[i + 0] * 3;
          var e = indices[i + 1] * 3;
          var sz = vertices[s + 2];
          var ez = vertices[e + 2];
          if (sz <= 0 || maxz < sz || ez <= 0 || maxz < ez)
            continue;
          c.moveTo(ox + vertices[s + 0] * zx, oy + vertices[s + 1] * zy);
          c.lineTo(ox + vertices[e + 0] * zx, oy + vertices[e + 1] * zy);
        }
        c.closePath();
        c.stroke();
        c.restore();
      }.bind(this)
    };

    const fg = this[_].contexts[this[_].fgcontext];
    fg.canvas.style.display = 'block';

    const bg = this[_].contexts[this[_].bgcontext];
    bg.canvas.style.display = 'none';

    for (let context of this[_].contexts) {
      context.clearRect(0, 0, fg.canvas.width, fg.canvas.height);
      context.globalCompositeOperation = 'lighter';
    }
  }

  palette (index, color) {
    if (color == undefined)
      return this[_].palette[index];
    var i = (color & 1) == 0 ? 0 : 4;
    var r = (((color >>  6) & 0x1f) << 3) + i;
    var g = (((color >> 11) & 0x1f) << 3) + i;
    var b = (((color >>  1) & 0x1f) << 3) + i;
    var palette = this[_].palette[index];
    palette.r = r;
    palette.g = g;
    palette.b = b;
    this[_].updatePalette(index);
  }

  vr (mode) {
    if (mode === undefined)
      return this[_].vr;
    var result = this[_].vr;
    this[_].vr = mode;
    for (let i = 0; i < 16; ++i)
      this[_].updatePalette(i);
    return result;
  }

  orientation (alpha, beta, gamma) {
    const orientation = this[_].orientation;
    if (orientation.baseAlpha === undefined)
      orientation.baseAlpha = alpha;
    orientation.alpha = alpha - orientation.baseAlpha;
    orientation.beta = beta;
    orientation.gamma = gamma;
  }

  context(mode) {
    const split = this[_].vr == V_SPLIT;
    const c = this[_].contexts[0].canvas;
    const base = (!split || mode != 2) ? 0 : c.width / 2;
    const width = (!split || mode == 0) ? c.width : c.width / 2;
    const aspect = (!split || mode == 0) ? 4 / 3 : 1;
    const color = this[_].vr != V_COLOR ? 'c' : mode == 1 ? 'cl' : 'cr';
    return {
      color: color,
      base: base,
      width: width,
      offset: base + (width - (c.height * aspect)) / 2,
      position: mode == 0 ? 0 : mode == 1 ? -10 : 10,
      alpha: mode == 0 ? 0 : mode == 1 ? -2 : 2,
      aspect: aspect,
      scaleX: c.height / 256 * aspect,
      scaleY: c.height / 256
    };
  }

  vsync (client) {
    this[_].clients.push(client);
  }

  line (x, y) {
    const c = this[_].contexts[this[_].apage];
    const n = x.length;
    if (this[_].vr) {
      const c1 = this.context(1);
      c.strokeStyle = this[_].palette[this[_].color][c1.color];
      c.beginPath();
      c.moveTo(x[0] * c1.scaleX + c1.offset, y[0] * c1.scaleY);
      for (let i = 1; i < n; ++i)
        c.lineTo(x[i] * c1.scaleX + c1.offset, y[i] * c1.scaleY);
      c.stroke();
      const c2 = this.context(2);
      c.strokeStyle = this[_].palette[this[_].color][c2.color];
      c.beginPath();
      c.moveTo(x[0] * c2.scaleX + c2.offset, y[0] * c2.scaleY);
      for (let i = 1; i < n; ++i)
        c.lineTo(x[i] * c2.scaleX + c2.offset, y[i] * c2.scaleY);
      c.stroke();
    } else {
      const context = this.context(0);
      c.strokeStyle = this[_].palette[this[_].color][context.color];
      c.beginPath();
      c.moveTo(x[0] * context.scaleX + context.offset, y[0] * context.scaleY);
      for (let i = 1; i < n; ++i) {
        c.lineTo(x[i] * context.scaleX + context.offset,
            y[i] * context.scaleY);
      }
      c.stroke();
    }
  }

  boxFull (x1, y1, x2, y2) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const c = this[_].contexts[this[_].apage];
    if (this[_].vr) {
      const c1 = this.context(1);
      c.fillStyle = this[_].palette[this[_].color][c1.color];
      c.fillRect(left * c1.scaleX + c1.offset,
                 top * c1.scaleY,
                 width * c1.scaleX,
                 height * c1.scaleY);
      const c2 = this.context(2);
      c.fillStyle = this[_].palette[this[_].color][c2.color];
      c.fillRect(left * c2.scaleX + c2.offset,
                 top * c2.scaleY,
                 width * c2.scaleX,
                 height * c2.scaleY);
    } else {
      const context = this.context(0);
      c.fillStyle = this[_].palette[this[_].color][context.color];
      c.fillRect(left * context.scaleX + context.offset,
                 top * context.scaleY,
                 width * context.scaleX,
                 height * context.scaleY);
    }
  }

  setWindow (x1, y1, x2, y2) {
    this[_].window.x = x1;
    this[_].window.y = y1;
    this[_].window.w = x2 - x1;
    this[_].window.h = y2 - y1;
  }

  cls () {
    const c = this[_].contexts[this[_].apage];
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  }

  set3dParameter (num, data) {
    this[_].parameters[num] = data;
  }

  set3dData (pct, vertices, lct, indices, color) {
    this[_].data.pct = pct;
    this[_].data.vertices = vertices;
    this[_].data.lct = lct;
    this[_].data.indices = indices;
    this[_].data.color = color !== undefined ? color : this[_].color;
  }

  set3dRawData (memory, addr) {
    const base = addr;
    this[_].data.pct = mem_read_u16be(memory, addr);
    addr += 2;
    for (let i = 0; i < this[_].data.pct; ++i) {
      this[_].data.vertices[i * 3 + 0] = mem_read_s16be(memory, addr + 0);
      this[_].data.vertices[i * 3 + 1] = mem_read_s16be(memory, addr + 2);
      this[_].data.vertices[i * 3 + 2] = mem_read_s16be(memory, addr + 4);
      addr += 6;
    }
    this[_].data.lct = mem_read_u16be(memory, addr);
    addr += 2;
    if (this[_].cext) {
      this[_].data.color = mem_read_u16be(memory, addr) & 0x0f;
      addr += 2;
    } else {
      this[_].data.color = this[_].color;
    }
    for (let i = 0; i < this[_].data.lct; ++i) {
      this[_].data.indices[i * 2 + 0] = mem_read_u16be(memory, addr + 0);
      this[_].data.indices[i * 2 + 1] = mem_read_u16be(memory, addr + 2);
      addr += 4;
    }
    return addr - base;
  }

  translate3dTo2d () {
    if (this[_].vr) {
      this[_].draw(this.context(1));
      this[_].draw(this.context(2));
    } else {
      this[_].draw(this.context(0));
    }
  }

  /**
   * Magic2 API: Swap offscreen and show rendered 3D data. Internnaly page 0
   * and 1 are used for rendering 3D objects in offscreen. translate3dTo2d()
   * actually renders a 3D object into the offscreen, and display2d() swap
   * the active page and offscreen page each other.
   */
  display2d () {
    const previous = this[_].fgcontext;
    this[_].fgcontext = this[_].bgcontext;
    this[_].bgcontext = previous;
    const fg = this[_].contexts[this[_].fgcontext];
    if (this[_].vr) {
      var c1 = this.context(1);
      var c2 = this.context(2);
      for (var client of this[_].clients) {
        client(fg, c1);
        client(fg, c2);
      }
    } else {
      var c = this.context(0);
      for (var client of this[_].clients)
        client(fg, c);
    }
    fg.canvas.style.display = 'block';
    const bg = this[_].contexts[this[_].bgcontext];
    bg.canvas.style.display = 'none';
    bg.clearRect(0, 0, bg.canvas.width, bg.canvas.height);
  }

  /**
   * Magic2 API: Sets color for 2D drawing.
   * @param {number} color color palette code
   */
  color (color) {
    this[_].color = color;
  }

  /**
   * Magic2 API: Sets CRT mode.
   * @param {number} crt CRT mode
   *   crt >= 0x100: extended mode (to make set3dData accept color data)
   */
  crt (crt) {
    console.warn('magic2: partially ignoring command CRT, ' + crt);
    this[_].cext = (crt & 0x100) != 0;
  }

  /**
   * Magic2 API: Executes magic commands stored in the specified memory.
   * @param {Uint8Array} memory image
   * @param {Number} addr memory address
   * @return {Boolean} true if canvas is updated and it requires waiting vsync
   */
  auto (memory, addr) {
    let shown = false;
    for (;;) {
      var cmd = mem_read_u16be(memory, addr);
      addr += 2;
      switch (cmd) {
        case C_LINE: {
          const n = mem_read_u16be(memory, addr + 0);
          const x = [];
          const y = [];
          for (let i = 0; i < n; ++i) {
            x.push(mem_read_u16be(memory, addr + 2 + i * 4));
            y.push(mem_read_u16be(memory, addr + 4 + i * 4));
          }
          addr += 2 + 4 * n;
          this.line(x, y);
          break; }
        case C_SPLINE:
          throw new Error('magic2: unsupported command SPLINE');
        case C_BOX:
          addr += 8;
          throw new Error('magic2: unsupported command BOX');
        case C_TRIANGLE:
          throw new Error('magic2: unsupported command TRIANGLE');
        case C_BOX_FULL: {
          const x1 = mem_read_u16be(memory, addr + 0);
          const y1 = mem_read_u16be(memory, addr + 2);
          const x2 = mem_read_u16be(memory, addr + 4);
          const y2 = mem_read_u16be(memory, addr + 6);
          addr += 8;
          this.boxFull(x1, y1, x2, y2);
          break; }
        case C_CIRCLE_FULL:
          throw new Error('magic2: unsupported command CIRCLE_FULL');
        case C_SET_WINDOW: {
          const x1 = mem_read_u16be(memory, addr + 0);
          const y1 = mem_read_u16be(memory, addr + 2);
          const x2 = mem_read_u16be(memory, addr + 4);
          const y2 = mem_read_u16be(memory, addr + 6);
          addr += 8;
          this.setWindow(x1, y1, x2, y2);
          break; }
        case C_SET_MODE: {
          const mode = mem_read_u16be(memory, addr);
          addr += 2;
          console.warn('magic2: ignoring command SET_MODE, ' + mode);
          break; }
        case C_POINT:
          throw new Error('magic2: unsupported command POINT');
        case C_CLS:
          this.cls();
          break;
        case C_SET_3D_PARAMETER: {
          const param_num = mem_read_u16be(memory, addr + 0);
          const param_val = mem_read_s16be(memory, addr + 2);
          addr += 4;
          this.set3dParameter(param_num, param_val);
          break; }
        case C_SET_3D_DATA:
          addr += this.set3dRawData(memory, addr);
          break;
        case C_TRANSLATE_3D_TO_2D:
          this.translate3dTo2d();
          break;
        case C_DISPLAY_2D:
          this.display2d();
          shown = true;
          break;
        case C_DONE:
          return shown;
        case C_COLOR: {
          const color = mem_read_u16be(memory, addr);
          addr += 2;
          this.color(color);
          break; }
        case C_CRT: {
          const crt = mem_read_u16be(memory, addr);
          addr += 2;
          this.crt(crt);
          break; }
        case C_INIT:
          // TODO: Initialize palette, etc.
          break;
        case C_AUTO:
          throw new Error('magic2: AUTO should not be used inside AUTO');
        case C_APAGE: {
          const apage = mem_read_u16be(memory, addr);
          addr += 2;
          this.apage(apage);
          break; }
        case C_DEPTH: {
          const minz = mem_read_u16be(memory, addr + 0);
          const maxz = mem_read_u16be(memory, addr + 2);
          addr += 4;
          this.depth(minz, maxz);
          break; }
        default:
          throw new Error('magic2: unknown command ' + cmd);
      }
    }
    // not reached.
  }

  /**
   * Magic2 API: Sets active page for 2D drawing commands.
   * @param {number} apage active page
   */
  apage (apage) {
    this[_].apage = apage;
  }

  /**
   * Magic2 API: Sets Z address for the plane of projection, and clipping.
   * @param {number} minz Z address for the plane of projection (initial: 50)
   * @param {number} maxz Z address for clipping (initial: 2000)
   */
  depth (minz, maxz) {
    this[_].depth.minz = minz;
    this[_].depth.maxz = maxz;
  }
}

global.Magic2 = Magic2;

})(typeof global !== 'undefined' ? global :
   typeof module !== 'undefined' ? module.exports : window);