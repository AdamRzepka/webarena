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

 
 * This file is modified verison of q3glshader.js by Brandon Jones. Below
 * is a copyright note from the original file.

 * q3glshader.js - Transforms a parsed Q3 shader definition into a set of WebGL compatible states
 
 *
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
 **********************************************************************************
 * Modified by Adam Rzepka
 */

'use strict';

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');

goog.require('base.Mat4');
goog.provide('renderer.Material');

goog.provide('renderer.MaterialManager');

/**
 * @constructor
 * @extends {base.Material}
 */
renderer.Material = function (shader, defaultTexture, lightningType) {
    /**
     * @const
     * @type {renderer.Shader}
     */
    this.shader = shader;
    /**
     * @const
     * @type {WebGLTexture}
     */
    this.defaultTexture = defaultTexture;
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
     * @type {number}
     */
    this.blendSrc = -1;
    /**
     * @type {number}
     */
    this.blendDest = -1;
    /**
     * @type {number}
     */
    this.depthFunc = -1;
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
    this.cull = -1;
    /**
     * @type {number}
     */
    this.sort = -1;
    /**
     * @type {boolean}
     */
    this.sky = false;
    /**
     * @type {number}
     */
    this.blend = -1;
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
 * @param {WebGLRenderingContext} gl
 */
renderer.MaterialManager = function(gl) {
    /**
     * @const
     * @private
     * @type {WebGLRenderingContext}
     */
    this.gl = gl;
    /**
     * @private
     * @type {Object.<string, renderer.Shader>}
     * Cache for compiled shaders
     */
    this.shaders = {};
    /**
     * @private
     * @type {Object.<string, WebGLTexture>}
     * Cache for textures
     */
    this.textures = {};

    /**
     * @private
     * @type {Object.<string, renderer.Material>}
     * Cache for materials
     */
    this.materials = {};
    /**
     * @private
     * @type {WebGLTexture}
     */
    this.lightmap = this.createSolidTexture(gl, [255,255,255,255]);
    /**
     * @private
     * @type {WebGLTexture}
     */
    this.white = this.createSolidTexture(gl, [255, 255, 255, 255]);
    /**
     * @private
     * @type {WebGLTexture}
     */
    this.defaultTexture = this.createSolidTexture(gl, [255, 0, 0, 255]);

    /**
     * @private
     * @type {renderer.ShaderProgram}
     */
    this.defaultLightmapProgram = this.compileShaderProgram(
	renderer.MaterialManager.defaultVertexSrc,
	renderer.MaterialManager.defaultLightmapFragmentSrc);
    /**
     * @private
     * @type {renderer.ShaderProgram}
     */    
    this.defaultModelProgram = this.compileShaderProgram(
	renderer.MaterialManager.defaultVertexSrc,
	renderer.MaterialManager.defaultModelFragmentSrc);

    /**
     * @private
     * @type {renderer.Shader}
     */
    this.defaultLightmapShader = this.buildDefault(gl, base.LightningType.LIGHT_MAP);
    /**
     * @private
     * @type {renderer.Shader}
     */
    this.defaultModelShader = this.buildDefault(gl, base.LightningType.LIGHT_DYNAMIC);

};

/**
 * @private
 * @type {goog.debug.Logger}
 */
renderer.MaterialManager.prototype.logger =
    goog.debug.Logger.getLogger('renderer.MaterialManager');

/**
 * @public
 * @param {Array.<base.ShaderScript>} shaderScripts
 * @param {Object.<string, string>} images Map of image paths and blob URLs to images
 */
renderer.MaterialManager.prototype.buildShaders = function (shaderScripts, images) {
    var name;
    var shaderScript;
    var i;

    for( name in images ) {
	if (images.hasOwnProperty(name)) {
            this.textures[name] = this.loadTextureUrl(this.gl, images[name]);
	}
    }

    for (i = 0; i < shaderScripts.length; ++i) {
	shaderScript = shaderScripts[i];
	name = shaderScript.name;
	this.materials[name] = new renderer.Material(
	    this.build(this.gl, shaderScript),
	    null,
	    base.LightningType.LIGHT_CUSTOM);
    }
};

/**
 * @public
 * @param {base.Map.LightmapData} lightmapData
 */
renderer.MaterialManager.prototype.buildLightmap = function (lightmapData) {
    var gl = this.gl;
    var size = lightmapData.size;
    var lightmaps = lightmapData.lightmaps;
    gl.bindTexture(gl.TEXTURE_2D, this.lightmap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    for(var i = 0; i < lightmaps.length; ++i) {
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0, lightmaps[i].x, lightmaps[i].y,
	    lightmaps[i].width, lightmaps[i].height,
            gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(lightmaps[i].bytes)
            );
    }

    gl.generateMipmap(gl.TEXTURE_2D);
};

/**
 * @public
 * @param {string} name
 * @param {base.LightningType} lightningType
 * @return {renderer.Material}
 */
renderer.MaterialManager.prototype.getMaterial = function (name, lightningType) {
    var shader,
        shaderSrc,
        material = this.materials[name],
        defTexture,
        gl = this.gl,
        i;

    // material not defined explicitly - use default
    if (!material) {
	defTexture = this.textures[name];
	if (!defTexture) {
	    this.logger.log(goog.debug.Logger.Level.WARNING, 'Texture ' +
			    name + ' not found');
	    defTexture = this.defaultTexture;
	}
	material = new renderer.Material(
	    (lightningType == base.LightningType.LIGHT_MAP) ?
		this.defaultLightmapShader : this.defaultModelShader,
	    defTexture,
	    lightningType
	);
    }

    return /**@type{renderer.Material}*/material;
};

//
// Shader building
//
/**
 * @private
 */
renderer.MaterialManager.prototype.build = function(gl, shader) {
    var glShader = {
        cull: this.translateCull(gl, shader.cull),
        sort: shader.sort,
        sky: shader.sky,
        blend: shader.blend,
        name: shader.name,
        stages: []
    };

    for(var j = 0; j < shader.stages.length; ++j) {
        var stage = shader.stages[j];
        var glStage = stage;

        glStage.texture = null;
        glStage.blendSrc = this.translateBlend(gl, stage.blendSrc);
        glStage.blendDest = this.translateBlend(gl, stage.blendDest);
        glStage.depthFunc = this.translateDepthFunc(gl, stage.depthFunc);

//	if(glStage.shaderSrc && !glStage.program) {
            glStage.program = this.compileShaderProgram(glStage.shaderSrc.vertex,
							      glStage.shaderSrc.fragment);
	//      }

	this.setStageTexture(gl, stage);

        glShader.stages.push(glStage);
    }

    return /**@type{renderer.Shader}*/(glShader);
};

/**
 * @private
 */
renderer.MaterialManager.prototype.buildDefault = function(gl, lightningType) {
    var diffuseStage = {
        map: null,
	texture: null,
        isLightmap: (lightningType == base.LightningType.LIGHT_MAP),
        blendSrc: gl.ONE,
        blendDest: gl.ZERO,
        depthFunc: gl.LEQUAL,
        depthWrite: true,
	program: (lightningType == base.LightningType.LIGHT_MAP) ?
	    this.defaultLightmapProgram : this.defaultModelProgram
    };

    // if(surface) {
    //     this.loadTexture(gl, surface, diffuseStage);
    // } else {
    diffuseStage.texture = this.defaultTexture;
    // }

    var glShader = {
        cull: gl.FRONT,
        sort: 3,
	sky: false,
        blend: false,
	name: "__default__",
        stages: [ diffuseStage ]
    };

    return glShader;
};

/**
 * @private
 */
renderer.MaterialManager.prototype.translateDepthFunc = function(gl, depth) {
    if(!depth) { return gl.LEQUAL; }
    switch(depth.toLowerCase()) {
        case 'gequal': return gl.GEQUAL;
        case 'lequal': return gl.LEQUAL;
        case 'equal': return gl.EQUAL;
        case 'greater': return gl.GREATER;
        case 'less': return gl.LESS;
        default: return gl.LEQUAL;
    }
};

/**
 * @private
 */
renderer.MaterialManager.prototype.translateCull = function(gl, cull) {
    if(!cull) { return gl.FRONT; }
    switch(cull.toLowerCase()) {
        case 'disable':
        case 'none': return null;
        case 'front': return gl.BACK;
        case 'back':
        default: return gl.FRONT;
    }
};

/**
 * @private
 */
renderer.MaterialManager.prototype.translateBlend = function(gl, blend) {
    if(!blend) { return gl.ONE; }
    switch(blend.toUpperCase()) {
        case 'GL_ONE': return gl.ONE;
        case 'GL_ZERO': return gl.ZERO;
        case 'GL_DST_COLOR': return gl.DST_COLOR;
        case 'GL_ONE_MINUS_DST_COLOR': return gl.ONE_MINUS_DST_COLOR;
        case 'GL_SRC_ALPHA ': return gl.SRC_ALPHA;
        case 'GL_ONE_MINUS_SRC_ALPHA': return gl.ONE_MINUS_SRC_ALPHA;
        case 'GL_SRC_COLOR': return gl.SRC_COLOR;
        case 'GL_ONE_MINUS_SRC_COLOR': return gl.ONE_MINUS_SRC_COLOR;
        default: return gl.ONE;
    }
};

//
// Texture loading
//
/**
 * @private
 */
renderer.MaterialManager.prototype.setStageTexture = function(
    gl, stage) {
    var textures = this.textures;
    var texture;
    
    if(!stage.map) {
        stage.texture = this.white;
        return;
    } else if(stage.map === '$lightmap') {
        stage.texture = this.lightmap;
        return;
    } else if(stage.map === '$whiteimage') {
        stage.texture = this.white;
        return;
    }

    stage.texture = this.defaultTexture;

    if(stage.map === 'anim') {
        stage.animTexture = [];
        for(var i = 0; i < stage.animMaps.length; ++i) {
	    texture = textures[stage.animMaps[i]];
	    if (texture) {
		stage.animTexture[i] = textures[stage.animMaps[i]];
	    }
	    else {
		this.logger.log(goog.debug.Logger.Level.WARNING,
				'Texture ' + stage.animMaps[i] + ' not found');
		stage.animTexture[i] = this.defaultTexture;
	    }
            // stage.animTexture[i] = this.defaultTexture;
            // this.loadTextureUrl(gl, stage.animMaps[i], stage.clamp, function(texture) {
            //     stage.animTexture[i] = texture;
            // });
        }
        stage.animFrame = 0;
    } else {
	texture = textures[stage.map];
	if (texture) {
	    stage.texture = texture;
	    if (stage.clamp) {
		// TODO: if a texture is used both with clampmap and map, the map version
		// will not work correctly. However it's rare and hard to notice, so I ignore
		// this issue for now.
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
	    }
	}
	else {
	    this.logger.log(goog.debug.Logger.Level.WARNING,
			    'Texture ' + stage.map + ' not found');
	}
        // this.loadTextureUrl(gl, stage.map, stage.clamp, function(texture) {
        //     stage.texture = texture;
        // });
    }
};

/**
 * @private
 * @param {WebGLRenderingContext} gl
 * @param {string} url
 * @param {function(WebGLTexture)} [onload]
 */
renderer.MaterialManager.prototype.loadTextureUrl = function(gl, url, onload) {
    var image = new Image(),
        texture = gl.createTexture();

    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        // if(clamp) {
        //     gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        //     gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
        // }
        gl.generateMipmap(gl.TEXTURE_2D);
	if (onload) {
            onload(texture);
	}
    };

    image.src = url;

    // if (textureSources[url] !== undefined) {
    //     texture = gl.createTexture();
    // 	image.src = textureSources;
    // 	this.textures[url] = texture;
    // } else {
    // 	// TODO logger
    // 	console.log('Texture ', url, ' not found');
    // 	if (onload) {
    // 	    onload(texture);
    // 	}
    // }
    return texture;
};

