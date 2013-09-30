/**
 * Copyright (C) 2013 Adam Rzepka
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

goog.provide('network.ObjectBuffer');
goog.provide('network.Snapshot');

/**
 * @constructor
 */
network.ObjectBuffer = function () {
    /**
     * @public
     * @type {number}
     */
    this.id = -1;
    /**
     * @public
     * @type {number}
     */
    this.classId = -1;
    /**
     * @public
     * @type {Array.<*>}
     * Holding object data (only primitive type or other object id)
     */
    this.data = [];
};

/**
 * @constructor
 */
network.Snapshot = function () {
    /**
     * @public
     * @type {number}
     */
    this.timestamp = 0;
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.objects = [];
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.arrays = [];
};

/**
 * @constructor
 */
network.SnapshotDelta = function () {
    /**
     * @public
     * @type {number}
     */
    this.timestampA = 0;
    /**
     * @public
     * @type {number}
     */
    this.timestampB = 0;
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.objects = [];
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.arrays = [];
    
    /**
     * @public
     * @type {Array.<network.ObjectBuffer>}
     */
    this.addedObjects = [];
    /**
     * @public
     * @type {Array.<number>}
     */
    this.removedObjects = [];
    /**
     * @public
     * @type {Array.<number>}
     */
    this.removedArrays = [];
};

/**
 * @param {network.Snapshot} snapshot1
 * @param {network.Snapshot} snapshot2
 * @param {network.SnapshotDelta} dalta
 */
network.Snapshot.diff = function (snapshot1, snapshot2, delta) {
    var i = 0, j = 0;
    var a, b, da, db;
    var objBuf;
    var count = Math.max(snapshot1.objects.length, snapshot2.objects.length);
    delta.timestampA = snapshot1.timestamp;
    delta.timestampB = snapshot2.timestamp;
    for (i = 0; i < count; ++i) {
        a = snapshot1.objects[i];
        b = snapshot2.objects[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            objBuf = new network.ObjectBuffer();
            objBuf.id = a.id;
            for (j = 0; j < b.data.length; ++j) {
                da = a.data[j];
                db = b.data[j];
                goog.asserts.assert(goog.isDefAndNotNull(da));
                
                if (typeof db === 'number') {
                    objBuf.data[j] = db - da;
                } else {
                    objBuf.data[j] = (db === da ? 0 : db);
                }
                
            }
            delta.objects[objBuf.id] = objBuf;
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            delta.addedObjects.push(b);
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            delta.removedObjects.push(a.id);
            delta.objects[a.id] = null;
        }
    }
    count = Math.max(snapshot1.arrays.length, snapshot2.arrays.length);
    for (i = 0; i < count; ++i) {
        a = snapshot1.arrays[i];
        b = snapshot2.arrays[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            objBuf = new network.ObjectBuffer();
            objBuf.id = a.id;
            for (j = 0; j < b.data.length; ++j) {
                da = a.data[j];
                db = b.data[j];
                if (goog.isDefAndNotNull(da)) {
                    if (typeof db === 'number') {
                        objBuf.data[j] = db - da;
                    } else {
                        objBuf.data[j] = (db === da ? 0 : db);
                    }
                } else {
                    objBuf.data[j] = db;
                }
            }
            delta.arrays[objBuf.id] = objBuf;
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            delta.arrays[b.id] = b;
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            delta.removedArrays.push(a.id);
        }
    }
};

/**
 * @param {network.Snapshot} snapshot1
 * @param {network.SnapshotDelta} dalta
 * @param {network.Snapshot} snapshot2
 */
network.Snapshot.sum = function (snapshot1, delta, snapshot2) {
    var i = 0, j = 0;
    var a, b, da, db;
    var objBuf;
    var count = Math.max(snapshot1.objects.length, delta.objects.length);
    goog.asserts.assert(snapshot1.timestamp === delta.timestampA);
    snapshot2.timestamp = delta.timestampB;

    for (i = 0; i < count; ++i) {
        a = snapshot1.objects[i];
        b = delta.objects[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            objBuf = new network.ObjectBuffer();
            objBuf.id = a.id;
            for (j = 0; j < b.data.length; ++j) {
                da = a.data[j];
                db = b.data[j];
                goog.asserts.assert(goog.isDefAndNotNull(da));
                objBuf.classId = a.classId;
                if (typeof da === 'number') {
                    objBuf.data[j] = db + da;
                } else {
                    objBuf.data[j] = (db === 0 ? da : db);
                }                
            }
            snapshot2.objects[objBuf.id] = objBuf;
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.fail();
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            if (delta.removedObjects.indexOf(a.id) !== -1) {
                snapshot2.objects[a.id] = null;
            } else {
                snapshot2.objects[a.id] = a; // !!! without clonning, should be working for now
            }
        }
    }
    count = delta.addedObjects.length;
    for (i = 0; i < count; ++i) {
        snapshot2.objects[delta.addedObjects[i].id] = delta.addedObjects[i];
    }
    count = Math.max(snapshot1.arrays.length,delta.arrays.length);
    for (i = 0; i < count; ++i) {
        a = snapshot1.arrays[i];
        b = delta.arrays[i];
        if (goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            goog.asserts.assert(a.id === b.id);
            objBuf = new network.ObjectBuffer();
            objBuf.id = a.id;
            for (j = 0; j < b.data.length; ++j) {
                da = a.data[j];
                db = b.data[j];
                if (goog.isDefAndNotNull(da)) {
                    if (typeof da === 'number') {
                        objBuf.data[j] = db + da;
                    } else {
                        objBuf.data[j] = (db === 0 ? da : db);
                    }
                } else {
                    objBuf.data[j] = db;
                }
            }
            snapshot2.arrays[objBuf.id] = objBuf;
        } else if (!goog.isDefAndNotNull(a) && goog.isDefAndNotNull(b)) {
            snapshot2.arrays[b.id] = b;
        } else if (goog.isDefAndNotNull(a) && !goog.isDefAndNotNull(b) ) {
            if (delta.removedObjects.indexOf(a.id) !== -1) {
                snapshot2.arrays[a.id] = null;
            } else {
                snapshot2.arrays[a.id] = a;
            }            
        }
    }
};

