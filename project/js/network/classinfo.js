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

goog.require('goog.asserts');
goog.require('network');

goog.provide('network.ClassInfo');
goog.provide('network.ClassInfoBuilder');
goog.provide('network.ClassInfoManager');

/**
 * @constructor
 * @param {number} classId
 */
network.ClassInfo = function (classId) {
    /**
     * @public
     * @const
     * @type {number}
     */
    this.id = classId;
    /**
     * @public
     * @type {number}
     */
    this.fieldsCount = 0;
    /**
     * @public
     * @type {Array.<network.Type>}
     */
    this.types = [];
    /**
     * @public
     * @type {Array.<number>}
     * Flags from network.Flags
     */
    this.flags = [];
    /**
     * @public
     * @type {function(): network.ISynchronizable|null}
     */
    this.factoryFunction = null;
    /**
     * @public
     * @type {function(network.ISynchronizable)|null}
     */
    this.destroyCallback = null;
};

/**
 * @constructor
 * @implements {network.ISynchronizer}
 */
network.ClassInfoBuilder = function (classId) {
    /**
     * @private
     * @type {network.ClassInfo}
     */
    this.classInfo_ = new network.ClassInfo(classId);
};
/**
 * @public
 * @param {*} data
 * @param {network.Type} type
 * @param {number} [flags]
 * @return {*}
 */
network.ClassInfoBuilder.prototype.synchronize = function (data, type, flags) {
    var ci = this.classInfo_;
    ci.types.push(type);
    ci.flags.push(flags || 0);
    ++ci.fieldsCount;
    return data;
};
/**
 * @public
 * @return {network.ISynchronizer.Mode}
 */
network.ClassInfoBuilder.prototype.getMode = function () {
    return network.ISynchronizer.Mode.READ;
};
/**
 * @public
 * @param {function(): network.ISynchronizable} factoryFunction
 * @param {function(network.ISynchronizable)} destroyCallback
 */
network.ClassInfoBuilder.prototype.addFunctions = function (factoryFunction, destroyCallback) {
    goog.asserts.assert(factoryFunction);
    goog.asserts.assert(destroyCallback);
    this.classInfo_.factoryFunction = factoryFunction;
    this.classInfo_.destroyCallback = destroyCallback;
};
/**
 * @public
 * @return {network.ClassInfo}
 */
network.ClassInfoBuilder.prototype.getClassInfo = function () {
    goog.asserts.assert(this.classInfo_.fieldsCount > 0); // is classInfo already built?
    goog.asserts.assert(this.classInfo_.factoryFunction);
    goog.asserts.assert(this.classInfo_.destroyCallback);
    return this.classInfo_;
};

/**
 * @constructor
 */
network.ClassInfoManager = function () {
    /**
     * @private
     * @type {Array.<network.ClassInfo>}
     */
    this.classInfo_ = [];
    /**
     * @private
     * @type {number}
     */
    this.nextId_ = 0;
};

/**
 * @private
 * @param {Object} obj
 */
network.ClassInfoManager.dummyDestroyCallback_ = function (obj) {};

/**
 * @public
 * @param {*} constructor
 * @param {function(): network.ISynchronizable} factoryFunction
 * @param {function(network.ISynchronizable)} [destroyCallback]
 */
network.ClassInfoManager.prototype.registerClass = function (constructor,
                                                             factoryFunction,
                                                             destroyCallback) {
    goog.asserts.assert(factoryFunction);
    goog.asserts.assert(this.classInfo_.length === this.nextId_);
    
    var classInfo;
    var classId = this.nextId_++;
    var sampleObj = factoryFunction();
    
    // building class info
    var builder = new network.ClassInfoBuilder(classId);
    sampleObj.synchronize(builder);

    destroyCallback = destroyCallback || network.ClassInfoManager.dummyDestroyCallback_;
    builder.addFunctions(factoryFunction, destroyCallback);

    classInfo = builder.getClassInfo();

    this.classInfo_.push(classInfo);

    // adding metadata to prototype
    constructor.prototype.__networkClassId__ = classId;
};

network.ClassInfoManager.prototype.getClassInfo = function (id) {
    var info = this.classInfo_[id];
    goog.asserts.assert(goog.isDefAndNotNull(info));
    return info;
};

