# webarena

## Summary

A clone of OpenArena (http://openarena.ws/) written (by hand) in JavaScript. To see the current code, checkout gameplay branch.

It was my Master of Science project.

## License
All my code is licensed under GNU GPL.
This project also uses code from Brandon Jones' q3bsp demo (http://media.tojicode.com/q3bsp/), Google Closure Library, zip-js(http://gildas-lormeau.github.io/zip.js/) and a few others. All files which comes from other projects are annotated accordingly.
All used game resources (meshes, textures, maps etc.) comes from OpenArena.

## State of development
Preview:
http://game-webarena.rhcloud.com/

For now I have implemented only very basic gameplay. There are still loads of bugs. The game is aimed to be multiplayer-only.
The multiplayer basically works, but there are issues with browsers interoperability (it's a problem with implementation of WebRTC in different browsers) and many other network and synchronization bugs.
The game currently works on Chrome and Firefox.
