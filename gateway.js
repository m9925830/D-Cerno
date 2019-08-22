
var port = 5011;
var timeout = 1000;
var retrying = false;
var alive = false;
var listeners = [];
var net = require('net');
var firebase = require("firebase/app");
var arp = require('node-arp');
var engineData = require('./ip-address.json');
var internetAvailable = require("internet-available");
const fs = require('fs');
require("firebase/firestore");
require("firebase/auth")

mac = engineData.mac;
host = engineData.ip;





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
                    socket.write('\x0202:set0000020O00000C00000000000000:{"nam":"slsvol","vol":' + doc.data().set + '}\x03');
                }
            }, function (error) {  }
        );

    listeners[1] =
        database.collection('engines').doc(mac).collection('recording').doc('set').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().set) {
                    socket.write('\x0202:set0000029O00000C00000000000000:{"nam":"srecstat","stat":"'
                        + doc.data().set + '"}\x03');
                }
            }, function (error) {  }
        );

    listeners[2] =
        database.collection('engines').doc(mac).collection('units').doc('get').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().timestamp) {
                    socket.write('\x0202:get0000029O00000C00000000000000:{"nam":"gunits"}\x03');
                }
            }, function (error) {  }
        );

    listeners[3] =
        database.collection('engines').doc(mac).collection('micstat').doc('set').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().uid) {
                    socket.write('\x0202:set0000029O00000C00000000000000:{"nam":"smicstat","uid":"'
                        + doc.data().uid + '","stat":"' + doc.data().stat + '"}\x03');
                }
            }, function (error) {  }
        );

    listeners[4] =
        database.collection('engines').doc(mac).collection('lifecheck').doc('getEngine').onSnapshot(
            function (doc) {
                if (doc.data() && doc.data().timestamp) {
                    socket.write('\x0202:lfc0000020O00000C00000000000000:\x03');
                    database.collection('engines').doc(mac).collection('lifecheck').doc('rep').update({
                        proxyLive: true
                    });
                }
            }, function (error) {  }
        );

    listeners[5] =
        database.collection('engines').doc(mac).collection('microphonemode').doc('set').onSnapshot(
            function (doc) {
                if (doc.data()) {
                    socket.write('\x0202:set0000020O00000C00000000000000:{"nam":"smmo","mmo":'
                        + doc.data().mode + ',"mio":' + doc.data().option + ', "mat":' +
                        doc.data().activation + '}\x03');
                }
            }, function (error) {    }
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
            
        });

}


// Functions to handle socket events
function makeConnection() {
    socket.connect(port, host);
    
}
function connectEventHandler() {
    console.log(new Date().toISOString() + '    Made succesfull connection with D-Cerno CU-R on http://'+host+':'+port );
    retrying = false;
    alive = true;
    var body = '{"typ":"Application","nam":"DU","ver":"1.01","inf":"","svr":0,"tim":""}';
    socket.write('\x0202:con1234020O00002C00000000000000:' + body + '\x03');
    socket.write('\x0202:get0000029O00002C00000000000000:{"nam":"gunits"}\x03');
}

function dataEventHandler(data) {
    var data2 = data.toString('utf8');
    var parts = data2.split('\x03\x02');
    var length = parts.length;
    parts[0] = parts[0].replace(/\x02/g, '');
    parts[length - 1] = parts[length - 1].replace(/\x03/g, '');
    for (var i = 0; i < length; i++) {
        var data3 = JSON.parse(parts[i].slice(35));
        writeEngineData(data3);
        console.log(new Date().toISOString() + '    D-Cerno sends data to the gateway:' + JSON.stringify(data3) );
    }
}
function endEventHandler(end) {
    
}
function timeoutEventHandler(time) {
   
}
function drainEventHandler(drain) {
    
}
function errorEventHandler(err) {
   
}
function closeEventHandler() {
    if (!retrying) {
        retrying = true;
        alive = false;
        socket.end();
        console.log(new Date().toISOString() + '    Connection with D-Cerno CU-R has been closed' ); 
    }
    setTimeout(makeConnection, timeout);
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


function getMac(host_) {
    arp.getMAC(host_, function (err, mac_) {
        if (!err) {
            mac = mac_;
            makeConnection();
            createDataStructure();
            configureListeners();
        }
        else {
            if (!alive) getMac(host_);
        }
    });
}

// Connect
firebase.auth().signInWithEmailAndPassword("gateway@micromanager.com", "123456").then(function () {
    if (host != '') getMac(host);
});



// Webserver
var path = require('path');
var express = require('express');
var app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    internetAvailable().then(function () {
        if (firebase.auth().currentUser) {
            if (host != '') {
                if (alive) {
                    res.redirect('/success?mac=' + mac + '&host=' + host);
                } else {
                    res.redirect('/failure?mac=' + mac + '&host=' + host);
                }
            } else {
                res.redirect('/connect');
            }
        } else {
            firebase.auth().signInWithEmailAndPassword("gateway@micromanager.com", "123456").then(function () {
                if (host != '') getMac(host);
            });
            res.redirect('/failure?mac=' + mac + '&host=' + host);
        }
    }).catch(function () {
        res.sendFile(__dirname + "/public/no-internet.html");
    });
});

app.get('/connect', function (req, res) {
    res.sendFile(__dirname + "/public/connect-cur.html");
});

app.get('/success', function (req, res) {
    res.sendFile(__dirname + "/public/success.html");
});

app.get('/failure', function (req, res) {
    res.sendFile(__dirname + "/public/failure.html");
});

app.get('/no-internet', function (req, res) {
    res.sendFile(__dirname + "/public/no-internet.html");
});

app.post('/connect', function (req, res) {
    internetAvailable().then(function () {
        if (firebase.auth().currentUser) {
            socket.end();

            arp.getMAC(req.body.inputIP, function (err, mac_) {
                if (!err) {
                    var testSocket = new net.Socket();
                    testSocket.connect(port, req.body.inputIP, function () {
                        mac = mac_;
                        host = req.body.inputIP;
                        let data = JSON.stringify({ 'ip': host, 'mac': mac });
                        fs.writeFileSync('ip-address.json', data);
                        testSocket.end();
                        testSocket = null;
                        makeConnection();
                        createDataStructure();
                        configureListeners();
                        res.redirect('/success?mac=' + mac + '&host=' + host);
                    });
                    testSocket.on('error', function () {
                        testSocket.end();
                        testSocket = null;
                        res.redirect('/connect?error=Could not make connection to device');
                    });
                } else {
                    res.redirect('/connect?error=Could not make connection to device');
                }
            });
        } else {
            firebase.auth().signInWithEmailAndPassword("gateway@micromanager.com", "123456").then(function () {
                if (host != '') getMac(host);
            });
            res.redirect('/failure?mac=' + mac + '&host=' + host);
        }

    }).catch(function () {
        res.sendFile(__dirname + "/public/no-internet.html");
    });
});

var server = app.listen(8081, function () {
    console.log("Open your browser and surf to http://localhost:8081 to configure your gateway.")
})



