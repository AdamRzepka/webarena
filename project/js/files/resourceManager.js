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
goog.require('goog.array');
goog.require('files.zipjs');
goog.require('files.md3');
goog.require('files.bsp');
goog.require('files.ShaderScriptLoader');

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
    // /**
    //  * @private
    //  * @type {Object.<string, string>}
    //  * Blob urls to texture image
    //  */
    // this.textures = {};
    // /**
    //  * @private
    //  * @type {Object.<string, base.ShaderScript>}
    //  */
    // this.scripts = {};
    // /**
    //  * @private
    //  * @type {Object.<string, base.Model>}
    //  */
    // this.models = {};
    // /**
    //  * @private
    //  * @type {Object.<string, string>}
    //  */
    // this.configFiles = {};
    // /**
    //  * @private
    //  * @type {base.Map}
    //  */
    // this.map = null;
    /**
     * @private
     * @type {files.ResourceManager.Archive}
     */
    this.archives = [];
    
    // this.onMd3Loaded = null;
    // this.onBspLoaded = null;
    // this.onShaderScriptsLoaded = null;
    // this.onTexturesLoaded = null;
};

/**
 * @constructor
 * @param {string} name
 * 
 */
files.ResourceManager.Archive = function (name, deferred) {
    this.name = name;
    this.scripts = {};
    this.map = null;
    this.models = {};
    this.textures = {};
    this.configs = {};
    this.state = files.ResourceManager.Archive.State.LOADING;
    this.loadingDeferred = deferred;
};

/**
 * @enum {number}
 */
files.ResourceManager.Archive.State = {
    LOADING: 0,
    LOADED: 1,
    ERROR: -1
};

/**
 * @private
 */
files.ResourceManager.prototype.logger = goog.debug.Logger.getLogger('files.ResourceManager');

// /**
//  * @public
//  * @param {string} url
//  * @return {?string} Blob url to texture image
//  */
// files.ResourceManager.prototype.getTexture = function (url) {
//     var i = 0;
//     for (i = 0; i < this.archives.length; ++i) {
//         if (this.archives[i].state === files.ResourceManager.Archive.State.LOADED
//             && url in this.archives[i].textures) {
//             return this.archives[i].textures[url];
//         }
//     }

//     this.logger.log(goog.debug.Logger.Level.SEVERE,
// 		    'Texture ' + path + ' not loaded.');
//     return null;
// };

// /**
//  * @public
//  * @param {string} url
//  * @return {?base.Model}
//  */
// files.ResourceManager.prototype.getModel = function (url) {
//     var i = 0;
//     for (i = 0; i < this.archives.length; ++i) {
//         if (this.archives[i].state === files.ResourceManager.Archive.State.LOADED
//             && url in this.archives[i].models) {
//             return this.archives[i].models[url];
//         }
//     }
//     this.logger.log(goog.debug.Logger.Level.SEVERE,
// 		    'Model ' + url + ' not loaded.');
//     return null;
// };

// /**
//  * @public
//  * @param {string} url
//  * @return {?base.ShaderScript}
//  */
// files.ResourceManager.prototype.getScript = function (url) {
//     var i = 0;
//     for (i = 0; i < this.archives.length; ++i) {
//         if (this.archives[i].state === files.ResourceManager.Archive.State.LOADED
//             && url in this.archives[i].scripts) {
//             return this.archives[i].scripts[url];
//         }
//     }

//     this.logger.log(goog.debug.Logger.Level.SEVERE,
// 		    'Script ' + url + ' not loaded.');
//     return null;
// };

// /**
//  * @public
//  * @param {string} url
//  * @return {?string}
//  */
// files.ResourceManager.prototype.getConfigFile = function (url) {
//     var i = 0;
//     for (i = 0; i < this.archives.length; ++i) {
//         if (this.archives[i].state === files.ResourceManager.Archive.State.LOADED
//             && url in this.archives[i].configs) {
//             return this.archives[i].configs[url];
//         }
//     }

//     this.logger.log(goog.debug.Logger.Level.SEVERE,
// 		    'File ' + url + ' not loaded.');
//     return null;
// };

// /**
//  * @public
//  * @return {?base.Map}
//  */
// files.ResourceManager.prototype.getMap = function () {
//     var i = 0;
//     for (i = 0; i < this.archives.length; ++i) {
//         if (this.archives[i].state === files.ResourceManager.Archive.State.LOADED
//             && this.archives[i].map) {
//             return this.archives[i].map;
//         }
//     }

//     this.logger.log(goog.debug.Logger.Level.SEVERE,
// 		    'Map not loaded.');
//     return null;
// };

/**
 * @public
 */
files.ResourceManager.prototype.releaseAll = function () {
    // TODO
};

/**
 * @public
 */
files.ResourceManager.prototype.release = function (archiveName) {
    // TODO
};


/**
 * @public
 * @param {string} archiveName
 * @returns {goog.async.Deferred}
 * @suppress {checkTypes|undefinedNames}
 */
