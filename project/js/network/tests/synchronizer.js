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
goog.require('network.Synchronizer');
goog.require('network.Snapshot');

function testResetParams() {
    var sync = new network.Synchronizer();
    assertThrows("When set to WRITE, snapshot mustn't be provided",
                 function () {
                     sync.reset(network.Synchronizer.Mode.WRITE, new network.Snapshot());
                 });
    assertThrows("When set to READ, snapshot must be provided",
                 function () {
                     sync.reset(network.Synchronizer.Mode.READ, null);
                 });
    assertNotThrows("When set to WRITE, snapshot mustn't be provided",
                    function () {
                        sync.reset(network.Synchronizer.Mode.WRITE, null);
                    });
    assertNotThrows("When set to READ, snapshot must be provided",
                    function () {
                        sync.reset(network.Synchronizer.Mode.READ, new network.Snapshot());
                    });

}

function testWrite() {
    var sync = new network.Synchronizer();
    assertEquals("Returns the same value during writing", 1, sync.synchronize(1));
}

function testRead() {
    var sync = new network.Synchronizer();
    sync.reset(network.Synchronizer.Mode.WRITE);
    sync.synchronize(1);
    sync.reset(network.Synchronizer.Mode.READ, sync.snapshot_);
    assertEquals("Returns previously written value", 1, sync.synchronize(2));
}

function testObject() {
    function Mock() {
        this.dummy = 1;
    }

    Mock.prototype.getId = function () {
        return 0;
    };
    
    Mock.prototype.getType = function () {
        return 0;
    };

    Mock.prototype.synchronize = function (synchronizer) {
        this.dummy = synchronizer.synchronize(this.dummy);
    };

    var mock = new Mock();
    
    var sync = new network.Synchronizer();
    sync.reset(network.Synchronizer.Mode.WRITE);
    sync.synchronize(mock);
    sync.reset(network.Synchronizer.Mode.READ, sync.snapshot_);
    mock.dummy = 2;
    mock = sync.synchronize(mock);
    assertEquals("Returns previously written value", 1, mock.dummy);
}
