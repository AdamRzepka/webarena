'use strict';

goog.require('goog.debug.Logger');
goog.require('zip.js');

goog.provide('resources');

resources.ResourceManager = function() {
    this.basedir = 'resources/';
    this.textures = {};
    this.scripts = {};
    this.models = {};
    this.configFiles = {};
    this.map = null;

    this.zipsToLoad = 0;
    this.filesToLoad = 0;
    this.loadedCallback = null;
};

resources.ResourceManager.prototype.load = function (archives, callback) {
    var i;
    this.zipsToLoad = archives.length;
    this.filesToLoad = 0;
    this.loadedCallback = callback;
    for (i = 0; i < archives.length; ++i)
	this.loadArchive(archives[i]);
};

resources.ResourceManager.prototype.getTexture = function (path) {
    var texture = this.textures[path];
    if (texture === undefined)
        throw 'Texture ' + path + ' not loaded.';
    else
        return texture;
};

resources.ResourceManager.prototype.getModel = function (path) {
    var model = this.models[path];
    if (model === undefined)
        throw 'Model ' + path + ' not loaded.';
    else
        return model;
};

resources.ResourceManager.prototype.getScript = function (path) {
    var script = this.scripts[path];
    if (script === undefined)
        throw 'Script ' + path + ' not loaded.';
    else
        return script;
};

resources.ResourceManager.prototype.getConfigFile = function (path) {
    var file = this.configFiles[path];
    if (file === undefined)
        throw 'File ' + path + ' not loaded.';
    else
        return file;
};

resources.ResourceManager.prototype.getMap = function () {
    if (this.map === null)
        throw 'Map not loaded.';
    else
        return this.map;
};

resources.ResourceManager.prototype.releaseAll = function () {
    // TODO
};


resources.ResourceManager.prototype.reportLoadedFile = function () {
    this.filesToLoad--;
    if (this.filesToLoad === 0 && this.zipsToLoad === 0)
	this.loadedCallback();
};

resources.ResourceManager.prototype.loadArchive = function (archive) {
    var self = this;
    zip.createReader(new zip.HttpReader(this.basedir + archive + '.zip'),
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

resources.ResourceManager.prototype.loadEntry = function (entry) {
    var self = this;
    var filename = entry.filename;
    var ext = filename.slice(filename.lastIndexOf('.') + 1);
    switch (ext) {
    case 'png': case 'jpg':
	entry.getData(new zip.BlobWriter('image/' + ((ext === 'png') ? 'png' : 'jpeg')),
		      function(blob) {
                          var url = ('URL' in window) ? window.URL.createObjectURL(blob) :
                              window.webkitURL.createObjectURL(blob);
			  self.textures[filename.replace(/\.(jpg|png)$/, '')] = url;
			  self.reportLoadedFile();
		      });
	break;
    case 'shader':
	entry.getData(new zip.TextWriter(), function(text) {
			  self.scripts[filename] = text;
			  self.reportLoadedFile();
		      });
	break;
    case 'md3':
	entry.getData(new zip.ArrayBufferWriter(), function(arrayBuffer) {
			  self.models[filename] = arrayBuffer;
			  self.reportLoadedFile();
		      });
	break;
    case 'bsp':
	if (!self.map) {
   	    entry.getData(new zip.ArrayBufferWriter(), function(arrayBuffer) {
			      self.map = arrayBuffer;
			      self.reportLoadedFile();
			  });
	}
        else
	    self.reportLoadedFile();
	break;
    default:
        entry.getData(new zip.TextWriter(), function(text) {
                          self.configFiles[filename] = text;
                          self.reportLoadedFile();
                      });
        break;
    }
};

