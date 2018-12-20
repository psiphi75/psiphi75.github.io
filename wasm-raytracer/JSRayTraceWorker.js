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

},{"./Vector":4}],3:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

const Vector = require('../common/Vector');
const constants = require('../common/Constants');

const COL_WHITE = constants.COL_WHITE;
const COL_SQUARE_1 = constants.COL_SQUARE_1;
const COL_SQUARE_2 = constants.COL_SQUARE_2;

/**
 * Make a sphere.
 * @param {Object} centerV    - The center point of the Sphere.
 * @class
 */
function Sphere(centerV) {
  this.c = centerV; // Center position Vector
  this.r = 1.0; // Radius
  this.col = COL_WHITE; // Colour of sphere
  this.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
  this.rfr = 0; // Refractivity
  this.ambient_light = 0.3;
  this.spec = 0.0; // the specular amount -> 0.0 to 1.0
  this.diff = 0.0;
  this.d = new Vector(0, 0, 0); // like .n above.
  this.canCreateShadow = true;
  this.canReceiveShadow = true;
  this.type = 'sphere';
}
/**
 * Sphere intersection.
 * @param  {Object} ray
 * @return {Object|null}
 */
Sphere.prototype.intersect = function(ray) {
  // Intersection with a circle from a ray coming from [px, py, pz] direction [vx, vy, vz]

  // Transform to local coordinates
  const LocalP1 = ray.origin.sub(this.c);

  // var A = ray.direction.dot(ray.direction);
  const A = ray.dotDD;
  const B = 2 * ray.direction.dot(LocalP1);
  const C = LocalP1.dot(LocalP1) - this.r * this.r;

  // , or ray is in wrong direction (when t < zero)
  if (B > 0 && C > 0) return null;
  const D = B * B - 4 * A * C;

  if (D < 0.0) {
    // No hit
    return null;
  } else {
    const sqrtD = Math.sqrt(D);
    if (-B - sqrtD > 0) {
      const t = (-B - sqrtD) / (2.0 * A);
      const pi = ray.origin.add(ray.direction.scale(t));
      return {
        col: this.col,
        t,
        pi,
      };
    }
  }

  return null;
};
/**
 * Get the normal at point p.
 * @param {Object} p  - The point to get the normal at.
 * @returns {Object}  The normal Vector.
 */
Sphere.prototype.get_norm = function(p) {
  return p.sub(this.c);
};
/** @param {number} diff */
Sphere.prototype.set_diffuse = function(diff) {
  this.diff = diff;
  this.spec = 1.0 - diff;
};

/**
 * Make a disc. This is just a circle on a plane.
 * @param {Object} center_v  - The center of the disc.
 * @param {Object} norm_v    - The normal of the disc.
 * @class
 */
function Disc(center_v, norm_v) {
  // Plane equation is a*x + b*y + c*z = d.
  this.c = center_v; // center of disc
  this.n = norm_v.normalise(); // normal Vector
  this.r = 1.0; // radius
  this.col = COL_WHITE;
  this.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
  this.rfr = 0; // Refractivity
  this.ambient_light = 0.3;
  this.spec = 0.0; // specular intensity
  this.diff = 0.0; // diffuse intensity
  this.d = this.c.dot(this.n); // solve plane equation for d
  this.canCreateShadow = true;
  this.canReceiveShadow = true;
  this.type = 'disc';
}
/**
 * Intersection with a disc from a ray coming from [px, py, pz] with direction Vector [vx, vy, vz].
 * @param {Object} ray    - The incoming ray.
 * @returns {Object|null}      And array with {col, t}.
 */
Disc.prototype.intersect = function(ray) {
  const d = this.n.dot(ray.direction);
  const t = (this.d - this.n.dot(ray.origin)) / d;
  if (t > 0.0) {
    const pi = ray.origin.add(ray.direction.scale(t)).sub(this.c);
    const pi_sub_c = pi.length();
    if (pi_sub_c < this.r) {
      let col;
      if ((Math.abs(pi.x + 100) & 255 % 2) ^ (Math.abs(pi.z + 100) & 255 % 2)) {
        col = COL_SQUARE_1;
      } else {
        col = COL_SQUARE_2;
      }

      return {
        col,
        t,
        pi,
      };
    }
  }

  // No intersection
  return null;
};
/**
 * Return a copy of the normal Vector for this disc.
 * @returns {Object} The normal Vector.
 */
