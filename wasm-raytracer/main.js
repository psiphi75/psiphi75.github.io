(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/* globals Worker */

const WorkUnit = require('./WorkUnit');

Array.prototype.removeItem = function removeItem(expression) {
  const arr = [];
  let idx = 0;
  let item;
  for (; idx < this.length; idx++) {
    const currentItem = this[idx];
    if (!expression(currentItem)) {
      arr.push(currentItem);
    } else {
      item = currentItem;
    }
  }
  for (; idx < this.length; idx++) {
    arr.push(this[idx]);
  }
  return { arr, item };
};

const MAX_WORK_UNIT_QUEUE = 1;

class AbruptWorker {
  constructor(workerUri) {
    this.worker = null;
    this.workerUri = workerUri;
    this.remainingWork = 0;
  }

  loadWorker() {
    this.worker = new Worker(this.workerUri);
    const self = this;
    return new Promise(resolve => {
      self.worker.addEventListener('message', function handleFirstMessage(msg) {
        if (msg.data !== 'started') throw new Error('Invalid start message');
        self.remainingWork = 0;
        self.worker.removeEventListener('message', handleFirstMessage);
        resolve(self);
      });
    });
  }

  addHandler(handleWorkerComplete) {
    this.worker.addEventListener('message', msg => {
      this.workComplete();
      return handleWorkerComplete(msg);
    });
    return this;
  }

  addWork(workUnit) {
    if (this.remainingWork + 1.0 > MAX_WORK_UNIT_QUEUE) {
      throw new Error('Cannot handle more than one unit of work');
    }
    this.worker.postMessage(workUnit.toObject());
    this.remainingWork += 1.0;
    return this;
  }

  workComplete() {
    this.remainingWork -= 1.0;
    return this;
  }

  terminate() {
    this.worker.terminate();
  }
}

class Abrupt {
  constructor({ maxDiffWorkId = Infinity, maxConcurrent = Infinity } = {}) {
    this.inProgress = [];

    this.nextWorkUnitId = 0;
    this.workUnits = [];

    this.nextWorkerId = 0;
    this.workers = undefined;

    this.maxDiffWorkId = maxDiffWorkId;
    this.maxConcurrent = maxConcurrent;

    this.onWorkUnitComplete = () => {};
    this.onNearComplete = () => {};
    this.onAllComplete = () => {};
  }

  setWorkers(webWorkerUris, messageHandler) {
    if (this.workers) {
      throw new Error('Can only set the workers once');
    }
    this.workers = webWorkerUris.map(webWorkerUri => new AbruptWorker(webWorkerUri));

    return Promise.all(this.workers.map(worker => worker.loadWorker())).then(workers =>
      workers.map(worker =>
        worker.addHandler(msg => {
          const workUnit = WorkUnit.fromObject(msg.data);
          this.handleWorkerComplete(messageHandler, workUnit);
        })
      )
    );
  }

  addWorkUnits(units) {
    if (!(units instanceof Array)) {
      throw new Error('addWorkUnits() expects an array as the parameter');
    }
    this.workUnits.push(...units.map(unit => new WorkUnit(unit, this.nextWorkUnitId++)));
    while (this.scheduleWork() !== null);
  }

  getNextWorker() {
    if (this.inProgress.length >= this.maxConcurrent) {
      return null;
    }

    for (let id = 0; id < this.workers.length; id += 1) {
      const worker = this.workers[id];
      if (worker.remainingWork === 0) {
        return worker;
      }
    }

    return null;
  }

  getNextWorkUnit() {
    const workUnit = this.workUnits.shift();
    return workUnit;
  }

  scheduleWork(oldWorkUnit) {
    const worker = this.getNextWorker();
    if (!worker) return null;
    const workUnit = this.getNextWorkUnit();
    if (!workUnit) return null;
    if (oldWorkUnit) oldWorkUnit.supersededBy(workUnit);
    worker.addWork(workUnit);
    this.inProgress.push(workUnit);
    return workUnit.workerId;
  }

  rescheduleOverdueWorkItems() {
    const maxInProgressWorkUnitId = this.inProgress.reduce((acc, workUnit) => Math.max(acc, workUnit.workUnitId), 0);
    return this.inProgress
      .filter(workUnit => maxInProgressWorkUnitId - workUnit.workUnitId > this.maxDiffWorkId)
      .map(workUnit => {
        workUnit.replacedByWorkId = this.scheduleWork(workUnit);
        return workUnit;
      });
  }

  handleWorkerComplete(messageHandler, completedWorkUnit) {
    const { arr, item: origWorkUnit } = this.inProgress.removeItem(
      wu => wu.workUnitId === completedWorkUnit.workUnitId
    );
    this.inProgress = arr;

    if (!origWorkUnit) {
      console.log('Dropped work unit');
      return;
    }

    // Check if the work unit has been replaced
    if (typeof origWorkUnit.replacedByWorkId === 'number') {
      const replacedByWorkUnit = this.inProgress.find(wu => wu.workUnitId === origWorkUnit.replacedByWorkId);

      // Cancel the replaced work unit
      if (replacedByWorkUnit) {
        const { arr2 } = this.inProgress.removeItem(wu => wu.workUnitId === completedWorkUnit._abrupt.workUnitId);
        this.inProgress = arr2;
      }
    }

    this.rescheduleOverdueWorkItems();
    this.scheduleWork();
    messageHandler(null, completedWorkUnit.message);
    if (this.inProgress.length === 0) {
      this.onAllComplete(null, []);
    }
  }

  terminateAll() {
    this.workers.forEach(worker => worker.terminate());
  }
}

if (module.exports) {
  module.exports = Abrupt;
}

},{"./WorkUnit":2}],2:[function(require,module,exports){
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

const Abrupt = require('./lib/Abrupt.js');

function ManageRayTracing(numWorkers, isPaused, numStrips, depth, images, renderCallback, workerUri) {
  let activeImage = 0;
  const abrupt = new Abrupt({ maxDiffWorkId: 30, maxConcurrent: 8 });

  const createWorkUnitsFn = imgId =>
    [...Array(numStrips).keys()].reverse().map(stripId => ({
      type: 'raytrace',
      stripId,
      imgId,
    }));
  const renderWorkUnits = {
    0: createWorkUnitsFn(0),
    1: createWorkUnitsFn(1),
  };
  const incWorkUnit = {
    type: 'inc',
  };

  // Load the workers
  const workerUris = [...Array(numWorkers)].map(() => workerUri);
  abrupt.setWorkers(workerUris, handleMessageFromWorker).then(() => {
    next();
  });
  abrupt.onAllComplete = err => {
    if (err) {
      throw new Error('Something wicked happened!');
    }
    next();
  };

  //
  // Functions
  //

  function startRenderWork(imgId) {
    abrupt.addWorkUnits([...Array(numWorkers)].map(() => incWorkUnit));
    abrupt.addWorkUnits(renderWorkUnits[imgId]);
  }

  function next() {
    if (isPaused) return;
    startRenderWork(activeImage === 0 ? 1 : 0);
    renderCallback(activeImage);
    activeImage = activeImage === 0 ? 1 : 0;
  }

  function handleMessageFromWorker(err, message) {
    switch (message.type) {
      case 'raytrace':
        handleRenderUpdate(message);
        break;

      case 'inc_done':
        break;

      case 'error':
        console.error('There was an error from the worker.');
        break;

      default:
        console.error(`Unexpected msg type: ${message.type}`);
    }
  }

  function handleRenderUpdate({ stripId, imgId, buffer }) {
    const startPnt = stripId * buffer.byteLength;
    images[imgId].data.set(new Uint8ClampedArray(buffer), startPnt);
  }

  return {
    pause: setPause => {
      if (setPause === isPaused) return;
      isPaused = setPause;

      // Need to resume
      if (!isPaused) {
        startRenderWork(activeImage);
      }
    },
    cancel: () => {
      abrupt.terminateAll();
    },
  };
}

module.exports = ManageRayTracing;

},{"./lib/Abrupt.js":1}],4:[function(require,module,exports){
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

},{"./Vector":6}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

/* globals document window ImageData */

const constants = require('./common/Constants');
const ManageRayTracing = require('./ManageRayTracing');
const FPSTimer = require('./common/FPSTimer');

// Let the page load.
window.onload = () => {
  function loadRTManager() {
    return ManageRayTracing(
      constants.NUM_WORKERS,
      false,
      numStrips,
      constants.DEPTH,
      images,
      renderCallback,
      document.getElementById('selectRenderMethod').value
    );
  }

  let animationIsPaused = false;
  const timer = FPSTimer();

  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');

  context.font = '30px Arial';

  context.canvas.height = constants.HEIGHT;
  context.canvas.width = constants.WIDTH;
  const images = [new ImageData(constants.WIDTH, constants.HEIGHT), new ImageData(constants.WIDTH, constants.HEIGHT)];

  // Set the colour to white
  for (let p = 0; p < images[0].data.length; p += 4) {
    images[0].data[p + 3] = 255;
    images[1].data[p + 3] = 255;
  }

  const numStrips = constants.HEIGHT / constants.SQUARE_SIZE;

  let rtMan = loadRTManager();

  timer.start();

  // Attach runPause
  document.getElementById('run_button').addEventListener(
    'click',
    () => {
      animationIsPaused = !animationIsPaused;
      rtMan.pause(animationIsPaused);
      console.log(animationIsPaused ? 'Let us take a break' : 'Go!');
    },
    false
  );

  // Attach runPause
  document.getElementById('selectRenderMethod').addEventListener(
    'change',
    () => {
      timer.stop();
      timer.reset();
      rtMan.cancel();
      rtMan = loadRTManager();
    },
    false
  );

  function renderCallback(imgId) {
    const fps = timer.stop();
    timer.start();

    context.putImageData(images[imgId], 0, 0);

    context.fillStyle = 'white';
    context.fillText(`FPS: ${fps.toFixed(1)}`, 5, 12);
    context.fillText(`avg: ${timer.average().toFixed(2)}`, 5, 22);
  }
};

},{"./ManageRayTracing":3,"./common/Constants":4,"./common/FPSTimer":5}]},{},[7,3]);
