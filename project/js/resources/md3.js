goog.require('binaryFile');
goog.require('goog.asserts');

goog.provide('resources.Md3');

resources.Md3.load = function(arrayBuffer, skins) {

    var header,
	surfaces = [],
	frames = [],
	tags = [],
	model,
	vertexData,
	i = 0,
	binaryFile = new BinaryFile(arrayBuffer);

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

    function parseTag_() {
	return null;
    }

    function parseFrame_() {
	return null;
    }

    function parseSurface_() {
	var surface;
	var i, count;
	var surfaceOffset = binaryFile.tell();

	binaryFile.skip(72);
	surface = {
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
	    name: binaryFile.readString(64).replace(/[\0\s]*$/, ''),
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
	    surfCount = 0,
	    count = 0,
	    mesh,
	    surface,
	    indicesOffset = 0,
	    verticesOffset = 0,
	    indices = [],
	    vertices = [],
	    frames = [],
	    vertex,
	    frame;

	model = new Model();
	model.framesCount = header.framesCount;
	model.skinsIndices = {'__default__': 0};

	for (i = 0; i < model.framesCount; ++i) {
	    frames[i] = {vertices: []};
	}
	
	surfCount = surfaces.length;
	for (i = 0; i < surfCount; ++i) {
	    surface = surfaces[i];
	    indicesOffset = indices.length;
	    
	    count = surface.indices.length;
	    verticesOffset = frames[0].vertices.length;
	    for (j = 0; j < count; ++j) {
		indices.push(surface.indices[j] + verticesOffset);
	    }

	    v = 0;
	    for (j = 0; j < header.framesCount; ++j) {
		frame = frames[j];
		for (k = 0; k < surface.verticesCount; ++k) {
		    // TODO: get rid of lightmap coords and color
		    frame.vertices.push(surface.vertices[k][0]); //x
		    frame.vertices.push(surface.vertices[k][1]); //y
		    frame.vertices.push(surface.vertices[k][2]); //z
		    frame.vertices.push(surface.uv[2 * k]); // u
		    frame.vertices.push(surface.uv[2 * k + 1]); // v
		    frame.vertices.push(0.0); // lightmapU
		    frame.vertices.push(0.0); // lightmapV
		    frame.vertices.push(surface.vertices[k][3]); //nx
		    frame.vertices.push(surface.vertices[k][4]); //ny
		    frame.vertices.push(surface.vertices[k][5]); //nz		    
		    frame.vertices.push(1.0); //r
		    frame.vertices.push(1.0); //g
		    frame.vertices.push(1.0); //b
		    frame.vertices.push(1.0); //a
		}
	    }
	    
	    mesh = new Mesh();
	    mesh.lightningType = LightningType.LIGHT_DYNAMIC;
	    mesh.elementsArrayId = 0;
	    mesh.elementsOffset = indicesOffset;
	    mesh.elementsCount = surface.indices.length;
	    
	    for (j = 0; j < header.framesCount; ++j) {
		mesh.frames[j] = {arrayBufferId: j};
	    }
	    
	    mesh.materials[0].shaderName = surface.shaders[0].name;
	    model.meshes.push(mesh);
	}

	for (i = 0; i < frames.length; ++i) {
	    frames[i].vertices = new Float32Array(frames[i].vertices);
	}

	vertexData = {
	    indices: new Uint16Array(indices),
	    frames: frames
	};
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
    for (i = header.tagsCount; i > 0; --i) {
	frames.push(parseTag_());
    }

    buildModel_();

    return {
	model: model,
	vertexData: vertexData
    };
};