/**
 * @private
 */
renderer.MaterialManager.prototype.createSolidTexture = function(gl, color) {
    var data = new Uint8Array(color);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
};

//
// Render state setup
//

/**
 * @public
 * @param {renderer.Shader} shader
 */
renderer.MaterialManager.prototype.setShader = function(shader) {
    var gl = this.gl;
    if(!shader) {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    } else if(shader.cull && !shader.sky) {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(shader.cull);
    } else {
        gl.disable(gl.CULL_FACE);
    }

    return true;
};

/**
 * @public
 * @param {renderer.Shader} shader
 * @param {renderer.Stage} shaderStage
 * @param {number} time
 */
renderer.MaterialManager.prototype.setShaderStage = function(shader, shaderStage, time) {
    var gl = this.gl;
    var stage = shaderStage;
    goog.asserts.assert(goog.isDefAndNotNull(stage));
    // if(!stage) {
    //     stage = this.defaultShader.stages[0];
    // }

    if(stage.animFreq) {
        // Texture animation seems like a natural place for setInterval, but that approach has proved error prone.
        // It can easily get out of sync with other effects (like rgbGen pulses and whatnot) which can give a
        // jittery or flat out wrong appearance. Doing it this way ensures all effects are synced.
        var animFrame = Math.floor(time*stage.animFreq) % stage.animTexture.length;
        stage.texture = stage.animTexture[animFrame];
    }

    gl.blendFunc(stage.blendSrc, stage.blendDest);

    if(stage.depthWrite && !shader.sky) {
        gl.depthMask(true);
    } else {
        gl.depthMask(false);
    }

    gl.depthFunc(stage.depthFunc);

    var program = stage.program;
    if(!program) {
        if(shader.model) {
            program = this.modelProgram;
        } else {
            program = this.defaultProgram;
        }
    }

    gl.useProgram(program.glProgram);

    var texture = stage.texture;
    if(!texture) { texture = this.defaultTexture; }

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(program.uniforms['texture'], 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if(program.uniforms['lightmap']) {
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(program.uniforms['lightmap'], 1);
        gl.bindTexture(gl.TEXTURE_2D, this.lightmap);
    }

    if(program.uniforms.time) {
        gl.uniform1f(program.uniforms['time'], time);
    }

    return program;
};

/**
 * @public
 * @param {WebGLTexture} texture
 * @param {renderer.ShaderProgram} program
 */
renderer.MaterialManager.prototype.bindTexture = function (texture, program) {
    var gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(program.uniforms['texture'], 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
};

//
// Shader program compilation
//

/**
 * @private
 */
renderer.MaterialManager.prototype.compileShaderProgram = function(vertexSrc, fragmentSrc) {
    var gl = this.gl;
    var vertexShader, fragmentShader, glProgram, shaderProgram;
    var i, attrib, attribs, uniform, uniforms, attribCount, uniformCount;
    
    fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSrc);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
	this.logger.log(goog.debug.Logger.Level.WARNING, 'Fragment shader compile error');
	this.logger.log(goog.debug.Logger.Level.WARNING, gl.getShaderInfoLog(fragmentShader));
	this.logger.log(goog.debug.Logger.Level.WARNING, fragmentSrc);

        gl.deleteShader(fragmentShader);
        return null;
    }

    vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSrc);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
	this.logger.log(goog.debug.Logger.Level.WARNING, 'Vertex shader compile error');
	this.logger.log(goog.debug.Logger.Level.WARNING, gl.getShaderInfoLog(vertexShader));
	this.logger.log(goog.debug.Logger.Level.WARNING, vertexSrc);
	
        gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
        return null;
    }

    glProgram = gl.createProgram();
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);

    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        gl.deleteProgram(glProgram);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
	
	this.logger.log(goog.debug.Logger.Level.WARNING, 'Shader link error');
	this.logger.log(goog.debug.Logger.Level.WARNING, fragmentSrc);
	this.logger.log(goog.debug.Logger.Level.WARNING, vertexSrc);

        return null;
    }

    attribCount = /**@type{number}*/(gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES));
    attribs = {};
    for (i = 0; i < attribCount; i++) {
        attrib = gl.getActiveAttrib(glProgram, i);
        attribs[attrib.name] = gl.getAttribLocation(glProgram, attrib.name);
    }

    uniformCount = /**@type{number}*/(gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS));
    uniforms = {};
    for (i = 0; i < uniformCount; i++) {
        uniform = gl.getActiveUniform(glProgram, i);
        uniforms[uniform.name] = gl.getUniformLocation(glProgram, uniform.name);
    }

    return new renderer.ShaderProgram(attribs, uniforms, glProgram);
};



