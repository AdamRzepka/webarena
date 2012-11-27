/*
 * q3bsp_worker.js - Parses Quake 3 Maps (.bsp) for use in WebGL
 * This file is the threaded backend that does the main parsing and processing
 */

/*
 * Copyright (c) 2009 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 **********************************************************************
 * Modified by Adam Rzepka
 */

goog.require('files.binaryfile');
goog.require('base');
goog.require('base.base.vec3');
goog.require('base.mat4');
goog.require('base.Map');

goog.provide('files.files.bsp');


/** @define {number}*/
files.bsp.TESSELATION_LEVEL = 10;


files.bsp.load = function(map) {
    return files.bsp.parse_(new files.BinaryFile(map));
};

/** @private*/
// Parses the BSP file
files.bsp.parse_ = function(src) {

    var shaders, lightmapData, verts, meshVerts, faces, models, compiledMap;
    var header = files.bsp.readHeader_(src);
    
    if(header.tag != 'IBSP' && header.version != 46) { // Check for appropriate format
	return null;
    }

    // Read map entities
    // files.bsp.readEntities_(header.lumps[0], src);

    // Load visual map components
    shaders = files.bsp.readShaders_(header.lumps[1], src);
    lightmapData = files.bsp.readLightmaps_(header.lumps[14], src);
    verts = files.bsp.readVerts_(header.lumps[10], src);
    meshVerts = files.bsp.readMeshVerts_(header.lumps[11], src);
    faces = files.bsp.readFaces_(header.lumps[13], src);
    models = files.bsp.readModels_(header.lumps[7], src);

    compiledMap = files.bsp.compileMap_(verts, faces, meshVerts, lightmapData, shaders);

    return compiledMap;
    
    // Load bsp components
    // not needed for now
    // var planes = files.bsp.readPlanes_(header.lumps[2], src);
    // var nodes = files.bsp.readNodes_(header.lumps[3], src);
    // var leaves = files.bsp.readLeaves_(header.lumps[4], src);
    // var leafFaces = files.bsp.readLeafFaces_(header.lumps[5], src);
    // var leafBrushes = files.bsp.readLeafBrushes_(header.lumps[6], src);
    // var brushes = files.bsp.readBrushes_(header.lumps[8], src);
    // var brushSides = files.bsp.readBrushSides_(header.lumps[9], src);
    // var visData = files.bsp.readVisData_(header.lumps[16], src);
    // var visBuffer = visData.buffer;
    // var visSize = visData.size;
};

// Read all lump headers
/** @private*/
files.bsp.readHeader_ = function(src) {
    // Read the magic number and the version
    var header = {
        tag: src.readString(4),
        version: src.readULong(),
        lumps: []
    };

    // Read the lump headers
    for(var i = 0; i < 17; ++i) {
        var lump = {
            offset: src.readULong(),
            length: src.readULong()
        };
        header.lumps.push(lump);
    }

    return header;
};

// // Read all entity structures
// /** @private*/
// files.bsp.readEntities_ = function(lump, src) {
//     src.seek(lump.offset);
//     var entities = src.readString(lump.length);

//     var elements = {
//         targets: {}
//     };

//     entities.replace(/\{([^}]*)\}/mg, function($0, entitySrc) {
//         var entity = {
//             classname: 'unknown'
//         };
//         entitySrc.replace(/"(.+)" "(.+)"$/mg, function($0, key, value) {
//             switch(key) {
//                 case 'origin':
//                     value.replace(/(.+) (.+) (.+)/, function($0, x, y, z) {
//                         entity[key] = [
//                             parseFloat(x),
//                             parseFloat(y),
//                             parseFloat(z)
//                         ];
//                     });
//                     break;
//                 case 'angle':
//                     entity[key] = parseFloat(value);
//                     break;
//                 default:
//                     entity[key] = value;
//                     break;
//             }
//         });

//         if(entity['targetname']) {
//             elements.targets[entity['targetname']] = entity;
//         }

//         if(!elements[entity.classname]) { elements[entity.classname] = []; }
//         elements[entity.classname].push(entity);
//     });

// };

// Read all shader structures
/** @private*/
files.bsp.readShaders_ = function(lump, src) {
    var count = lump.length / 72;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        var shader = {
            shaderName: src.readString(64).replace(/[\0\s]*$/, ''),
            flags: src.readLong(),
            contents: src.readLong(),
            shader: null,
            faces: [],
            indexOffset: 0,
            elementCount: 0,
            visible: true
        };

        elements.push(shader);
    }

    return elements;
};

