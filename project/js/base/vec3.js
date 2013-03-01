/**
 * @fileoverview gl-matrix - High performance matrix and vector operations for WebGL
 * @author Brandon Jones
 * @version 1.2.4
 */

/*
 * Copyright (c) 2011 Brandon Jones, modified by Adam Rzepka
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

"use strict";

goog.provide('base.Vec3');

/*
 * base.Vec3
 */

base.MatrixArray = Float32Array;

/** @typedef Float32Array*/ base.Vec3 = {};
/** @typedef Float32Array*/ base.Vec4 = {};

/**
 * Creates a new instance of a base.Vec3 using the default array type
 * Any javascript array-like objects containing at least 3 numeric elements can serve as a base.Vec3
 *
 * @param {base.Vec3|Array.<number>} [vec] base.Vec3 containing values to initialize with
 *
 * @returns {base.Vec3} New base.Vec3
 */
base.Vec3.create = function (vec) {
    var dest = new base.MatrixArray(3);

    if (vec) {
        dest[0] = vec[0];
        dest[1] = vec[1];
        dest[2] = vec[2];
    } else {
        dest[0] = dest[1] = dest[2] = 0;
    }

    return dest;
};
/**
 * Creates a new instance of a base.Vec3 using values
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {base.Vec3} New base.Vec3
 */
base.Vec3.createVal = function (x, y, z) {
    var dest = new base.MatrixArray(3);

    dest[0] = x;
    dest[1] = y;
    dest[2] = z;

    return dest;
};


/**
 * Copies the values of one base.Vec3 to another
 *
 * @param {base.Vec3|Array.<number>} vec base.Vec3 containing values to copy
 * @param {base.Vec3} dest base.Vec3 receiving copied values
 *
 * @returns {base.Vec3} dest
 */
base.Vec3.set = function (vec, dest) {
    dest[0] = vec[0];
    dest[1] = vec[1];
    dest[2] = vec[2];

    return dest;
};

/**
 * Copies the values of one base.Vec3 to another
 *
 * @param {base.Vec3} vec
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {base.Vec3} vec
 */
base.Vec3.setValues = function (vec, x, y, z) {
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;

    return vec;
};

/**
 * Copies the values of one base.Vec3 to another
 *
 * @param {base.Vec3} vec
 * @returns {base.Vec3} vec
 */
base.Vec3.setZero = function (vec) {
    vec[0] = 0;
    vec[1] = 0;
    vec[2] = 0;

    return vec;
};

/**
 * Performs a vector addition
 *
 * @param {base.Vec3} vec First operand
 * @param {base.Vec3} vec2 Second operand
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.add = function (vec, vec2, dest) {
    if (!dest || vec === dest) {
        vec[0] += vec2[0];
        vec[1] += vec2[1];
        vec[2] += vec2[2];
        return vec;
    }

    dest[0] = vec[0] + vec2[0];
    dest[1] = vec[1] + vec2[1];
    dest[2] = vec[2] + vec2[2];
    return dest;
};

/**
 * Performs a vector subtraction
 *
 * @param {base.Vec3} vec First operand
 * @param {base.Vec3} vec2 Second operand
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.subtract = function (vec, vec2, dest) {
    if (!dest || vec === dest) {
        vec[0] -= vec2[0];
        vec[1] -= vec2[1];
        vec[2] -= vec2[2];
        return vec;
    }

    dest[0] = vec[0] - vec2[0];
    dest[1] = vec[1] - vec2[1];
    dest[2] = vec[2] - vec2[2];
    return dest;
};

/**
 * Performs a vector multiplication
 *
 * @param {base.Vec3} vec First operand
 * @param {base.Vec3} vec2 Second operand
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.multiply = function (vec, vec2, dest) {
    if (!dest || vec === dest) {
        vec[0] *= vec2[0];
        vec[1] *= vec2[1];
        vec[2] *= vec2[2];
        return vec;
    }

    dest[0] = vec[0] * vec2[0];
    dest[1] = vec[1] * vec2[1];
    dest[2] = vec[2] * vec2[2];
    return dest;
};

/**
 * Negates the components of a base.Vec3
 *
 * @param {base.Vec3} vec base.Vec3 to negate
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.negate = function (vec, dest) {
    if (!dest) { dest = vec; }

    dest[0] = -vec[0];
    dest[1] = -vec[1];
    dest[2] = -vec[2];
    return dest;
};

/**
 * Multiplies the components of a base.Vec3 by a scalar value
 *
 * @param {base.Vec3} vec base.Vec3 to scale
 * @param {number} val Value to scale by
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.scale = function (vec, val, dest) {
    if (!dest || vec === dest) {
        vec[0] *= val;
        vec[1] *= val;
        vec[2] *= val;
        return vec;
    }

    dest[0] = vec[0] * val;
    dest[1] = vec[1] * val;
    dest[2] = vec[2] * val;
    return dest;
};

/**
 * Generates a unit vector of the same direction as the provided base.Vec3
 * If vector length is 0, returns [0, 0, 0]
 *
 * @param {base.Vec3} vec base.Vec3 to normalize
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.normalize = function (vec, dest) {
    if (!dest) { dest = vec; }

    var x = vec[0], y = vec[1], z = vec[2],
        len = Math.sqrt(x * x + y * y + z * z);

    if (!len) {
        dest[0] = 0;
        dest[1] = 0;
        dest[2] = 0;
        return dest;
    } else if (len === 1) {
        dest[0] = x;
        dest[1] = y;
        dest[2] = z;
        return dest;
    }

    len = 1 / len;
    dest[0] = x * len;
    dest[1] = y * len;
    dest[2] = z * len;
    return dest;
};

/**
 * Generates the cross product of two base.Vec3s
 *
 * @param {base.Vec3} vec First operand
 * @param {base.Vec3} vec2 Second operand
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.cross = function (vec, vec2, dest) {
    if (!dest) { dest = vec; }

    var x = vec[0], y = vec[1], z = vec[2],
        x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];

    dest[0] = y * z2 - z * y2;
    dest[1] = z * x2 - x * z2;
    dest[2] = x * y2 - y * x2;
    return dest;
};

/**
 * Caclulates the length of a base.Vec3
 *
 * @param {base.Vec3} vec base.Vec3 to calculate length of
 *
 * @returns {number} Length of vec
 */
