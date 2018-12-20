(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class WorkUnit {
  constructor(message, workUnitId) {
    this.message = message;
    this.workUnitId = workUnitId;
    this.replacesWorkId = null;
    this.replacedByWorkId = null;
  }

  toObject() {
    return {
      message: this.message,
      abrupt: { workUnitId: this.workUnitId },
    };
  }

  static fromObject(obj) {
    return new WorkUnit(obj.message, obj.abrupt.workUnitId);
  }

  supersededBy(workUnit) {
    this.replacedByWorkId = workUnit.workUnitId;
    workUnit.replacesWorkId = this.replacesWorkId;
  }
}

module.exports = WorkUnit;

},{}],2:[function(require,module,exports){
/*********************************************************************
 *                                                                   *
 *   Copyright 2018 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

const Vector = require('./Vector');

const constants = {
  NUM_WORKERS: 8,

  // Raytracing Depth
  DEPTH: 5,

  // Used to make sure we are on the near side of point of intersection
  EPSILON: 0.00001,

  // Canvas size - NOTE: Must be a factor of SQUARE_SIZE
  WIDTH: 696,
  HEIGHT: 696,

  // How big a grid size to use for checking contents (in pixels)
  SQUARE_SIZE: 8,

  // Named Colours
  COL_SILVER: new Vector(0.85, 0.85, 0.85),
  COL_BLUE: new Vector(0.6, 1.0, 1.0),
  COL_BLACK: new Vector(0.0, 0.0, 0.0),
  COL_WHITE: new Vector(1.0, 1.0, 1.0),
  COL_RED: new Vector(1.0, 0.0, 0.0),
  COL_GREEN: new Vector(0.0, 1.0, 0.0),

  // Colours of objects/scene
  COL_SQUARE_1: new Vector(0, 0.5, 0),
  COL_SQUARE_2: new Vector(0, 0, 0),
  COL_BACKGROUND: new Vector(0, 0, 0),

  // Where the ground plane sits
  GROUND_PLANE: new Vector(0, 0, 0),
};

if (constants.WIDTH % constants.SQUARE_SIZE) console.error('WIDTH must be a factor of SQUARE_SIZE');
if (constants.HEIGHT % constants.SQUARE_SIZE) console.error('HEIGHT must be a factor of SQUARE_SIZE');

module.exports = constants;

},{"./Vector":3}],3:[function(require,module,exports){
/*********************************************************************
 *                                                                   *
 *   Copyright 2018 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

'use strict';

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @constructor
 * @struct
 */
function Vector(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

/**
 * Set the values to the given vector;.
 * @param {Object} w The vector.
 */
Vector.prototype.set = function(w) {
  this.x = w.x;
  this.y = w.y;
  this.z = w.z;
};

/**
 * Dot product.
 * @param  {Object} w
 * @return {number}
 */
Vector.prototype.dot = function(w) {
  return this.x * w.x + this.y * w.y + this.z * w.z;
};

/**
 * Add two vectors.
 * @param  {Object} w
 * @return {Object}
 */
Vector.prototype.add = function(w) {
  return new Vector(this.x + w.x, this.y + w.y, this.z + w.z);
};

/**
 * Add two vectors, but don't create a new one.
 * @param  {Object} w
 */
Vector.prototype.addInplace = function(w) {
  this.x += w.x;
  this.y += w.y;
  this.z += w.z;
};

/**
 * Subtract two vectors.
 * @param  {Object} w
 * @return {Object}
 */
Vector.prototype.sub = function(w) {
  return new Vector(this.x - w.x, this.y - w.y, this.z - w.z);
};

/**
 * Subtract two vectors, but don't create a new one.
 * @param  {Object} w
 */
Vector.prototype.subInplace = function(w) {
  this.x -= w.x;
  this.y -= w.y;
  this.z -= w.z;
};

/**
 * Get the length of a Vector.
 * @return {number}
 */
Vector.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

/**
 * Normalise a vector.
 * @return {Object}
 */
Vector.prototype.normalise = function() {
  const s = 1 / this.length();
  return new Vector(this.x * s, this.y * s, this.z * s);
};

/**
 * Normalise a vector in situ.
 */
Vector.prototype.normaliseInplace = function() {
  const s = 1 / this.length();
  this.x *= s;
  this.y *= s;
  this.z *= s;
};

/**
 * Create a copy of the current vector.
 * @return {Object}
 */
Vector.prototype.copy = function() {
  return new Vector(this.x, this.y, this.z);
};

/**
 * Scale a vector by f and return the object.
 * @param {number} f
 * @return {Object}
 */
Vector.prototype.scale = function(f) {
  const v = new Vector(this.x, this.y, this.z);
  v.x *= f;
  v.y *= f;
  v.z *= f;
  return v;
};

/**
 * Scale a vector by f, in situ.
 * @param {number} f
 */
Vector.prototype.scaleInplace = function(f) {
  this.x *= f;
  this.y *= f;
  this.z *= f;
};

/**
 * The product of each element.
 * @param {Object} w
 * @return {Object}
 */
Vector.prototype.product = function(w) {
  return new Vector(this.x * w.x, this.y * w.y, this.z * w.z);
};

/**
 * The product of each element, in situ.
 * @param {Object} w
 */
Vector.prototype.productInplace = function(w) {
  this.x *= w.x;
  this.y *= w.y;
  this.z *= w.z;
};

/**
 * Check if the vectors have the same values.
 * @param {Object} w
 * @return {boolean}
 */
Vector.prototype.equals = function(w) {
  return this.x === w.x && this.y === w.y && this.z === w.z;
};

/**
 * Sum each element together and return the result.
 * @return {number}
 */
Vector.prototype.sumElements = function() {
  return this.x + this.y + this.z;
};

/**
 * Limit the values in place.
 *
 * @param max {number} - The max value.
 */
Vector.prototype.maxValInplace = function(max) {
  this.x = Math.min(this.x, max);
  this.y = Math.min(this.y, max);
  this.z = Math.min(this.z, max);
};

module.exports = Vector;

},{}],4:[function(require,module,exports){
/*********************************************************************
 *                                                                   *
 *   Copyright 2018 Simon M. Werner                                  *
 *                                                                   *
 *   Licensed to the Apache Software Foundation (ASF) under one      *
 *   or more contributor license agreements.  See the NOTICE file    *
 *   distributed with this work for additional information           *
 *   regarding copyright ownership.  The ASF licenses this file      *
 *   to you under the Apache License, Version 2.0 (the               *
 *   "License"); you may not use this file except in compliance      *
 *   with the License.  You may obtain a copy of the License at      *
 *                                                                   *
 *      http://www.apache.org/licenses/LICENSE-2.0                   *
 *                                                                   *
 *   Unless required by applicable law or agreed to in writing,      *
 *   software distributed under the License is distributed on an     *
 *   "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY          *
 *   KIND, either express or implied.  See the License for the       *
 *   specific language governing permissions and limitations         *
 *   under the License.                                              *
 *                                                                   *
 *********************************************************************/

/* globals self rayTracer  WebAssembly */

require('./rust_web_rtrt.js');

const constants = require('../common/Constants');
const WorkUnit = require('../lib/WorkUnit');

// not ordinarily necessary, but for streaming WASM compilation to
// work it needs to be served with a content-type of application/wasm,
// which isn't always the case (eg with php -S), so we remove for now:
delete WebAssembly.instantiateStreaming;
// const buffer = new Uint8ClampedArray(constants.SQUARE_SIZE * constants.WIDTH * 4);
// for (let i = 0; i < buffer.length; i += 4) {
//   buffer[i] = Math.random() * 128;
//   buffer[i + 1] = Math.random() * 128;
//   buffer[i + 2] = Math.random() * 128;
//   buffer[i + 3] = 255;
// }
rayTracer('./rust_web_rtrt_bg.wasm').then(
  () => {
    const { RayTracer, wasm } = rayTracer;
    const rt = new RayTracer(12);

    const queue = [];

    function next() {
      if (queue.length > 0) {
        const workUnit = queue.shift();
        switch (workUnit.message.type) {
          case 'raytrace':
            raytrace(workUnit);
            break;

          case 'inc':
            increment(workUnit);
            break;

          default:
            console.error('Oops!');
        }
      }
    }
    function handleNext() {
      setTimeout(next, 0);
    }

    function raytrace(workUnit) {
      workUnit.message.buffer = new Uint8Array(constants.SQUARE_SIZE * constants.WIDTH * 4);
      rt.render(workUnit.message.stripId, workUnit.message.buffer);
      self.postMessage(workUnit.toObject(), [workUnit.message.buffer.buffer]);
      handleNext();
    }

    function increment(workUnit) {
      rt.increment();
      workUnit.message = {
        type: 'inc_done',
      };
      self.postMessage(workUnit.toObject());
      handleNext();
    }

    self.addEventListener('message', e => {
      if (e.data === 'started') return;
      const workUnit = WorkUnit.fromObject(e.data);
      switch (workUnit.message.type) {
        case 'raytrace':
        case 'inc':
          queue.push(workUnit);
          break;

        default:
          console.error('Unexpected value: ', workUnit.message);
      }
      handleNext();
    });

    self.postMessage('started');
  },
  _ => {
    console.error('Error starting worker');
  }
);

},{"../common/Constants":2,"../lib/WorkUnit":1,"./rust_web_rtrt.js":5}],5:[function(require,module,exports){
(function() {
    var wasm;
    const __exports = {};


    let cachegetUint8Memory = null;
    function getUint8Memory() {
        if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory;
    }

    let WASM_VECTOR_LEN = 0;

    function passArray8ToWasm(arg) {
        const ptr = wasm.__wbindgen_malloc(arg.length * 1);
        getUint8Memory().set(arg, ptr / 1);
        WASM_VECTOR_LEN = arg.length;
        return ptr;
    }

    function freeRayTracer(ptr) {

        wasm.__wbg_raytracer_free(ptr);
    }
    /**
    */
    class RayTracer {

        free() {
            const ptr = this.ptr;
            this.ptr = 0;
            freeRayTracer(ptr);
        }

        /**
        * @param {number} arg0
        * @returns {}
        */
        constructor(arg0) {
            this.ptr = wasm.raytracer_new(arg0);
        }
        /**
        * @returns {number}
        */
        width() {
            return wasm.raytracer_width(this.ptr);
        }
        /**
        * @returns {number}
        */
        height() {
            return wasm.raytracer_height(this.ptr);
        }
        /**
        * @returns {number}
        */
        square_size() {
            return wasm.raytracer_square_size(this.ptr);
        }
        /**
        * @returns {number}
        */
        num_strips() {
            return wasm.raytracer_num_strips(this.ptr);
        }
        /**
        * @returns {void}
        */
        increment() {
            return wasm.raytracer_increment(this.ptr);
        }
        /**
        * Render the scene.  self will update the data object that was provided.
        * @param {number} arg0
        * @param {Uint8Array} arg1
        * @returns {void}
        */
        render(arg0, arg1) {
            const ptr1 = passArray8ToWasm(arg1);
            const len1 = WASM_VECTOR_LEN;
            try {
                return wasm.raytracer_render(this.ptr, arg0, ptr1, len1);

            } finally {
                arg1.set(getUint8Memory().subarray(ptr1 / 1, ptr1 / 1 + len1));
                wasm.__wbindgen_free(ptr1, len1 * 1);

            }

        }
    }
    __exports.RayTracer = RayTracer;

    let cachedTextDecoder = new TextDecoder('utf-8');

    function getStringFromWasm(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
    }

    __exports.__wbindgen_throw = function(ptr, len) {
        throw new Error(getStringFromWasm(ptr, len));
    };

    function init(path_or_module) {
        let instantiation;
        const imports = { './rust_web_rtrt': __exports };
        if (path_or_module instanceof WebAssembly.Module) {
            instantiation = WebAssembly.instantiate(path_or_module, imports)
            .then(instance => {
            return { instance, module: path_or_module }
        });
    } else {
        const data = fetch(path_or_module);
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            instantiation = WebAssembly.instantiateStreaming(data, imports);
        } else {
            instantiation = data
            .then(response => response.arrayBuffer())
            .then(buffer => WebAssembly.instantiate(buffer, imports));
        }
    }
    return instantiation.then(({instance}) => {
        wasm = init.wasm = instance.exports;

    });
};
self.rayTracer = Object.assign(init, __exports);
})();

},{}]},{},[4]);
