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

 
 * This file is modified verison of q3shader.js by Brandon Jones. Below
 * is a copyright note from the original file.
 *

 * q3shader.js - Parses Quake 3 shader files (.shader)

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

"use strict";

goog.require('base.ShaderScript');
goog.provide('files.ShaderScriptLoader');

//
// Shader Loading
//

/**
 * @public
 * @param {string} src
 * @return {Array.<base.ShaderScript>}
 */
files.ShaderScriptLoader.load = function(src) {
    var shaderScripts = [],
	shaders = [],
	shader,
	tokens = new files.ShaderScriptTokenizer(src),
	name,
	i;

    // Parse a shader
    while(!tokens.EOF()) {
        name = tokens.next();
        shader = files.ShaderScriptLoader.parseShader(name, tokens);
        if(shader) {
            shaderScripts.push(shader);
        }
    }
    return shaderScripts;
};

/**
 * @private
 */
files.ShaderScriptLoader.parseShader = function(name, tokens) {
    var brace = tokens.next(),
	shader;
    if(brace !== '{') {
        return null;
    }

    shader = {
	name: name,
	isDefault: false,
        cull: 'back',
        sky: false,
        blend: false,
        opaque: false,
        sort: 0,
        vertexDeforms: [],
        stages: []
    };

    // Parse a shader
    while(!tokens.EOF()) {
        var token = tokens.next().toLowerCase();
        if(token == '}') { break; }

        switch (token) {
            case '{': {
                var stage = files.ShaderScriptLoader.parseStage(shader, tokens);

                // I really really really don't like doing files.ShaderScriptLoader, which basically just forces lightmaps to use the 'filter' blendmode
                // but if I don't a lot of textures end up looking too bright. I'm sure I'm jsut missing something, and files.ShaderScriptLoader shouldn't
                // be needed.
                if(stage.isLightmap && (stage.hasBlendFunc)) {
                    stage.blendSrc = 'GL_DST_COLOR';
                    stage.blendDest = 'GL_ZERO';
                }

                // I'm having a ton of trouble getting lightingSpecular to work properly,
                // so files.ShaderScriptLoader little hack gets it looking right till I can figure out the problem
                if(stage.alphaGen == 'lightingspecular') {
                    stage.blendSrc = 'GL_ONE';
                    stage.blendDest = 'GL_ZERO';
                    stage.hasBlendFunc = false;
                    stage.depthWrite = true;
                    shader.stages = [];
                }

                if(stage.hasBlendFunc) { shader.blend = true; } else { shader.opaque = true; }

                shader.stages.push(stage);
            } break;

            case 'cull':
                shader.cull = tokens.next();
                break;

            case 'deformvertexes':
                var deform = {
                    type: tokens.next().toLowerCase()
                };

                switch(deform.type) {
                    case 'wave':
                        deform.spread = 1.0 / parseFloat(tokens.next());
                        deform.waveform = files.ShaderScriptLoader.parseWaveform(tokens);
                        break;
                    default: deform = null; break;
                }

                if(deform) { shader.vertexDeforms.push(deform); }
                break;

            case 'sort':
                var sort = tokens.next().toLowerCase();
                switch(sort) {
                    case 'portal': shader.sort = 1; break;
                    case 'sky': shader.sort = 2; break;
                    case 'opaque': shader.sort = 3; break;
                    case 'banner': shader.sort = 6; break;
                    case 'underwater': shader.sort = 8; break;
                    case 'additive': shader.sort = 9; break;
                    case 'nearest': shader.sort = 16; break;
                    default: shader.sort = parseInt(sort, 10); break;
                };
                break;

            case 'surfaceparm':
                var param = tokens.next().toLowerCase();

                switch(param) {
                    case 'sky':
                        shader.sky = true;
                        break;
                    default: break;
                }
                break;

            default: break;
        }
    }

    if(!shader.sort) {
        shader.sort = (shader.opaque ? 3 : 9);
    }

    return /**@type {base.ShaderScript}*/(shader);
};

/**
 * @private
 */