//
// Default Shaders
//

/**
 * @private
 * @const
 * @type {string}
 */
renderer.MaterialManager.defaultVertexSrc = 
    'precision highp float;\n' +
    'attribute vec3 position; \n' +
    'attribute vec3 normal; \n' +
    'attribute vec2 texCoord; \n' +
    'attribute vec2 lightCoord; \n' +
    'attribute vec4 color; \n' +

    'varying vec2 vTexCoord; \n' +
    'varying vec2 vLightmapCoord; \n' +
    'varying vec4 vColor; \n' +

    'uniform mat4 modelViewMat; \n' +
    'uniform mat4 projectionMat; \n' +
    'void main(void) { \n' +
        'vec4 worldPosition = modelViewMat * vec4(position, 1.0); \n' +
        'vTexCoord = texCoord; \n' +
        'vColor = color; \n' +
        'vLightmapCoord = lightCoord; \n' +
        'gl_Position = projectionMat * worldPosition; \n' +
    '} \n';

/**
 * @private
 * @const
 * @type {string}
 */
renderer.MaterialManager.defaultLightmapFragmentSrc =
    'precision highp float;\n' +
    'varying vec2 vTexCoord; \n' +
    'varying vec2 vLightmapCoord; \n' +
    'uniform sampler2D texture; \n' +
    'uniform sampler2D lightmap; \n' +

    'void main(void) { \n' +
        'vec4 diffuseColor = texture2D(texture, vTexCoord); \n' +
        'vec4 lightColor = texture2D(lightmap, vLightmapCoord); \n' +
        'gl_FragColor = vec4(diffuseColor.rgb * lightColor.rgb, diffuseColor.a); \n' +
    '} \n';

/**
 * @private
 * @const
 * @type {string}
 */
renderer.MaterialManager.defaultModelFragmentSrc =
    'precision highp float;\n' +
    'varying vec2 vTexCoord; \n' +
    'varying vec4 vColor; \n' +
    'uniform sampler2D texture; \n' +

    'void main(void) { \n' +
        'vec4 diffuseColor = texture2D(texture, vTexCoord); \n' +
        'gl_FragColor = vec4(diffuseColor.rgb * vColor.rgb, diffuseColor.a); \n' +
    '} \n';
