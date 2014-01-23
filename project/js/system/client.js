/**
 * Copyright (C) 2013 Adam Rzepka
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

goog.require('goog.asserts');
goog.require('goog.debug.Logger');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.object');

goog.require('flags');
goog.require('base.events');
goog.require('base.Broker');
goog.require('system.common');
goog.require('system.ISocket');
goog.require('system.RTCSocket');
goog.require('system.InputHandler');
goog.require('renderer.Scene');
goog.require('files.ResourceManager');

goog.provide('system.Client');

/**
 * @constructor
 * @param {string} matchId
 * @param {system.PlayerData} playerData
 * @param {string} lobbyUrl
 * @param {WebGLRenderingContext} gl
 * @param {HTMLElement} inputElement
 * @param {files.ResourceManager} rm
 */
system.Client = function (matchId, playerData, lobbyUrl, gl, inputElement, rm) {
    var that = this;
    /**
     * @const
     * @private
     * @type {renderer.Scene}
     */
    this.rendererScene_ = new renderer.Scene(gl);
    /**
     * @const
     * @private
     * @type {files.ResourceManager}
     */
    this.rm_ = rm;
    /**
     * @const
     * @private
     * @type {system.InputHandler}
     */
    this.input_ = new system.InputHandler(inputElement);
    /**
     * @const
     * @private
     * @type {system.WebSocket}
     */
    this.lobbySocket_ = new system.WebSocket(lobbyUrl);
    /**
     * @private
     * @type {system.RTCSocket}
     */
    this.serverSocket_ = null;
    /**
     * @private
     * @type {number}
     */
    this.lastSnapshot_ = 0;
    /**
     * @const
     * @private
     * @type {base.IBroker}
     */
    this.broker_ = base.IBroker.createWorker(['game'], ['base.js', 'game.js'], 'game');
    /**
     * @private
     * @type {system.PlayerData}
     */
    this.playerData_ = null;
    /**
     * @private
     * @type {system.MatchData}
     */
    this.matchData_ = null;

    this.joinMatch_(matchId, playerData);
};

/**
 * @const
 * @private
 * @type {goog.debug.Logger}
 */
system.Client.prototype.logger_ = goog.debug.Logger.getLogger('system.Client');
/**
 * @private
 */
system.Client.prototype.joinMatch_ = function (matchId, playerData) {
    var that = this;
    this.lobbySocket_.onopen = function () {
        var msg = {
            'type': system.ControlMessage.Type.JOIN_MATCH_REQUEST,
            'matchId': matchId,
            'from': system.SERVER_ID,
            'to': system.LOBBY_ID,
            'data': playerData
        };
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'Lobby socket opened');
        that.lobbySocket_.send(JSON.stringify(msg));
    };
    this.lobbySocket_.onmessage = function (evt) {
        that.onMessage_(JSON.parse(evt.data));
    };
    this.lobbySocket_.onclose = function (evt) {
        that.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Lobby socket closed');
        throw new Error('Lobby socket closed');
    };
};
/**
 * @private
 */
system.Client.prototype.onMessage_ = function (msg) {
    if (msg['type'] === system.ControlMessage.Type.JOIN_MATCH_RESPONSE &&
        this.matchData_ !== null) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Got second JOIN_MATCH_RESPONSE. Ignoring.');
        return;
    }
    if (msg['type'] !== system.ControlMessage.Type.JOIN_MATCH_RESPONSE &&
        msg['matchId'] !== this.matchData_['id']) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Wrong match id: ' + msg['matchId']);
        return;
    }
    if (msg['type'] !== system.ControlMessage.Type.JOIN_MATCH_RESPONSE &&
        msg['to'] !== this.playerData_['gameId'] && msg['to'] !== system.ANY_ID) {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Wrong player id: ' + msg['to']);
        return;
    }
    
    switch (msg['type']) {
    case system.ControlMessage.Type.JOIN_MATCH_RESPONSE:
        this.onJoinMatchResponse_(msg['data']);
        break;
    case system.ControlMessage.Type.JOIN_MATCH_REQUEST:
        this.onJoinMatchRequest_(msg['data']);
        break;
    case system.ControlMessage.Type.DISCONNECTED:
        this.onDisconnected_(msg['from']);
        break;
    case system.ControlMessage.Type.RTC_SIGNAL:
        this.onRTCSignal_(msg['data']);
        break;
    default:
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'Unsupported message type: ' + msg['type']);
        break;
    }
};
/**
 * @private
 */
system.Client.prototype.onJoinMatchResponse_ = function (data) {
    this.playerData_ = data['playerData'];
    this.matchData_ = data['matchData'];

    this.initGame_(this.matchData_['level'], this.matchData_['toLoad']);
};
/**
 * @private
 */
system.Client.prototype.onJoinMatchRequest_ = function (playerData) {
    // TODO
};
/**
 * @private
 */
system.Client.prototype.onDisconnected_ = function (playerId) {
    // TODO
};
/**
 * @private
 */
system.Client.prototype.onRTCSignal_ = function (msg) {
    if (this.serverSocket_) {
        this.serverSocket_.readSignallingMessage(msg);
    } else {
        this.logger_.log(goog.debug.Logger.Level.WARNING,
                         'serverSocket not created yet');
    }
};
/**
 * @private
 */