files.ShaderScriptLoader.parseStage = function(shader, tokens) {
    var stage = {
        map: null,
        clamp: false,
        tcGen: 'base',
        rgbGen: 'identity',
        rgbWaveform: null,
        alphaGen: '1.0',
        alphaFunc: null,
        alphaWaveform: null,
        blendSrc: 'GL_ONE',
        blendDest: 'GL_ZERO',
        hasBlendFunc: false,
        tcMods: [],
        animMaps: [],
        animFreq: 0,
        depthFunc: 'lequal',
        depthWrite: true,
	isLightmap: false,
	shaderSrc: null
    };

    // Parse a shader
    while(!tokens.EOF()) {
        var token = tokens.next();
        if(token === '}') { break; }

        switch(token.toLowerCase()) {
            case 'clampmap':
                stage.clamp = true;
            case 'map':
                stage.map = tokens.next().replace(/(\.jpg|\.tga)/, '');
                break;

            case 'animmap':
                stage.map = 'anim';
                stage.animFreq = parseFloat(tokens.next());
                var nextMap = tokens.next();
                while(nextMap.match(/(\.jpg|\.tga)/)) {
                    stage.animMaps.push(nextMap.replace(/(\.jpg|\.tga)/, ''));
                    nextMap = tokens.next();
                }
                tokens.prev();
                break;

            case 'rgbgen':
                stage.rgbGen = tokens.next().toLowerCase();;
                switch(stage.rgbGen) {
                    case 'wave':
                        stage.rgbWaveform = files.ShaderScriptLoader.parseWaveform(tokens);
                        if(!stage.rgbWaveform) { stage.rgbGen = 'identity'; }
                        break;
                };
                break;

            case 'alphagen':
                stage.alphaGen = tokens.next().toLowerCase();
                switch(stage.alphaGen) {
                    case 'wave':
                        stage.alphaWaveform = files.ShaderScriptLoader.parseWaveform(tokens);
                        if(!stage.alphaWaveform) { stage.alphaGen = '1.0'; }
                        break;
                    default: break;
                };
                break;

            case 'alphafunc':
                stage.alphaFunc = tokens.next().toUpperCase();
                break;

            case 'blendfunc':
                stage.blendSrc = tokens.next();
                stage.hasBlendFunc = true;
                if(!stage.depthWriteOverride) {
                    stage.depthWrite = false;
                }
                switch(stage.blendSrc) {
                    case 'add':
                        stage.blendSrc = 'GL_ONE';
                        stage.blendDest = 'GL_ONE';
                        break;

                    case 'blend':
                        stage.blendSrc = 'GL_SRC_ALPHA';
                        stage.blendDest = 'GL_ONE_MINUS_SRC_ALPHA';
                        break;

                    case 'filter':
                        stage.blendSrc = 'GL_DST_COLOR';
                        stage.blendDest = 'GL_ZERO';
                        break;

                    default:
                        stage.blendDest = tokens.next();
                        break;
                }
                break;

            case 'depthfunc':
                stage.depthFunc = tokens.next().toLowerCase();
                break;

            case 'depthwrite':
                stage.depthWrite = true;
                stage.depthWriteOverride = true;
                break;

            case 'tcmod':
                var tcMod = {
                    type: tokens.next().toLowerCase()
                };
                switch(tcMod.type) {
                    case 'rotate':
                        tcMod.angle = parseFloat(tokens.next()) * (3.1415/180);
                        break;
                    case 'scale':
                        tcMod.scaleX = parseFloat(tokens.next());
                        tcMod.scaleY = parseFloat(tokens.next());
                        break;
                    case 'scroll':
                        tcMod.sSpeed = parseFloat(tokens.next());
                        tcMod.tSpeed = parseFloat(tokens.next());
                        break;
                    case 'stretch':
                        tcMod.waveform = files.ShaderScriptLoader.parseWaveform(tokens);
                        if(!tcMod.waveform) { tcMod.type = null; }
                        break;
                    case 'turb':
                        tcMod.turbulance = {
                            base: parseFloat(tokens.next()),
                            amp: parseFloat(tokens.next()),
                            phase: parseFloat(tokens.next()),
                            freq: parseFloat(tokens.next())
                        };
                        break;
                    default: tcMod.type = null; break;
                }
                if(tcMod.type) {
                    stage.tcMods.push(tcMod);
                }
                break;
            case 'tcgen':
                stage.tcGen = tokens.next();
                break;
            default: break;
        }
    }

    if(stage.blendSrc == 'GL_ONE' && stage.blendDest == 'GL_ZERO') {
        stage.hasBlendFunc = false;
        stage.depthWrite = true;
    }

    stage.isLightmap = stage.map == '$lightmap';
    stage.shaderSrc = files.ShaderScriptLoader.buildShaderSource(shader, stage);

    return /**@type {base.ShaderScriptStage}*/(stage);
};

/**
 * @private
 */
files.ShaderScriptLoader.parseWaveform = function(tokens) {
    return {
        funcName: tokens.next().toLowerCase(),
        base: parseFloat(tokens.next()),
        amp: parseFloat(tokens.next()),
        phase: parseFloat(tokens.next()),
        freq: parseFloat(tokens.next())
    };
};

