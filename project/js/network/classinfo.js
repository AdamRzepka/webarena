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
goog.require('network.public');

goog.provide('network.ClassInfo');
goog.provide('network.ClassInfoBuilder');

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
     * @type {Array.<network.Flags>}
     */
    this.flags = [];
    /**
     * @public
     * @type {function(): network.ISynchronizable}
     */
    this.factoryFunction = null;
    /**
     * @public
     * @type {function(network.ISynchronizable)}
     */
    this.destroyCallback = null;
};

/**
 * @constructor
 * @implements {ISynchronizer}
 */
network.ClassInfoBuilder = function (classId) {
    /**
     * @private
     * @type {network.ClassInfo}
     */
    this.classInfo = new network.ClassInfo(classId);
};
/**
 * @public
 * @param {*} data
 * @param {network.Type} type
 * @param {network.Flags} flags
 */
network.ClassInfoBuilder.prototype.synchronize = function (data, type, flags) {
    var ci = this.classInfo;
    ci.types.push(type);
    ci.flags.push(flags);
    ++ci.fieldsCount;
    return data;
};
/**
 * @public
 * @param {function(): network.ISynchronizable} factoryFunction
 * @param {function(network.ISynchronizable)} destroyCallback
 */
network.ClassInfoBuilder.prototype.addFunctions = function (factoryFunction, destroyCallback) {
    goog.asserts.assert(factoryFunction);
    goog.asserts.assert(destroyCallback);
    this.factoryFunction = factoryFunction;
    this.destroyCallback = destroyCallback;
};
/**
 * @public
 * @return {network.ClassInfo}
 */
network.ClassInfoBuilder.prototype.getClassInfo = function () {
    goog.asserts.assert(this.classInfo.fieldsCount > 0); // is classInfo already built?
    goog.asserts.assert(this.factoryFunction);
    goog.asserts.assert(this.destroyCallback);
    return this.classInfo;
};

