/**
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

goog.require('base');

goog.provide('base.Map');

/**
 * Class representing a level loaded from bsp. It is created by bsp loader.
 * @constructor
 * @param {Array.<base.Model>} models
 * @param {base.Map.Lightmap} lightmapData
 */
base.Map = function(models, lightmapData) {
    this.bsp = null;
    /**
     * @const
     * @type {Array.<base.Model>}
     */
    this.models = models;
    /**
     * @const
     * @type {base.Map.Lightmap}
     */
    this.lightmapData = lightmapData;
};

/**
 * @constructor
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array} bytes
 */
base.Map.Lightmap = function(x, y, width, height, bytes) {
    /**
     * @const
     * @type {number}
     */
    this.x = x;
    /**
     * @const
     * @type {number}
     */
    this.y = y;
    /**
     * @const
     * @type {number}
     */
    this.width = width;
    /**
     * @const
     * @type {number}
     */
    this.height = height;
    /**
     * @const
     * @type {Uint8Array}
     */
    this.bytes = bytes;
};

/**
 * @constructor
 * @param {Array.<base.Map.Lightmap>} lightmaps
 * @param {number} size
 */
base.Map.LightmapData = function(lightmaps, size) {
    /**
     * @const
     * @type {Array.<base.Map.Lightmap>}
     */
    this.lightmaps = lightmaps;
    /**
     * @const
     * @type {number}
     */
    this.size = size;
};
