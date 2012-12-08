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

"use strict";

goog.provide('base.Material');
goog.provide('base.ShaderScript');

/**
 * Base class for material, containing only material name. Material class corresponds
 * to shader strings found in bsp and md3, which in fact can reffer either to
 * explicit shader declaration or to ordinary texture (with default shader). Material
 * unifies this concept.
 * @constructor
 * @param {string} name Material name as found in md3/bsp/skin file, without
 * trailing zeros
 */
base.Material = function (name, shaderScript) {
    /**
     * @const
     * @type {string}
     */
    this.name = name;
    /**
     * @type {base.ShaderScript}
     */
    this.shaderScript = shaderScript;
};

base.ShaderScript = function () {
    /**
     * @const
     * @type {string}
     */
    this.name = "";
    /**
     * @const
     * @type {boolean}
     */ 
    this.isDefault = true;
    /**
     * @const
     * @type {string}
     */
    this.cull = 'back';
    /**
     * @const
     * @type {boolean}
     */
    this.sky = false;
    /**
     * @const
     * @type {boolean}
     */
    this.blend = false;
    /**
     * @const
     * @type {boolean}
     */
    this.opaque = false;
    /**
     * @const
     * @type {number}
     */
    this.sort = 0;
    /**
     * @const
     * @type {Array.<?>}
     */
    this.vertexDeforms = [];
    /**
     * @const
     * @type {Array.<base.ShaderScriptStage>}
     */
    this.stages = [];
};

base.ShaderScriptStage = function () {
    /**
     * @const
     * @type {string}
     */
    this.map = null;
    /**
     * @const
     * @type {boolean}
     */
    this.clamp = false;
    /**
     * @const
     * @type {string}
     */
    this.tcGen = 'base';
    /**
     * @const
     * @type {string}
     */
    this.rgbGen = 'identity';
    /**
     * @const
     * @type {?}
     */
    this.rgbWaveform = null;
    /**
     * @const
     * @type {string}
     */
    this.alphaGen = '1.0';
    /**
     * @const
     * @type {?}
     */
    this.alphaFunc = null;
    /**
     * @const
     * @type {?}
     */
    this.alphaWaveform = null;
    /**
     * @const
     * @type {string}
     */
    this.blendSrc = 'GL_ONE';
    /**
     * @const
     * @type {string}
     */
    this.blendDest = 'GL_ZERO';
    /**
     * @const
     * @type {boolean}
     */
    this.hasBlendFunc = false;
    /**
     * @const
     * @type {Array.<?>}
     */
    this.tcMods = [];
    /**
     * @const
     * @type {Array.<?>}
     */
    this.animMaps = [];
    /**
     * @const
     * @type {number}
     */
    this.animFreq = 0;
    /**
     * @const
     * @type {string}
     */
    this.depthFunc = 'lequal';
    /**
     * @const
     * @type {boolean}
     */
    this.depthWrite = true;
    /**
     * @const
     * @type {boolean}
     */
    this.isLightmap = false;
    /**
     * @const
     * @type {{string,string}}
     */
    this.shaderSrc = null;
};
