/**
 * copyright (C) 2012 Adam Rzepka
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

goog.require('goog.debug.Logger');
goog.require('goog.async.DeferredList');
goog.require('goog.async.Deferred');
goog.require('files.zipjs');
goog.require('files.md3');
goog.require('files.bsp');

goog.provide('files.ResourceManager');

/**
 * @constructor
 * Resource manager downloads, unpacks and holds game resources.
 * In future it will also hadle caching in local storage.
 */
files.ResourceManager = function() {
    /**
     * @public
     * @const
     * @type {string}
     */
    this.basedir = '/resources/';
    /**
     * @private
     * @type {Object.<string, string>}
     * Blob urls to texture image
     */
    this.textures = {};
    /**
     * @private
     * @type {Object.<string, base.ShaderScript>}
     */
    this.scripts = {};
    /**
     * @private
     * @type {Object.<string, base.Model>}
     */
    this.models = {};
    /**
     * @private
     * @type {Object.<string, string>}
     */
    this.configFiles = {};
    /**
     * @private
     * @type {base.Map}
     */
    this.map = null;

    /**
     * @private
     */
    this.zipsToLoad = 0;
    /**
     * @private
     */
    this.filesToLoad = 0;
    /**
     * @private
     */
    this.loadedCallback = null;
};

/**
 * @private
 */
files.ResourceManager.prototype.logger = goog.debug.Logger.getLogger('files.ResourceManager');

/**
 * @public
 * @param {Array.<string>} archives
 * @param {function()} callback
 */
files.ResourceManager.prototype.load = function (archives, callback) {
    var i;
    this.zipsToLoad = archives.length;
    this.filesToLoad = 0;
    this.loadedCallback = callback;
    for (i = 0; i < archives.length; ++i)
	this.loadArchive(archives[i]);
};

/**
 * @public
 * @param {string} path
 * @return {?string} Blob url to texture image
 */
files.ResourceManager.prototype.getTexture = function (path) {
    var texture = this.textures[path];
    if (texture === undefined) {
	this.logger.log(goog.debug.Logger.Level.SEVERE,
			'Texture ' + path + ' not loaded.');
	return null;
    }
    else
        return texture;
};

/**
 * @public
 * @return {Object.<string,string>}
 */
files.ResourceManager.prototype.getTextures = function () {
    return this.textures;
};

/**
 * @public
 * @param {string} path
 * @return {?base.Model}
 */
files.ResourceManager.prototype.getModel = function (path) {
    var model = this.models[path];
    if (model === undefined) {
	this.logger.log(goog.debug.Logger.Level.SEVERE,
			'Model ' + path + ' not loaded.');
	return null;
    }
    else {
        return model;
    }
};

/**
 * @public
 * @param {string} path
 * @return {?base.ShaderScript}
 */
files.ResourceManager.prototype.getScript = function (path) {
    var script = this.scripts[path];
    if (script === undefined) {
	this.logger.log(goog.debug.Logger.Level.SEVERE,
			'Script ' + path + ' not loaded.');
	return null;
    }
    else {
        return script;
    }
};

/**
 * @public
 * @return {Object.<string,base.ShaderScripts>}
 */
files.ResourceManager.prototype.getScripts = function () {
    return this.scripts;
};

/**
 * @public
 * @param {string} path
 * @return {?string}
 */
files.ResourceManager.prototype.getConfigFile = function (path) {
    var file = this.configFiles[path];
    if (file === undefined) {
	this.logger.log(goog.debug.Logger.Level.SEVERE,
			'File ' + path + ' not loaded.');
	return null;
    }
    else
        return file;
};

/**
 * @public
 * @return {?base.Map}
 */
files.ResourceManager.prototype.getMap = function () {
    if (this.map === null){
	this.logger.log(goog.debug.Logger.Level.SEVERE,
		'Map not loaded.');
	return null;
    }
    else
        return this.map;
};

/**
 * @public
 * @param {RegExp} regexp
 * @return {Object.<string, string>}
 */
files.ResourceManager.prototype.findConfigFiles = function (regexp) {
    var key, file;
    var result = {};
    for( key in this.configFiles )
    {
        if (this.configFiles.hasOwnProperty(key) && regexp.test(key)) {
            result[key] = this.configFiles[key];
        }
    }
    return result;
};

/**
 * @public
 */
files.ResourceManager.prototype.releaseAll = function () {
    // TODO
};


/**
 * @private
 */
files.ResourceManager.prototype.reportLoadedFile_ = function () {
    this.filesToLoad--;
    if (this.filesToLoad === 0 && this.zipsToLoad === 0)
	this.loadedCallback();
};

