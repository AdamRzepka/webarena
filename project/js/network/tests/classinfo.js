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
goog.require('network.ClassInfo');

function testClassInfoManager() {
    /**
     * @constructor
     * @implements network.ISynchronizable
     */
    function Mock() {
        this.a = 8;
        this.b = [1.5];
    }
    Mock.prototype.synchronize = function (sync) {
        this.a = sync.synchronize(this.a, network.Type.UINT8, 0);
        this.b = sync.synchronize(this.b, network.Type.FLOAT32, network.Flags.ARRAY);
    };

    function factory() {
        return new Mock();
    }

    var destroyed = false;
    function destroy(obj) {
        destroyed = true;
    }

    network.ClassInfoManager.nextId_ = 0;

    var classInfoMng = new network.ClassInfoManager();
    classInfoMng.registerClass(Mock, factory, destroy);

    assertEquals('__networkClassId__ is added to prototype',
                 0, Mock.prototype.__networkClassId__);

    var classInfo = classInfoMng.getClassInfo(0);

    assertEquals('id', 0, classInfo.id);
    assertEquals('fieldsCount', 2, classInfo.fieldsCount);
    assertEquals('a type', network.Type.UINT8, classInfo.types[0]);
    assertEquals('b type', network.Type.FLOAT32, classInfo.types[1]);
    assertEquals('a flags', 0, classInfo.flags[0]);
    assertEquals('b flags', network.Flags.ARRAY, classInfo.flags[1]);
    
    var obj = classInfo.factoryFunction();
    assertEquals('__networkClassId__ in object',
                 0, obj.__networkClassId__);
    classInfo.destroyCallback(obj);
    assertTrue('destroyCallback was called', destroyed);    
}
