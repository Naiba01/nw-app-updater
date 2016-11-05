var os = require('os');
var path = require('path');
var fs = require('fs');
var request = require('request');
var rp = require('request-promise');
var semver = require('semver');

var platform = process.platform;
var arch = process.arch;
platform = (/^win/.test(platform) ? 'win' : /^darwin/.test(platform) ? 'mac' : 'linux') + (arch === 'x64' ? '64' : '32');

var Updater = function(manifest, options) {
  this.options = {
    version: manifest.version,
    manifestUrl: manifest.manifestUrl,
    packages: manifest.packages,
    tmpDir: options && options.tmpDir || os.tmpDir()
  };
};

Updater.prototype.checkNewVersion = function() {
  return new Promise(function(resolve, reject) {
    //rp(this.options.manifestUrl)
    //  .then(function(data) {
    //    var dataObj;
    //    var result = {};
    //    try {
    //      dataObj = JSON.parse(data);
    //    } catch (e) {
    //      throw new Error(e);
    //    }
    //    if (dataObj.version && semver.gt(dataObj.version, this.options.version)) {
    //      result.hasNewVersion = true;
    //      result.version = dataObj.version;
    //      result.packages = dataObj.packages;
    //      result.platform = platform;
    //      resolve(result);
    //    } else {
    //      result.hasNewVersion = false;
    //      resolve(result);
    //    }
    //  }.bind(this))
    //  .catch(function(err) {
    //    reject(err);
    //  });
    request(this.options.manifestUrl, function(err, response, data) {
      if (err || response.statusCode < 200 || response.statusCode >299) reject(new Error(response.statusCode));
      resolve(data);
    })
  }.bind(this));
  
};

Updater.prototype.download = function(packages) {
  var downloadUrl = packages[platform].url || this.options.packages[platform].url;
  return new Promise(function(resolve, reject) {
    var dl = rp(downloadUrl);
    dl.on('data', function(data) {
      console.log(data);
    });
    dl.then(function(path) {
      resolve(path);
    })
    .catch(function(err) {
      reject(err);
    });
  }.bind(this));
}

module.exports = Updater;
