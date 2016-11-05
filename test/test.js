var rp = require('request-promise');

var download = rp('http://192.168.29.231:3000/images/2.png');

rp(download).then(function(data) {
  console.log(data);
})
.catch(function(err) {
  console.log(err);
});
