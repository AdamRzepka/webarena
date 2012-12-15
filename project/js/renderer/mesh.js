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

goog.provide('renderer.Mesh');

goog.require('goog');
goog.require('base');

// /**
//  * @constructor
//  * @extends {base.Mesh}
//  * @param {base.Mesh} mesh
//  * @param {number} indexBufferId
//  * @param {Array.<number>} vertexBufferIds
//  * @param {renderer.LightningType} lightningType
//  */
// renderer.Mesh = function(mesh, material, indexBufferId, vertexBufferIds, lightningType) {
//     /**
//      * @const
//      * @type {base.GeometryData}
//      */
//     this.geometry = mesh.geometry;
//     /**
//      * @const
//      * Offset in geometry buffer
//      * @type {number}
//      */
//     this.indicesOffset = mesh.indicesOffset;
//     /**
//      * @const
//      * @type {number}
//      */
//     this.indicesCount = mesh.indicesCount;
//     /**
//      * List of all materials, the instances of the mesh can have.
//      * @const
//      * @type {Array.<renderer.Material>}
//      */
//     this.materialNames = mesh.materialNames;

//     /**
//      * List of all materials, the instances of the mesh can have.
//      * @const
//      * @type {Array.<renderer.Material>}
//      */
//     this.materials = material;
//     /**
//      * @const
//      * @type {number}
//      */
//     this.indexBufferId = indexBufferId;
//     /**
//      * @const
//      * @type {Array.<number>}
//      */
//     this.vertexBufferIds = vertexBufferIds;
//     /**
//      * @const
//      * @type {renderer.LightningType}
//      */
//     this.lightningType = lightningType;
// };

goog.inherits(renderer.Mesh, base.Mesh);


/**
 * @constructor
 * @param {renderer.Mesh} baseMesh
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
};