system.Client.prototype.initGame_ = function (level, archives) {
    this.logger_.log(goog.debug.Logger.Level.INFO,
                         'initializing game');
    var that = this;
    var deferred = this.initRTC_();

    this.broker_.registerReceiver('base.IRendererScene', this.rendererScene_);
    this.broker_.registerEventListener(base.EventType.SERVER_TIME_UPDATE,
                                       function (type, timestamp) {
                                           that.lastSnapshot_ = /**@type{number}*/timestamp;
                                       });

    this.broker_.executeFunction(function (clientId, broker) {
        game.init((/**@type{base.IBroker}*/broker), false, (/**@type{number}*/clientId));
    }, [that.playerData_['gameId']]);

    deferred.awaitDeferred(this.loadResources_(archives, this.rendererScene_));

    deferred.addCallback(function() {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'game initialized');        
        that.broker_.fireEvent(base.EventType.GAME_START, null);
        that.initUpdates_();
        that.onGameStarted();
    });
};
/**
 * @private
 */
system.Client.prototype.initRTC_ = function () {
    var that = this;
    var deferred = new goog.async.Deferred();
    function signallingCallback(msg) {
        var cmsg = {
            'type': system.ControlMessage.Type.RTC_SIGNAL,
            'matchId': that.matchData_['id'],
            'from': that.playerData_['gameId'],
            'to': system.SERVER_ID,
            'data': msg
        };
        that.lobbySocket_.send(JSON.stringify(cmsg));
    }
    this.serverSocket_ = new system.RTCSocket(signallingCallback);
    this.serverSocket_.onopen = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'RTCSocket opened');
        deferred.callback();
    };
    this.serverSocket_.onmessage = function (evt) {
        // var dv = new DataView(evt.data);
        // assume that snapshot id is first uint in message
        // TODO fix this
        // that.lastSnapshot_ = dv.getInt32(0, true);
        that.broker_.fireEvent(base.EventType.STATE_UPDATE, evt.data,
                               base.IBroker.EventScope.REMOTE, [evt.data]);
    };
    this.serverSocket_.onclose = function () {
        that.logger_.log(goog.debug.Logger.Level.INFO,
                         'RTCSocket closed');
        // TODO
    };
    this.serverSocket_.open();
    return deferred;
};
/**
 * @private
 */
system.Client.prototype.loadResources_ = function (archives, scene) {
    var i = 0;;
    var rm = this.rm_;
    var broker = this.broker_;
    var deferred;
    var deferreds = [];
    function onload (archive) {
        var key;
        scene.buildShaders(archive.scripts, archive.textures);
        for ( key in archive.models ) {
            if (archive.models.hasOwnProperty(key)) {
                scene.registerMd3(archive.models[key]);
                broker.fireEvent(base.EventType.MODEL_LOADED, {
                    url: key,
                    model: archive.models[key]
                });
            }
        }
        for( key in archive.configs ) {
            if (archive.configs.hasOwnProperty(key)) {
                broker.fireEvent(base.EventType.CONFIG_LOADED, {
                    url: key,
                    config: archive.configs[key]
                });
            }
        }
        if (archive.map) {
            scene.registerMap(archive.map.models, archive.map.lightmapData);
            broker.fireEvent(base.EventType.MAP_LOADED, {
                models: archive.map.models,
                lightmapData: null,  // game worker doesn't need lightmap
                bsp: archive.map.bsp,
                entities: archive.map.entities
            });
        }
    };

    for (i = 0; i < archives.length; ++i) {
        deferred = rm.load(archives[i]);
        deferred.addCallback(onload);
        deferreds.push(deferred);
    }
    return goog.async.DeferredList.gatherResults(deferreds);
};
/**
 * @const
 * @private
 * @type {number}
 */
system.Client.INPUT_MESSAGE_SIZE = 16;
/*
 * Input message format
 * lastSnapshot - 4 bytes
 * cursorX - 4 bytes
 * cursorY - 4 bytes
 * actions - 2 bytes
 * *unused* - 2 bytes
 */

/**
 * @private
 */
system.Client.prototype.sendInputMessage_ = function (dataView) {
    dataView.setUint32(0, this.lastSnapshot_, true);
    base.InputState.serialize(this.input_.getState(), dataView, 4);
    this.serverSocket_.send(dataView.buffer);
};
/**
 * @private
 */
system.Client.prototype.initUpdates_ = function () {
    var that = this;
    var inputMessage_ = new DataView(new ArrayBuffer(system.Client.INPUT_MESSAGE_SIZE));
    
    var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
            window.oRequestAnimationFrame || function (fn) { setTimeout(fn, 16); };

    var lastTime = Date.now();
    var fpsCounter = 0;
    var fpsTime = 0;
    var fpsElem = document.getElementById('fps');
    var inputUpdateData = {
            playerId: that.playerData_['gameId'],
            inputState: null
    };

    function update() {
        // Note: we accept one frame lag between input and renderer on the client.
        
        // fps counter
        if (fpsElem) {
            fpsTime += Date.now() - lastTime;
	    lastTime = Date.now();

	    ++fpsCounter;
	    if (fpsTime > 1000) {
	        fpsTime -= 1000;
	        fpsElem.textContent = fpsCounter;
	        fpsCounter = 0;
	    }
        }

        // input
        that.sendInputMessage_(inputMessage_);
        if (!flags.GAME_WORKER || base.IBroker.DISABLE_WORKERS) {
            // inputState can't be passed by reference
            inputUpdateData.inputState = goog.object.unsafeClone(that.input_.getState());
        } else {
            inputUpdateData.inputState = that.input_.getState();
        }
        that.broker_.fireEvent(base.EventType.INPUT_UPDATE, inputUpdateData);

        // render
	that.rendererScene_.render();
        
	raf(update);
    };

    raf(update);
};

