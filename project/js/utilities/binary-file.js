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

goog.provide('binaryFile');

var BinaryFile = function(data) {
    this.buffer = data;
    this.length = data.length;
    this.offset = 0;
    this.data = data;
    this.dataView = new DataView(data);
};

// This is the result of an interesting trick that Google does in their
// GWT port of Quake 2. (For floats, anyway...) Rather than parse and
// calculate the values manually they share the contents of a byte array
// between several types of buffers, which allows you to push into one and
// read out the other. The end result is, effectively, a typecast!

// var bf_byteBuff = new ArrayBuffer(4);

// var bf_wba = new Int8Array(bf_byteBuff);
// var bf_wuba = new Uint8Array(bf_byteBuff);

// var bf_wsa = new Int16Array(bf_byteBuff);
// var bf_wusa = new Uint16Array(bf_byteBuff);

// var bf_wia = new Int32Array(bf_byteBuff);
// var bf_wuia = new Uint32Array(bf_byteBuff);

// var bf_wfa = new Float32Array(bf_byteBuff);

BinaryFile.prototype.eof = function() {
    return this.offset >= this.length;
};

// Seek to the given byt offset within the stream
BinaryFile.prototype.seek = function(offset) {
    this.offset = offset;
};

// Seek to the given byt offset within the stream
BinaryFile.prototype.tell = function() {
    return this.offset;
};

// Read a signed byte from the stream
BinaryFile.prototype.readByte = function() {
    return this.dataView.getInt8(this.offset++);
};

// Read an unsigned byte from the stream
BinaryFile.prototype.readUByte = function() {
    return this.dataView.getUint8(this.offset++);
};

// Read a signed short (2 bytes) from the stream
BinaryFile.prototype.readShort = function() {
    var res = this.dataView.getInt16(this.offset, true);
    this.offset += 2;
    return res;
};

// Read an unsigned short (2 bytes) from the stream
BinaryFile.prototype.readUShort = function() {
    var res = this.dataView.getUint16(this.offset, true);
    this.offset += 2;
    return res;
};

// Read a signed long (4 bytes) from the stream
BinaryFile.prototype.readLong = function() {
    var res = this.dataView.getInt32(this.offset, true);
    this.offset += 4;
    return res;
};

// Read an unsigned long (4 bytes) from the stream
BinaryFile.prototype.readULong = function() {
    var res = this.dataView.getUint32(this.offset, true);
    this.offset += 4;
    return res;
};

// Read a float (4 bytes) from the stream
BinaryFile.prototype.readFloat = function() {
    var res = this.dataView.getFloat32(this.offset, true);
    this.offset += 4;
    return res;
};

BinaryFile.prototype.expandHalf = function(h) {
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

BinaryFile.prototype.readHalf = function() {
    var h = this.readUShort();
    return this.expandHalf(h);
};

// Read an ASCII string of the given length from the stream
BinaryFile.prototype.readString = function(length) {
    var str = String.fromCharCode.apply(null, new Uint8Array(this.data, this.offset, length));
    this.offset += length;
    return str;
};

