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

goog.require('goog.asserts');
goog.require('base.Mat4');
goog.require('renderer');
goog.require('renderer.State');
goog.provide('renderer.Sky');

/**
 * @constructor
 */
renderer.Sky = function() {
    this.model = null;
    this.modelInstance = null;
    this.geometryData = null;
};

/**
 * @param {base.Material} material
 * @param {renderer.Renderer} rend
 */
renderer.Sky.prototype.build = function(material, rend) {
    var a = 0.29289, b = 0.7071, d = 128;

    var skyVerts = [
	-d, d, -d, 0, 0, //A
	d, d, -d, 1, 0, //B
	d, d, d, b, a, //C
	-d, d, d, a, a, //D 
	-d, -d, d, a, b, // E
	d, -d, d, b, b, //F
	d, -d, -d, 1, 1, //G
	-d, -d, -d, 0, 1
    ];

    var skyIndices = [
	0, 1, 2,
	0, 2, 3,

	2, 1, 6,
	5, 2, 6,

	4, 5, 6,
	4, 6, 7,

	0, 3, 4,
	0, 4, 7,

	3, 2, 5,
	3, 5, 4
    ];

    goog.asserts.assert(this.model === null);

    rend.registerMeshCallbacks(base.Model.Type.SKY, renderer.Sky.bindMesh,
                         renderer.Sky.renderMeshInstance);
    
    this.geometryData = new base.GeometryData(new Uint16Array(skyIndices),
					      [new Float32Array(skyVerts)]);
    var mesh = new base.Mesh(this.geometryData, 0, skyIndices.length, [material.shader.name],
			    base.LightningType.LIGHT_CUSTOM);
    this.model = new base.Model(renderer.SpecialModelId.SKY, [mesh], 1, [], base.Model.Type.SKY);
    rend.addModel(this.model);
    this.modelInstance = new base.ModelInstance(-1, this.model, 0);
    rend.addModelInstance(this.modelInstance);
};

/**
 * @param {base.Mat4} mtx
 */
renderer.Sky.prototype.updateMatrix = function (mtx) {
    if (this.modelInstance) {
	var skyMtx = this.modelInstance.getMatrix();
	skyMtx[12] = mtx[12];
	skyMtx[13] = mtx[13];
	skyMtx[14] = mtx[14];
    }
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {renderer.State} state
 * @param {Array.<WebGLBuffer>} indexBuffers
 * @param {Array.<WebGLBuffer>} vertexBuffers
 * Callback fired by renderer just before drawElements to set uniforms and attribs.
 * Called once for mesh type.
 */
renderer.Sky.bindMesh = function (gl, state, indexBuffers, vertexBuffers) {
    var vertexStride = 20, texOffset = 12;
    var meshInstance = state.meshInstance;
    var shader = state.stage.program;
    var indexBufferId = meshInstance.baseMesh.geometry.indexBufferId;
    var vertexBufferId = meshInstance.baseMesh.geometry.vertexBufferIds[0];

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,
		  indexBuffers[indexBufferId]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[vertexBufferId]);

    goog.asserts.assert(meshInstance.modelInstance.baseModel.type === base.Model.Type.SKY);
    
    // Set uniforms
    gl.uniformMatrix4fv(shader.uniforms['mvpMat'], false, state.mvpMat);

    // Setup vertex attributes
    gl.enableVertexAttribArray(shader.attribs['position']);
    gl.vertexAttribPointer(shader.attribs['position'], 3, gl.FLOAT, false, vertexStride, 0);

    gl.enableVertexAttribArray(shader.attribs['texCoord']);
    gl.vertexAttribPointer(shader.attribs['texCoord'], 2, gl.FLOAT, false,
			   vertexStride, texOffset);
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {renderer.State} state
 * @param {Array.<WebGLBuffer>} indexBuffers
 * @param {Array.<WebGLBuffer>} vertexBuffers
 * Callback fired by renderer for every meshInstance.
 */
renderer.Sky.renderMeshInstance = function (gl, state, indexBuffers, vertexBuffers) {
    var mesh = state.meshInstance.baseMesh;
    gl.drawElements(gl.TRIANGLES, mesh.indicesCount, gl.UNSIGNED_SHORT, mesh.indicesOffset);
};