base.Vec3.length = function (vec) {
    var x = vec[0], y = vec[1], z = vec[2];
    return Math.sqrt(x * x + y * y + z * z);
};

/**
 * Caclulates the length^2 of a base.Vec3
 *
 * @param {base.Vec3} vec base.Vec3 to calculate length of
 *
 * @returns {number} Length of vec
 */
base.Vec3.length2 = function (vec) {
    var x = vec[0], y = vec[1], z = vec[2];
    return x * x + y * y + z * z;
};


/**
 * Caclulates the dot product of two base.Vec3s
 *
 * @param {base.Vec3} vec First operand
 * @param {base.Vec3} vec2 Second operand
 *
 * @returns {number} Dot product of vec and vec2
 */
base.Vec3.dot = function (vec, vec2) {
    return vec[0] * vec2[0] + vec[1] * vec2[1] + vec[2] * vec2[2];
};

/**
 * Generates a unit vector pointing from one vector to another
 *
 * @param {base.Vec3} vec Origin base.Vec3
 * @param {base.Vec3} vec2 base.Vec3 to point to
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.direction = function (vec, vec2, dest) {
    if (!dest) { dest = vec; }

    var x = vec[0] - vec2[0],
        y = vec[1] - vec2[1],
        z = vec[2] - vec2[2],
        len = Math.sqrt(x * x + y * y + z * z);

    if (!len) {
        dest[0] = 0;
        dest[1] = 0;
        dest[2] = 0;
        return dest;
    }

    len = 1 / len;
    dest[0] = x * len;
    dest[1] = y * len;
    dest[2] = z * len;
    return dest;
};

/**
 * Performs a linear interpolation between two base.Vec3
 *
 * @param {base.Vec3} vec First vector
 * @param {base.Vec3} vec2 Second vector
 * @param {number} lerp Interpolation amount between the two inputs
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Vec3.lerp = function (vec, vec2, lerp, dest) {
    if (!dest) { dest = vec; }

    dest[0] = vec[0] + lerp * (vec2[0] - vec[0]);
    dest[1] = vec[1] + lerp * (vec2[1] - vec[1]);
    dest[2] = vec[2] + lerp * (vec2[2] - vec[2]);

    return dest;
};

/**
 * Calculates the euclidian distance between two base.Vec3
 *
 * Params:
 * @param {base.Vec3} vec First vector
 * @param {base.Vec3} vec2 Second vector
 *
 * @returns {number} Distance between vec and vec2
 */
base.Vec3.dist = function (vec, vec2) {
    var x = vec2[0] - vec[0],
        y = vec2[1] - vec[1],
        z = vec2[2] - vec[2];

    return Math.sqrt(x*x + y*y + z*z);
};


/**
 * Returns a string representation of a vector
 *
 * @param {base.Vec3} vec Vector to represent as a string
 *
 * @returns {string} String representation of vec
 */
base.Vec3.str = function (vec) {
    return '[' + vec[0] + ', ' + vec[1] + ', ' + vec[2] + ']';
};