// Scale up an RGB color
/** @private*/
files.bsp.brightnessAdjust_ = function(color, factor) {
    var scale = 1.0, temp = 0.0;

    color[0] *= factor;
    color[1] *= factor;
    color[2] *= factor;

    if(color[0] > 255 && (temp = 255/color[0]) < scale) { scale = temp; }
    if(color[1] > 255 && (temp = 255/color[1]) < scale) { scale = temp; }
    if(color[2] > 255 && (temp = 255/color[2]) < scale) { scale = temp; }

    color[0] *= scale;
    color[1] *= scale;
    color[2] *= scale;

    return color;
};

/** @private*/
files.bsp.brightnessAdjustVertex_ = function(color, factor) {
    var scale = 1.0, temp = 0.0;

    color[0] *= factor;
    color[1] *= factor;
    color[2] *= factor;

    if(color[0] > 1 && (temp = 1/color[0]) < scale) { scale = temp; }
    if(color[1] > 1 && (temp = 1/color[1]) < scale) { scale = temp; }
    if(color[2] > 1 && (temp = 1/color[2]) < scale) { scale = temp; }

    color[0] *= scale;
    color[1] *= scale;
    color[2] *= scale;

    return color;
};

// Read all lightmaps
/** @private*/
files.bsp.readLightmaps_ = function(lump, src) {
    var lightmapSize = 128 * 128;
    var count = lump.length / (lightmapSize*3);

    var gridSize = 2;

    while(gridSize * gridSize < count) {
        gridSize *= 2;
    }

    var textureSize = gridSize * 128;

    var xOffset = 0;
    var yOffset = 0;

    var lightmaps = [];
    var rgb = [ 0, 0, 0 ];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        var elements = new Array(lightmapSize*4);

        for(var j = 0; j < lightmapSize*4; j+=4) {
            rgb[0] = src.readUByte();
            rgb[1] = src.readUByte();
            rgb[2] = src.readUByte();

            files.bsp.brightnessAdjust_(rgb, 4.0);

            elements[j] = rgb[0];
            elements[j+1] = rgb[1];
            elements[j+2] = rgb[2];
            elements[j+3] = 255;
        }

        lightmaps.push(new base.Map.Lightmap(
	    xOffset, yOffset, 128, 128,
	    new Uint8Array(elements)));

        xOffset += 128;
        if(xOffset >= textureSize) {
            yOffset += 128;
            xOffset = 0;
        }
    }

    return new base.Map.LightmapData(lightmaps, textureSize);
};

/** @private*/
files.bsp.readVerts_ = function(lump, src) {
    var count = lump.length/44;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push({
            pos: [ src.readFloat(), src.readFloat(), src.readFloat() ],
            texCoord: [ src.readFloat(), src.readFloat() ],
            lmCoord: [ src.readFloat(), src.readFloat() ],
            lmNewCoord: [ 0, 0 ],
            normal: [ src.readFloat(), src.readFloat(), src.readFloat() ],
            color: files.bsp.brightnessAdjustVertex_(files.bsp.colorToVec_(src.readULong()), 4.0)
        });
    }

    return elements;
};

/** @private*/
files.bsp.readMeshVerts_ = function(lump, src) {
    var count = lump.length/4;
    var meshVerts = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        meshVerts.push(src.readLong());
    }

    return meshVerts;
};

// Read all face structures
/** @private*/
files.bsp.readFaces_ = function(lump, src) {
    var faceCount = lump.length / 104;
    var faces = [];

    src.seek(lump.offset);
    for(var i = 0; i < faceCount; ++i) {
        var face = {
            shader: src.readLong(),
            effect: src.readLong(),
            type: src.readLong(),
            vertex: src.readLong(),
            vertCount: src.readLong(),
            meshVert: src.readLong(),
            meshVertCount: src.readLong(),
            lightmap: src.readLong(),
            lmStart: [ src.readLong(), src.readLong() ],
            lmSize: [ src.readLong(), src.readLong() ],
            lmOrigin: [ src.readFloat(), src.readFloat(), src.readFloat() ],
            lmVecs: [[ src.readFloat(), src.readFloat(), src.readFloat() ],
                    [ src.readFloat(), src.readFloat(), src.readFloat() ]],
            normal: [ src.readFloat(), src.readFloat(), src.readFloat() ],
            size: [ src.readLong(), src.readLong() ],
            indexOffset: -1
        };

        faces.push(face);
    }

    return faces;
};

