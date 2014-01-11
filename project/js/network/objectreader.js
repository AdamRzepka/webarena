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
goog.require('goog.array');
goog.require('network');
goog.require('network.Snapshot');
goog.require('network.ClassInfo');
goog.require('network.ClassInfoManager');

goog.provide('network.ObjectReader');

/*
 * Simple, yet quite powerful serialization API.
 * Assumptions:
 * - serialized class must implement ISynchronizable interface,
 * - type and object ids must be unique and should be continuous
 *   and kept as low as possible (they serve as an array indices),
 * - arrays mustn't be shared between objects and must hold
 *   values of single type,
 * - for now shared objects are not recognized (but this can be fixed easly).
 */

/**
 * @constructor
 * @implements {network.ISynchronizer}
 */
network.ObjectReader = function (classInfoManager) {
    /**
     * @private
     * @type {network.Snapshot}
     */
    this.snapshot_ = new network.Snapshot();
    /**
     * @private
     * @type {Array.<{objectBuffer: network.ObjectBuffer, index: number}>}
     * Stack used to traverse through objects structure
     */
    this.stack_ = [{
                objectBuffer: new network.ObjectBuffer(),
                index: 0
            }]; // start with dummy ObjectBuffer on stack
    /**
     * @private
     * @type {number}
     * Top of the stack
     */
    this.top_ = 0;
    /**
     * @private
     * @type {network.ClassInfoManager}
     */
    this.classInfoManager_ = classInfoManager;
    /**
     * @private
     * @type {network.Snapshot}
     * For searching free object id
     */
    this.lastSnapshot_ = new network.Snapshot();
    /**
     * @private
     * @type {number}
     */
    this.lastId_ = -1;
};

/**
 * @public
 * @param {*} data
 * @param {network.Type} type
 * @param {number} [flags]
 * @return {*}
 */
network.ObjectReader.prototype.synchronize = function (data, type, flags) {
    var state = this.stack_[this.top_];
    var objBuffer = state.objectBuffer;
    var ci = this.classInfoManager_.getClassInfo(objBuffer.classId);

    flags = flags || 0;

    goog.asserts.assert(type === ci.types[state.index]);
    goog.asserts.assert(flags === ci.flags[state.index]);

    return this.read_(data, type, flags);
    
    // if (flags & network.Flags.ARRAY) {
    //     goog.asserts.assert(goog.isArray(data));
    //     return this.readArray_((/**@type{Array.<*>}*/data));
    // }
    // else if (type === network.Type.OBJECT) {
    //     goog.asserts.assert(typeof data === 'object');
    //     return this.readObject_((/**@type{network.ISynchronizable}*/data));
    // }
    // else {
    //     return this.readPrimitive_(data);
    // }
};

/**
 * @public
 * @param {network.ISynchronizable} scene
 * @return {network.Snapshot}
 */
network.ObjectReader.prototype.readScene = function (scene) {
    this.lastSnapshot_ = this.snapshot_;
    this.snapshot_ = new network.Snapshot();
    this.stack_.legth = 1;
    this.stack_[0].index = 0;
    this.top_ = 0;    
    this.lastId_ = -1;

    this.readObject_(scene);
    return this.snapshot_;
};

/**
 * @public
 * @return {network.ISynchronizer.Mode}
 */
network.ObjectReader.prototype.getMode = function () {
    return network.ISynchronizer.Mode.READ;
};

/**
 * @private
 * @return number
 */
network.ObjectReader.prototype.findFreeId_ = function () {
    var i;
    for (i = this.lastId_ + 1; goog.isDefAndNotNull(this.lastSnapshot_.objects[i]); ++i) {
    }
    this.lastId_ = i;
    return i;
};

/**
 * @private
 * @param {*} data
 * @param {network.Type} type
 * @param {number} flags
 */
network.ObjectReader.prototype.read_ = function (data, type, flags) {
    if (flags & network.Flags.ARRAY) {
        goog.asserts.assert(goog.isArray(data));
        return this.readArray_((/**@type{Array.<*>}*/data), type, flags);
    }
    else if (type === network.Type.OBJECT) {
        goog.asserts.assert(typeof data === 'object');
        return this.readObject_((/**@type{network.ISynchronizable}*/data));
    }
    else {
        return this.readPrimitive_(data);
    }
};

/**
 * @private
 * @param {Array.<*>} array
 * @param {network.Type} type
 * @param {number} flags
 */
network.ObjectReader.prototype.readArray_ = function (array, type, flags) {
    var id, i, obj;
    var childBuffer;
    var state = this.stack_[this.top_];
    var parentBuffer = state.objectBuffer;

    flags &= ~network.Flags.ARRAY;

    childBuffer = new network.ObjectBuffer();
    childBuffer.id = this.snapshot_.arrays.length;
    childBuffer.classId = type | (flags << 16);
    
    parentBuffer.data[state.index++] = childBuffer.id;
    this.snapshot_.arrays.push(childBuffer);

    this.stack_[++this.top_] = {
        objectBuffer: childBuffer,
        index: 0
    };

    
    for (i = 0; i < array.length; ++i) {
        this.read_(array[i], type, flags);
    }
    --this.top_;
    
    return array;    
};

/**
 * @private
 * @param {network.ISynchronizable} obj
 */
network.ObjectReader.prototype.readObject_ = function (obj) {
    var childBuffer;
    var state = this.stack_[this.top_];
    var parentBuffer = state.objectBuffer;
    var id = obj.__networkObjectId__;

    if (!goog.isDefAndNotNull(obj)) {
        parentBuffer.data[state.index++] = -1;
        return obj;
    }
    if (id === undefined) {
        id = obj.__networkObjectId__ = this.findFreeId_();
    }
    parentBuffer.data[state.index++] = id;
    
    childBuffer = new network.ObjectBuffer();
    childBuffer.id = id;
    childBuffer.classId = obj.__networkClassId__;
    
    this.snapshot_.objects[id] = childBuffer;
    
    this.stack_[++this.top_] = {
        objectBuffer: childBuffer,
        index: 0
    };
    
    obj.synchronize(this);
    --this.top_;
    
    return obj;    
};

/**
 * @private
 * @param {*} data
 */
network.ObjectReader.prototype.readPrimitive_ = function (data) {
    var state = this.stack_[this.top_];
    var buffer = state.objectBuffer;
    if (data.constructor == Float32Array) {
        buffer.data[state.index++] = new Float32Array(goog.array.clone(data));
    } else {
        buffer.data[state.index++] = data;
    }
    return data;
};
