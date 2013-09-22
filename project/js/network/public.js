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

goog.provide('network.public');
goog.provide('network.ISynchronizer');
goog.provide('network.ISynchronizable');
goog.provide('network.Type');
goog.provide('network.Flags');

goog.require('network.classInfo');

/**
 * @interface
 */
network.ISynchronizer = function () {};
/**
 * @public
 * @param {*} data
 * @param {network.Type} type
 * @param {network.Flags} flags
 */
network.ISynchronizer.synchronize = function (data, type, flags) {};

/**
 * @constructor
 */
network.SynchronizeManager = function () {
    this.classInfo = [];
};

network.SynchronizeManager.nextId_ = 0;

network.SynchronizeManager.dummyDestroyCallback = function (obj) {};

network.SynchronizeManager.prototype.registerClass = function (constructor,
                                                               factoryFunction,
                                                               destroyCallback) {
    goog.asserts.assert(factoryFunction);
    goog.asserts.assert(this.classInfo.length === network.SynchronizeManager.nextId_);
    
    var classInfo;
    var classId = network.SynchronizeManager.nextId_++;
    var sampleObj = factoryFunction();
    
    // building class info
    var builder = new network.ClassInfoBuilder(classId);
    sampleObj.synchronize(builder);

    destroyCallback = destroyCallback || network.SynchronizeManager.dummyDestroyCallback;
    builder.addFunctions(factoryFunction, destroyCallback);

    classInfo = builder.getClassInfo;

    this.classInfo.push(classInfo);

    // adding metadata to prototype
    constructor.prototype.__networkClassId__ = classId;
};

/**
 * @interface
 * A class must implement this to be synchronized.
 */
network.ISynchronizable = function () {};
/**
 * @param {network.ISynchronizer} synchronizer
 */
network.ISynchronizable.prototype.synchronize = function (synchronizer) {};

/**
 * enum {number}
 */
network.Type = {
    INT8: 0,
    INT16: 1,
    INT32: 3,
    UINT8: 4,
    UINT16: 5,
    UINT32: 6,
    FLOAT32: 7,

    VEC3: 8,
    MTX4: 9,
    
    CHAR: 10,
    STRING: 11, // currently not supported

    OBJECT: 12    
};

/**
 * enum {number}
 */
network.Flags = {
    ARRAY: 1,
    NORMAL_VECTOR: 2
};

