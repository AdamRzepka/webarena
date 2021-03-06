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
goog.require('goog.testing.jsunit');
goog.require('network');
goog.require('network.ClassInfo');

goog.provide('network.tests.common');

network.tests.classInfoManager = null;

/**
 * @implements {network.ISynchronizable}
 */
network.tests.A = function () {
    this.a = 4;
    this.b = 1.5;
};

network.tests.A.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.INT8);
    this.b = synchronizer.synchronize(this.b, network.Type.FLOAT32);
};

/**
 * @implements {network.ISynchronizable}
 */
network.tests.B = function () {
    this.obj = new network.tests.A();
    this.c = 'c';
};

network.tests.B.prototype.synchronize = function (synchronizer) {
    this.obj = synchronizer.synchronize(this.obj, network.Type.OBJECT);
    this.c = synchronizer.synchronize(this.c, network.Type.CHAR8);
};

/**
 * @implements {network.ISynchronizable}
 */
network.tests.C = function () {
    this.a = [1,2];
    this.b = 3;
};

network.tests.C.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.INT32, network.Flags.ARRAY);
    this.b = synchronizer.synchronize(this.b, network.Type.INT32);
};

/**
 * @implements {network.ISynchronizable}
 */
network.tests.D = function () {
    this.a = [new network.tests.A(), new network.tests.B(), new network.tests.C()];
};

network.tests.D.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.OBJECT, network.Flags.ARRAY);
};

network.tests.E = function () {
    this.a = -1;
    this.b = null;
    this.c = 12;
    this.d = 3;
    this.e = [4];
    this.f = 0.5;
    this.g = 0.25;
    this.h = 'le dupa';
};

network.tests.E.prototype.synchronize = function (synchronizer) {
    this.a = synchronizer.synchronize(this.a, network.Type.INT8);
    this.b = synchronizer.synchronize(this.b, network.Type.OBJECT);
    this.c = synchronizer.synchronize(this.c, network.Type.UINT16);
    this.d = synchronizer.synchronize(this.d, network.Type.INT32);
    this.e = synchronizer.synchronize(this.e, network.Type.INT32, network.Flags.ARRAY);
    this.f = synchronizer.synchronize(this.f, network.Type.FLOAT32);
    this.g = synchronizer.synchronize(this.g, network.Type.FLOAT32);
    this.h = synchronizer.synchronize(this.h, network.Type.STRING8);
};

network.tests.destroyedA = false;
network.tests.destroyedC = false;

function setUp() {
    network.tests.destroyedA = false;
    network.tests.destroyedC = false;
    network.ClassInfoManager.nextId_ = 0;
    network.tests.classInfoManager = new network.ClassInfoManager();
    network.tests.classInfoManager.registerClass(network.tests.A, function () {
        return new network.tests.A();
    }, function () {
        network.tests.destroyedA = true;
    });
    
    network.tests.classInfoManager.registerClass(network.tests.B, function () {
        return new network.tests.B();
    });

    network.tests.classInfoManager.registerClass(network.tests.C, function () {
        return new network.tests.C();
    }, function () {
        network.tests.destroyedC = true;
    });
    
    network.tests.classInfoManager.registerClass(network.tests.D, function () {
        return new network.tests.D();
    });
    
    network.tests.classInfoManager.registerClass(network.tests.E, function () {
        return new network.tests.E();
    });

}

function tearDown() {
    network.tests.classInfoManager = null;
    network.ClassInfoManager.nextId_ = 0;
}


network.tests.deepCompare = function (a, b) {
    var x;
    var fa;
    var fb;
    var result;
    for( x in a ) {
        if (a.hasOwnProperty(x)) {
            if (b.hasOwnProperty(x)) {
                fa = a[x];
                fb = b[x];
                if (typeof fa === 'object' && typeof fb === 'object'
                    && fa !== null && fb !== null) {
                    if (!network.tests.deepCompare(fa, fb)) {
                        return false;
                    }                    
                } else {
                    if (fa !== fb) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
    }
    for( x in b )
    {
        if (b.hasOwnProperty(x)) {
            if (!a.hasOwnProperty(x)) {
                return false;
            }
        }
    }
    return true;
};

function testDeepCompare() {
    var a = {
        a: 1,
        b: {
            c: 2,
            d: 3
        },
        e: [
            'a',
            'b'
        ]
    };
    var b = {
        a: 1,
        b: {
            c: 2,
            d: 3
        },
        e: [
            'a',
            'b'
        ]
    };
    assertTrue(network.tests.deepCompare(a, b));
    b.a = 2;
    assertFalse(network.tests.deepCompare(a, b));
    b.a = 1;
    assertTrue(network.tests.deepCompare(a, b));
    
    b.b.c = 1;
    assertFalse(network.tests.deepCompare(a, b));
    b.b.c = 2;
    delete b.b.c;
    assertFalse(network.tests.deepCompare(a, b));
    b.b.c = 2;
    assertTrue(network.tests.deepCompare(a, b));
    b.b.e = 5;
    assertFalse(network.tests.deepCompare(a, b));
    delete b.b.e;
    assertTrue(network.tests.deepCompare(a, b));
    b.b = null;
    assertFalse(network.tests.deepCompare(a, b));
    b.b = { c: 2, d: 3};
    assertTrue(network.tests.deepCompare(a, b));
    
    b.e[0] = 5;
    assertFalse(network.tests.deepCompare(a, b));
    b.e[0] = 'a';
    assertTrue(network.tests.deepCompare(a, b));
    b.e.length = 1;
    assertFalse(network.tests.deepCompare(a, b));
    b.e[1] = 'b';
    assertTrue(network.tests.deepCompare(a, b));
    b.e[2] = 'dupa';
    assertFalse(network.tests.deepCompare(a, b));
}
