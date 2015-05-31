if (process.argv.length != 3) {
    console.log('port number, please');
}

var port = parseInt(process.argv[2]);
if (port <= 0 || port > 0xFFFF) {
    console.log('invalid port number');
}

var FileServer = require('node-static').Server;
var fileServer = new FileServer('.');
var fs = require('fs');
var log = fs.createWriteStream('../server/log.txt');

var httpServer = require('http').createServer(function (req, res) {
    if (req.method === 'HEAD') {
        log.write('Got http request ' + req.url + '\n');
        fs.stat('../project' + req.url, function (err, stat) {
            if (err) {
                console.log(err);
            } else {
                log.write(req.url + ' size: ' + stat.size + '\n\n');
            }
        });
    }
    fileServer.serve(req, res);
}).listen(port);
console.log('http is listening on ' + port);

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var wss = new WebSocketServer({port:8003});
console.log('websocket is listening on ' + 8003);

var generateId = require('hat').rack();

var common = require('../project/js/system/common.js');

var matches = {};

wss.on('connection', function (ws) {
    console.log('New ws connection');
    ws.on('message', function (data) {
        var i = 0;
        var match;
        console.log('Message', data);
        var args = JSON.parse(data);
        switch (args.type) {
        case common.ControlMessage.Type.CREATE_MATCH_REQUEST:
            var id = generateId();
            var matchData = args.data;
            matchData.id = id;
            matchData.toLoad = [matchData.level, 'assassin', 'weapons'];
            matches[id] = {
                serverSocket: ws,
                playersSockets: [],
                playersData: [],
                matchData: matchData
            };
            ws.send(JSON.stringify({
                type: common.ControlMessage.Type.CREATE_MATCH_RESPONSE,
                matchId: id,
                from: common.LOBBY_ID,
                to: common.SERVER_ID,
                data: matchData
            }));
            break;
        case common.ControlMessage.Type.JOIN_MATCH_REQUEST:
            match = matches[args.matchId];
            if (match) {
                var playerId = match.playersSockets.length;
                var playerData = args.data;
                playerData.gameId = playerId;
                var msg = JSON.stringify({
                    type: common.ControlMessage.Type.JOIN_MATCH_REQUEST,
                    matchId: args.matchId,
                    from: playerId,
                    to: common.ANY_ID,
                    data: playerData
                });
                
                for (i = 0; i < playerId; ++i) {
                    if (match.playersSockets[i].readyState === WebSocket.OPEN) {
                        match.playersSockets[i].send(msg);
                    }
                }                
                match.serverSocket.send(msg);
                
                match.playersSockets.push(ws);
                match.playersData.push(playerData);
                //match.matchData.toLoad.push(playerData.model);
                
                ws.send(JSON.stringify({
                    type: common.ControlMessage.Type.JOIN_MATCH_RESPONSE,
                    matchId: args.matchId,
                    from: common.LOBBY_ID,
                    to: playerId,
                    data: {
                        playerData: playerData,
                        matchData: match.matchData
                    }
                }));
            } else {
                console.log('Wrong matchId in JOIN_MATCH_REQUEST: ' + args.matchId);
            }
            break;
        case common.ControlMessage.Type.RTC_SIGNAL:
            match = matches[args.matchId];
            if (match) {
                var to = args.to;
                var receiver;
                if (to === -1) {
                    receiver = match.serverSocket;
                } else if (to >= 0 && to < match.playersSockets.length) {
                    receiver = match.playersSockets[to];
                } else {
                    console.log('Wrong "to" value in RTC_SIGNAL');
                }
                
                if (receiver) {
                    receiver.send(data);
                }
            } else {
                console.log('Wrong matchId in RTC_SIGNAL: ' + args.matchId);
            }
            break;
        default:
            console.log('Wrong message type: ' + args.type);
            break;
        }        
    });
    ws.on('close', function () {
        console.log('ws connection closed');
        // TODO
    });
});







