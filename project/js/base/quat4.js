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

goog.provide('base.Quat4');

base.MatrixArray = Float32Array;

/*
 * base.Quat4
 */

/** @typedef {Float32Array}*/ base.Quat4 = {};

/**
 * Creates a new instance of a base.Quat4 using the default array type
 * Any javascript array containing at least 4 numeric elements can serve as a base.Quat4
 *
 * @param {base.Quat4} [quat] base.Quat4 containing values to initialize with
 *
 * @returns {base.Quat4} New base.Quat4
 */
base.Quat4.create = function (quat) {
    var dest = new base.MatrixArray(4);

    if (quat) {
        dest[0] = quat[0];
        dest[1] = quat[1];
        dest[2] = quat[2];
        dest[3] = quat[3];
    }

    return dest;
};

/**
 * Copies the values of one base.Quat4 to another
 *
 * @param {base.Quat4} quat base.Quat4 containing values to copy
 * @param {base.Quat4} dest base.Quat4 receiving copied values
 *
 * @returns {base.Quat4} dest
 */
base.Quat4.set = function (quat, dest) {
    dest[0] = quat[0];
    dest[1] = quat[1];
    dest[2] = quat[2];
    dest[3] = quat[3];

    return dest;
};

/**
 * Calculates the W component of a base.Quat4 from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {base.Quat4} quat base.Quat4 to calculate W component of
 * @param {base.Quat4} [dest] base.Quat4 receiving calculated values. If not specified result is written to quat
 *
 * @returns {base.Quat4} dest if specified, quat otherwise
 */
