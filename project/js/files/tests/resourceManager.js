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
goog.require('goog.testing.AsyncTestCase');

goog.require('files.ResourceManager');

var gAsyncTestCase;
var gWasCalled = true;

function testLoadMd3WithSkins() {
    function buildEntry(name, data) {
        return {
            filename: name,
            getData: function (writer, callback) {
                callback(data);
            }
        };
    }

    var entries = [
        buildEntry('models/model.md3', 'model data'),
        buildEntry('models/model_default.skin', 'default skin'),
        buildEntry('models/model_red.skin', 'red skin')
    ];

    gAsyncTestCase.waitForAsync();
    gWasCalled = false;
    
    files.md3.load = function (modelData, skins) { // override load function for test
        gAsyncTestCase.continueTesting();
        assertEquals('model data', modelData);
        assertEquals('default skin', skins['default']);
        assertEquals('red skin', skins['red']);
        gWasCalled = true;
    };

    var rm = new files.ResourceManager();
    rm.loadMd3WithSkins_(entries[0], entries);
}

function tearDown() {
    assertTrue(gWasCalled);
}

gAsyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
