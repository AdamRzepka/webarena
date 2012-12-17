// plovr config file
{
    "id": "webarena",
    "paths": "project/js",
    "inputs": "project/js/main.js",
    "mode": "ADVANCED",
    "level": "VERBOSE",
    "debug": false,
    "pretty-print": false,
    "output-file": "release/main.js",
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
    
