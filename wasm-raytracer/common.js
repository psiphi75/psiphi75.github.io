(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./Vector":3}],2:[function(require,module,exports){
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

/* globals performance */

/**
 * A simple timer that stores the FPS (Frames Per Second) as a list.
 */
function FPSTimer() {
  let fpsTimes = [];
  const times = [];
  let startTime;
  let pauseStart = 0;
  let counter = 0;

  const now = performance.now.bind(performance);

  return {
    count: () => {
      counter += 1;
    },
    start: () => {
      startTime = now();
    },
    reset: () => {
      fpsTimes = [];
    },
    pause: () => {
      pauseStart = now();
    },
    resume: () => {
      const pausedTime = pauseStart - now();
      startTime -= pausedTime;
    },
    stop: () => {
      if (startTime === undefined) return NaN;
      const stopTime = now();
      times.push(stopTime - startTime);
      const fpsTime = 1000 / (stopTime - startTime);
      startTime = undefined;
      fpsTimes.push(fpsTime);
      return fpsTime;
    },
    getFPSList: () => fpsTimes,
    average: () => {
      if (fpsTimes.length === 0) return 0;
      const sum = fpsTimes.reduce((a, b) => a + b);
      return sum / fpsTimes.length;
    },
    totalTime: () => {
      return times.reduce((a, b) => {
        return a + b;
      });
    },
    getCounter: () => {
      return counter;
    },
  };
}

module.exports = FPSTimer;

},{}],3:[function(require,module,exports){
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

},{}]},{},[1,2,3]);