//
// WebGL Shader creation
//

// files.ShaderScriptLoader whole section is a bit ugly, but it gets the job done. The job, in files.ShaderScriptLoader case, is translating
// Quake 3 shaders into GLSL shader programs. We should probably be doing a bit more normalization here.

/**
 * @private
 */
files.ShaderScriptLoader.buildShaderSource = function(shader, stage) {
    return {
        vertex: files.ShaderScriptLoader.buildVertexShader(shader, stage),
        fragment: files.ShaderScriptLoader.buildFragmentShader(shader, stage)
    };
};

/**
 * @private
 */
files.ShaderScriptLoader.buildVertexShader = function(stageShader, stage) {
    var shader = new files.ShaderBuilder();
    var i;

    if (goog.DEBUG) {
	shader.addLines(['// source material: ' + stageShader.name]);
    }
    
    shader.addAttribs({
        'position': 'vec3',
        'normal': 'vec3',
        'color': 'vec4'
    });

    shader.addVaryings({
        'vTexCoord': 'vec2',
        'vColor': 'vec4'
    });

    shader.addUniforms({
        'mvpMat': 'mat4',
        'time': 'float'
    });

    if(stage.isLightmap) {
        shader.addAttribs({ 'lightCoord': 'vec2' });
    } else {
        shader.addAttribs({ 'texCoord': 'vec2' });
    }

    shader.addLines(['vec3 defPosition = position;']);

    for(i = 0; i < stageShader.vertexDeforms.length; ++i) {
        var deform = stageShader.vertexDeforms[i];

        switch(deform.type) {
            case 'wave':
                var name = 'deform' + i;
                var offName = 'deformOff' + i;

                shader.addLines([
                    'float ' + offName + ' = (position.x + position.y + position.z) * ' + deform.spread.toFixed(4) + ';'
                ]);

                var phase = deform.waveform.phase;
                deform.waveform.phase = phase.toFixed(4) + ' + ' + offName;
                shader.addWaveform(name, deform.waveform);
                deform.waveform.phase = phase;

                shader.addLines([
                    'defPosition += normal * ' + name + ';'
                ]);
                break;
            default: break;
        }
    }

//    shader.addLines(['vec4 worldPosition = mvpMat * vec4(defPosition, 1.0);']);
    shader.addLines(['vColor = color;']);

    if(stage.tcGen == 'environment') {
        // shader.addLines([
        //     'vec3 viewer = normalize(-worldPosition.xyz);',
        //     'float d = dot(normal, viewer);',
        //     'vec3 reflected = normal*2.0*d - viewer;',
        //     'vTexCoord = vec2(0.5, 0.5) + reflected.xy * 0.5;'
        // ]);
        // @todo
        shader.addLines([
            'vTexCoord = vec2(0.5, 0.5);'
        ]);
    } else {
        // Standard texturing
        if(stage.isLightmap) {
            shader.addLines(['vTexCoord = lightCoord;']);
        } else {
            shader.addLines(['vTexCoord = texCoord;']);
        }
    }

    // tcMods
    for(i = 0; i < stage.tcMods.length; ++i) {
        var tcMod = stage.tcMods[i];
        switch(tcMod.type) {
            case 'rotate':
                shader.addLines([
                    'float r = ' + tcMod.angle.toFixed(4) + ' * time;',
                    'vTexCoord -= vec2(0.5, 0.5);',
                    'vTexCoord = vec2(vTexCoord.s * cos(r) - vTexCoord.t * sin(r), vTexCoord.t * cos(r) + vTexCoord.s * sin(r));',
                    'vTexCoord += vec2(0.5, 0.5);'
                ]);
                break;
            case 'scroll':
                shader.addLines([
                    'vTexCoord += vec2(' + tcMod.sSpeed.toFixed(4) + ' * time, ' + tcMod.tSpeed.toFixed(4) + ' * time);'
                ]);
                break;
            case 'scale':
                shader.addLines([
                    'vTexCoord *= vec2(' + tcMod.scaleX.toFixed(4) + ', ' + tcMod.scaleY.toFixed(4) + ');'
                ]);
                break;
            case 'stretch':
                shader.addWaveform('stretchWave', tcMod.waveform);
                shader.addLines([
                    'stretchWave = 1.0 / stretchWave;',
                    'vTexCoord *= stretchWave;',
                    'vTexCoord += vec2(0.5 - (0.5 * stretchWave), 0.5 - (0.5 * stretchWave));'
                ]);
                break;
            case 'turb':
                var tName = 'turbTime' + i;
                shader.addLines([
                    'float ' + tName + ' = ' + tcMod.turbulance.phase.toFixed(4) + ' + time * ' + tcMod.turbulance.freq.toFixed(4) + ';',
                    'vTexCoord.s += sin( ( ( position.x + position.z )* 1.0/128.0 * 0.125 + ' + tName + ' ) * 6.283) * ' + tcMod.turbulance.amp.toFixed(4) + ';',
                    'vTexCoord.t += sin( ( position.y * 1.0/128.0 * 0.125 + ' + tName + ' ) * 6.283) * ' + tcMod.turbulance.amp.toFixed(4) + ';'
                ]);
                break;
            default: break;
        }
    }

    switch(stage.alphaGen) {
        case 'lightingspecular':
            shader.addAttribs({ 'lightCoord': 'vec2' });
            shader.addVaryings({ 'vLightCoord': 'vec2' });
            shader.addLines([ 'vLightCoord = lightCoord;' ]);
            break;
        default:
            break;
    }

    shader.addLines(['gl_Position = mvpMat * vec4(defPosition, 1.0);']);

    return shader.getSource();

};

