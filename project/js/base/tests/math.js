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
goog.require('base.math');

function testRayTriangle() {
    var v1 = [0, 0, 0];
    var v2 = [0, 1, 0];
    var v3 = [1, 0, 0];

    var res = base.math.rayTriangle(v1, v2, v3, [0, 0, -1], [0, 0, 1]);
    assertTrue(res < 1);
    res = base.math.rayTriangle(v1, v2, v3, [0, 1, -1], [0, 1, 1]);
    assertTrue(res < 1);
    res = base.math.rayTriangle(v1, v2, v3, [1, 0, -1], [1, 0, 1]);
    assertTrue(res < 1);
    res = base.math.rayTriangle(v1, v2, v3, [0, 0, 1], [0, 0, -1]);
    assertTrue(res < 1);
    res = base.math.rayTriangle(v1, v2, v3, [0.5, 0.5, 1], [0, 0, -1]);
    assertTrue(res < 1);

    res = base.math.rayTriangle(v1, v2, v3, [0, -0.5, 1], [0, 0, -1]);
    assertFalse(res < 1);
}