/**
 * @private
 * @suppress {checkTypes|undefinedNames}
 */
files.ResourceManager.prototype.loadArchive = function (archive) {
    var self = this;
    files.zipjs.createReader(new files.zipjs.HttpReader(this.basedir + archive + '.zip'),
		             function (reader) {
			         reader.getEntries(
			             function (entries) {
				         self.filesToLoad += entries.length;
				         self.zipsToLoad--;
                                         self.loadEntries(entries);
			             });
		             },
                            function () {
                                self.logger.log(goog.debug.Logger.Level.SEVERE,
			                        'Unable to load archive ' + archive);
                            });
};

/**
 * @private
 * @suppress {checkTypes|undefinedNames}
 */
files.ResourceManager.prototype.loadEntries = function (entries) {
    var self = this;
    var i = 0;
    var entry, filename, ext;
    var deferreds = [];

    for (i = 0; i < entries.length; ++i) {
        entry = entries[i];
        
        filename = entry.filename;
        ext = filename.slice(filename.lastIndexOf('.') + 1);
        switch (ext) {
        case 'png': case 'jpg':
	    entry.getData(new files.zipjs.BlobWriter('image/' + ((ext === 'png') ? 'png' : 'jpeg')),
		          function(blob) {
                              var name = filename.replace(/\.(jpg|png)$/, '');
                              function addTexture(url) {
			          self.textures[name] = url;
			          self.reportLoadedFile_();
                              }
                              
                              var urlCreator = ('URL' in window) ? window.URL :
                                      window.webkitURL;
                              var url = null;
                              
                              if (urlCreator) {
                                  url = urlCreator.createObjectURL(blob);
                                  addTexture(url);
                              } else if (typeof(FileReaderSync) !== 'undefined') {
                                  // falback to dataURL
			          url = (new FileReaderSync()).readAsDataURL(blob);
                                  addTexture(url);
                              } else {
                                  var reader = new FileReader();
                                  reader.readAsDataURL(blob);
                                  reader.onload = function (evt) {
                                      addTexture(evt.target.result);
                                  };
                              }
		          });
	    break;
        case 'shader':
	    entry.getData(new files.zipjs.TextWriter(), function(text) {
                if (self.scripts.hasOwnProperty(filename)) {
                    self.scripts[filename] += ('\n' + text);
                } else {
		    self.scripts[filename] = text;
                }
	        self.reportLoadedFile_();                
	    });
	    break;
        case 'md3':
	    entry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
	        self.models[filename] = files.md3.load(arrayBuffer);
	        self.reportLoadedFile_();
	    });
	    break;
        case 'bsp':
	    if (!self.map) {
   	        entry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
		    self.map = files.bsp.load(arrayBuffer);
		    self.reportLoadedFile_();
	        });
	    }
            else
	        self.reportLoadedFile();
	    break;
        case 'skin':
            // skip; will be loaded with appropriate model
            break;
        default:
            entry.getData(new files.zipjs.TextWriter(), function(text) {
                self.configFiles[filename] = text;
                self.reportLoadedFile_();
            });
            break;
        }
    }
};

/**
 * @private
 * @param {string} modelPath
 * @return {Object.<string, string>}
 */
files.ResourceManager.prototype.loadMd3WithSkins_ = function (modelEntry, allEntries) {
    var self = this;
    var modelPath = modelEntry.filename;
    var modelData, path, regexp, skins = {}, skinEntries = {};
    var i = 0;
    var deferreds = [new goog.async.Deferred()]; // first one is for modelEntry
    
    path = modelPath.replace('.md3', '');
    regexp = new RegExp(path + '_(.*)\\.skin');
    
    skinEntries = allEntries.filter(function (entry) {
        return regexp.test(entry.filename);
    });

    for (i = 0; i < skinEntries.length; ++i) {
        (function () {
            var entry = skinEntries[i];
            var deferred = new goog.async.Deferred();
            entry.getData(new files.zipjs.TextWriter(), function(text) {
                var skinName;
                skinName = regexp.exec(entry.filename)[1]; // get only skin name (eg. 'default')
                skins[skinName] = text;
                deferred.callback();
            });
            deferreds.push(deferred);
        })();
    }

    modelEntry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
        modelData = arrayBuffer;
        deferreds[0].callback();
    });

    // wait for all skins and ArrayBuffer with md3 file to be available
    goog.async.DeferredList.gatherResults(deferreds).addCallback(function () {
        self[modelPath] = files.md3.load(modelData, skins);
        self.reportLoadedFile_();
    });
};