files.ResourceManager.prototype.load = function (archiveName) {
    var that = this;
    var deferred = null;
    var archive = goog.array.find(this.archives, function (elem) {
        return elem.name === archiveName;
    });

    if (archive) {
        return archive.loadingDeferred;
    } else {
        deferred = new goog.async.Deferred();
        archive = new files.ResourceManager.Archive(archiveName, deferred);
        this.archives.push(archive);
        files.zipjs.createReader(new files.zipjs.HttpReader(this.basedir + archiveName + '.zip'),
		                 function (reader) {
			             reader.getEntries(
			                 function (entries) {
                                             var entriesDeferred = that.loadEntries(archive,
                                                                                    entries);
                                             entriesDeferred.addCallback(function () {
                                                 archive.state = files.ResourceManager.
                                                     Archive.State.LOADED;
                                                 deferred.callback(archive);
                                                 return archive;
                                             });
			                 });
		                 },
                                 function () {
                                     that.logger.log(goog.debug.Logger.Level.SEVERE,
			                             'Unable to load archive ' + archiveName);
                                     archive.state = files.ResourceManager.Archive.State.ERROR;
                                     deferred.errback(archive);
                                 });
        return deferred;
    }
};

/**
 * @private
 * @suppress {checkTypes|undefinedNames}
 */
files.ResourceManager.prototype.loadEntries = function (archive, entries) {
    var that = this;
    var i = 0;
    var entry, filename, ext;
    var deferred = goog.async.Deferred.succeed();
    var localDeferred = null;

    for (i = 0; i < entries.length; ++i) {
        entry = entries[i];
        
        filename = entry.filename;
        ext = filename.slice(filename.lastIndexOf('.') + 1);
        switch (ext) {
        case 'png': case 'jpg':
            localDeferred = this.loadTexture_(archive, entry, ext);
	    break;
        case 'shader':
            localDeferred = this.loadShaders_(archive, entry);
	    break;
        case 'md3':
            localDeferred = this.loadMd3WithSkins_(archive, entry, entries);
	    break;
        case 'bsp':
            localDeferred = this.loadBsp_(archive, entry);
        case 'skin':
            // skip; will be loaded with appropriate model
            break;
        default:
            localDeferred = this.loadConfigFile_(archive, entry);
            break;
        }
        deferred.awaitDeferred(localDeferred);
    }
    
    return deferred;
};

/**
 * @private
 * @param {string} modelPath
 * @return {goog.async.Deferred}
 */
files.ResourceManager.prototype.loadMd3WithSkins_ = function (archive, modelEntry, allEntries) {
    var modelPath = modelEntry.filename;
    var modelData, path, regexp, skins = {}, skinEntries = {};
    var i = 0;
    var deferred = new goog.async.Deferred();
    
    path = modelPath.replace('.md3', '');
    regexp = new RegExp(path + '_(.*)\\.skin');
    
    skinEntries = allEntries.filter(function (entry) {
        return regexp.test(entry.filename);
    });

    for (i = 0; i < skinEntries.length; ++i) {
        (function () {
            var entry = skinEntries[i];
            var localDeferred = new goog.async.Deferred();
            entry.getData(new files.zipjs.TextWriter(), function(text) {
                var skinName;
                skinName = regexp.exec(entry.filename)[1]; // get only skin name (eg. 'default')
                skins[skinName] = text;
                localDeferred.callback();
            });
            deferred.awaitDeferred(localDeferred);
        })();
    }

    modelEntry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
        modelData = arrayBuffer;
        deferred.callback();
    });

    // wait for all skins and ArrayBuffer with md3 file to be available
    deferred.addCallback(function () {
        archive.models[modelPath] = files.md3.load(modelData, skins);
    });
    return deferred;
};

files.ResourceManager.prototype.loadTexture_ = function (archive, entry, ext) {
    var filename = entry.filename;
    var deferred = new goog.async.Deferred();
    
    entry.getData(new files.zipjs.BlobWriter('image/' + ((ext === 'png') ? 'png' : 'jpeg')),
		  function(blob) {
                      var name = filename.replace(/\.(jpg|png)$/, '');
                      function addTexture(url) {
			  archive.textures[name] = url;
		          deferred.callback();
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
    return deferred;
};

files.ResourceManager.prototype.loadShaders_ = function (archive, entry) {
    var deferred = new goog.async.Deferred();
    var filename = entry.filename;
    
    entry.getData(new files.zipjs.TextWriter(), function(text) {
        var i = 0;
        var shaders = files.ShaderScriptLoader.load(text);
        for (i = 0; i < shaders.length; ++i) {
            archive.scripts[shaders[i].name] = shaders[i];
        }
        deferred.callback();
    });
    
    return deferred;
};

files.ResourceManager.prototype.loadBsp_ = function (archive, entry) {
    var deferred = new goog.async.Deferred();

    goog.asserts.assert(archive.map === null);
    
    entry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
	archive.map = files.bsp.load(arrayBuffer);
        deferred.callback();
    });

    return deferred;
};

files.ResourceManager.prototype.loadConfigFile_ = function (archive, entry) {
    var deferred = new goog.async.Deferred();
    var filename = entry.filename;
    
    entry.getData(new files.zipjs.TextWriter(), function(text) {
        archive.configs[filename] = text;
        deferred.callback();
    });

    return deferred;
};