Disc.prototype.get_norm = function() {
  return this.n.copy();
};
Disc.prototype.set_diffuse = function(diff) {
  this.diff = diff;
  this.spec = 1.0 - diff;
};

/**
 * Light class, can have position and colour.
 *
 * @class
 */
function Light(c, colour) {
  this.c = c;
  this.col = colour;
}

/**
 * Make an eye, the observer. There can only be one observer.
 * @param {Object} center
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @class
 */
function Eye(center, width, height, depth) {
  this.c = center;
  this.w = width;
  this.h = height;
  this.d = depth;
}

/**
 * Class to make the scene, can add objects, lights.  Requires an eye for constructor.
 * @param {Eye} eye    - The observer for the scene.
 * @class
 */
function Scene(eye) {
  this.eye = eye;
  this.lights = []; // The list of lights for the scene
  this.objs = []; // The list of objects in the scene
}
Scene.prototype.addLight = function(light) {
  this.lights.push(light);
};
Scene.prototype.addObject = function(obj) {
  this.objs.push(obj);
  obj.rendered = false; // Has this object been rendered in the last sequence
};

/**
 * A ray that gets cast.
 * @param {Object} origin
 * @param {Object} direction - (must be normalised).
 * @class
 */
function Ray(origin, direction) {
  this.origin = origin;
  this.direction = direction;
  this.dotDD = direction.dot(direction);
}