/**
 * @private
 */
files.ShaderScriptLoader.buildFragmentShader = function(stageShader, stage) {
    var shader = new files.ShaderBuilder();

    if (goog.DEBUG) {
	shader.addLines(['// source material: ' + stageShader.name]);
    }
    
    shader.addVaryings({
        'vTexCoord': 'vec2',
        'vColor': 'vec4'
    });

    shader.addUniforms({
        'texture': 'sampler2D',
        'time': 'float'
    });

    shader.addLines(['vec4 texColor = texture2D(texture, vTexCoord.st);']);

    switch(stage.rgbGen) {
        case 'vertex':
            shader.addLines(['vec3 rgb = texColor.rgb * vColor.rgb;']);
            break;
        case 'wave':
            shader.addWaveform('rgbWave', stage.rgbWaveform);
            shader.addLines(['vec3 rgb = texColor.rgb * rgbWave;']);
            break;
        default:
            shader.addLines(['vec3 rgb = texColor.rgb;']);
            break;
    }

    switch(stage.alphaGen) {
        case 'wave':
            shader.addWaveform('alpha', stage.alphaWaveform);
            break;
        case 'lightingspecular':
            // For now files.ShaderScriptLoader is VERY special cased. May not work well with all instances of lightingSpecular
            shader.addUniforms({
                'lightmap': 'sampler2D'
            });
            shader.addVaryings({
                'vLightCoord': 'vec2',
                'vLight': 'float'
            });
            shader.addLines([
                'vec4 light = texture2D(lightmap, vLightCoord.st);',
                'rgb *= light.rgb;',
                'rgb += light.rgb * texColor.a * 0.6;', // files.ShaderScriptLoader was giving me problems, so I'm ignorning an actual specular calculation for now
                'float alpha = 1.0;'
            ]);
            break;
        default:
            shader.addLines(['float alpha = texColor.a;']);
            break;
    }

    if(stage.alphaFunc) {
        switch(stage.alphaFunc) {
            case 'GT0':
                shader.addLines([
                    'if(alpha == 0.0) { discard; }'
                ]);
                break;
            case 'LT128':
                shader.addLines([
                    'if(alpha >= 0.5) { discard; }'
                ]);
                break;
            case 'GE128':
                shader.addLines([
                    'if(alpha < 0.5) { discard; }'
                ]);
                break;
            default:
                break;
        }
    }

    shader.addLines(['gl_FragColor = vec4(rgb, alpha);']);

    return shader.getSource();
};


//
// Shader Tokenizer
//
/**
 * @private
 * @constructor
 */
