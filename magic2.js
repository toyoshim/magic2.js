'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Copyright 2016 Takashi Toyoshima <toyoshim@gmail.com>. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function (global) {
  'use strict';

  // A special symbol to hide private members.

  var _ = Symbol();

  // MAGIC2 Commands.
  var C_LINE = 0x00;
  var C_SPLINE = 0x01;
  var C_BOX = 0x02;
  var C_TRIANGLE = 0x03;
  var C_BOX_FULL = 0x04;
  var C_CIRCLE_FULL = 0x05;
  var C_SET_WINDOW = 0x06;
  var C_SET_MODE = 0x07;
  var C_POINT = 0x08;
  var C_CLS = 0x09;
  var C_SET_3D_PARAMETER = 0x0b;
  var C_SET_3D_DATA = 0x0c;
  var C_TRANSLATE_3D_TO_2D = 0x0d;
  var C_DISPLAY_2D = 0x0e;
  var C_DONE = 0x0f;
  var C_COLOR = 0x10;
  var C_CRT = 0x11;
  var C_INIT = 0x12;
  var C_AUTO = 0x13;
  var C_APAGE = 0x14;
  var C_DEPTH = 0x15;

  // 3D Parameters.
  var P_CX = 0;
  var P_CY = 1;
  var P_CZ = 2;
  var P_DX = 3;
  var P_DY = 4;
  var P_DZ = 5;
  var P_HEAD = 6;
  var P_PITCH = 7;
  var P_BANK = 8;

  // VR mode.
  var V_NORMAL = 0;
  var V_SPLIT = 1;
  var V_COLOR = 2;

  /**
   * Decodes an unsigned 16-bit number in big endian.
   * @param {Uint8Array} memory memory image
   * @param {Number} addr memory address
   * @param {Number} read value
   */
  var mem_read_u16be = function mem_read_u16be(memory, addr) {
    return memory[addr] << 8 | memory[addr + 1];
  };

  /**
   * Decodes a signed 16-bit number in big endian.
   * @param {Uint8Array} memory memory image
   * @param {Number} addr memory address
   * @param {Number} read value
   */
  var mem_read_s16be = function mem_read_s16be(memory, addr) {
    var u16be = mem_read_u16be(memory, addr);
    if (u16be < 0x8000) return u16be;
    return u16be - 0x10000;
  };

  var translate = {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    dx: 0.0,
    dy: 0.0,
    dz: 0.0,
    m: [[0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0]],

    setup: function setup(parameters, position, minz) {
      this.dx = parameters[P_DX];
      this.dy = parameters[P_DY];
      this.dz = parameters[P_DZ];

      var math = Math;
      var cx = parameters[P_CX] - position;
      var cy = parameters[P_CY];
      var cz = parameters[P_CZ];
      var rh = parameters[P_HEAD] / 180 * math.PI;
      var rp = parameters[P_PITCH] / 180 * math.PI;
      var rb = parameters[P_BANK] / 180 * math.PI;
      var ch = math.cos(rh);
      var cp = math.cos(rp);
      var cb = math.cos(rb);
      var sh = math.sin(rh);
      var sp = math.sin(rp);
      var sb = math.sin(rb);
      var m = this.m;
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

    convert: function convert(sx, sy, sz) {
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
  var camera = {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    m: [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]],

    setup: function setup(alpha, beta, gamma) {
      var math = Math;
      var a = beta / 180 * math.PI * (gamma < 0 ? -1 : 1);
      var b = (gamma + 90) / 180 * math.PI * (gamma < 0 ? 1 : -1);
      var c = alpha / 180 * math.PI;
      var ca = math.cos(a);
      var cb = math.cos(b);
      var cc = math.cos(c);
      var sa = math.sin(a);
      var sb = math.sin(b);
      var sc = math.sin(c);
      var m = this.m;
      m[0][0] = -sa * sb * sc + ca * cc;
      m[0][1] = -sa * cb;
      m[0][2] = sa * sb * cc + ca * sc;
      m[1][0] = ca * sb * sc + sa * cc;
      m[1][1] = ca * cb;
      m[1][2] = -ca * sb * cc + sa * sc;
      m[2][0] = -cb * sc;
      m[2][1] = sb;
      m[2][2] = cb * cc;
    },

    convert: function convert(x, y, z) {
      var m = this.m;
      this.x = m[0][0] * x + m[0][1] * y + m[0][2] * z;
      this.y = m[1][0] * x + m[1][1] * y + m[1][2] * z;
      this.z = m[2][0] * x + m[2][1] * y + m[2][2] * z;
    }
  };

  var Magic2 = function () {
    // constructor
    // @param {CanvasRenderingContext2D} context
    function Magic2(contexts) {
      _classCallCheck(this, Magic2);

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
          maxz: 2000
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
        palette: [{ r: 0, g: 0, b: 0, c: 'rgba(  0,   0,   0, 1.0)' }, //  0
        { r: 85, g: 85, b: 85, c: 'rgba( 85,  85,  85, 1.0)' }, //  1
        { r: 0, g: 0, b: 127, c: 'rgba(  0,   0, 127, 1.0)' }, //  2
        { r: 0, g: 0, b: 255, c: 'rgba(  0,   0, 255, 1.0)' }, //  3
        { r: 127, g: 0, b: 0, c: 'rgba(127,   0,   0, 1.0)' }, //  4
        { r: 255, g: 0, b: 0, c: 'rgba(255,   0,   0, 1.0)' }, //  5
        { r: 127, g: 0, b: 127, c: 'rgba(127,   0, 127, 1.0)' }, //  6
        { r: 255, g: 0, b: 255, c: 'rgba(255,   0, 255, 1.0)' }, //  7
        { r: 0, g: 127, b: 0, c: 'rgba(  0, 127,   0, 1.0)' }, //  8
        { r: 0, g: 255, b: 0, c: 'rgba(  0, 255,   0, 1.0)' }, //  9
        { r: 0, g: 127, b: 127, c: 'rgba(  0, 127, 127, 1.0)' }, // 10
        { r: 0, g: 255, b: 255, c: 'rgba(  0, 255, 255, 1.0)' }, // 11
        { r: 127, g: 127, b: 0, c: 'rgba(127, 127,   0, 1.0)' }, // 12
        { r: 255, g: 255, b: 0, c: 'rgba(255, 255,   0, 1.0)' }, // 13
        { r: 170, g: 170, b: 170, c: 'rgba(170, 170, 170, 1.0)' }, // 14
        { r: 255, g: 255, b: 255, c: 'rgba(255, 255, 255, 1.0)' } // 15
        ],
        contexts: contexts,
        fgcontext: 0,
        bgcontext: 1,
        clients: [],
        apage: 0,
        vr: 0,
        updatePalette: function (i) {
          var palette = this[_].palette[i];
          palette.c = 'rgba(' + palette.r + ',' + palette.g + ',' + palette.b + ',1.0)';
          palette.l = 0.299 * palette.r + 0.587 * palette.g + 0.114 * palette.b | 0;
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
            if (nz <= 0 || maxz < nz) continue;
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
            if (sz <= 0 || maxz < sz || ez <= 0 || maxz < ez) continue;
            c.moveTo(ox + vertices[s + 0] * zx, oy + vertices[s + 1] * zy);
            c.lineTo(ox + vertices[e + 0] * zx, oy + vertices[e + 1] * zy);
          }
          c.closePath();
          c.stroke();
          c.restore();
        }.bind(this)
      };

      var fg = this[_].contexts[this[_].fgcontext];
      fg.canvas.style.display = 'block';

      var bg = this[_].contexts[this[_].bgcontext];
      bg.canvas.style.display = 'none';

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this[_].contexts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var context = _step.value;

          context.clearRect(0, 0, fg.canvas.width, fg.canvas.height);
          context.globalCompositeOperation = 'lighter';
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    _createClass(Magic2, [{
      key: 'palette',
      value: function palette(index, color) {
        if (color == undefined) return this[_].palette[index];
        var i = (color & 1) == 0 ? 0 : 4;
        var r = ((color >> 6 & 0x1f) << 3) + i;
        var g = ((color >> 11 & 0x1f) << 3) + i;
        var b = ((color >> 1 & 0x1f) << 3) + i;
        var palette = this[_].palette[index];
        palette.r = r;
        palette.g = g;
        palette.b = b;
        this[_].updatePalette(index);
      }
    }, {
      key: 'vr',
      value: function vr(mode) {
        if (mode === undefined) return this[_].vr;
        var result = this[_].vr;
        this[_].vr = mode;
        for (var i = 0; i < 16; ++i) {
          this[_].updatePalette(i);
        }return result;
      }
    }, {
      key: 'orientation',
      value: function orientation(alpha, beta, gamma) {
        var orientation = this[_].orientation;
        if (orientation.baseAlpha === undefined) orientation.baseAlpha = alpha;
        orientation.alpha = alpha - orientation.baseAlpha;
        orientation.beta = beta;
        orientation.gamma = gamma;
      }
    }, {
      key: 'context',
      value: function context(mode) {
        var split = this[_].vr == V_SPLIT;
        var c = this[_].contexts[0].canvas;
        var base = !split || mode != 2 ? 0 : c.width / 2;
        var width = !split || mode == 0 ? c.width : c.width / 2;
        var aspect = !split || mode == 0 ? 4 / 3 : 1;
        var color = this[_].vr != V_COLOR ? 'c' : mode == 1 ? 'cl' : 'cr';
        return {
          color: color,
          base: base,
          width: width,
          offset: base + (width - c.height * aspect) / 2,
          position: mode == 0 ? 0 : mode == 1 ? -10 : 10,
          alpha: mode == 0 ? 0 : mode == 1 ? -2 : 2,
          aspect: aspect,
          scaleX: c.height / 256 * aspect,
          scaleY: c.height / 256
        };
      }
    }, {
      key: 'vsync',
      value: function vsync(client) {
        this[_].clients.push(client);
      }
    }, {
      key: 'line',
      value: function line(x, y) {
        var c = this[_].contexts[this[_].apage];
        var n = x.length;
        if (this[_].vr) {
          var c1 = this.context(1);
          c.strokeStyle = this[_].palette[this[_].color][c1.color];
          c.beginPath();
          c.moveTo(x[0] * c1.scaleX + c1.offset, y[0] * c1.scaleY);
          for (var i = 1; i < n; ++i) {
            c.lineTo(x[i] * c1.scaleX + c1.offset, y[i] * c1.scaleY);
          }c.stroke();
          var c2 = this.context(2);
          c.strokeStyle = this[_].palette[this[_].color][c2.color];
          c.beginPath();
          c.moveTo(x[0] * c2.scaleX + c2.offset, y[0] * c2.scaleY);
          for (var _i = 1; _i < n; ++_i) {
            c.lineTo(x[_i] * c2.scaleX + c2.offset, y[_i] * c2.scaleY);
          }c.stroke();
        } else {
          var context = this.context(0);
          c.strokeStyle = this[_].palette[this[_].color][context.color];
          c.beginPath();
          c.moveTo(x[0] * context.scaleX + context.offset, y[0] * context.scaleY);
          for (var _i2 = 1; _i2 < n; ++_i2) {
            c.lineTo(x[_i2] * context.scaleX + context.offset, y[_i2] * context.scaleY);
          }
          c.stroke();
        }
      }
    }, {
      key: 'boxFull',
      value: function boxFull(x1, y1, x2, y2) {
        var left = Math.min(x1, x2);
        var top = Math.min(y1, y2);
        var width = Math.abs(x2 - x1);
        var height = Math.abs(y2 - y1);
        var c = this[_].contexts[this[_].apage];
        if (this[_].vr) {
          var c1 = this.context(1);
          c.fillStyle = this[_].palette[this[_].color][c1.color];
          c.fillRect(left * c1.scaleX + c1.offset, top * c1.scaleY, width * c1.scaleX, height * c1.scaleY);
          var c2 = this.context(2);
          c.fillStyle = this[_].palette[this[_].color][c2.color];
          c.fillRect(left * c2.scaleX + c2.offset, top * c2.scaleY, width * c2.scaleX, height * c2.scaleY);
        } else {
          var context = this.context(0);
          c.fillStyle = this[_].palette[this[_].color][context.color];
          c.fillRect(left * context.scaleX + context.offset, top * context.scaleY, width * context.scaleX, height * context.scaleY);
        }
      }
    }, {
      key: 'setWindow',
      value: function setWindow(x1, y1, x2, y2) {
        this[_].window.x = x1;
        this[_].window.y = y1;
        this[_].window.w = x2 - x1;
        this[_].window.h = y2 - y1;
      }
    }, {
      key: 'cls',
      value: function cls() {
        var c = this[_].contexts[this[_].apage];
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      }
    }, {
      key: 'set3dParameter',
      value: function set3dParameter(num, data) {
        this[_].parameters[num] = data;
      }
    }, {
      key: 'set3dData',
      value: function set3dData(pct, vertices, lct, indices, color) {
        this[_].data.pct = pct;
        this[_].data.vertices = vertices;
        this[_].data.lct = lct;
        this[_].data.indices = indices;
        this[_].data.color = color !== undefined ? color : this[_].color;
      }
    }, {
      key: 'set3dRawData',
      value: function set3dRawData(memory, addr) {
        var base = addr;
        this[_].data.pct = mem_read_u16be(memory, addr);
        addr += 2;
        for (var i = 0; i < this[_].data.pct; ++i) {
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
        for (var _i3 = 0; _i3 < this[_].data.lct; ++_i3) {
          this[_].data.indices[_i3 * 2 + 0] = mem_read_u16be(memory, addr + 0);
          this[_].data.indices[_i3 * 2 + 1] = mem_read_u16be(memory, addr + 2);
          addr += 4;
        }
        return addr - base;
      }
    }, {
      key: 'translate3dTo2d',
      value: function translate3dTo2d() {
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

    }, {
      key: 'display2d',
      value: function display2d() {
        var previous = this[_].fgcontext;
        this[_].fgcontext = this[_].bgcontext;
        this[_].bgcontext = previous;
        var fg = this[_].contexts[this[_].fgcontext];
        if (this[_].vr) {
          var c1 = this.context(1);
          var c2 = this.context(2);
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = this[_].clients[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var client = _step2.value;

              client(fg, c1);
              client(fg, c2);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        } else {
          var c = this.context(0);
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = this[_].clients[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var client = _step3.value;

              client(fg, c);
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
        fg.canvas.style.display = 'block';
        var bg = this[_].contexts[this[_].bgcontext];
        bg.canvas.style.display = 'none';
        bg.clearRect(0, 0, bg.canvas.width, bg.canvas.height);
      }

      /**
       * Magic2 API: Sets color for 2D drawing.
       * @param {number} color color palette code
       */

    }, {
      key: 'color',
      value: function color(_color) {
        this[_].color = _color;
      }

      /**
       * Magic2 API: Sets CRT mode.
       * @param {number} crt CRT mode
       *   crt >= 0x100: extended mode (to make set3dData accept color data)
       */

    }, {
      key: 'crt',
      value: function crt(_crt) {
        console.warn('magic2: partially ignoring command CRT, ' + _crt);
        this[_].cext = (_crt & 0x100) != 0;
      }

      /**
       * Magic2 API: Executes magic commands stored in the specified memory.
       * @param {Uint8Array} memory image
       * @param {Number} addr memory address
       * @return {Boolean} true if canvas is updated and it requires waiting vsync
       */

    }, {
      key: 'auto',
      value: function auto(memory, addr) {
        var shown = false;
        for (;;) {
          var cmd = mem_read_u16be(memory, addr);
          addr += 2;
          switch (cmd) {
            case C_LINE:
              {
                var n = mem_read_u16be(memory, addr + 0);
                var x = [];
                var y = [];
                for (var i = 0; i < n; ++i) {
                  x.push(mem_read_u16be(memory, addr + 2 + i * 4));
                  y.push(mem_read_u16be(memory, addr + 4 + i * 4));
                }
                addr += 2 + 4 * n;
                this.line(x, y);
                break;
              }
            case C_SPLINE:
              throw new Error('magic2: unsupported command SPLINE');
            case C_BOX:
              addr += 8;
              throw new Error('magic2: unsupported command BOX');
            case C_TRIANGLE:
              throw new Error('magic2: unsupported command TRIANGLE');
            case C_BOX_FULL:
              {
                var x1 = mem_read_u16be(memory, addr + 0);
                var y1 = mem_read_u16be(memory, addr + 2);
                var x2 = mem_read_u16be(memory, addr + 4);
                var y2 = mem_read_u16be(memory, addr + 6);
                addr += 8;
                this.boxFull(x1, y1, x2, y2);
                break;
              }
            case C_CIRCLE_FULL:
              throw new Error('magic2: unsupported command CIRCLE_FULL');
            case C_SET_WINDOW:
              {
                var _x = mem_read_u16be(memory, addr + 0);
                var _y = mem_read_u16be(memory, addr + 2);
                var _x2 = mem_read_u16be(memory, addr + 4);
                var _y2 = mem_read_u16be(memory, addr + 6);
                addr += 8;
                this.setWindow(_x, _y, _x2, _y2);
                break;
              }
            case C_SET_MODE:
              {
                var mode = mem_read_u16be(memory, addr);
                addr += 2;
                console.warn('magic2: ignoring command SET_MODE, ' + mode);
                break;
              }
            case C_POINT:
              throw new Error('magic2: unsupported command POINT');
            case C_CLS:
              this.cls();
              break;
            case C_SET_3D_PARAMETER:
              {
                var param_num = mem_read_u16be(memory, addr + 0);
                var param_val = mem_read_s16be(memory, addr + 2);
                addr += 4;
                this.set3dParameter(param_num, param_val);
                break;
              }
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
            case C_COLOR:
              {
                var color = mem_read_u16be(memory, addr);
                addr += 2;
                this.color(color);
                break;
              }
            case C_CRT:
              {
                var crt = mem_read_u16be(memory, addr);
                addr += 2;
                this.crt(crt);
                break;
              }
            case C_INIT:
              // TODO: Initialize palette, etc.
              break;
            case C_AUTO:
              throw new Error('magic2: AUTO should not be used inside AUTO');
            case C_APAGE:
              {
                var apage = mem_read_u16be(memory, addr);
                addr += 2;
                this.apage(apage);
                break;
              }
            case C_DEPTH:
              {
                var minz = mem_read_u16be(memory, addr + 0);
                var maxz = mem_read_u16be(memory, addr + 2);
                addr += 4;
                this.depth(minz, maxz);
                break;
              }
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

    }, {
      key: 'apage',
      value: function apage(_apage) {
        this[_].apage = _apage;
      }

      /**
       * Magic2 API: Sets Z address for the plane of projection, and clipping.
       * @param {number} minz Z address for the plane of projection (initial: 50)
       * @param {number} maxz Z address for clipping (initial: 2000)
       */

    }, {
      key: 'depth',
      value: function depth(minz, maxz) {
        this[_].depth.minz = minz;
        this[_].depth.maxz = maxz;
      }
    }]);

    return Magic2;
  }();

  global.Magic2 = Magic2;
})(typeof global !== 'undefined' ? global : typeof module !== 'undefined' ? module.exports : window);