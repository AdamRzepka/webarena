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

goog.provide('network');
goog.provide('network.ISynchronizer');
goog.provide('network.ISynchronizable');
goog.provide('network.Type');
goog.provide('network.Flags');

/**
 * @interface
 */
network.ISynchronizer = function () {};
/**
 * @public
 * @param {*} data
 * @param {network.Type} type
 * @param {number} [flags] from network.Flags
 * @return {*}
 */
network.ISynchronizer.prototype.synchronize = function (data, type, flags) {};
/**
 * @public
 * @return {network.ISynchronizer.Mode}
 */
network.ISynchronizer.prototype.getMode = function () {};
/**
 * @enum {number}
 */
network.ISynchronizer.Mode = {
    WRITE: 0,
    READ: 1
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
 * @enum {number}
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
    
    CHAR8: 10,
    STRING8: 11,
    CHAR16: 12,
    STRING16: 13,

    OBJECT: 14
};

/**
 * @type {Array.<number>}
 */
network.TypeSize = [
    1, // INT8
    2, // INT16
    4, // INT32
    1, // UINT8
    2, // UINT16
    4, // UINT32
    4, // FLOAT32

    12, // VEC3
    48, // MTX4
    
    1, // CHAR8
    -1, // STRING8
    2, // CHAR16
    -1, // STRING16

    2 // OBJECT
];

/**
 * @type {Array.<string>}
 */
network.JsType = [
    'number', // INT8
    'number', // INT16
    'number', // INT32
    'number', // UINT8
    'number', // UINT16
    'number', // UINT32
    'number', // FLOAT32

    'object', // VEC3
    'object', // MTX4
    
    'string', // CHAR8
    'string', // STRING8
    'string', // CHAR16
    'string', // STRING16

    'object' // OBJECT
];

/**
 * @enum {number}
 */
network.Flags = {
    ARRAY: 1,
    NORMAL_VECTOR: 2
};

