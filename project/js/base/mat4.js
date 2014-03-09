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

goog.require('base.Vec3');
goog.require('base.Mat3');
goog.provide('base.Mat4');

base.MatrixArray = Float32Array;

/*
 * base.Mat4
 */

/** @typedef {Float32Array}*/ base.Mat4 = {};

/**
 * Creates a new instance of a base.Mat4 using the default array type
 * Any javascript array-like object containing at least 16 numeric elements can serve as a base.Mat4
 *
 * @param {base.Mat4|Array.<number>} [mat] base.Mat4 containing values to initialize with
 *
 * @returns {base.Mat4} New base.Mat4
 */
base.Mat4.create = function (mat) {
    var dest = new base.MatrixArray(16);

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
        dest[9] = mat[9];
        dest[10] = mat[10];
        dest[11] = mat[11];
        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
    }

    return dest;
};

/**
 * Copies the values of one base.Mat4 to another
 *
 * @param {base.Mat4} mat base.Mat4 containing values to copy
 * @param {base.Mat4} dest base.Mat4 receiving copied values
 *
 * @returns {base.Mat4} dest
 */
base.Mat4.set = function (mat, dest) {
    dest[0] = mat[0];
    dest[1] = mat[1];
    dest[2] = mat[2];
    dest[3] = mat[3];
    dest[4] = mat[4];
    dest[5] = mat[5];
    dest[6] = mat[6];
    dest[7] = mat[7];
    dest[8] = mat[8];
    dest[9] = mat[9];
    dest[10] = mat[10];
    dest[11] = mat[11];
    dest[12] = mat[12];
    dest[13] = mat[13];
    dest[14] = mat[14];
    dest[15] = mat[15];
    return dest;
};

/**
 * Sets a base.Mat4 to an identity matrix
 *
 * @param {base.Mat4} [dest] base.Mat4 to set
 *
 * @returns {base.Mat4} dest
 */
base.Mat4.identity = function (dest) {
    if (!dest) { dest = base.Mat4.create(); }
    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;
    return dest;
};

/**
 * Transposes a base.Mat4 (flips the values over the diagonal)
 *
 * @param {base.Mat4} mat base.Mat4 to transpose
 * @param {base.Mat4} [dest] base.Mat4 receiving transposed values. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.transpose = function (mat, dest) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (!dest || mat === dest) {
        var a01 = mat[1], a02 = mat[2], a03 = mat[3],
            a12 = mat[6], a13 = mat[7],
            a23 = mat[11];

        mat[1] = mat[4];
        mat[2] = mat[8];
        mat[3] = mat[12];
        mat[4] = a01;
        mat[6] = mat[9];
        mat[7] = mat[13];
        mat[8] = a02;
        mat[9] = a12;
        mat[11] = mat[14];
        mat[12] = a03;
        mat[13] = a13;
        mat[14] = a23;
        return mat;
    }

    dest[0] = mat[0];
    dest[1] = mat[4];
    dest[2] = mat[8];
    dest[3] = mat[12];
    dest[4] = mat[1];
    dest[5] = mat[5];
    dest[6] = mat[9];
    dest[7] = mat[13];
    dest[8] = mat[2];
    dest[9] = mat[6];
    dest[10] = mat[10];
    dest[11] = mat[14];
    dest[12] = mat[3];
    dest[13] = mat[7];
    dest[14] = mat[11];
    dest[15] = mat[15];
    return dest;
};

/**
 * Calculates the determinant of a base.Mat4
 *
 * @param {base.Mat4} mat base.Mat4 to calculate determinant of
 *
 * @returns {number} determinant of mat
 */
