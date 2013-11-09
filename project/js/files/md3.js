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
goog.require('files.BinaryFile');
goog.require('goog.asserts');

goog.provide('files.md3');

/**
 * @param {ArrayBuffer} arrayBuffer
 * @param {Object.<string, string>} skinFiles
 */
files.md3.load = function(arrayBuffer, skinFiles) {

    var skins = [],
        key,
        header,
	surfaces = [],
	frames = [],
        tagNames = [],
	model,
	i = 0,
        j = 0,
	binaryFile = new files.BinaryFile(arrayBuffer);

    // local functions
    function parseHeader_() {
	if (binaryFile.readString(4) != 'IDP3')
	    throw "Invalid md3 file";

	binaryFile.skip(72); // skipping version (4), name(64) and flags (4)
	return {
	    framesCount: binaryFile.readLong(),
	    tagsCount: binaryFile.readLong(),
	    surfacesCount: binaryFile.readLong(),
	    framesOffset: binaryFile.skip(4).readLong(), // skipping skins number
	    tagsOffset: binaryFile.readLong(),
	    surfacesOffset: binaryFile.readLong()
	};
    }

    function parseTagNames_() {
        var i;
        var result = [];
        for (i = 0; i < header.tagsCount; ++i) {
            result.push(binaryFile.readString(64).replace(/[\0\s]*$/, ''));
            binaryFile.skip(48); // skip transformation for now
        }
        return result;
    };

    function parseTag_() {
        var mtx, rot, origin;
        binaryFile.skip(64); // name already parsed
        origin = binaryFile.readFloatArray(3);
        rot = binaryFile.readFloatArray(9);
        mtx = base.Mat4.fromMat3(base.Mat3.create(rot));
        mtx[12] = origin[0];
        mtx[13] = origin[1];
        mtx[14] = origin[2];
        return mtx;
    }

    function parseFrame_() {
	var result = {
            aabbMin: base.Vec3.createVal(binaryFile.readFloat(),
                                         binaryFile.readFloat(),
                                         binaryFile.readFloat()),
            aabbMax: base.Vec3.createVal(binaryFile.readFloat(),
                                         binaryFile.readFloat(),
                                         binaryFile.readFloat()),
            origin: base.Vec3.createVal(binaryFile.readFloat(),
                                        binaryFile.readFloat(),
                                        binaryFile.readFloat()),
            radius: binaryFile.readFloat(),
            tags: [] // will be filled later
        };
        binaryFile.skip(16); // skip frame name
        return result;
    }

    function parseSurface_() {
	var surface;
	var i, count;
	var surfaceOffset = binaryFile.tell();

        binaryFile.skip(4);
	//binaryFile.skip(72);
	surface = {
            name: binaryFile.readString(64).replace(/[\0\s]*$/, ''),
            flags: binaryFile.readLong(),
	    framesCount: binaryFile.readLong(),
	    shadersCount: binaryFile.readLong(),
	    verticesCount: binaryFile.readLong(),
	    indicesCount: binaryFile.readLong(),
	    indicesOffset: binaryFile.readLong(),
	    shadersOffset: binaryFile.readLong(),
	    uvOffset: binaryFile.readLong(),
	    verticesOffset: binaryFile.readLong(),
	    endOffset: binaryFile.readLong(),
	    shaders: [],
	    vertices: [],
	    uv: [],
	    indices: []
	};

	goog.asserts.assert(surface.framesCount === header.framesCount);

	binaryFile.seek(surfaceOffset + surface.shadersOffset);
	for (i = surface.shadersCount; i > 0; --i) {
	    surface.shaders.push(parseShader_());
	}

	binaryFile.seek(surfaceOffset + surface.verticesOffset);
	for (i = surface.verticesCount * surface.framesCount; i > 0; --i) {
	    surface.vertices.push(parseVertex_());
	}

	binaryFile.seek(surfaceOffset + surface.indicesOffset);
	surface.indices = binaryFile.readLongArray(surface.indicesCount * 3);

	binaryFile.seek(surfaceOffset + surface.uvOffset);
	surface.uv = binaryFile.readFloatArray(surface.verticesCount * 2);

	binaryFile.seek(surfaceOffset + surface.endOffset);
	return surface;
    }

    function parseShader_() {
	return {
	    name: binaryFile.readString(64).replace(/[\0\s]*$/, '').replace(/\.(jpg|tga)$/, ''),
	    index: binaryFile.readLong()
	};
    }

    function parseVertex_() {
	// decoding position and normal: http://en.wikipedia.org/wiki/MD3_(file_format)#Vertex
	var x = binaryFile.readShort();
	var y = binaryFile.readShort();
	var z = binaryFile.readShort();
	var lat = binaryFile.readByte() * 2 * Math.PI / 255;
	var lng = binaryFile.readByte() * 2 * Math.PI / 255;

	return [
	    x / 64,
	    y / 64,
	    z / 64,
	    Math.cos(lng) * Math.sin(lat),
	    Math.sin(lng) * Math.cos(lat),
	    Math.cos(lat)
	];
    }

    function buildModel_() {
	var i = 0,
	    j = 0,
	    k = 0,
	    v = 0,
            materials = [],
	    surfCount = 0,
	    count = 0,
	    mesh,
	    meshes,
	    surface,
	    indicesOffset = 0,
	    verticesOffset = 0,
	    indices = [],
	    vertices = [],
	    vertex,
	    frame,
	    geometryData,
            skinNames,
            off;

	meshes = [];
	

	surfCount = surfaces.length;
	for (i = 0; i < surfCount; ++i) {
            indices = [];
            for (j = 0; j < header.framesCount; ++j) {
	        vertices[j] = [];
	    }

	    surface = surfaces[i];
	    indicesOffset = indices.length;
	    
	    count = surface.indices.length;
	    verticesOffset = vertices[0].length;
            materials = [];
	    for (j = 0; j < count; ++j) {
		indices.push(surface.indices[j] + verticesOffset);
	    }

	    for (j = 0; j < header.framesCount; ++j) {
		for (k = 0; k < surface.verticesCount; ++k) {
                    off = j * surface.verticesCount + k;
		    vertices[j].push(surface.vertices[off][0]); //x
		    vertices[j].push(surface.vertices[off][1]); //y
		    vertices[j].push(surface.vertices[off][2]); //z
		    vertices[j].push(surface.uv[2 * k]); // u
		    vertices[j].push(surface.uv[2 * k + 1]); // v
		    vertices[j].push(surface.vertices[off][3]); //nx
		    vertices[j].push(surface.vertices[off][4]); //ny
		    vertices[j].push(surface.vertices[off][5]); //nz		    
		}
	    }

	    geometryData = new base.GeometryData(new Uint16Array(indices),
						 vertices.map(function(v) {
						     return new Float32Array(v);
						 }));
            materials.push(surface.shaders[0].name); // material from md3
            for (k = 0; k < skins.length; ++k) {
                materials.push(skins[k].skin[surface.name]);
            }
            // probably bug: indicesOffset shouldn't be 0?
	    mesh = new base.Mesh(geometryData, indicesOffset, count,
			    materials, base.LightningType.LIGHT_DYNAMIC);
	    meshes.push(mesh);
	}
        
        skinNames = [base.Model.DEFAULT_SKIN].concat(skins.map(function (s) {
            return s.name;
        }));
        
	model = new base.Model(-1, meshes, header.framesCount,
			       frames, base.Model.Type.MD3, tagNames, skinNames);
    }

    for( key in skinFiles ) {
        if (skinFiles.hasOwnProperty(key)) {
            skins.push({name: key, skin: files.md3.loadSkin(skinFiles[key])});
        }
    }

    header = parseHeader_();

    binaryFile.seek(header.surfacesOffset);
    for (i = header.surfacesCount; i > 0; --i) {
	surfaces.push(parseSurface_());
    }

    binaryFile.seek(header.framesOffset);
    for (i = header.framesCount; i > 0; --i) {
	frames.push(parseFrame_());
    }

    binaryFile.seek(header.tagsOffset);
    tagNames = parseTagNames_();
    binaryFile.seek(header.tagsOffset);
    for (i = 0; i < header.framesCount; ++i) {
        for (j = 0; j < header.tagsCount; ++j) {
	    frames[i].tags.push(parseTag_());
        }
    }

    buildModel_();

    return model;
};

/**
 * @private
 * @return {Object.<string,string>}
 */
files.md3.loadSkin = function (skinDesc) {
    var i, tokens;
    var result = {};
    var lines = skinDesc.split('\r\n');
    for (i = 0; i < lines.length; ++i) {
        tokens = lines[i].split(',');
        if (tokens.length === 2) {
            result[tokens[0]] = tokens[1].replace(/\.(jpg|tga)$/, '');
        }
    }
    return result;
};
