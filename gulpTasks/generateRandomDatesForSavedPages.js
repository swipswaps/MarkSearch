'use strict'

var path = require('path')

var gulp = require('gulp')
var _ = require('lodash')
var moment = require('moment')
var coForEach = require('co-foreach')
var AppDirectory = require('appdirectory')
var existent = require('existent')

var platform = process.platform
// TODO try to get this working on Linux & Windows
var userDirectories

if(platform === 'darwin'){
  userDirectories = new AppDirectory('MarkSearch')
}
// else if(platform === 'linux'){
//
// }
 else if(platform === 'win32'){
  userDirectories = new AppDirectory('MarkSearch')
  /****
   * If MarkSearch folder is not in the AppData Local folder, then
   * use the Roaming folder.
   */
  if(!existent.sync(userDirectories.userData())){
    userDirectories = new AppDirectory({
      appName: "MarkSearch",
      useRoaming: true
    })
  }
 }

var appDataPath = userDirectories.userData()

/****
 * This is not working on Windows atm because sqlite3 is installed
 * for electron, and gulp runs node, so knex thinks the sqlite3
 * module is not installed.
 * It seems to work ok on OSX though  ¯\_(ツ)_/¯
 */

gulp.task('randomDates', () => {
  var pagesDBknex
  var appSettingsKnex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: path.join(appDataPath, 'MarkSearchAppSettings.db')
    },
    useNullAsDefault: false
  })

  return appSettingsKnex('appSettings')
    .select('pagesDBFilePath')
    .then(rows => rows[0].pagesDBFilePath)
    .then(pagesDBFilePath => {
      pagesDBknex = require('knex')({
        client: 'sqlite3',
        connection: {
          filename: pagesDBFilePath
        },
        useNullAsDefault: false
      })
    })
    .then(() => pagesDBknex('pages').select('pageUrl'))
    .then(rows =>
      _.map(rows, (row, index) => {
        var subtractKey = 'days'
        var firstRandomRange = 210
        if(index < 5){
          firstRandomRange = 5
          subtractKey = 'years'
        }
        if(index > 4 && index < 15){
          firstRandomRange = 30
        }
        row.newDateCreated = moment()
          .subtract(_.random(1, firstRandomRange), subtractKey)
          .subtract(_.random(1, 24), 'hours')
          .valueOf()
        return row
      })
    )
    .then(rows =>
      coForEach(rows, function* (row) {
        yield pagesDBknex('pages')
          .where('pageUrl', row.pageUrl)
          .update({dateCreated: row.newDateCreated})
          .then(() =>
            pagesDBknex('fts')
              .where('pageUrl', row.pageUrl)
              .update({dateCreated: row.newDateCreated})
          )
      })
    )
    .then(() => {
      console.log('Successfully changed dateCreated on rows in pagesdb')
      pagesDBknex.destroy()
      appSettingsKnex.destroy()
    })
    .catch(err => {
      console.log('Error changing dateCreated on rows in pagesdb')
      console.error(err)
      pagesDBknex.destroy()
      appSettingsKnex.destroy()
    })

})
