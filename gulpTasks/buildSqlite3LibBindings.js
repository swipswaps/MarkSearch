'use strict'

var path = require('path')

var gulp = require('gulp')
var exeq = require('exeq')

var platform = process.platform
var electronVersion = require(path.resolve('', 'package.json')).dependencies['electron-prebuilt'].slice(1)
var useExternalSQLite = false

gulp.task('sqlite', () => {
  // TODO - make this work on Windows & Linux
  /****
   * If want to build against an external SQLite (e.g. one installed by homebrew).
   *
   * (note: sqlite3 npm lib comes with sqlite-autoconf-3090100.tar.gz (which is a litle old, but
   * does includes the fts5 addon))
   */
  var externalSQLite = ''
  if(useExternalSQLite){
    var externalSQLiteDir
    if(platform === 'darwin'){
      /****
       * Homebrew sqlite installed folder
       * /usr/local/opt/sqlite/ is a symlink to the most up to date version installed in /usr/local/Cellar/sqlite
       */
      externalSQLiteDir = '/usr/local/opt/sqlite/'
    }
    // else if(platform === 'linux'){
    //
    // }
    // else if(platform === 'win32'){
    //
    // }
    externalSQLite = `--sqlite=${ externalSQLiteDir }`
  }
  //TODO - change this back to regular install from default npm when mapbox add fts5 flags & update sqlite source verion
  var shellTask = `npm install sqlite3@https://github.com/Darkle/node-sqlite3 --runtime=electron --target=${ electronVersion } --target_arch=${ process.arch } --target_platform=${ platform } --build-from-source ${ externalSQLite }`
  console.log(`running ${ shellTask }`)

  return exeq(shellTask)
    .then(function() {
      console.log('Successfully compiled sqlite3 lib binding')
    })
    .catch(function(err) {
      console.error('There was an error building sqlite3 lib binding', err)
    })

})