base.Mat4.determinant = function (mat) {
    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3],
        a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7],
        a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11],
        a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

    return (a30 * a21 * a12 * a03 - a20 * a31 * a12 * a03 - a30 * a11 * a22 * a03 + a10 * a31 * a22 * a03 +
            a20 * a11 * a32 * a03 - a10 * a21 * a32 * a03 - a30 * a21 * a02 * a13 + a20 * a31 * a02 * a13 +
            a30 * a01 * a22 * a13 - a00 * a31 * a22 * a13 - a20 * a01 * a32 * a13 + a00 * a21 * a32 * a13 +
            a30 * a11 * a02 * a23 - a10 * a31 * a02 * a23 - a30 * a01 * a12 * a23 + a00 * a31 * a12 * a23 +
            a10 * a01 * a32 * a23 - a00 * a11 * a32 * a23 - a20 * a11 * a02 * a33 + a10 * a21 * a02 * a33 +
            a20 * a01 * a12 * a33 - a00 * a21 * a12 * a33 - a10 * a01 * a22 * a33 + a00 * a11 * a22 * a33);
};

/**
 * Calculates the inverse matrix of a base.Mat4
 *
 * @param {base.Mat4} mat base.Mat4 to calculate inverse of
 * @param {base.Mat4} [dest] base.Mat4 receiving inverse matrix. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise, null if matrix cannot be inverted
 */
