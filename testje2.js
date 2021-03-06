var net = require('net');

// Create socket
var port = 5011;
var host = '192.168.0.20';
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
        database.collection('engines').doc(mac).collection('volume').doc('event').update({ event: data.vol });
    }
    if (data.nam && data.nam == "recstat") {
        database.collection('engines').doc(mac).collection('recording').doc('event').update({ timestamp: Date.now(), event: data.stat });
    }
    if (data.nam && data.nam == "unit") {
        database.collection('engines').doc(mac).collection('units').doc('event').update({ uid: data.uid.toUpperCase(), pres: data.pres });
    }
    if (data.nam && data.nam == "units") {
        database.collection('engines').doc(mac).collection('units').doc('rep').update({ timestamp: Date.now(), units: data.s });
    }
    if (data.nam && data.nam == "micstat") {
        database.collection('engines').doc(mac).collection('micstat').doc('event').update({ timestamp: Date.now(), uid: data.uid.toUpperCase(), stat: data.stat });
    }
    if (data.rep && data.rep.inf) {
        database.collection('engines').doc(mac).collection('lifecheck').doc('rep').update({ engineLive: true });
    }
}

function configureListeners() {
    listeners[0] = database.collection('engines').doc(mac).collection('volume').doc('set').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().set) {
                console.log(doc.data().set);
                socket.write('\x0202:set0000020O00000C00000000000000:{"nam":"slsvol","vol":' + doc.data().set + '}\x03');
            }
        }
    );

    listeners[1] = database.collection('engines').doc(mac).collection('recording').doc('set').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().set) {
                console.log(doc.data().set);
                socket.write('\x0202:set0000029O00000C00000000000000:{"nam":"srecstat","stat":"' + doc.data().set + '"}\x03');
            }
        }
    );

    listeners[2] = database.collection('engines').doc(mac).collection('units').doc('get').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().timestamp) {
                console.log(doc.data().timestamp);
                socket.write('\x0202:get0000029O00000C00000000000000:{"nam":"gunits"}\x03');
            }
        }
    );

    listeners[3] = database.collection('engines').doc(mac).collection('micstat').doc('set').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().uid) {
                console.log(doc.data());
                socket.write('\x0202:set0000029O00000C00000000000000:{"nam":"smicstat","uid":"' + doc.data().uid + '","stat":"' + doc.data().stat + '"}\x03');
            }
        }
    );

    listeners[4] = database.collection('engines').doc(mac).collection('lifecheck').doc('getEngine').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().timestamp) {
                console.log(doc.data().timestamp);
                socket.write('\x0202:lfc0000020O00000C00000000000000:\x03');
                database.collection('engines').doc(mac).collection('lifecheck').doc('rep').update({ proxyLive: true });
            }
        }
    );

}

function createDataStructure() {
    database.collection('engines').doc(mac).get().then(
        x => {
            if (!x.exists) {
                database.collection('engines').doc(mac).collection('volume').doc('event').set({ event: 10 });
                database.collection('engines').doc(mac).collection('volume').doc('set').set({ set: 10 });
                database.collection('engines').doc(mac).collection('recording').doc('event').set({ timestamp: Date.now(), event: 1 });
                database.collection('engines').doc(mac).collection('recording').doc('set').set({ set: 1 });
                database.collection('engines').doc(mac).collection('units').doc('get').set({});
                database.collection('engines').doc(mac).collection('units').doc('event').set({ uid: '', pres: 0 });
                database.collection('engines').doc(mac).collection('units').doc('rep').set({ timestamp: Date.now(), units: [] });
                database.collection('engines').doc(mac).collection('micstat').doc('set').set({});
                database.collection('engines').doc(mac).collection('micstat').doc('event').set({ timestamp: Date.now(), uid: '', stat: 0 });
                database.collection('engines').doc(mac).collection('lifecheck').doc('rep').set({ engineLive: false, proxyLive: false });
                database.collection('engines').doc(mac).collection('lifecheck').doc('getEngine').set({ timestamp: Date.now() });
                database.collection('engines').doc(mac).set({ user: '' });


            }
        })
        .catch((err) => {
            console.log(err);
        });

}

var socket = new net.Socket();
socket.setKeepAlive(true);


function openSocket() {
    console.log('opensocket');
    socket.connect(port, host);
    
}

var interval;

socket.on('connect', function() {

    console.log('Socket is open!');
    var body = '{"typ":"Application","nam":"DU","ver":"1.01","inf":"","svr":0,"tim":""}';
    socket.write('\x0202:con1234020O00000C00000000000000:' + body + '\x03');
   
})

socket.on('error', function(err) {

    console.log('Socket error!', err);

    // Kill socket
    clearInterval(interval);
    socket.destroy();
    socket.unref();

    // Re-open socket
    setTimeout(openSocket, 1e3);
})



socket.on('data', function (data) {
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
})



// Connect


arp.getMAC('192.168.0.20', function (err, mac_) {
    if (!err) {

        //listeners.forEach(x => x());

        mac = mac_;
        openSocket();
        //createDataStructure();
        //configureListeners();

        console.log('Connecting to ' + host + ':' + port + '...');
        

    }
});