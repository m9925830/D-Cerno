var net = require('net');

// Create socket
var port = 5011;
var host = '169.254.11.20';
var timeout = 1000;
var retrying = false;
var listeners = [];
var firsttime = true;


var firebase = require("firebase/app");
require("firebase/firestore");
var arp = require('node-arp');
var mac = "";







var config = {
    apiKey: "AIzaSyDZvGdejVxS8szGots3AVqBEoYT6GeNKlw",
    authDomain: "d-cerno.firebaseapp.com",
    databaseURL: "https://d-cerno.firebaseio.com",
    projectId: "d-cerno",
    storageBucket: "d-cerno.appspot.com",
    messagingSenderId: "548082438008"
};
firebase.initializeApp(config);

var database = firebase.firestore();




/*
mac = '00:0e:3d:11:0a:76';
createDataStructure();
configureListeners();
*/


/*
function writeUserData(data) {
    database.collection('users').add({
        data: data
    })
        .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
}
*/

function writeEngineData(data) {
    if (data.nam && data.nam == "lsvol") {
        database.collection('engines').doc(mac).collection('volume').doc('event').update({
            event: data.vol
        });
    }
    if (data.nam && data.nam == "recstat") {
        database.collection('engines').doc(mac).collection('recording').doc('event').update({
            timestamp: Date.now(), event: data.stat
        });
    }
    if (data.nam && data.nam == "unit") {
        database.collection('engines').doc(mac).collection('units').doc('event').update({
            uid: data.uid.toUpperCase(), pres: data.pres
        });
    }
    if (data.nam && data.nam == "units") {
        database.collection('engines').doc(mac).collection('units').doc('rep').update({
            timestamp: Date.now(), units: data.s
        });
    }
    if (data.nam && data.nam == "micstat") {
        database.collection('engines').doc(mac).collection('micstat').doc('event').update({
            timestamp: Date.now(), uid: data.uid.toUpperCase(), stat: data.stat
        });
    }
    if (data.rep && data.rep.inf) {
        database.collection('engines').doc(mac).collection('lifecheck').doc('rep').update({
            engineLive: true
        });
    }
    if (data.nam && data.nam == "mmo") {
        database.collection('engines').doc(mac).collection('microphonemode').doc('event').update({
            mode:
                data.mmo, option: data.mio, activation: data.mat
        });
    }
}

function configureListeners() {
    listeners[0] =
        database.collection('engines').doc(mac).collection('volume').doc('set').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().set) {
                    console.log(doc.data().set);

                    socket.write('\x0202:set0000020O00000C00000000000000:{"nam":"slsvol","vol":' + doc.data().set + '}\x03');
                }
            }, function (error) { console.log(error) }
        );

    listeners[1] =
        database.collection('engines').doc(mac).collection('recording').doc('set').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().set) {
                    console.log(doc.data().set);

                    socket.write('\x0202:set0000029O00000C00000000000000:{"nam":"srecstat","stat":"'
                        + doc.data().set + '"}\x03');
                }
            }, function (error) { console.log(error) }
        );

    listeners[2] =
        database.collection('engines').doc(mac).collection('units').doc('get').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().timestamp) {
                    console.log(doc.data().timestamp);

                    socket.write('\x0202:get0000029O00000C00000000000000:{"nam":"gunits"}\x03');
                }
            }, function (error) { console.log(error) }
        );

    listeners[3] =
        database.collection('engines').doc(mac).collection('micstat').doc('set').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().uid) {
                    console.log(doc.data());

                    socket.write('\x0202:set0000029O00000C00000000000000:{"nam":"smicstat","uid":"'
                        + doc.data().uid + '","stat":"' + doc.data().stat + '"}\x03');
                }
            }, function (error) { console.log(error) }
        );

    listeners[4] =
        database.collection('engines').doc(mac).collection('lifecheck').doc('getEngine').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().timestamp) {
                    console.log(doc.data().timestamp);
                    socket.write('\x0202:lfc0000020O00000C00000000000000:\x03');

                    database.collection('engines').doc(mac).collection('lifecheck').doc('rep').update({
                        proxyLive: true
                    });
                }
            }, function (error) { console.log(error) }
        );

    listeners[5] =
        database.collection('engines').doc(mac).collection('microphonemode').doc('set').onSnapshot(
            function (doc) {
                if (doc.data()) {
                    console.log(doc.data());

                    socket.write('\x0202:set0000020O00000C00000000000000:{"nam":"smmo","mmo":'
                        + doc.data().mode + ',"mio":' + doc.data().option + ', "mat":' +
                        doc.data().activation + '}\x03');
                }
            }, function (error) { console.log(error) }
        );

}

