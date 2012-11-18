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

goog.provide('base.Mat3');

base.MatrixArray = Float32Array;

/*
 * base.Mat3
 */

/** @typedef {Float32Array}*/ base.Mat3 = {};

/**
 * Creates a new instance of a base.Mat3 using the default array type
 * Any javascript array-like object containing at least 9 numeric elements can serve as a base.Mat3
 *
 * @param {base.Mat3} [mat] base.Mat3 containing values to initialize with
 *
 * @returns {base.Mat3} New base.Mat3
 */
base.Mat3.create = function (mat) {
    var dest = new base.MatrixArray(9);

    if (mat) {
        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[3];
        dest[4] = mat[4];
        dest[5] = mat[5];
        dest[6] = mat[6];
        dest[7] = mat[7];
        dest[8] = mat[8];
    }

    return dest;
};

/**
 * Copies the values of one base.Mat3 to another
 *
 * @param {base.Mat3} mat base.Mat3 containing values to copy
 * @param {base.Mat3} dest base.Mat3 receiving copied values
 *
 * @returns {base.Mat3} dest
 */
base.Mat3.set = function (mat, dest) {
    dest[0] = mat[0];
    dest[1] = mat[1];
    dest[2] = mat[2];
    dest[3] = mat[3];
    dest[4] = mat[4];
    dest[5] = mat[5];
    dest[6] = mat[6];
    dest[7] = mat[7];
    dest[8] = mat[8];
    return dest;
};

/**
 * Sets a base.Mat3 to an identity matrix
 *
 * @param {base.Mat3} dest base.Mat3 to set
 *
 * @returns dest if specified, otherwise a new base.Mat3
 */
base.Mat3.identity = function (dest) {
    if (!dest) { dest = base.Mat3.create(); }
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 1;
    dest[5] = 0;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 1;
    return dest;
};

/**
 * Transposes a base.Mat3 (flips the values over the diagonal)
 *
 * Params:
 * @param {base.Mat3} mat base.Mat3 to transpose
 * @param {base.Mat3} [dest] base.Mat3 receiving transposed values. If not specified result is written to mat
 *
 * @returns {base.Mat3} dest is specified, mat otherwise
 */
base.Mat3.transpose = function (mat, dest) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (!dest || mat === dest) {
        var a01 = mat[1], a02 = mat[2],
            a12 = mat[5];

        mat[1] = mat[3];
        mat[2] = mat[6];
        mat[3] = a01;
        mat[5] = mat[7];
        mat[6] = a02;
        mat[7] = a12;
        return mat;
    }

    dest[0] = mat[0];
    dest[1] = mat[3];
    dest[2] = mat[6];
    dest[3] = mat[1];
    dest[4] = mat[4];
    dest[5] = mat[7];
    dest[6] = mat[2];
    dest[7] = mat[5];
    dest[8] = mat[8];
    return dest;
};

/**
 * Copies the elements of a base.Mat3 into the upper 3x3 elements of a base.mat4
 *
 * @param {base.Mat3} mat base.Mat3 containing values to copy
 * @param {base.mat4} [dest] base.mat4 receiving copied values
 *
 * @returns {base.mat4} dest if specified, a new base.mat4 otherwise
 */
base.Mat3.toMat4 = function (mat, dest) {
    if (!dest) { dest = base.mat4.create(); }

    dest[15] = 1;
    dest[14] = 0;
    dest[13] = 0;
    dest[12] = 0;

    dest[11] = 0;
    dest[10] = mat[8];
    dest[9] = mat[7];
    dest[8] = mat[6];

    dest[7] = 0;
    dest[6] = mat[5];
    dest[5] = mat[4];
    dest[4] = mat[3];

    dest[3] = 0;
    dest[2] = mat[2];
    dest[1] = mat[1];
    dest[0] = mat[0];

    return dest;
};

/**
 * Returns a string representation of a base.Mat3
 *
 * @param {base.Mat3} mat base.Mat3 to represent as a string
 *
 * @param {string} String representation of mat
 */
base.Mat3.str = function (mat) {
    return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] +
        ', ' + mat[3] + ', ' + mat[4] + ', ' + mat[5] +
        ', ' + mat[6] + ', ' + mat[7] + ', ' + mat[8] + ']';
};
