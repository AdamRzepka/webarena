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
goog.require('files.zipjs');

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
    this.basedir = '/resources/';//(COMPILED ? '../resources/' : '/resources/');
    /**
     * @private
     * @type {Object.<string, string>}
     * Blob urls to texture image
     */
    this.textures = {};
    /**
     * @private
     * @type {Object.<string, string>}
     */
    this.scripts = {};
    /**
     * @private
     * @type {Object.<string, ArrayBuffer>}
     */
    this.models = {};
    /**
     * @private
     * @type {Object.<string, string>}
     */
    this.configFiles = {};
    /**
     * @private
     * @type {ArrayBuffer}
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
 * @return {?ArrayBuffer}
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
 * @return {?string}
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
 * @return {Object.<string,string>}
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
 * @return {?ArrayBuffer}
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
 */
files.ResourceManager.prototype.releaseAll = function () {
    // TODO
};


/**
 * @private
 */
files.ResourceManager.prototype.reportLoadedFile = function () {
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
				 for (var i = 0; i < entries.length; ++i) {
				     self.loadEntry(entries[i]);
				 }
			     });
		     });
};

/**
 * @private
 * @suppress {checkTypes|undefinedNames}
 */
files.ResourceManager.prototype.loadEntry = function (entry) {
    var self = this;
    var filename = entry.filename;
    var ext = filename.slice(filename.lastIndexOf('.') + 1);
    switch (ext) {
    case 'png': case 'jpg':
	entry.getData(new files.zipjs.BlobWriter('image/' + ((ext === 'png') ? 'png' : 'jpeg')),
		      function(blob) {
                          // var url = ('URL' in window) ? window.URL.createObjectURL(blob) :
                          //     window.webkitURL.createObjectURL(blob);
			   // @todo there must be better way than data URL
                          if (typeof(FileReaderSync) !== 'undefined') {
			      var url = (new FileReaderSync()).readAsDataURL(blob);
			      self.textures[filename.replace(/\.(jpg|png)$/, '')] = url;
			      self.reportLoadedFile();
                          } else {
                              var reader = new FileReader();
                              reader.readAsDataURL(blob);
                              reader.onload = function (evt) {
			          self.textures[filename.replace(/\.(jpg|png)$/, '')] =
                                      evt.target.result;
			          self.reportLoadedFile();   
                              };
                          }
		      });
	break;
    case 'shader':
	entry.getData(new files.zipjs.TextWriter(), function(text) {
			  self.scripts[filename] = text;
			  self.reportLoadedFile();
		      });
	break;
    case 'md3':
	entry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
			  self.models[filename] = arrayBuffer;
			  self.reportLoadedFile();
		      });
	break;
    case 'bsp':
	if (!self.map) {
   	    entry.getData(new files.zipjs.ArrayBufferWriter(), function(arrayBuffer) {
			      self.map = arrayBuffer;
			      self.reportLoadedFile();
			  });
	}
        else
	    self.reportLoadedFile();
	break;
    default:
        entry.getData(new files.zipjs.TextWriter(), function(text) {
                          self.configFiles[filename] = text;
                          self.reportLoadedFile();
                      });
        break;
    }
};