base.Quat4.calculateW = function (quat, dest) {
    var x = quat[0], y = quat[1], z = quat[2];

    if (!dest || quat === dest) {
        quat[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
        return quat;
    }
    dest[0] = x;
    dest[1] = y;
    dest[2] = z;
    dest[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return dest;
};

/**
 * Calculates the dot product of two quaternions
 *
 * @param {base.Quat4} quat First operand
 * @param {base.Quat4} quat2 Second operand
 *
 * @return {number} Dot product of quat and quat2
 */
base.Quat4.dot = function(quat, quat2){
    return quat[0]*quat2[0] + quat[1]*quat2[1] + quat[2]*quat2[2] + quat[3]*quat2[3];
};

/**
 * Calculates the inverse of a base.Quat4
 *
 * @param {base.Quat4} quat base.Quat4 to calculate inverse of
 * @param {base.Quat4} [dest] base.Quat4 receiving inverse values. If not specified result is written to quat
 *
 * @returns {base.Quat4} dest if specified, quat otherwise
 */
base.Quat4.inverse = function(quat, dest) {
    var q0 = quat[0], q1 = quat[1], q2 = quat[2], q3 = quat[3],
        dot = q0*q0 + q1*q1 + q2*q2 + q3*q3,
        invDot = dot ? 1.0/dot : 0;

    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    if(!dest || quat === dest) {
        quat[0] *= -invDot;
        quat[1] *= -invDot;
        quat[2] *= -invDot;
        quat[3] *= invDot;
        return quat;
    }
    dest[0] = -quat[0]*invDot;
    dest[1] = -quat[1]*invDot;
    dest[2] = -quat[2]*invDot;
    dest[3] = quat[3]*invDot;
    return dest;
};


/**
 * Calculates the conjugate of a base.Quat4
 * If the quaternion is normalized, this function is faster than base.Quat4.inverse and produces the same result.
 *
 * @param {base.Quat4} quat base.Quat4 to calculate conjugate of
 * @param {base.Quat4} [dest] base.Quat4 receiving conjugate values. If not specified result is written to quat
 *
 * @returns {base.Quat4} dest if specified, quat otherwise
 */
base.Quat4.conjugate = function (quat, dest) {
    if (!dest || quat === dest) {
        quat[0] *= -1;
        quat[1] *= -1;
        quat[2] *= -1;
        return quat;
    }
    dest[0] = -quat[0];
    dest[1] = -quat[1];
    dest[2] = -quat[2];
    dest[3] = quat[3];
    return dest;
};

/**
 * Calculates the length of a base.Quat4
 *
 * Params:
 * @param {base.Quat4} quat base.Quat4 to calculate length of
 *
 * @returns Length of quat
 */
base.Quat4.length = function (quat) {
    var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
};

/**
 * Generates a unit quaternion of the same direction as the provided base.Quat4
 * If quaternion length is 0, returns [0, 0, 0, 0]
 *
 * @param {base.Quat4} quat base.Quat4 to normalize
 * @param {base.Quat4} [dest] base.Quat4 receiving operation result. If not specified result is written to quat
 *
 * @returns {base.Quat4} dest if specified, quat otherwise
 */
base.Quat4.normalize = function (quat, dest) {
    if (!dest) { dest = quat; }

    var x = quat[0], y = quat[1], z = quat[2], w = quat[3],
        len = Math.sqrt(x * x + y * y + z * z + w * w);
    if (len === 0) {
        dest[0] = 0;
        dest[1] = 0;
        dest[2] = 0;
        dest[3] = 0;
        return dest;
    }
    len = 1 / len;
    dest[0] = x * len;
    dest[1] = y * len;
    dest[2] = z * len;
    dest[3] = w * len;

    return dest;
};

/**
 * Performs a quaternion multiplication
 *
 * @param {base.Quat4} quat First operand
 * @param {base.Quat4} quat2 Second operand
 * @param {base.Quat4} [dest] base.Quat4 receiving operation result. If not specified result is written to quat
 *
 * @returns {base.Quat4} dest if specified, quat otherwise
 */
base.Quat4.multiply = function (quat, quat2, dest) {
    if (!dest) { dest = quat; }

    var qax = quat[0], qay = quat[1], qaz = quat[2], qaw = quat[3],
        qbx = quat2[0], qby = quat2[1], qbz = quat2[2], qbw = quat2[3];

    dest[0] = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    dest[1] = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    dest[2] = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    dest[3] = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return dest;
};

/**
 * Transforms a base.vec3 with the given quaternion
 *
 * @param {base.Quat4} quat base.Quat4 to transform the vector with
 * @param {base.vec3} vec base.vec3 to transform
 * @param {base.vec3} [dest] base.vec3 receiving operation result. If not specified result is written to vec
 *
 * @returns dest if specified, vec otherwise
 */
base.Quat4.multiplyVec3 = function (quat, vec, dest) {
    if (!dest) { dest = vec; }

    var x = vec[0], y = vec[1], z = vec[2],
        qx = quat[0], qy = quat[1], qz = quat[2], qw = quat[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    dest[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    dest[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    dest[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return dest;
};

/**
 * Calculates a 3x3 matrix from the given base.Quat4
 *
 * @param {base.Quat4} quat base.Quat4 to create matrix from
 * @param {base.mat3} [dest] base.mat3 receiving operation result
 *
 * @returns {base.mat3} dest if specified, a new base.mat3 otherwise
 */
base.Quat4.toMat3 = function (quat, dest) {
    if (!dest) { dest = base.mat3.create(); }

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

    dest[3] = xy - wz;
    dest[4] = 1 - (xx + zz);
    dest[5] = yz + wx;

    dest[6] = xz + wy;
    dest[7] = yz - wx;
    dest[8] = 1 - (xx + yy);

    return dest;
};

/**
 * Calculates a 4x4 matrix from the given base.Quat4
 *
 * @param {base.Quat4} quat base.Quat4 to create matrix from
 * @param {base.mat4} [dest] base.mat4 receiving operation result
 *
 * @returns {base.mat4} dest if specified, a new base.mat4 otherwise
 */
base.Quat4.toMat4 = function (quat, dest) {
    if (!dest) { dest = base.mat4.create(); }

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

    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;

    return dest;
};

/**
 * Performs a spherical linear interpolation between two base.Quat4
 *
 * @param {base.Quat4} quat First quaternion
 * @param {base.Quat4} quat2 Second quaternion
 * @param {number} slerp Interpolation amount between the two inputs
 * @param {base.Quat4} [dest] base.Quat4 receiving operation result. If not specified result is written to quat
 *
 * @returns {base.Quat4} dest if specified, quat otherwise
 */
base.Quat4.slerp = function (quat, quat2, slerp, dest) {
    if (!dest) { dest = quat; }

    var cosHalfTheta = quat[0] * quat2[0] + quat[1] * quat2[1] + quat[2] * quat2[2] + quat[3] * quat2[3],
        halfTheta,
        sinHalfTheta,
        ratioA,
        ratioB;

    if (Math.abs(cosHalfTheta) >= 1.0) {
        if (dest !== quat) {
            dest[0] = quat[0];
            dest[1] = quat[1];
            dest[2] = quat[2];
            dest[3] = quat[3];
        }
        return dest;
    }

    halfTheta = Math.acos(cosHalfTheta);
    sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
        dest[0] = (quat[0] * 0.5 + quat2[0] * 0.5);
        dest[1] = (quat[1] * 0.5 + quat2[1] * 0.5);
        dest[2] = (quat[2] * 0.5 + quat2[2] * 0.5);
        dest[3] = (quat[3] * 0.5 + quat2[3] * 0.5);
        return dest;
    }

    ratioA = Math.sin((1 - slerp) * halfTheta) / sinHalfTheta;
    ratioB = Math.sin(slerp * halfTheta) / sinHalfTheta;

    dest[0] = (quat[0] * ratioA + quat2[0] * ratioB);
    dest[1] = (quat[1] * ratioA + quat2[1] * ratioB);
    dest[2] = (quat[2] * ratioA + quat2[2] * ratioB);
    dest[3] = (quat[3] * ratioA + quat2[3] * ratioB);

    return dest;
};

/**
 * Returns a string representation of a quaternion
 *
 * @param {base.Quat4} quat base.Quat4 to represent as a string
 *
 * @returns {string} String representation of quat
 */
base.Quat4.str = function (quat) {
    return '[' + quat[0] + ', ' + quat[1] + ', ' + quat[2] + ', ' + quat[3] + ']';
};

