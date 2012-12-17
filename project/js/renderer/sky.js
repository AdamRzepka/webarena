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
goog.provide('renderer.Sky');

/**
 * @constructor
 */
renderer.Sky = function() {
    this.model = null;
    this.modelInstance = null;
    this.geometryData = null;
};

renderer.Sky.prototype.build = function(material, renderer) {
    // var skyVerts = [
    //     -128, 128, 128, 0, 0,
    //     128, 128, 128, 1, 0,
    //     -128, -128, 128, 0, 1,
    //     128, -128, 128, 1, 1,
        
    //     -128, 128, 128, 0, 1,
    //     128, 128, 128, 1, 1,
    //     -128, 128, -128, 0, 0,
    //     128, 128, -128, 1, 0,
        
    //     -128, -128, 128, 0, 0,
    //     128, -128, 128, 1, 0,
    //     -128, -128, -128, 0, 1,
    //     128, -128, -128, 1, 1,
        
    //     128, 128, 128, 0, 0,
    //     128, -128, 128, 0, 1,
    //     128, 128, -128, 1, 0,
    //     128, -128, -128, 1, 1,
        
    //     -128, 128, 128, 1, 0,
    //     -128, -128, 128, 1, 1,
    //     -128, 128, -128, 0, 0,
    //     -128, -128, -128, 0, 1
    // ];
    
    // var skyIndices = [
    //     0, 1, 2,
    //     1, 2, 3,
        
    //     4, 5, 6,
    //     5, 6, 7,
        
    //     8, 9, 10,
    //     9, 10, 11,
        
    //     12, 13, 14,
    //     13, 14, 15,
        
    //     16, 17, 18,
    //     17, 18, 19
    // ];

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

    this.geometryData = new base.GeometryData(new Uint16Array(skyIndices),
					      [new Float32Array(skyVerts)],
					      base.GeometryData.Layout.SKY);
    var mesh = new base.Mesh(this.geometryData, 0, skyIndices.length, [material.shader.name],
			    base.LightningType.LIGHT_CUSTOM);
    this.model = new base.Model(-1, [mesh], 1, null);
    renderer.addMeshes(this.model);
    this.modelInstance = new base.ModelInstance(-1, this.model, 0);
    renderer.addMeshInstances(this.modelInstance);
};

renderer.Sky.prototype.updateMatrix = function (mtx) {
    if (this.modelInstance) {
	var skyMtx = this.modelInstance.getMatrix();
	skyMtx[12] = mtx[12];
	skyMtx[13] = mtx[13];
	skyMtx[14] = mtx[14];
    }
};

