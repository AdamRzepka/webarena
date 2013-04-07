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
 *
 */

'use strict';

goog.require('base.Material');
goog.require('goog.webgl');

goog.provide('renderer');
goog.provide('renderer.Material');
goog.provide('renderer.Stage');
goog.provide('renderer.Shader');
goog.provide('renderer.ShaderProgram');
goog.provide('renderer.MeshInstance');
goog.provide('renderer.State');

/**
 * @constructor
 * @extends {base.Material}
 * @param {renderer.Shader} shader
 * @param {WebGLTexture} customTexture
 * @param {base.LightningType} lightningType
 */
renderer.Material = function (shader, customTexture, lightningType) {
    /**
     * @const
     * @type {renderer.Shader}
     */
    this.shader = shader;
    /**
     * @const
     * @type {WebGLTexture}
     */
    this.customTexture = customTexture;
    /**
     * @const
     * @type {base.LightningType}
     */
    this.lightningType = lightningType;
};

goog.inherits(renderer.Material, base.Material);

/**
 * @constructor
 */
renderer.Stage = function () {
    /**
     * @type {string}
     */
    this.map = '';
    /**
     * @type {WebGLTexture}
     */
    this.texture = null;
    /**
     * @type {boolean}
     */
    this.isLightmap = false;
    /**
     * @type {number}
     */
    this.blendSrc = goog.webgl.ONE;
    /**
     * @type {number}
     */
    this.blendDest = goog.webgl.ZERO;
    /**
     * @type {number}
     */
    this.depthFunc = goog.webgl.LEQUAL;
    /**
     * @type {boolean}
     */
    this.dephWrite = true;
    /**
     * @type {renderer.ShaderProgram}
     */
    this.program = null;
};

/**
 * @constructor
 */
renderer.Shader = function () {
    /**
     * @type {number}
     */
    this.cull = goog.webgl.BACK;
    /**
     * @type {number}
     */
    this.sort = 7;
    /**
     * @type {boolean}
     */
    this.sky = false;
    // /**
    //  * @type {number}
    //  */
    // this.blend = -1;
    /**
     * @type {string}
     */
    this.name = '';
    /**
     * @type {Array.<renderer.Stage>}
     */
    this.stages = [];
};

/**
 * @constructor
 * @param {Object.<string,number>} attribs
 * @param {Object.<string,number>} uniforms
 * @param {WebGLProgram} glProgram
 */
renderer.ShaderProgram = function (attribs, uniforms, glProgram) {
    /**
     * @type {Object.<string,number>}
     * Attribs locations
     */
    this.attribs = attribs;
    /**
     * @type {Object.<string,WebGLUniformLocation>}
     * Uniforms locations
     */
    this.uniforms = uniforms;
    /**
     * @type {WebGLProgram}
     */
    this.glProgram = glProgram;
};

/**
 * @constructor
 * @param {base.Mesh} baseMesh
 * @param {base.ModelInstance} modelInstance
 * @param {renderer.Material} material
 */
renderer.MeshInstance = function(baseMesh, modelInstance, material) {
    /**
     * @const
     * @type {base.Mesh}
     */
    this.baseMesh = baseMesh;
    /**
     * @type {boolean}
     */
    this.culled = false;
    /**
     * @const
     * @type {base.ModelInstance}
     */
    this.modelInstance = modelInstance;
    /**
     * @const
     * @type {renderer.Material}
     */
    this.material = material;
    /**
     * @const
     * @type {number}
     */
    this.hash = 0;
};

/**
 * @constructor
 */
renderer.State = function () {
    /**
     * @type {base.Mat4}
     */
    this.mvpMat = base.Mat4.identity();
    /**
     * @type {base.Mat4}
     */
    this.viewMat = base.Mat4.identity();
    /**
     * @type {base.Mat4}
     */
    this.projectionMat = base.Mat4.identity();
    /**
     * @type {base.Vec3}
     */
    this.camPos = base.Vec3.create();
    /**
     * @type {renderer.Stage}
     */
    this.stage = null;
    /**
     * @type {renderer.Stage}
     */
    this.prevStage = null;
    /**
     * @type {renderer.MeshInstance}
     */
    this.meshInstance = null;
    /**
     * @type {renderer.MeshInstance}
     */
    this.prevMeshInstance = null;
};

/**
 * @enum {number}
 */
renderer.SpecialModelId = {
    SKY: -1,
    LINE: -2,
    BILLBOARD: -3
};