// Read all Plane structures
/** @private*/
files.bsp.readPlanes_ = function(lump, src) {
    var count = lump.length / 16;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push({
            normal: [ src.readFloat(), src.readFloat(), src.readFloat() ],
            distance: src.readFloat()
        });
    }

    return elements;
};

// Read all Node structures
/** @private*/
files.bsp.readNodes_ = function(lump, src) {
    var count = lump.length / 36;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push({
            plane: src.readLong(),
            children: [ src.readLong(), src.readLong() ],
            min: [ src.readLong(), src.readLong(), src.readLong() ],
            max: [ src.readLong(), src.readLong(), src.readLong() ]
        });
    }

    return elements;
};

// Read all Leaf structures
/** @private*/
files.bsp.readLeaves_ = function(lump, src) {
    var count = lump.length / 48;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push({
            cluster: src.readLong(),
            area: src.readLong(),
            min: [ src.readLong(), src.readLong(), src.readLong() ],
            max: [ src.readLong(), src.readLong(), src.readLong() ],
            leafFace: src.readLong(),
            leafFaceCount: src.readLong(),
            leafBrush: src.readLong(),
            leafBrushCount: src.readLong()
        });
    }

    return elements;
};

// Read all Leaf Faces
/** @private*/
files.bsp.readLeafFaces_ = function(lump, src) {
    var count = lump.length / 4;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push(src.readLong());
    }

    return elements;
};

// Read all Brushes
/** @private*/
files.bsp.readBrushes_ = function(lump, src) {
    var count = lump.length / 12;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push({
            brushSide: src.readLong(),
            brushSideCount: src.readLong(),
            shader: src.readLong()
        });
    }

    return elements;
};

// Read all Leaf Brushes
/** @private*/
files.bsp.readLeafBrushes_ = function(lump, src) {
    var count = lump.length / 4;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push(src.readLong());
    }

    return elements;
};

// Read all Brush Sides
/** @private*/
files.bsp.readBrushSides_ = function(lump, src) {
    var count = lump.length / 8;
    var elements = [];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
        elements.push({
            plane: src.readLong(),
            shader: src.readLong()
        });
    }

    return elements;
};

// Read all Vis Data
/** @private*/
files.bsp.readVisData_ = function(lump, src) {
    src.seek(lump.offset);
    var vecCount = src.readLong();
    var size = src.readLong();

    var byteCount = vecCount * size;
    var elements = new Array(byteCount);

    for(var i = 0; i < byteCount; ++i) {
        elements[i] = src.readUByte();
    }

    return {
        buffer: elements,
        size: size
    };
};

/** @private*/
files.bsp.readModels_ = function(lump, src) {
    var count = lump.length / 40;
    var models = new Array(count);

    src.seek(lump.offset);
    for (var i = 0; i < count; ++i) {
	models[i] = {
	    aabbMin: {
		x: src.readFloat(),
		y: src.readFloat(),
		z: src.readFloat()
	    },
	    aabbMax: {
		x: src.readFloat(),
		y: src.readFloat(),
		z: src.readFloat()
	    },
	    faceOff: src.readLong(),
	    faceCount: src.readLong(),
	    brushOff: src.readLong(),
	    brushCount: src.readLong(),
	    meshes: []
	};
    }
    return models;
};

/** @private*/
files.bsp.colorToVec_ = function(color) {
    return[
        (color & 0xFF) / 0xFF,
        ((color & 0xFF00) >> 8) / 0xFF,
        ((color & 0xFF0000) >> 16) / 0xFF,
        1
    ];
};


//
// Compile the map into a stream of WebGL-compatible data
//

