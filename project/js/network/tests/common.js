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
goog.require('network.public');
goog.require('network.ClassInfo');

goog.provide('network.tests.common');

network.tests.classInfoManager = null;

/**
 * @implements {network.ISynchronizable}
 */
network.tests.A = function () {
    this.a = 4;
    this.b = 1.5;
}

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
    this.c = synchronizer.synchronize(this.c, network.Type.CHAR);
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
}

function tearDown() {
    network.tests.classInfoManager = null;
    network.ClassInfoManager.nextId_ = 0;
}