module.exports = {
  Scene,
  Eye,
  Light,
  Disc,
  Sphere,
  Ray,
};

},{"../common/Constants":2,"../common/Vector":4}],6:[function(require,module,exports){
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

const Vector = require('../common/Vector');

/**
 * A **very** simple physics implimentation.
 * @param groundVector
 * @param options
 * @constructor
 */
function Physics(groundVector, options) {
  this.obj_list = [];
  this.gravity = new Vector(0.0, -0.00981, 0.0);
  this.ground_vector = groundVector;
  this.options = options;
}

Physics.prototype.addObject = function(obj) {
  this.obj_list[this.obj_list.length] = obj;
  obj.velocity = new Vector(0, 0, 0);
};

Physics.prototype.applyForces = function() {
  for (let i = 0; i < this.obj_list.length; i += 1) {
    rotate3d(this.obj_list[i].c, (5 / 180) * Math.PI);
  }

  function rotate3d(p, angle) {
    const sinT = Math.sin(angle);
    const cosT = Math.cos(angle);

    const x = p.x;
    const z = p.z;
    p.x = x * cosT - z * sinT;
    p.z = z * cosT + x * sinT;
  }
};

module.exports = Physics;

},{"../common/Vector":4}],7:[function(require,module,exports){
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

/* globals self */

const RayTracer = require('./RayTracer');
const constants = require('../common/Constants');
const WorkUnit = require('../lib/WorkUnit');

const rt = new RayTracer(constants.WIDTH, constants.HEIGHT);
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
  const buffer = rt.render(workUnit.message.stripId);
  workUnit.message.buffer = buffer;
  self.postMessage(workUnit.toObject());
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

},{"../common/Constants":2,"../lib/WorkUnit":1,"./RayTracer":8}],8:[function(require,module,exports){
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

/*********************************************************************/
/**                                                                 **/
/**      Javascript    Ray    Tracer                                **/
/**                                                                 **/
/*********************************************************************/

/*********************************************************************

         Coordinate system used:

         +y

         ^  ^  +z (depth)
         | /
         |/
         +----->  +x

 *********************************************************************/

'use strict';

const Objects = require('./Objects');
const Physics = require('./Physics');
const constants = require('../common/Constants');
const Vector = require('../common/Vector');
const FPSTimer = require('../common/FPSTimer');

//
// Some global constants.
//

const COL_BACKGROUND = constants.COL_BACKGROUND;
const GROUND_PLANE = constants.GROUND_PLANE;
const EPSILON = constants.EPSILON;
const Ray = Objects.Ray;

/**
 * The Ray Tracer.
 *
 * @param {number} cols - Number of columns.
 * @param {number} rows - Number of rows.
 * @class
 */
function RayTracer(cols, rows) {
  this.cols = cols;
  this.rows = rows;
  this.depth = constants.DEPTH;
  this.timers = {
    raytrace: FPSTimer(),
    intersect: FPSTimer(),
    getShadeAtPoint: FPSTimer(),
  };

  /**************************************/
  /* Create the scene, add our objects. */
  /**************************************/

  // set up the Physics
  this.physics = new Physics(GROUND_PLANE, {
    bouncing: false,
  });

  // Init the eye and scene
  const eye = new Objects.Eye(new Vector(0.0, 2, -15.0), 0.75, 0.75, 2.0);
  this.scene = new Objects.Scene(eye);

  // Add a disc
  const discCenter = new Vector(0.0, 0.0, 0);
  const discNormal = new Vector(0.0, 1.0, 0.0);
  const disc = new Objects.Disc(discCenter, discNormal);
  disc.r = 6;
  disc.rfl = 0.7; // Reflectivity -> 0.0 to 1.0
  disc.rfr = 0; // Refractivity
  disc.ambient_light = 0.6;
  disc.set_diffuse(0.2);
  disc.canCreateShadow = false;
  disc.canReceiveShadow = true;
  this.scene.addObject(disc);

  // Add a sphere
  const sphCenter = new Vector(0.7, 1.2, 0.4);
  const sph = new Objects.Sphere(sphCenter);
  sph.r = 1.0; // Radius
  sph.col = constants.COL_RED; // Colour of sphere
  sph.rfl = 0.9; // Reflectivity -> 0.0 to 1.0
  sph.rfr = 0; // Refractivity
  sph.ambient_light = 0.2;
  sph.set_diffuse(0.2);
  sph.canCreateShadow = true;
  sph.canReceiveShadow = false;
  this.scene.addObject(sph);
  this.physics.addObject(sph);

  // ... and another sphere
  const sph2Center = new Vector(-1.5, 1.6, 0.4);
  const sph2 = new Objects.Sphere(sph2Center);
  sph2.r = 0.8;
  sph2.col = constants.COL_WHITE;
  sph2.rfl = 0.6;
  sph2.rfr = 0; // Refractivity
  sph2.ambient_light = 0.2;
  sph2.set_diffuse(0.7);
  sph2.canCreateShadow = true;
  sph2.canReceiveShadow = false;
  this.scene.addObject(sph2);
  this.physics.addObject(sph2);

  // ... and another sphere
  const sph3Center = new Vector(1.2, 0.8, -1.8);
  const sph3 = new Objects.Sphere(sph3Center);
  sph3.r = 0.8;
  sph3.col = constants.COL_WHITE;
  sph3.rfl = 0.4;
  sph3.rfr = 1.12; // Refractivity
  sph3.ambient_light = 0.05;
  sph3.set_diffuse(0);
  sph3.canCreateShadow = true;
  sph3.canReceiveShadow = false;
  this.scene.addObject(sph3);
  this.physics.addObject(sph3);

  // Add a light
  const lightC = new Vector(5, 7.5, -2.0);
  const lightCol = constants.COL_WHITE;
  const light = new Objects.Light(lightC, lightCol);
  this.scene.addLight(light);

  /**************************************/
  /*     Do some pre-calculations.      */
  /**************************************/

  // Start in the top left
  const xDirectionStart = -this.scene.eye.w / 2.0;
  const yDirectionStart = this.scene.eye.h / 2.0;
  const direction = new Vector(xDirectionStart, yDirectionStart, this.scene.eye.d);
  const origin = this.scene.eye.c;
  const dnx = new Vector(this.scene.eye.w / (this.cols - 1.0), 0, 0);
  const dny = new Vector(0, this.scene.eye.h / (this.rows - 1.0), 0);

  // Prepare the strips
  this.strips = [];
  let strip;
  let pnt = 0;
  for (let row = 0; row < this.rows; row += 1) {
    if (row % constants.SQUARE_SIZE === 0) {
      strip = [];
    }

    for (let col = 0; col < this.cols; col += 1) {
      direction.addInplace(dnx);
      const firstRay = new Ray(origin, direction.normalise());
      strip.push({
        firstRay,
        pnt,
        pixelCol: new Vector(0, 0, 0),
      });
      pnt += 1;
    }

    direction.x = xDirectionStart;
    direction.subInplace(dny);

    if ((row + 1) % constants.SQUARE_SIZE === 0) {
      this.strips.push(strip);
    }
  }

  // Prepare the result strip, this will be copied, it means we don't have
  // do the 255 copy.
  const len = this.cols * constants.SQUARE_SIZE * 4;
  this.preparedStrip = new Uint8ClampedArray(len);
  for (let i = 3; i < len; i += 4) {
    this.preparedStrip[i] = 255;
  }
}

RayTracer.prototype.getNumStrips = function() {
  return this.strips.length;
};
RayTracer.prototype.increment = function() {
  this.physics.applyForces();
};

/**
 * Render the scene.  This will update the data object that was provided.
 *
 * @param {number} stripID - The strip number to render.
 * @returns {ArrayBuffer} - The strip.
 */
RayTracer.prototype.render = function render(stripID) {
  const self = this;
  const objs = self.scene.objs;
  const resultGrid = new Uint8ClampedArray(this.preparedStrip);

  // The "main loop"
  raytraceStrip(self.strips[stripID]);
  return resultGrid.buffer;

  function raytraceStrip(strip) {
    let staticColour = COL_BACKGROUND.copy();

    const staticBackground = COL_BACKGROUND.copy();
    staticBackground.scaleInplace(255);
    staticBackground.maxValInplace(255);

    // TopLeft (TL), TopRight (TR), ...
    let sPntTL = 0;
    let sPntTR = constants.SQUARE_SIZE - 1;
    let sPntBL = (constants.SQUARE_SIZE - 1) * self.cols;
    let sPntBR = sPntBL + constants.SQUARE_SIZE - 1;
    let sPntMid = (sPntBR / 2) | 0; // eslint-disable-line no-bitwise

    // For Each Square
    while (sPntTL < self.cols) {
      const pixelColTL = COL_BACKGROUND.copy();
      raytrace(pixelColTL, self.depth, strip[sPntTL].firstRay, -1, 1);
      const pixelColTR = COL_BACKGROUND.copy();
      raytrace(pixelColTR, self.depth, strip[sPntTR].firstRay, -1, 1);
      const pixelColBL = COL_BACKGROUND.copy();
      raytrace(pixelColBL, self.depth, strip[sPntBL].firstRay, -1, 1);
      const pixelColBR = COL_BACKGROUND.copy();
      raytrace(pixelColBR, self.depth, strip[sPntBR].firstRay, -1, 1);
      const pixelColMid = COL_BACKGROUND.copy();
      raytrace(pixelColMid, self.depth, strip[sPntMid].firstRay, -1, 1);

      let sPnt = sPntTL;

      // Check to see if we can fill the square with black
      const pixSum = pixelColTL
        .add(pixelColTR)
        .add(pixelColBL)
        .add(pixelColBR)
        .add(pixelColMid);
      const allElementsAreZero = pixSum.sumElements() === 0;

      // Fill the square with colour (or black)
      for (let r = 0; r < constants.SQUARE_SIZE; r += 1) {
        for (let c = 0; c < constants.SQUARE_SIZE; c += 1) {
          if (allElementsAreZero) {
            staticColour = staticBackground;
          } else {
            // Don't need to calculate those that have already be calculated
            if (sPnt === sPntTL) {
              staticColour = pixelColTL;
            } else if (sPnt === sPntTR) {
              staticColour = pixelColTR;
            } else if (sPnt === sPntBL) {
              staticColour = pixelColBL;
            } else if (sPnt === sPntBR) {
              staticColour = pixelColBR;
            } else {
              raytrace(staticColour, self.depth, strip[sPnt].firstRay, -1, 1);
            }
            staticColour.scaleInplace(255);
            staticColour.maxValInplace(255);
          }

          resultGrid[sPnt * 4] = staticColour.x;
          resultGrid[sPnt * 4 + 1] = staticColour.y;
          resultGrid[sPnt * 4 + 2] = staticColour.z;
          // resultGrid[sPnt * 4 + 3] = 255;
          sPnt += 1;
        }
        sPnt += self.cols - constants.SQUARE_SIZE;
      }

      sPntTL += constants.SQUARE_SIZE;
      sPntTR += constants.SQUARE_SIZE;
      sPntBL += constants.SQUARE_SIZE;
      sPntBR += constants.SQUARE_SIZE;
      sPntMid += constants.SQUARE_SIZE;
    }
  }

  /**
   * Recursive function that returns the shade of a pixel.
   *
   * @param {Object} colour    - The colour - this value gets changed in place.
   * @param {number} depth     - How many iterations left.
   * @param {Ray} ray          - The ray.
   * @param {number} objID  - The ID of the object the ray comes from.
   * @param {number} rindex    - Refractivity.
   */
  function raytrace(colour, depth, ray, objID, rindex) {
    if (depth === 0) {
      colour.set(COL_BACKGROUND);
      return;
    }

    let closestObjId = -1;
    let closestInt;
    const len = objs.length;

    for (let i = 0; i < len; i += 1) {
      // Don't intersect object with itself
      if (i !== objID) {
        const obj = objs[i];

        const intersection = obj.intersect(ray);
        if (intersection !== null) {
          if (closestObjId === -1 || intersection.t < closestInt.t) {
            closestInt = intersection;
            closestObjId = i;
          }
        }
      }
    }

    if (closestObjId === -1) {
      colour.set(COL_BACKGROUND);
    } else {
      colour.set(closestInt.col);
      // If we found an object, get the shade for the object.  Otherwise return the background
      getShadeAtPoint(colour, depth, ray, closestObjId, closestInt.pi, rindex);
    }
  }

  /**
   * Get the shade of the pixel - where the work is done.
   * @param {Object} colour - The colour - this value gets changed in place.
   * @param {number} depth - How many iterations left.
   * @param {Ray} ray -  The ray.
   * @param {number} objID -  The ID of the object the ray just hit.
   * @param {Object} pi - The intersection point.
   * @param {number} rindex - Refractivity.
   */
  function getShadeAtPoint(colour, depth, ray, objID, pi, rindex) {
    const obj = objs[objID];
    colour.scaleInplace(obj.ambient_light);

    const light = self.scene.lights[0];

    // handle point light source -
    const L = light.c.sub(pi);
    const shade = getShading(L, pi, objID);

    // calculate diffuse shading
    L.normaliseInplace();
    const V = ray.direction;
    const N = obj.get_norm(pi);
    const dotLN = L.dot(N);
    const dotVN = ray.direction.dot(N);
    if (obj.diff > 0) {
      if (dotLN > 0) {
        const diff = dotLN * obj.diff * shade;
        // add diffuse component to ray color
        colour.addInplace(light.col.product(obj.col).scale(diff));
      }
    }

    // determine specular component
    let R;
    if (obj.spec > 0.0001) {
      // point light source: sample once for specular highlight

      R = L; // NOTE: don't use L after this point
      R.subInplace(N.scale(2 * dotLN));
      const dotVR = V.dot(R);
      if (dotVR > 0.0001) {
        const spec = dotVR ** 20 * obj.spec * shade;
        // add specular component to ray color
        colour.addInplace(light.col.scale(spec));
      }
    }

    // calculate reflection
    if (obj.rfl > 0) {
      R = ray.direction.sub(N.scale(2 * dotVN));
      if (depth > 0) {
        const newRay = new Ray(pi.add(R.scale(EPSILON)), R);

        const rcol = COL_BACKGROUND.copy();
        raytrace(rcol, depth - 1, newRay, objID, 1);
        rcol.productInplace(obj.col);
        rcol.scaleInplace(obj.rfl);
        colour.addInplace(rcol);
      }
    }

    // calculate refraction
    if (obj.rfr > 0) {
      const n = rindex / obj.rfr;
      const result = rindex === 1.0 ? 1 : -1;
      const rN = N;
      rN.scaleInplace(result); // NOTE: Don't use N after this point
      const cosI = -dotVN;
      const cosT2 = 1 - n * n * (1.0 - cosI * cosI);
      if (cosT2 > 0) {
        rN.scaleInplace(n * cosI - Math.sqrt(cosT2));
        let T = ray.direction;
        T = T.scale(n);
        T.addInplace(rN);
        const refrRay = new Ray(pi.add(T.scale(EPSILON)), T);
        const rfrCol = COL_BACKGROUND.copy();
        raytrace(rfrCol, depth - 1, refrRay, objID, obj.rfr);
        colour.addInplace(rfrCol);
      }
    }
  }

  function getShading(L, pi, objID) {
    const tdist = L.length();
    const Lt = L.scale(1 / tdist);
    const r = new Ray(pi.add(Lt.scale(EPSILON)), Lt);
    for (let i = 0; i < objs.length; i += 1) {
      // Don't intersect with self...
      // ... and check if an object is in the way of the light source

      if (objID !== i && objs[objID].canReceiveShadow && objs[i].canCreateShadow && objs[i].intersect(r) !== null) {
        return 0;
      }
    }
    return 1;
  }
};

module.exports = RayTracer;

},{"../common/Constants":2,"../common/FPSTimer":3,"../common/Vector":4,"./Objects":5,"./Physics":6}]},{},[7]);
