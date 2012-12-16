/*
 * binFile.js - Binary Stream Reader
 * version 1.0
 */

/*
 * Copyright (c) 2011 Brandon Jones
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
 *
 **********************************************************************************
 * Modified by Adam Rzepka
 */

goog.provide('files.BinaryFile');

/**
 * @constructor
 * @param {ArrayBuffer} data
 */
files.BinaryFile = function(data) {
    this.buffer = data;
    this.length = data.length;
    this.offset = 0;
    this.data = data;
    this.dataView = new DataView(data);
};

files.BinaryFile.prototype.eof = function() {
    return this.offset >= this.length;
};

// Seek to the given byt offset within the stream
files.BinaryFile.prototype.seek = function(offset) {
    this.offset = offset;
    return this; // to allow chaining
};

files.BinaryFile.prototype.skip = function(bytesToSkip) {
    this.offset += bytesToSkip;
    return this; // to allow chaining
};

// Seek to the given byt offset within the stream
files.BinaryFile.prototype.tell = function() {
    return this.offset;
};

// Read a signed byte from the stream
files.BinaryFile.prototype.readByte = function() {
    return this.dataView.getInt8(this.offset++);
};

// Read an unsigned byte from the stream
files.BinaryFile.prototype.readUByte = function() {
    return this.dataView.getUint8(this.offset++);
};

// Read a signed short (2 bytes) from the stream
files.BinaryFile.prototype.readShort = function() {
    var res = this.dataView.getInt16(this.offset, true);
    this.offset += 2;
    return res;
};

// Read an unsigned short (2 bytes) from the stream
files.BinaryFile.prototype.readUShort = function() {
    var res = this.dataView.getUint16(this.offset, true);
    this.offset += 2;
    return res;
};

// Read a signed long (4 bytes) from the stream
files.BinaryFile.prototype.readLong = function() {
    var res = this.dataView.getInt32(this.offset, true);
    this.offset += 4;
    return res;
};

// Read an unsigned long (4 bytes) from the stream
files.BinaryFile.prototype.readULong = function() {
    var res = this.dataView.getUint32(this.offset, true);
    this.offset += 4;
    return res;
};

// Read a float (4 bytes) from the stream
files.BinaryFile.prototype.readFloat = function() {
    var res = this.dataView.getFloat32(this.offset, true);
    this.offset += 4;
    return res;
};

files.BinaryFile.prototype.readFloatArray = function(count) {
    var res = new Float32Array(this.data, this.offset, count);
    this.offset += 4 * count;
    return res;
};

files.BinaryFile.prototype.readLongArray = function(count) {
    var res = new Int32Array(this.data, this.offset, count);
    this.offset += 4 * count;
    return res;
};


files.BinaryFile.prototype.expandHalf = function(h) {
    var s = (h & 0x8000) >> 15;
    var e = (h & 0x7C00) >> 10;
    var f = h & 0x03FF;

    if(e == 0) {
        return (s?-1:1) * Math.pow(2,-14) * (f/Math.pow(2, 10));
    } else if (e == 0x1F) {
        return f?NaN:((s?-1:1)*Infinity);
    }

    return (s?-1:1) * Math.pow(2, e-15) * (1+(f/Math.pow(2, 10)));
};

files.BinaryFile.prototype.readHalf = function() {
    var h = this.readUShort();
    return this.expandHalf(h);
};

// Read an ASCII string of the given length from the stream
files.BinaryFile.prototype.readString = function(length) {
    var str = String.fromCharCode.apply(null, new Uint8Array(this.data, this.offset, length));
    this.offset += length;
    return str;
};

