goog.provide('md3');

function Md3()
{
    var self = this;

    self.mPath = null;

    self.mName = null;
    self.mFramesCount = 0;
    self.mSurfaces = null;
    self.mTags = null;
    self.mLoaded = false;

    self.renderModel = null;

    self.parseMD3 = function(binaryArray, onLoad) {
	var header = new Int32Array(binaryArray, 0, 27);

	if (header[0] != 860898377) // magic number
	{
	    alert("Incorrect MD3 file (Magic number = " + header[0] + ")");
	    return null;
	}

	var nameBytes = new Uint8Array(binaryArray, 8, 64);
	self.mName = createString(nameBytes, 0, 64);

	var surfacesCount = header[21];
	var surfacesOffset = header[25];

	self.mFramesCount = header[19];
	var tagsCount = header[20];
	var tagsOffset = header[24];

	self.mTags = self.parseTags(binaryArray, tagsOffset, tagsCount, self.mFramesCount);

	self.mSurfaces = new Array(surfacesCount);

	var readBytes = 0;
	for (var i = 0; i < surfacesCount; ++i)
	{
	    var result = self.parseSurface(binaryArray, surfacesOffset + readBytes);
	    readBytes += result.mSize;
	    self.mSurfaces[i] = result.mSurface;
	}

	self.loadSkin(self.mPath + ".skin");
    };

    self.parseTags = function(binaryArray, tagsOffset, tagsCount, framesCount) {
	var tags = new Array(tagsCount);
	for (var i = 0; i < tagsCount; ++i)
	{
	    var nameBytes = new Uint8Array(binaryArray, tagsOffset + i * 112, 64);
	    var name = createString(nameBytes, 0, 64);

	    tags[i] = { mName: name, mMatrices: new Array(framesCount) };
	    for (var j = 0; j < framesCount; ++j)
	    {
		var origin = new Float32Array(binaryArray, tagsOffset + 64 + (i + j * tagsCount) * 112, 3);
		var rotation = new Float32Array(binaryArray, tagsOffset + 76 + (i + j * tagsCount) * 112, 9);
		var mtx = mat3.toMat4(mat3.create(rotation));
		mtx[12] = origin[0];
		mtx[13] = origin[1];
		mtx[14] = origin[2];

		tags[i].mMatrices[j] = mtx;
	    }
	}

	return tags;
    };

    self.parseSurface = function(binaryArray, surfaceOffset) {
	var surfaceHeader = new Int32Array(binaryArray, surfaceOffset, 27);
	if (surfaceHeader[0] != 860898377) // magic number
	{
	    alert("Incorrect MD3 file (Magic number = " + magicNumber[0] + ")");
	    return null;
	}

	var nameBytes = new Uint8Array(binaryArray, surfaceOffset + 4, 64);
	var name = createString(nameBytes, 0, 64);

	var framesCount = surfaceHeader[18];
	if (framesCount != self.mFramesCount)
	    alert("Frames count from surface does not match global model frames count");

	var shadersCount = surfaceHeader[19];
	var verticesCount = surfaceHeader[20];
	var trianglesCount = surfaceHeader[21];

	var shadersOffset = surfaceHeader[23];
	var verticesOffset = surfaceHeader[25];
	var trianglesOffset = surfaceHeader[22];
	var texCoordOffset = surfaceHeader[24];

	var shaders = self.parseShaders(binaryArray, surfaceOffset + shadersOffset, shadersCount);
	var indices = self.parseTriangles(binaryArray, surfaceOffset + trianglesOffset,
					  trianglesCount);

	var frames = Array(self.mFramesCount);
	for (var i = 0; i < framesCount; ++i)
	{
	    frames[i] = new Object();
	    frames[i].mVertices = self.parseVertices(binaryArray, surfaceOffset
						     + verticesOffset + i * 8 * verticesCount,
						     verticesCount);
	}

	var texCoords = self.parseST(binaryArray, surfaceOffset + texCoordOffset, verticesCount);

	var surface = {
	    mName: name,
	    mShaders: shaders,
	    mIndices: indices,
	    mFrames: frames,
	    mTexCoords: texCoords
	};

	return { mSurface: surface, mSize: surfaceHeader[26]};
    };

    self.parseShaders = function(binaryArray, shadersOffset, shadersCount) {
	var asChars = new Uint8Array(binaryArray, shadersOffset, shadersCount * 68);
	var asInts = new Int32Array(binaryArray, shadersOffset, shadersCount * 17);

	var shaders = Array(shadersCount);
	for (var i = 0; i < shadersCount; ++i)
	{
	    shaders[i] = { mPath: createString(asChars, i * 68, 64), mIndex: asInts[16 + i * 68]};
	}

	return shaders;
    };

    self.parseTriangles = function(binaryArray, trianglesOffset, trianglesCount) {
	var indices = new Uint16Array(new Int32Array(binaryArray, trianglesOffset,
                                                     3 * trianglesCount));
	indices.mBuffer = gGl.createBuffer();
	gGl.bindBuffer(gGl.ELEMENT_ARRAY_BUFFER, indices.mBuffer);
	gGl.bufferData(gGl.ELEMENT_ARRAY_BUFFER, indices, gGl.STATIC_DRAW);
	gGl.bindBuffer(gGl.ELEMENT_ARRAY_BUFFER, null);
	return indices;
    };

    self.parseVertices = function(binaryArray, verticesOffset, verticesCount) {
	// These arrays are pointing to the same data. We need them both,
	// because coordinates are saved as int16, while normals are
	// stored as uint8.
	var asShort = new Int16Array(binaryArray, verticesOffset, 4 * verticesCount);
	var asByte = new Uint8Array(binaryArray, verticesOffset, 8 * verticesCount);

	var vertices = new Array(verticesCount * 6);

	for (var i = 0; i < verticesCount; ++i)
	{
	    // coordinates
	    vertices[6 * i] = asShort[4 * i] * 1.0 / 64.0;
	    vertices[6 * i + 1] = asShort[4 * i + 1] * 1.0 / 64.0;
	    vertices[6 * i + 2] = asShort[4 * i + 2] * 1.0 / 64.0;
	    // skipping next int16, which is actually normal vector

	    // normals from spherical coordinates
	    var lat = asByte[8 * i + 6] * 2.0 * Math.PI / 255.0;
	    var lng = asByte[8 * i + 7] * 2.0 * Math.PI / 255.0;
	    vertices[6 * i + 3] = Math.cos(lng) * Math.sin(lat);
	    vertices[6 * i + 4] = Math.sin(lng) * Math.cos(lat);
	    vertices[6 * i + 5] = Math.cos(lat);
	}

	vertices = new Float32Array(vertices);
	vertices.mBuffer = gGl.createBuffer();
	gGl.bindBuffer(gGl.ARRAY_BUFFER, vertices.mBuffer);
	gGl.bufferData(gGl.ARRAY_BUFFER, vertices, gGl.STATIC_DRAW);
	gGl.bindBuffer(gGl.ARRAY_BUFFER, null);

	return vertices;
    };

    self.parseST = function(binaryArray, texCoordOffset, texCoordCount) {
	var texCoords = new Float32Array(binaryArray, texCoordOffset, texCoordCount * 2);
	texCoords.mBuffer = gGl.createBuffer();
	gGl.bindBuffer(gGl.ARRAY_BUFFER, texCoords.mBuffer);
	gGl.bufferData(gGl.ARRAY_BUFFER, texCoords, gGl.STATIC_DRAW);
	gGl.bindBuffer(gGl.ARRAY_BUFFER, null);

	return texCoords;
    };

    self.loadSkin = function(path) {
	loadFile(path, true, false, self.parseSkin);
    };

    self.parseSkin = function(skinDesc) {
	var lines = skinDesc.split("\n");

	for (var i = 0; i < lines.length - 1; ++i)
	{
	    if (lines[i].length == 0)
		continue;
	    var tokens = lines[i].split(",");
	    if (tokens.length == 2 && tokens[0].length > 0 && tokens[1].length > 0)
	    {
		// changing file extension from tga to png
		var textureFile = self.mPath.slice(0, self.mPath.lastIndexOf("/")) +
		    tokens[1].slice(tokens[1].lastIndexOf("/"), -4) + "png";
		// finding surface with given name
		for (var j = 0; j < self.mSurfaces.length; ++j)
		{
		    if (self.mSurfaces[j].mName == tokens[0])
			self.loadTexture(j, textureFile);
		}
	    }
	}
    };

    self.loadTexture = function(surfaceIndex, path) {
	self.mSurfaces[surfaceIndex].mTexture = gGl.createTexture();
	var image = new Image();
	self.mSurfaces[surfaceIndex].mTexture.mImage = image;

	image.onload = function()
	{
	    var texture = self.mSurfaces[surfaceIndex].mTexture;
	    gGl.bindTexture(gGl.TEXTURE_2D, texture);
	    // gGl.pixelStorei(gGl.UNPACK_FLIP_Y_WEBGL, true);
	    gGl.texImage2D(gGl.TEXTURE_2D, 0, gGl.RGBA, gGl.RGBA, gGl.UNSIGNED_BYTE,
			   texture.mImage);
	    gGl.texParameteri(gGl.TEXTURE_2D, gGl.TEXTURE_MAG_FILTER, gGl.LINEAR);
	    gGl.texParameteri(gGl.TEXTURE_2D, gGl.TEXTURE_MIN_FILTER, gGl.LINEAR_MIPMAP_NEAREST);
	    gGl.generateMipmap(gGl.TEXTURE_2D);

	    gGl.bindTexture(gGl.TEXTURE_2D, null);

	    self.mLoaded = true;
	};

	image.src = path;
    };


    self.render = function(matrix, frame) {
	gGl.useProgram(gShaderProgram);
	var intFrame = Math.floor(frame);
	var intNextFrame = intFrame + 1;
	var interpolScale = intFrame - frame;
	if (intNextFrame == self.mFramesCount)
	{
	    intNextFrame = intFrame;
	    interpolScale = 0.0;
	}

	var mvp = mat4.create();
	mat4.multiply(gCamera.pVtx, matrix, mvp);

	for (var i = 0; i < self.mSurfaces.length; ++i)
	{
	    gGl.bindBuffer(gGl.ELEMENT_ARRAY_BUFFER, self.mSurfaces[i].mIndices.mBuffer);

	    gGl.bindBuffer(gGl.ARRAY_BUFFER,
			   self.mSurfaces[i].mFrames[intFrame].mVertices.mBuffer);
	    gGl.vertexAttribPointer(gShaderProgram.mVertexLocation, 3, gGl.FLOAT, false, 24, 0);

	    gGl.bindBuffer(gGl.ARRAY_BUFFER,
			   self.mSurfaces[i].mFrames[intNextFrame].mVertices.mBuffer);
	    gGl.vertexAttribPointer(gShaderProgram.mVertexNextLocation, 3, gGl.FLOAT, false, 24, 0);

	    gGl.bindBuffer(gGl.ARRAY_BUFFER, self.mSurfaces[i].mTexCoords.mBuffer);
	    gGl.vertexAttribPointer(gShaderProgram.mTexCoordsLocation, 2, gGl.FLOAT, false, 0, 0);

	    gGl.activeTexture(gGl.TEXTURE0);
	    gGl.bindTexture(gGl.TEXTURE_2D, self.mSurfaces[i].mTexture);
	    gGl.uniform1i(gShaderProgram.mSamlerLocation, 0);

	    gGl.uniformMatrix4fv(gShaderProgram.mMvpLocation, false, mvp);

	    gGl.drawElements(gGl.TRIANGLES, self.mSurfaces[i].mIndices.length, gGl.UNSIGNED_SHORT, 0);
	}
    };
}