/** @private*/
files.bsp.compileMap_ = function(verts, faces, meshVerts, lightmapData, shaders) {

    // Find associated shaders for all clusters
    var i, j, k, face, shader, lightmap, vert, texSize;

    // Per-face operations
    for(i = 0; i < faces.length; ++i) {
        face = faces[i];

        if(face.type==1 || face.type==2 || face.type==3) {
            // Add face to the appropriate texture face list
            shader = shaders[face.shader];
            shader.faces.push(face);
            lightmap = lightmapData.lightmaps[face.lightmap];

            if(!lightmap) {
                lightmap = lightmapData.lightmaps[0];
            }

            if(face.type==1 || face.type==3) {
                shader.geomType = face.type;
                // Transform lightmap coords to match position in combined texture
                for(j = 0; j < face.meshVertCount; ++j) {
                    vert = verts[face.vertex + meshVerts[face.meshVert + j]];

		    texSize = lightmap.textureSize;
                    vert.lmNewCoord[0] = (vert.lmCoord[0] * lightmap.width / texSize)
			+ lightmap.x / texSize;
                    vert.lmNewCoord[1] = (vert.lmCoord[1] * lightmap.height / texSize)
			+ lightmap.y / texSize;
                }
            } else {
                // Build Bezier curve
                files.bsp.tesselate_(face, verts, meshVerts);
                for(j = 0; j < face.vertCount; ++j) {
                    vert = verts[face.vertex + j];

		    texSize = lightmap.textureSize;
                    vert.lmNewCoord[0] = (vert.lmCoord[0] * lightmap.width / texSize) + lightmap.x / texSize;
                    vert.lmNewCoord[1] = (vert.lmCoord[1] * lightmap.height / texSize) + lightmap.y / texSize;
                }
            }
        }
    }

    // Compile vert list
    var vertices = [];
    var offset = 0;
    for(i = 0; i < verts.length; ++i) {
        vert = verts[i];

        vertices[offset++] = vert.pos[0];
        vertices[offset++] = vert.pos[1];
        vertices[offset++] = vert.pos[2];

        vertices[offset++] = vert.texCoord[0];
        vertices[offset++] = vert.texCoord[1];

        vertices[offset++] = vert.lmNewCoord[0];
        vertices[offset++] = vert.lmNewCoord[1];

        vertices[offset++] = vert.normal[0];
        vertices[offset++] = vert.normal[1];
        vertices[offset++] = vert.normal[2];

        vertices[offset++] = vert.color[0];
        vertices[offset++] = vert.color[1];
        vertices[offset++] = vert.color[2];
        vertices[offset++] = vert.color[3];
    }

    // Compile index list
    var indices = [];
    var meshes = [];
    var mesh;

    for(i = 0; i <  shaders.length; ++i) {
        shader = shaders[i];
        if(shader.faces.length > 0) {
            shader.indexOffset = indices.length * 2; // Offset is in bytes

            for(j = 0; j < shader.faces.length; ++j) {
                face = shader.faces[j];
                face.indexOffset = indices.length * 2;
                for(k = 0; k < face.meshVertCount; ++k) {
                    indices.push(face.vertex + meshVerts[face.meshVert + k]);
                }
                shader.elementCount += face.meshVertCount;

            }
        }
//        shader.faces = null; // Don't need to send this to the render thread.
    }

    var geometryData = new base.GeometryData(new Uint16Array(indices),
					     [new Float32Array(vertices)]);

    for (i = 0; i < shaders.length; ++i) {
	shader = shaders[i];
	if (shader.faces.length > 0) {
	    mesh = new base.Mesh(geometryData, shader.indexOffset,
				 shader.elementCount, [new base.Material(shader.shaderName)]);
	    meshes.push(mesh);
	}
    }

    var model = new base.Model(meshes, 1, []);

    return new base.Map([model],
			lightmapData,
			geometryData);
};


/** @private*/
files.bsp.buildModels_ = function(leaves, leafFaces, faces, verts, meshVerts, models) {
    var i;

    for (i = 0; i < leaves.length; ++i) {
	// dla kazdego face'a:
	// jesli ma ten sam shader i model
	//   wrzuc verteksy do jednego mesha
    }

};

//
// Curve Tesselation
//

/** @private*/
files.bsp.getCurvePoint3_ = function(c0, c1, c2, dist) {
    var b = 1.0 - dist;

    return base.vec3.add(
        base.vec3.add(
            base.vec3.scale(c0, (b*b), [0, 0, 0]),
            base.vec3.scale(c1, (2*b*dist), [0, 0, 0])
        ),
        base.vec3.scale(c2, (dist*dist), [0, 0, 0])
    );
};

// This is kinda ugly. Clean it up at some point?
/** @private*/
files.bsp.getCurvePoint2_ = function(c0, c1, c2, dist) {
    var b = 1.0 - dist;

    var c30 = [c0[0], c0[1], 0];
    var c31 = [c1[0], c1[1], 0];
    var c32 = [c2[0], c2[1], 0];

    var res = base.vec3.add(
        base.vec3.add(
            base.vec3.scale(c30, (b*b), [0, 0, 0]),
            base.vec3.scale(c31, (2*b*dist), [0, 0, 0])
        ),
        base.vec3.scale(c32, (dist*dist), [0, 0, 0])
    );

    return [res[0], res[1]];
};

