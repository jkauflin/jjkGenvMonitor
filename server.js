var five = require('johnny-five');
var dateTime = require('node-datetime');
/*
var BeagleBone = require('beaglebone-io');
var board = new five.Board({
    io: new BeagleBone()
});
*/

var board = new five.Board();

board.on("ready", function() {
});

board.on('ready', function () {
    console.log("bbb board is ready");
    // This requires OneWire support using the ConfigurableFirmata
    var thermometer = new five.Thermometer({
        controller: "DS18B20",
        pin: 2
    });

    thermometer.on("change", function() {
        //console.log(this.celsius + "°C");
        console.log(this.fahrenheit + "°F");
        // console.log("0x" + this.address.toString(16));
    });

    console.log("end of board.on");
});