files.ShaderScriptTokenizer = function (src) {
    // Strip out comments
    src = src.replace(/\/\/.*$/mg, ''); // C++ style (//...)
    src = src.replace(/\/\*[^*\/]*\*\//mg, ''); // C style (/*...*/) (Do the shaders even use these?)
    this.tokens = src.match(/[^\s\n\r\"]+/mg);

    this.offset = 0;
};

/**
 * @private
 */
files.ShaderScriptTokenizer.prototype.EOF = function() {
    if(this.tokens === null) { return true; }
    var token = this.tokens[this.offset];
    while(token === '' && this.offset < this.tokens.length) {
        this.offset++;
        token = this.tokens[this.offset];
    }
    return this.offset >= this.tokens.length;
};

/**
 * @private
 */
files.ShaderScriptTokenizer.prototype.next = function() {
    if(this.tokens === null) { return null; }
    var token = '';
    while(token === '' && this.offset < this.tokens.length) {
        token = this.tokens[this.offset++];
    }
    return token;
};

/**
 * @private
 */
files.ShaderScriptTokenizer.prototype.prev = function() {
    if(this.tokens === null) { return null; }
    var token = '';
    while(token === '' && this.offset >= 0) {
        token = this.tokens[this.offset--];
    }
    return token;
};


//
// WebGL Shader builder utility
//

/**
 * @private
 * @constructor
 */
files.ShaderBuilder = function () {
    this.attrib = {};
    this.varying = {};
    this.uniform = {};

    this.functions = {};

    this.statements = [];
};

/**
 * @private
 */
files.ShaderBuilder.prototype.addAttribs = function(attribs) {
    for (var name in attribs) {
        this.attrib[name] = 'attribute ' + attribs[name] + ' ' + name + ';';
    }
};

/**
 * @private
 */
files.ShaderBuilder.prototype.addVaryings = function(varyings) {
    for (var name in varyings) {
        this.varying[name] = 'varying ' + varyings[name] + ' ' + name + ';';
    }
};

/**
 * @private
 */
files.ShaderBuilder.prototype.addUniforms = function(uniforms) {
    for (var name in uniforms) {
        this.uniform[name] = 'uniform ' + uniforms[name] + ' ' + name + ';';
    }
};

/**
 * @private
 */
files.ShaderBuilder.prototype.addFunction = function(name, lines) {
    this.functions[name] = lines.join('\n');
};

files.ShaderBuilder.prototype.addLines = function(statements) {
    for(var i = 0; i < statements.length; ++i) {
        this.statements.push(statements[i]);
    }
};

/**
 * @private
 */
files.ShaderBuilder.prototype.getSource = function() {
    var src = '\
#ifdef GL_ES \n\
precision highp float; \n\
#endif \n';
    var i;

    for(i in this.attrib) {
        src += this.attrib[i] + '\n';
    }

    for(i in this.varying) {
        src += this.varying[i] + '\n';
    }

    for(i in this.uniform) {
        src += this.uniform[i] + '\n';
    }

    for(i in this.functions) {
        src += this.functions[i] + '\n';
    }

    src += 'void main(void) {\n\t';
    src += this.statements.join('\n\t');
    src += '\n}\n';

    return src;
};

// q3-centric functions
/**
 * @private
 * @param {string} name
 * @param {*} [wf]
 * @param {string} [timeVar]
 */
files.ShaderBuilder.prototype.addWaveform = function(name, wf, timeVar) {
    if(!wf) {
        this.statements.push('float ' + name + ' = 0.0;');
        return;
    }

    if(!timeVar) { timeVar = 'time'; }

    if(typeof(wf.phase) == "number") {
        wf.phase = wf.phase.toFixed(4);
    }

    var funcName = '';
    switch(wf.funcName) {
        case 'sin':
            this.statements.push('float ' + name + ' = ' + wf.base.toFixed(4) + ' + sin((' + wf.phase + ' + ' + timeVar + ' * ' + wf.freq.toFixed(4) + ') * 6.283) * ' + wf.amp.toFixed(4) + ';');
            return;
        case 'square': funcName = 'square'; this.addSquareFunc(); break;
        case 'triangle': funcName = 'triangle'; this.addTriangleFunc(); break;
        case 'sawtooth': funcName = 'fract'; break;
        case 'inversesawtooth': funcName = '1.0 - fract'; break;
        default:
            this.statements.push('float ' + name + ' = 0.0;');
            return;
    }
    this.statements.push('float ' + name + ' = ' + wf.base.toFixed(4) + ' + ' + funcName + '(' + wf.phase + ' + ' + timeVar + ' * ' + wf.freq.toFixed(4) + ') * ' + wf.amp.toFixed(4) + ';');
};

/**
 * @private
 */
files.ShaderBuilder.prototype.addSquareFunc = function() {
    this.addFunction('square', [
        'float square(float val) {',
        '   return (mod(floor(val*2.0)+1.0, 2.0) * 2.0) - 1.0;',
        '}'
    ]);
};

/**
 * @private
 */
files.ShaderBuilder.prototype.addTriangleFunc = function() {
    this.addFunction('triangle', [
        'float triangle(float val) {',
        '   return abs(2.0 * fract(val) - 1.0);',
        '}'
    ]);
};

