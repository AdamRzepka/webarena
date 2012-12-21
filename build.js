// plovr config file
{
    "id": "webarena",
    "paths": "project/js",
    "modules": {
	"base": {
	    "inputs" : "project/js/base/base.js",
	    "deps": []
	},
	"main": {
	    "inputs": "project/js/main.js",
	    "deps": "base"
	},
	"game": {
	    "inputs": "project/js/game/game.js",
	    "deps": "base"
	}
    },
    "module-output-path": "release/%s.js",
    "externs": ["tools/externs.js"],
    "mode": "ADVANCED",
    "level": "VERBOSE",
    "debug": true,
    "pretty-print": true,
    "define": {
	"goog.DEBUG": true
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
    
