var request = require('request');
var rProgress = require('request-progress');
var fs = require('fs');

//request.get('http://192.168.29.231:3000/package.json')
//  .on('response', function(response) {
//    console.log(response.statusCode);
//    console.log(response.headers['content-length']);
//  });

rProgress(request('http://192.168.29.231:3000/images/2.png'), {
  // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
  // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
  // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
})
  .on('progress', function (state) {
    // The state is an object that looks like this:
    // {
    //     percentage: 0.5,            // Overall percentage (between 0 to 1)
    //     speed: 554732,              // The download speed in bytes/sec
    //     size: {
    //         total: 90044871,        // The total payload size in bytes
    //         transferred: 27610959   // The transferred payload size in bytes
    //     },
    //     time: {
    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
    //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
    //     }
    // }
    console.log('progress22', state);
  })
  .on('error', function (err) {
    console.log(err);
  })
  .on('end', function () {
    console.log('good');
  })
  .pipe(fs.createWriteStream('../22.png'));
