/**
 * @license
 * Copyright (C) 2012 Adam Rzepka
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

goog.provide('renderer.Material');

goog.require('goog');
goog.require('base');


/**
 * @enum
 */
renderer.LightningType = {
    LIGHT_2D: -4,
    LIGHT_VERTEX: -3,
    LIGHT_WHITE: -2,
    LIGHT_DYNAMIC: -1,
    LIGHT_MAP: 0,
    LIGHT_CUSTOM: 1
};

/**
 * @constructor
 */
renderer.Material = function (shader, defaultTexture, lightningType) {
    this.shader = shader;
    this.defaultTexture = defaultTexture;
    this.lightningType = lightningType;
};

goog.inherits(renderer.Material, base.Material);
