goog.provide('input');

function InputHandler()
{
    var self = this;
    self.keyMap = new Array(128);
    self.oldKeyMap = new Array(128);

    self.mouseXY = { x: 0, y: 0 };
    self.mouseDeltaXY = { x: 0, y: 0};

    self.mouseDown = false;
    self.oldMouseDown = false;


    for (var i = 0; i < self.keyMap.length; ++i)
    {
	self.keyMap[i] = false;
	self.oldKeyMap[i] = false;
    }

    document.onkeydown = function(event)
    {
	var key = event.keyCode;
	if (key >= self.keyMap.length)
	    return;

	self.oldKeyMap[key] = self.keyMap[key];
	self.keyMap[key] = true;
    };

    document.onkeyup = function(event)
    {
	var key = event.keyCode;
	if (key >= self.keyMap.length)
	    return;

	self.oldKeyMap[key] = self.keyMap[key];
	self.keyMap[key] = false;
    };

    document.onmousedown = function(event)
    {
	self.oldMouseDown = self.mouseDown;
	self.mouseDown = true;
    };

    document.onmouseup = function(event)
    {
	self.oldMouseDown = self.mouseDown;
	self.mouseDown = false;
    };

    document.onmousemove = function(event)
    {
	self.mouseDeltaXY.x = event.clientX - self.mouseXY.x;
	self.mouseDeltaXY.y = event.clientY - self.mouseXY.y;

	self.mouseXY.x = event.clientX;
	self.mouseXY.y = event.clientY;
    };

    self.keyPressed = function(key)
    {
	if (typeof(key) == "string")
	    key = key.charCodeAt(0);

	return (key < self.keyMap.length && self.keyMap[key]);
    };

    self.keyPressedOld = function(key)
    {
	if (typeof(key) == "string")
	    key = key.charCodeAt(0);

	return (key < self.oldKeyMap.length && self.oldkeyMap[key]);
    };

    self.clearInput = function()
    {
	self.mouseDeltaXY.x = 0;
	self.mouseDeltaXY.y = 0;
    };

}

