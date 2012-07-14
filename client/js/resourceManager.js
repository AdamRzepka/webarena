function ResourceManager() {
    this.basedir = 'resources/';
    this.textures = [];
    this.scripts = [];
    this.models = [];
    this.players = [];
    this.map = null;
}

ResourceManager.prototype.loadMap = function (map) {
    var self = this;
    zip.createReader(new zip.HttpReader(this.resources + map + '.zip'), function (reader) {
	reader.getEntries(function (entries) {
	    for (var i = 0; i < entries.length; ++i) {
		var filename = entries[i].filename;
		var ext = filename.slice(filename.lastIndexOf('.') + 1);
		switch (ext) {
		    case 'png': case 'jpg':
		        entries[i].getData(new zip.TextWriter(), function(text) {
			    self.textures[filename] = text;
			});
		    break;
		    case 'shader':
		        entries[i].getData(new zip.TextWriter(), function(text) {
			    self.scripts[filename] = text;
			});
		    break;
		    case 'bsp':
		        if (!self.map) {
   		            entries[i].getData(new zip.TextWriter(), function(text) {
				self.map;
			    });
			}
		    break;
		}
	    }
	})
    })
}

ResourceManager.prototype.loadCommons = function() {
}

ResourceManager.prototype.loadPlayer = function(player) {
}