function createDataStructure() {
    database.collection('engines').doc(mac).get().then(
        x => {
            if (!x.exists) {

                database.collection('engines').doc(mac).collection('volume').doc('event').set({
                    event: 10
                });

                database.collection('engines').doc(mac).collection('volume').doc('set').set({
                    set: 10
                });

                database.collection('engines').doc(mac).collection('recording').doc('event').set({
                    timestamp: Date.now(), event: 1
                });

                database.collection('engines').doc(mac).collection('recording').doc('set').set({
                    set: 1
                });

                database.collection('engines').doc(mac).collection('units').doc('get').set({});

                database.collection('engines').doc(mac).collection('units').doc('event').set({
                    uid: '', pres: 0
                });

                database.collection('engines').doc(mac).collection('units').doc('rep').set({
                    timestamp: Date.now(), units: []
                });

                database.collection('engines').doc(mac).collection('micstat').doc('set').set({});

                database.collection('engines').doc(mac).collection('micstat').doc('event').set({
                    timestamp: Date.now(), uid: '', stat: 0
                });

                database.collection('engines').doc(mac).collection('lifecheck').doc('rep').set({
                    engineLive: false, proxyLive: false
                });

                database.collection('engines').doc(mac).collection('lifecheck').doc('getEngine').set({
                    timestamp: Date.now()
                });
                database.collection('engines').doc(mac).set({ user: '' });

                database.collection('engines').doc(mac).collection('microphonemode').doc('event').set({
                    mode: 0, option: 0, activation: 1
                });


            }
        })
        .catch((err) => {
            console.log(err);
        });

}








// Functions to handle socket events
function makeConnection() {
    socket.connect(port, host);
    console.log('make connection');
}
function connectEventHandler() {
    console.log('connected');
    retrying = false;
    var body = '{"typ":"Application","nam":"DU","ver":"1.01","inf":"","svr":0,"tim":""}';
    socket.write('\x0202:con1234020O00002C00000000000000:' + body + '\x03');
    socket.write('\x0202:get0000029O00002C00000000000000:{"nam":"gunits"}\x03');





}
function dataEventHandler(data) {
    console.log('Server return data : ' + data);
    var data2 = data.toString('utf8');
    var parts = data2.split('\x03\x02');
    var length = parts.length;
    parts[0] = parts[0].replace(/\x02/g, '');
    parts[length - 1] = parts[length - 1].replace(/\x03/g, '');
    for (var i = 0; i < length; i++) {
        var data3 = JSON.parse(parts[i].slice(35));
        console.log(data3);
        writeEngineData(data3);
    }
}
function endEventHandler(end) {
    console.log('end' + end);
}
function timeoutEventHandler(time) {
    console.log('timeout' + time);
}
function drainEventHandler(drain) {
    console.log('drain' + drain);
}
function errorEventHandler(err) {
    console.log('error' + err);
}
function closeEventHandler() {
    console.log('close');
    if (!retrying) {
        retrying = true;
        socket.destroy();
        socket.unref();
        console.log('Is socket destroyed? ', socket.destroyed);
        console.log('Reconnecting...');
    }
    setTimeout(makeConnection, timeout);
    console.log(retrying);
}

// Create socket and bind callbacks
var socket = new net.Socket();
socket.setKeepAlive(true);

socket.on('connect', connectEventHandler);
socket.on('data', dataEventHandler);
socket.on('end', endEventHandler);
socket.on('timeout', timeoutEventHandler);
socket.on('drain', drainEventHandler);
socket.on('error', errorEventHandler);
socket.on('close', closeEventHandler);

// Connect


function getMac() {
    arp.getMAC('169.254.11.20', function (err, mac_) {
        if (!err) {

            //listeners.forEach(x => x());

            mac = mac_;
            makeConnection();
            createDataStructure();
            configureListeners();

            console.log('Connecting to ' + host + ':' + port + '...');


        }
        else {
            console.log('Trying to find mac');
            getMac();
        }
    });
}

getMac();



// Webserver


var path = require('path');
var express = require('express');
var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "index.htm");
});


var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})