base.Mat4.inverse = function (mat, dest) {
    if (!dest) { dest = mat; }

    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3],
        a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7],
        a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11],
        a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        d = (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06),
        invDet;

        // Calculate the determinant
        if (!d) { return null; }
        invDet = 1 / d;

    dest[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
    dest[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
    dest[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
    dest[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
    dest[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
    dest[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
    dest[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
    dest[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
    dest[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
    dest[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
    dest[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
    dest[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
    dest[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
    dest[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
    dest[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
    dest[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

    return dest;
};

/**
 * Copies the upper 3x3 elements of a base.Mat4 into another base.Mat4
 *
 * @param {base.Mat4} mat base.Mat4 containing values to copy
 * @param {base.Mat4} [dest] base.Mat4 receiving copied values
 *
 * @returns {base.Mat4} dest is specified, a new base.Mat4 otherwise
 */
base.Mat4.toRotationMat = function (mat, dest) {
    if (!dest) { dest = base.Mat4.create(); }

    dest[0] = mat[0];
    dest[1] = mat[1];
    dest[2] = mat[2];
    dest[3] = mat[3];
    dest[4] = mat[4];
    dest[5] = mat[5];
    dest[6] = mat[6];
    dest[7] = mat[7];
    dest[8] = mat[8];
    dest[9] = mat[9];
    dest[10] = mat[10];
    dest[11] = mat[11];
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;

    return dest;
};

/**
 * Copies the elements of a base.Mat3 into the upper 3x3 elements of a base.mat4
 *
 * @param {base.Mat3} mat base.Mat3 containing values to copy
 * @param {base.Mat4} [dest] base.mat4 receiving copied values
 *
 * @returns {base.Mat4} dest if specified, a new base.mat4 otherwise
 */
base.Mat4.fromMat3 = function (mat, dest) {
    if (!dest) { dest = base.Mat4.create(); }

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
 * Copies the upper 3x3 elements of a base.Mat4 into a base.Mat3
 *
 * @param {base.Mat4} mat base.Mat4 containing values to copy
 * @param {base.Mat3} [dest] base.Mat3 receiving copied values
 *
 * @returns {base.Mat3} dest is specified, a new base.Mat3 otherwise
 */
base.Mat4.toMat3 = function (mat, dest) {
    if (!dest) { dest = base.Mat3.create(); }

    dest[0] = mat[0];
    dest[1] = mat[1];
    dest[2] = mat[2];
    dest[3] = mat[4];
    dest[4] = mat[5];
    dest[5] = mat[6];
    dest[6] = mat[8];
    dest[7] = mat[9];
    dest[8] = mat[10];

    return dest;
};

/**
 * Calculates the inverse of the upper 3x3 elements of a base.Mat4 and copies the result into a base.Mat3
 * The resulting matrix is useful for calculating transformed normals
 *
 * Params:
 * @param {base.Mat4} mat base.Mat4 containing values to invert and copy
 * @param {base.Mat3} [dest] base.Mat3 receiving values
 *
 * @returns {base.Mat3} dest is specified, a new base.Mat3 otherwise, null if the matrix cannot be inverted
 */
base.Mat4.toInverseMat3 = function (mat, dest) {
    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2],
        a10 = mat[4], a11 = mat[5], a12 = mat[6],
        a20 = mat[8], a21 = mat[9], a22 = mat[10],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        d = a00 * b01 + a01 * b11 + a02 * b21,
        id;

    if (!d) { return null; }
    id = 1 / d;

    if (!dest) { dest = base.Mat3.create(); }

    dest[0] = b01 * id;
    dest[1] = (-a22 * a01 + a02 * a21) * id;
    dest[2] = (a12 * a01 - a02 * a11) * id;
    dest[3] = b11 * id;
    dest[4] = (a22 * a00 - a02 * a20) * id;
    dest[5] = (-a12 * a00 + a02 * a10) * id;
    dest[6] = b21 * id;
    dest[7] = (-a21 * a00 + a01 * a20) * id;
    dest[8] = (a11 * a00 - a01 * a10) * id;

    return dest;
};

/**
 * Performs a matrix multiplication
 *
 * @param {base.Mat4} mat First operand
 * @param {base.Mat4} mat2 Second operand
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.multiply = function (mat, mat2, dest) {
    if (!dest) { dest = mat; }

    // Cache the matrix values (makes for huge speed increases!)
    var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3],
        a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7],
        a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11],
        a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15],

        b00 = mat2[0], b01 = mat2[1], b02 = mat2[2], b03 = mat2[3],
        b10 = mat2[4], b11 = mat2[5], b12 = mat2[6], b13 = mat2[7],
        b20 = mat2[8], b21 = mat2[9], b22 = mat2[10], b23 = mat2[11],
        b30 = mat2[12], b31 = mat2[13], b32 = mat2[14], b33 = mat2[15];

    dest[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    dest[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    dest[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    dest[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    dest[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    dest[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    dest[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    dest[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    dest[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    dest[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    dest[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    dest[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    dest[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    dest[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    dest[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    dest[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

    return dest;
};

/**
 * Transforms a base.Vec3 with the given matrix
 * 4th vector component is implicitly '1'
 *
 * @param {base.Mat4} mat base.Mat4 to transform the vector with
 * @param {base.Vec3} vec base.Vec3 to transform
 * @param {base.Vec3} [dest] base.Vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Mat4.multiplyVec3 = function (mat, vec, dest) {
    if (!dest) { dest = vec; }

    var x = vec[0], y = vec[1], z = vec[2];

    dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
    dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
    dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];

    return dest;
};

/**
 * Transforms a vec4 with the given matrix
 *
 * @param {base.Mat4} mat base.Mat4 to transform the vector with
 * @param {base.Vec4} vec vec4 to transform
 * @param {base.Vec4} [dest] vec4 receiving operation result.
 * If not specified result is written to vec
 *
 * @returns {base.Vec4} dest if specified, vec otherwise
 */
base.Mat4.multiplyVec4 = function (mat, vec, dest) {
    if (!dest) { dest = vec; }

    var x = vec[0], y = vec[1], z = vec[2], w = vec[3];

    dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w;
    dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w;
    dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w;
    dest[3] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w;

    return dest;
};

/**
 * Translates a matrix by the given vector
 *
 * @param {base.Mat4} mat base.Mat4 to translate
 * @param {base.Vec3} vec base.Vec3 specifying the translation
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.translate = function (mat, vec, dest) {
    var x = vec[0], y = vec[1], z = vec[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (!dest || mat === dest) {
        mat[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
        mat[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
        mat[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
        mat[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
        return mat;
    }

    a00 = mat[0]; a01 = mat[1]; a02 = mat[2]; a03 = mat[3];
    a10 = mat[4]; a11 = mat[5]; a12 = mat[6]; a13 = mat[7];
    a20 = mat[8]; a21 = mat[9]; a22 = mat[10]; a23 = mat[11];

    dest[0] = a00; dest[1] = a01; dest[2] = a02; dest[3] = a03;
    dest[4] = a10; dest[5] = a11; dest[6] = a12; dest[7] = a13;
    dest[8] = a20; dest[9] = a21; dest[10] = a22; dest[11] = a23;

    dest[12] = a00 * x + a10 * y + a20 * z + mat[12];
    dest[13] = a01 * x + a11 * y + a21 * z + mat[13];
    dest[14] = a02 * x + a12 * y + a22 * z + mat[14];
    dest[15] = a03 * x + a13 * y + a23 * z + mat[15];
    return dest;
};

/**
 * Scales a matrix by the given vector
 *
 * @param {base.Mat4} mat base.Mat4 to scale
 * @param {base.Vec3} vec base.Vec3 specifying the scale for each axis
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.scale = function (mat, vec, dest) {
    var x = vec[0], y = vec[1], z = vec[2];

    if (!dest || mat === dest) {
        mat[0] *= x;
        mat[1] *= x;
        mat[2] *= x;
        mat[3] *= x;
        mat[4] *= y;
        mat[5] *= y;
        mat[6] *= y;
        mat[7] *= y;
        mat[8] *= z;
        mat[9] *= z;
        mat[10] *= z;
        mat[11] *= z;
        return mat;
    }

    dest[0] = mat[0] * x;
    dest[1] = mat[1] * x;
    dest[2] = mat[2] * x;
    dest[3] = mat[3] * x;
    dest[4] = mat[4] * y;
    dest[5] = mat[5] * y;
    dest[6] = mat[6] * y;
    dest[7] = mat[7] * y;
    dest[8] = mat[8] * z;
    dest[9] = mat[9] * z;
    dest[10] = mat[10] * z;
    dest[11] = mat[11] * z;
    dest[12] = mat[12];
    dest[13] = mat[13];
    dest[14] = mat[14];
    dest[15] = mat[15];
    return dest;
};

/**
 * Rotates a matrix by the given angle around the specified axis
 * If rotating around a primary axis (X,Y,Z) one of the specialized rotation functions should be used instead for performance
 *
 * @param {base.Mat4} mat base.Mat4 to rotate
 * @param {number} angle Angle (in radians) to rotate
 * @param {base.Vec3} axis base.Vec3 representing the axis to rotate around
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.rotate = function (mat, angle, axis, dest) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (!len) { return null; }
    if (len !== 1) {
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
    }

    s = Math.sin(angle);
    c = Math.cos(angle);
    t = 1 - c;

    a00 = mat[0]; a01 = mat[1]; a02 = mat[2]; a03 = mat[3];
    a10 = mat[4]; a11 = mat[5]; a12 = mat[6]; a13 = mat[7];
    a20 = mat[8]; a21 = mat[9]; a22 = mat[10]; a23 = mat[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    if (!dest) {
        dest = mat;
    } else if (mat !== dest) { // If the source and destination differ, copy the unchanged last row
        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
    }

    // Perform rotation-specific matrix multiplication
    dest[0] = a00 * b00 + a10 * b01 + a20 * b02;
    dest[1] = a01 * b00 + a11 * b01 + a21 * b02;
    dest[2] = a02 * b00 + a12 * b01 + a22 * b02;
    dest[3] = a03 * b00 + a13 * b01 + a23 * b02;

    dest[4] = a00 * b10 + a10 * b11 + a20 * b12;
    dest[5] = a01 * b10 + a11 * b11 + a21 * b12;
    dest[6] = a02 * b10 + a12 * b11 + a22 * b12;
    dest[7] = a03 * b10 + a13 * b11 + a23 * b12;

    dest[8] = a00 * b20 + a10 * b21 + a20 * b22;
    dest[9] = a01 * b20 + a11 * b21 + a21 * b22;
    dest[10] = a02 * b20 + a12 * b21 + a22 * b22;
    dest[11] = a03 * b20 + a13 * b21 + a23 * b22;
    return dest;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {base.Mat4} mat base.Mat4 to rotate
 * @param {number} angle Angle (in radians) to rotate
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.rotateX = function (mat, angle, dest) {
    var s = Math.sin(angle),
        c = Math.cos(angle),
        a10 = mat[4],
        a11 = mat[5],
        a12 = mat[6],
        a13 = mat[7],
        a20 = mat[8],
        a21 = mat[9],
        a22 = mat[10],
        a23 = mat[11];

    if (!dest) {
        dest = mat;
    } else if (mat !== dest) { // If the source and destination differ, copy the unchanged rows
        dest[0] = mat[0];
        dest[1] = mat[1];
        dest[2] = mat[2];
        dest[3] = mat[3];

        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
    }

    // Perform axis-specific matrix multiplication
    dest[4] = a10 * c + a20 * s;
    dest[5] = a11 * c + a21 * s;
    dest[6] = a12 * c + a22 * s;
    dest[7] = a13 * c + a23 * s;

    dest[8] = a10 * -s + a20 * c;
    dest[9] = a11 * -s + a21 * c;
    dest[10] = a12 * -s + a22 * c;
    dest[11] = a13 * -s + a23 * c;
    return dest;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {base.Mat4} mat base.Mat4 to rotate
 * @param {number} angle Angle (in radians) to rotate
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.rotateY = function (mat, angle, dest) {
    var s = Math.sin(angle),
        c = Math.cos(angle),
        a00 = mat[0],
        a01 = mat[1],
        a02 = mat[2],
        a03 = mat[3],
        a20 = mat[8],
        a21 = mat[9],
        a22 = mat[10],
        a23 = mat[11];

    if (!dest) {
        dest = mat;
    } else if (mat !== dest) { // If the source and destination differ, copy the unchanged rows
        dest[4] = mat[4];
        dest[5] = mat[5];
        dest[6] = mat[6];
        dest[7] = mat[7];

        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
    }

    // Perform axis-specific matrix multiplication
    dest[0] = a00 * c + a20 * -s;
    dest[1] = a01 * c + a21 * -s;
    dest[2] = a02 * c + a22 * -s;
    dest[3] = a03 * c + a23 * -s;

    dest[8] = a00 * s + a20 * c;
    dest[9] = a01 * s + a21 * c;
    dest[10] = a02 * s + a22 * c;
    dest[11] = a03 * s + a23 * c;
    return dest;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {base.Mat4} mat base.Mat4 to rotate
 * @param {number} angle Angle (in radians) to rotate
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to mat
 *
 * @returns {base.Mat4} dest if specified, mat otherwise
 */
base.Mat4.rotateZ = function (mat, angle, dest) {
    var s = Math.sin(angle),
        c = Math.cos(angle),
        a00 = mat[0],
        a01 = mat[1],
        a02 = mat[2],
        a03 = mat[3],
        a10 = mat[4],
        a11 = mat[5],
        a12 = mat[6],
        a13 = mat[7];

    if (!dest) {
        dest = mat;
    } else if (mat !== dest) { // If the source and destination differ, copy the unchanged last row
        dest[8] = mat[8];
        dest[9] = mat[9];
        dest[10] = mat[10];
        dest[11] = mat[11];

        dest[12] = mat[12];
        dest[13] = mat[13];
        dest[14] = mat[14];
        dest[15] = mat[15];
    }

    // Perform axis-specific matrix multiplication
    dest[0] = a00 * c + a10 * s;
    dest[1] = a01 * c + a11 * s;
    dest[2] = a02 * c + a12 * s;
    dest[3] = a03 * c + a13 * s;

    dest[4] = a00 * -s + a10 * c;
    dest[5] = a01 * -s + a11 * c;
    dest[6] = a02 * -s + a12 * c;
    dest[7] = a03 * -s + a13 * c;

    return dest;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @param {base.Mat4} [dest] base.Mat4 frustum matrix will be written into
 *
 * @returns {base.Mat4} dest if specified, a new base.Mat4 otherwise
 */
base.Mat4.frustum = function (left, right, bottom, top, near, far, dest) {
    if (!dest) { dest = base.Mat4.create(); }
    var rl = (right - left),
        tb = (top - bottom),
        fn = (far - near);
    dest[0] = (near * 2) / rl;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = (near * 2) / tb;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = (right + left) / rl;
    dest[9] = (top + bottom) / tb;
    dest[10] = -(far + near) / fn;
    dest[11] = -1;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = -(far * near * 2) / fn;
    dest[15] = 0;
    return dest;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {number} fovy Vertical field of view
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @param {base.Mat4} [dest] base.Mat4 frustum matrix will be written into
 *
 * @returns {base.Mat4} dest if specified, a new base.Mat4 otherwise
 */
base.Mat4.perspective = function (fovy, aspect, near, far, dest) {
    var top = near * Math.tan(fovy * Math.PI / 360.0),
        right = top * aspect;
    return base.Mat4.frustum(-right, right, -top, top, near, far, dest);
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @param {base.Mat4} [dest] base.Mat4 frustum matrix will be written into
 *
 * @returns {base.Mat4} dest if specified, a new base.Mat4 otherwise
 */
base.Mat4.ortho = function (left, right, bottom, top, near, far, dest) {
    if (!dest) { dest = base.Mat4.create(); }
    var rl = (right - left),
        tb = (top - bottom),
        fn = (far - near);
    dest[0] = 2 / rl;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 2 / tb;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = -2 / fn;
    dest[11] = 0;
    dest[12] = -(left + right) / rl;
    dest[13] = -(top + bottom) / tb;
    dest[14] = -(far + near) / fn;
    dest[15] = 1;
    return dest;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {base.Vec3} eye Position of the viewer
 * @param {base.Vec3} center Point the viewer is looking at
 * @param {base.Vec3} up base.Vec3 pointing "up"
 * @param {base.Mat4} [dest] base.Mat4 frustum matrix will be written into
 *
 * @returns {base.Mat4} dest if specified, a new base.Mat4 otherwise
 */
base.Mat4.lookAt = function (eye, center, up, dest) {
    if (!dest) { dest = base.Mat4.create(); }

    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (eyex === centerx && eyey === centery && eyez === centerz) {
        return base.Mat4.identity(dest);
    }

    //base.Vec3.direction(eye, center, z);
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    // normalize (no check needed for 0 because of early return)
    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    //base.Vec3.normalize(base.Vec3.cross(up, z, x));
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    //base.Vec3.normalize(base.Vec3.cross(z, x, y));
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    dest[0] = x0;
    dest[1] = y0;
    dest[2] = z0;
    dest[3] = 0;
    dest[4] = x1;
    dest[5] = y1;
    dest[6] = z1;
    dest[7] = 0;
    dest[8] = x2;
    dest[9] = y2;
    dest[10] = z2;
    dest[11] = 0;
    dest[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    dest[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    dest[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    dest[15] = 1;

    return dest;
};

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     base.Mat4.identity(dest);
 *     base.Mat4.translate(dest, vec);
 *     var quatMat = base.Mat4.create();
 *     base.quat4.toMat4(quat, quatMat);
 *     base.Mat4.multiply(dest, quatMat);
 *
 * @param {base.Quat4} quat Rotation quaternion
 * @param {base.Vec3} vec Translation vector
 * @param {base.Mat4} [dest] base.Mat4 receiving operation result. If not specified result is written to a new base.Mat4
 *
 * @returns {base.Mat4} dest if specified, a new base.Mat4 otherwise
 */
base.Mat4.fromRotationTranslation = function (quat, vec, dest) {
    if (!dest) { dest = base.Mat4.create(); }

    // Quaternion math
    var x = quat[0], y = quat[1], z = quat[2], w = quat[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    dest[0] = 1 - (yy + zz);
    dest[1] = xy + wz;
    dest[2] = xz - wy;
    dest[3] = 0;
    dest[4] = xy - wz;
    dest[5] = 1 - (xx + zz);
    dest[6] = yz + wx;
    dest[7] = 0;
    dest[8] = xz + wy;
    dest[9] = yz - wx;
    dest[10] = 1 - (xx + yy);
    dest[11] = 0;
    dest[12] = vec[0];
    dest[13] = vec[1];
    dest[14] = vec[2];
    dest[15] = 1;

    return dest;
};

/**
 * Projects the specified base.Vec3 from screen space into object space
 * Based on the <a href="http://webcvs.freedesktop.org/mesa/Mesa/src/glu/mesa/project.c?revision=1.4&view=markup">Mesa gluUnProject implementation</a>
 *
 * @param {base.Vec3} vec Screen-space vector to project
 * @param {base.Mat4} view View matrix
 * @param {base.Mat4} proj Projection matrix
 * @param {base.Vec4} viewport Viewport as given to gl.viewport [x, y, width, height]
 * @param {base.Vec3} [dest] base.Vec3 receiving unprojected result. If not specified result is written to vec
 *
 * @returns {base.Vec3} dest if specified, vec otherwise
 */
base.Mat4.unproject = function (vec, view, proj, viewport, dest) {
    if (!dest) { dest = vec; }

    var m = base.Mat4.create();
    var v = new base.MatrixArray(4);

    v[0] = (vec[0] - viewport[0]) * 2.0 / viewport[2] - 1.0;
    v[1] = (vec[1] - viewport[1]) * 2.0 / viewport[3] - 1.0;
    v[2] = 2.0 * vec[2] - 1.0;
    v[3] = 1.0;

    base.Mat4.multiply(proj, view, m);
    if(!base.Mat4.inverse(m)) { return null; }

    base.Mat4.multiplyVec4(m, v);
    if(v[3] === 0.0) { return null; }

    dest[0] = v[0] / v[3];
    dest[1] = v[1] / v[3];
    dest[2] = v[2] / v[3];

    return dest;
};

/**
 * Returns a string representation of a base.Mat4
 *
 * @param {base.Mat4} mat base.Mat4 to represent as a string
 *
 * @returns {string} String representation of mat
 */
base.Mat4.str = function (mat) {
    return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + ', ' + mat[3] +
        ', ' + mat[4] + ', ' + mat[5] + ', ' + mat[6] + ', ' + mat[7] +
        ', ' + mat[8] + ', ' + mat[9] + ', ' + mat[10] + ', ' + mat[11] +
        ', ' + mat[12] + ', ' + mat[13] + ', ' + mat[14] + ', ' + mat[15] + ']';
};

base.Mat4.lerp = function (matA, matB, weight, dest) {
    var wa = (1 - weight);
    var wb = weight;
    
    var lx = Math.sqrt(matA[0] * matA[0] + matA[1] * matA[1] + matA[2] * matA[2]);
    var ly = Math.sqrt(matA[4] * matA[4] + matA[5] * matA[5] + matA[6] * matA[6]);
    var lz = Math.sqrt(matA[8] * matA[8] + matA[9] * matA[9] + matA[10] * matA[10]);
    
    dest = dest || matA;

    // @todo: cross && normalization
    dest[0] = wa * matA[0] + wb * matB[0];
    dest[1] = wa * matA[1] + wb * matB[1];
    dest[2] = wa * matA[2] + wb * matB[2];

    dest[4] = wa * matA[4] + wb * matB[4];
    dest[5] = wa * matA[5] + wb * matB[5];
    dest[6] = wa * matA[6] + wb * matB[6];

    dest[8] = wa * matA[8] + wb * matB[8];
    dest[9] = wa * matA[9] + wb * matB[9];
    dest[10] = wa * matA[10] + wb * matB[10];

    dest[12] = wa * matA[12] + wb * matB[12];
    dest[13] = wa * matA[13] + wb * matB[13];
    dest[14] = wa * matA[14] + wb * matB[14];

    dest[3] = dest[7] = dest[11] = 0;
    dest[15] = 1;
    
    return dest;
};

base.Mat4.getRow = function(mat, col, dest) {
    var i = 0;
    var from = 4 * col;
    dest = dest || base.Vec3.create();
    for (i = 0; i < 3; ++i, ++from) {
        dest[i] = mat[from];
    }
    return dest;
};

