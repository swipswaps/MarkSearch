'use strict';

var appLogger = require('../utils/appLogger')

/****
 * Error middlewares
 */
function errorMiddleware(app){
  /****
   * catch 404 and forward to error handler
   */
  app.use((req, res, next) =>{
    var err = new Error('Page Not Found')
    err.status = 404
    next(err)
  })
  /****
   * error handlers
   */
  app.use((err, req, res, next) =>{
    /****
     * errObjectToShow = {} - no stacktraces leaked to user if in production
     */
    var errObjectToShow = {}
    if(app.get('env') === 'development'){
      console.error(err.status)
      console.error(err.message)
      console.error(err)
      errObjectToShow = err
    }
    appLogger.log.error(req)
    appLogger.log.error(res)
    appLogger.log.error(err)
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: errObjectToShow
    })
  })
}

module.exports = errorMiddleware