/** @private*/
files.bsp.tesselate_ = function(face, verts, meshVerts) {
    var i, j, py, px;
    var off = face.vertex;
    var count = face.vertCount;

    var level = files.bsp.TESSELATION_LEVEL;

    var L1 = level + 1;

    face.vertex = verts.length;
    face.meshVert = meshVerts.length;

    face.vertCount = 0;
    face.meshVertCount = 0;

    for(py = 0; py < face.size[1]-2; py += 2) {
        for(px = 0; px < face.size[0]-2; px += 2) {

            var rowOff = (py*face.size[0]);

            // Store control points
            var c0 = verts[off+rowOff+px], c1 = verts[off+rowOff+px+1], c2 = verts[off+rowOff+px+2];
            rowOff += face.size[0];
            var c3 = verts[off+rowOff+px], c4 = verts[off+rowOff+px+1], c5 = verts[off+rowOff+px+2];
            rowOff += face.size[0];
            var c6 = verts[off+rowOff+px], c7 = verts[off+rowOff+px+1], c8 = verts[off+rowOff+px+2];

            var indexOff = face.vertCount;
            face.vertCount += L1 * L1;

            // Tesselate!
            for(i = 0; i < L1; ++i) {
                var a = i / level;

                var pos = files.bsp.getCurvePoint3_(c0.pos, c3.pos, c6.pos, a);
                var lmCoord = files.bsp.getCurvePoint2_(c0.lmCoord, c3.lmCoord, c6.lmCoord, a);
                var texCoord = files.bsp.getCurvePoint2_(c0.texCoord, c3.texCoord, c6.texCoord, a);
                var color = files.bsp.getCurvePoint3_(c0.color, c3.color, c6.color, a);

                var vert = {
                    pos: pos,
                    texCoord: texCoord,
                    lmCoord: lmCoord,
                    color: [color[0], color[1], color[2], 1],
                    lmNewCoord: [ 0, 0 ],
                    normal: [0, 0, 1]
                };

                verts.push(vert);
            }

            for(i = 1; i < L1; i++) {
                a = i / level;

                var pc0 = files.bsp.getCurvePoint3_(c0.pos, c1.pos, c2.pos, a);
                var pc1 = files.bsp.getCurvePoint3_(c3.pos, c4.pos, c5.pos, a);
                var pc2 = files.bsp.getCurvePoint3_(c6.pos, c7.pos, c8.pos, a);

                var tc0 = files.bsp.getCurvePoint3_(c0.texCoord, c1.texCoord, c2.texCoord, a);
                var tc1 = files.bsp.getCurvePoint3_(c3.texCoord, c4.texCoord, c5.texCoord, a);
                var tc2 = files.bsp.getCurvePoint3_(c6.texCoord, c7.texCoord, c8.texCoord, a);

                var lc0 = files.bsp.getCurvePoint3_(c0.lmCoord, c1.lmCoord, c2.lmCoord, a);
                var lc1 = files.bsp.getCurvePoint3_(c3.lmCoord, c4.lmCoord, c5.lmCoord, a);
                var lc2 = files.bsp.getCurvePoint3_(c6.lmCoord, c7.lmCoord, c8.lmCoord, a);

                var cc0 = files.bsp.getCurvePoint3_(c0.color, c1.color, c2.color, a);
                var cc1 = files.bsp.getCurvePoint3_(c3.color, c4.color, c5.color, a);
                var cc2 = files.bsp.getCurvePoint3_(c6.color, c7.color, c8.color, a);

                for(j = 0; j < L1; j++)
                {
                    var b = j / level;

                    pos = files.bsp.getCurvePoint3_(pc0, pc1, pc2, b);
                    texCoord = files.bsp.getCurvePoint2_(tc0, tc1, tc2, b);
                    lmCoord = files.bsp.getCurvePoint2_(lc0, lc1, lc2, b);
                    color = files.bsp.getCurvePoint3_(cc0, cc1, cc2, a);

                    vert = {
                        pos: pos,
                        texCoord: texCoord,
                        lmCoord: lmCoord,
                        color: [color[0], color[1], color[2], 1],
                        lmNewCoord: [ 0, 0 ],
                        normal: [0, 0, 1]
                    };

                    verts.push(vert);
                }
            }

            face.meshVertCount += level * level * 6;

            for(var row = 0; row < level; ++row) {
                for(var col = 0; col < level; ++col) {
                    meshVerts.push(indexOff + (row + 1) * L1 + col);
                    meshVerts.push(indexOff + row * L1 + col);
                    meshVerts.push(indexOff + row * L1 + (col+1));

                    meshVerts.push(indexOff + (row + 1) * L1 + col);
                    meshVerts.push(indexOff + row * L1 + (col+1));
                    meshVerts.push(indexOff + (row + 1) * L1 + (col+1));
                }
            }

        }
    }
};
