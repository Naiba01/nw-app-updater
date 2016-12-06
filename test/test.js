var Updater = require('../updater');
var manifest = require('../manifest.json');
var fs = require('fs');

var updater = new Updater(manifest, {
  tmpDir: 'C:\\Users\\Administrator\\Desktop\\testdl'
});
var filePath = 'C:\\Users\\Administrator\\Desktop\\testdl\\22.png';



var copyPath,execPath;
if (gui.App.argv.length) {
  copyPath = gui.App.argv[0];
  execPath = gui.App.argv[1];
  updater.install(copyPath, execPath);
  gui.App.quit();
}
updater.checkNewVersion()
  .then(function (result) {
    if (!result.hasNewVersion) {
      console.log('没有新版本');
      return;
    }
    return updater.download(result.packages);
  })
  .then(function (destPath) {
    console.log('安装包路径', destPath);
    return updater.copy(destPath);
  })
  .then(function (copyArr) {
    updater.runInstaller(copyArr[0], [copyArr[1], updater.getAppExecPath()], {});
    gui.App.quit();
  })
  .catch(function (err) {
    console.log(err);
  });
