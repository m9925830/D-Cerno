// Import net module.
var net = require('net');
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
}

function configureListeners() {
    database.collection('engines').doc(mac).collection('volume').doc('set').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().set) {
                console.log(doc.data().set);
                client.write('\x0202:set0000020O00000C00000000000000:{"nam":"slsvol","vol":' + doc.data().set + '}\x03');
            }
        }
    );

    database.collection('engines').doc(mac).collection('recording').doc('set').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().set) {
                console.log(doc.data().set);
                client.write('\x0202:set0000029O00000C00000000000000:{"nam":"srecstat","stat":"' + doc.data().set + '"}\x03');
            }
        }
    );

    database.collection('engines').doc(mac).collection('units').doc('get').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().timestamp) {
                console.log(doc.data().timestamp);
                client.write('\x0202:get0000029O00000C00000000000000:{"nam":"gunits"}\x03');
            }
        }
    );

    database.collection('engines').doc(mac).collection('micstat').doc('set').onSnapshot(
        function (doc) {
            if (doc.data() && doc.data().uid) {
                console.log(doc.data());
                client.write('\x0202:set0000029O00000C00000000000000:{"nam":"smicstat","uid":"' + doc.data().uid + '","stat":"' + doc.data().stat + '"}\x03');
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
                database.collection('engines').doc(mac).collection('recording').doc('event').set({ event: 10 });
                database.collection('engines').doc(mac).collection('recording').doc('set').set({ set: 10 });
                database.collection('engines').doc(mac).collection('units').doc('get').set({});
                database.collection('engines').doc(mac).collection('units').doc('event').set({});
                database.collection('engines').doc(mac).collection('units').doc('rep').set({});
                database.collection('engines').doc(mac).collection('micstat').doc('set').set({});
                database.collection('engines').doc(mac).collection('micstat').doc('event').set({});


            }
        }
    )

}




var option = {
    host: '192.168.0.20',
    port: 5011
}

// Create TCP client.

var client = new net.Socket();
client.connect(option.port, option.host, function () {
    console.log('Connected');
    var body = '{"typ":"Application","nam":"DU","ver":"1.01","inf":"","svr":0,"tim":"2008-09-15T15:53:00"}';
    arp.getMAC('192.168.0.20', function (err, mac_) {
        if (!err) {
            mac = mac_;
            console.log(mac);
            createDataStructure();
            configureListeners();
            client.write('\x0202:con1234020O12345C12345000000000:' + body + '\x03');
            client.write('\x0202:get0000029O00000C00000000000000:{"nam":"gunits"}\x03');
        }
    });
});

client.setKeepAlive(true);


// When receive server send back data.
client.on('data', function (data) {
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
});


// When connection disconnected.
client.on('close', function () {
    console.log('Client socket disconnect. ');

});


client.on('error', function (err) {
    console.log('errortje:' + JSON.stringify(err));
});


