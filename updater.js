var os = require('os');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var request = require('request');
var semver = require('semver');
var ncp = require('ncp').ncp;
var del = require('del');

var platform = process.platform;
var arch = process.arch;
platform = (/^win/.test(platform) ? 'win' : /^darwin/.test(platform) ? 'mac' : 'linux') + (arch === 'x64' ? '64' : '32');


function run(path, args, options){
  var opts = Object.assign({}, {detached: true}, options);
  var sp = spawn(path, args, opts);
  sp.unref();
  return sp;
}
/**
 * create copy file from downloaded file to
 * @param pathObj
 * @param number
 */
function createCopyDest(pathObj, number) {
  var copyObj = {
    dir: pathObj.dir,
    ext: pathObj.ext,
    name: pathObj.name + '-' + number
  };
  return path.format(copyObj);
}

function copyToDest(source, dest) {
  return new Promise(function (resolve, reject) {
    var rs = fs.createReadStream(source);
    var ws = fs.createWriteStream(dest);
    rs.pipe(ws);
    rs.on('error', function (err) {
      reject(err);
    });
    ws.on('error', function (err) {
      reject(err);
    });
    ws.on('finish', function () {
      resolve(dest);
    });
  });
}

var pRun = {
  win32: function (appPath, args, options) {
    console.log(this);
    console.log('应用路径', appPath);
    console.log('应用参数', args);
    console.log('应用选项', options);
    run(appPath, args, options);
  },
  win64: function (appPath, args, options) {
    console.log(this);
    console.log('应用路径', appPath);
    console.log('应用参数', args);
    console.log('应用选项', options);
    run(appPath, args, options);
  }
};

var pInstall = {
  win32: function(copyPath, to, cb){
    var self = this;
    var errCounter = 50;
    deleteApp(appDeleted);

    function appDeleted(err){
      if(err){
        errCounter--;
        if(errCounter > 0) {
          setTimeout(function(){
            deleteApp(appDeleted);
          }, 100);
        } else {
          return cb(err);
        }
      }
      else {
        ncp(copyPath, to, appCopied);
      }
    }
    function deleteApp(cb){
      del(to, {force: true}, cb);
    }
    function appCopied(err){
      if(err){
        setTimeout(deleteApp, 100, appDeleted);
        return
      }
      cb();
    }
  }
};

var Updater = function (manifest, options) {
  this.options = {
    platform: platform,
    version: manifest.version || '',
    manifestUrl: manifest.manifestUrl || '',
    tmpDir: options && options.tmpDir || os.tmpDir()
  };
};

Updater.prototype.getAppInstallPath = function () {
  var installPath = {
    win32: path.dirname(process.execPath),
    win64: path.dirname(process.execPath)
  };
  return installPath[platform];
};

Updater.prototype.getAppExecPath = function () {
  var execPath = {
    win32: process.execPath,
    win64: process.execPath
  };
  return execPath[platform];
};

Updater.prototype.checkNewVersion = function () {
  return new Promise (function (resolve, reject) {
    var manifestUrl = encodeURI(this.options.manifestUrl);
    var manifestRq = request(manifestUrl, function (err, response, body) {
      var dataObj;
      var result = {};
      if (err) {
        reject(err);
      }
      if (response && (response.statusCode < 200 || response.statusCode > 299)) {
        manifestRq.abort();
        reject(new Error(response.statusCode));
      }
      try {
        dataObj = JSON.parse(body);
      } catch (e) {
        throw new Error(e);
      }
      if (dataObj.version && semver.gt(dataObj.version, this.options.version)) {
        result.hasNewVersion = true;
        result.version = dataObj.version;
        result.packages = dataObj.packages;
        resolve(result);
      } else {
        result.hasNewVersion = false;
        resolve(result);
      }
    }.bind(this));
  }.bind(this));
};

Updater.prototype.download = function (packages) {
  var downloadUrl = packages[platform].url || this.options.packages[platform].url;
  return new Promise(function (resolve, reject) {
    var downloadRq = request(encodeURI(downloadUrl));
    var destPath = path.join(this.options.tmpDir, path.basename(downloadUrl));
    var ws = fs.createWriteStream(destPath);
    // readStream error listener
    downloadRq.on('error', function (err) {
      reject(err);
    });
    // ------ Step 1 : download begin ------
    downloadRq.on('response', function (response) {
      if (!response || response.statusCode < 200 || response.statusCode > 299) {
        downloadRq.abort();
        return reject(new Error(response.statusCode));
      }
      var totalLen = response.headers['content-length'];
      var accumLen = 0;
      response.on('data', function (data) {
        accumLen += data.length;
        var proNum = Math.floor(accumLen / totalLen * 100);
        var progress = proNum > 100 ? (100 + '%') : (proNum + '%');
        console.log('Download Progress ', progress);
      });
    });
    // ------ Step 3 : read stream end ------
    downloadRq.on('end', function () {
      console.log('Download finished [%s]', downloadUrl);
    });
    // ------ Step 2 : read stream pipe into write stream ------
    downloadRq.pipe(ws);
    // ------ Step 4 : write stream finish ------
    ws.on('finish', function () {
      console.log('Successfully write file [%s]', destPath);
      resolve(destPath);
    });
    // writeStream error listener
    ws.on('error', function (err) {
      reject(err);
    });
  }.bind(this));
};

Updater.prototype.decompress = function () {

};

Updater.prototype.copy = function (source, destination) {
  var dest = destination || this.getAppExecPath();
  var parseObj = path.parse(dest);
  var cp1 = createCopyDest(parseObj, 1);
  var cp2 = createCopyDest(parseObj, 2);
  return Promise.all([copyToDest(source, cp1), copyToDest(source, cp2)]);
}

Updater.prototype.runInstaller = function (execPath, args, options) {
  return pRun[platform].apply(this, arguments);
};

Updater.prototype.install = function (copyPath, execPath, cb) {
  return pInstall[platform].apply(this, arguments);
}

Updater.prototype.run = function (execPath, args, options) {
  return pRun[platform].apply(this, arguments);
}


module.exports = Updater;
