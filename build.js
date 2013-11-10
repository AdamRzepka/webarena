// plovr config file
{
    "id": "webarena",
    "paths": "project/js",
    "modules": {
	"base": {
	    "inputs" : ["project/js/base/base.js", "project/js/base/irendererscene.js",
                        "project/js/base/map.js", "project/js/base/material.js",
                        "project/js/base/broker.js", "project/js/base/jobspool.js",
                        "project/js/base/iinputhandler.js"],
	    "deps": []
	},
	"main": {
	    "inputs": "project/js/main.js",
	    "deps": "base"
	},
	"game": {
	    "inputs": "project/js/game/game.js",
	    "deps": "base"
	},
        "files": {
            "inputs": ["project/js/files/md3.js", "project/js/files/bsp.js"],
            "deps": "base"
        }
    },
    "module-output-path": "release/js/%s.js",
    "externs": ["tools/externs.js"],
    "mode": "ADVANCED",
    "level": "VERBOSE",
    "debug": true,
    "pretty-print": true,
    "define": {
	"goog.DEBUG": false
    },
    "checks": {
    // acceptable values are "ERROR", "WARNING", and "OFF"
	"accessControls": "ERROR",
	"checkTypes": "ERROR",
	"checkRegExp": "WARNING",
	"const": "ERROR",
	"constantProperty": "ERROR",
	"invalidCasts": "WARNING",
	"visibility": "ERROR"	
  }
}
    
