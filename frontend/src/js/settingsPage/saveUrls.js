'use strict'

import { xhrHeaders, progressBar$, addUrlsProgress$, progressInfo$, errorOKbutton$ } from './settingsPage'
import { hidePageSubbarAndReset } from './hideShowAddPageSubbar'
import { externalLinks } from './externalLinks'

import suspend from 'suspend'
import _ from 'lodash'
import axios from 'axios'

/****
 * @param urlsToSave - Set()
 */
function saveUrls(urlsToSave) {
  suspend(function* (genUrlsToSave) {
    var progressBarContainerWidth = addUrlsProgress$.width()
    var urlsThatErrored = []
    var progressStepAmount = progressBarContainerWidth/genUrlsToSave.size
    var error
    var index = 0
    progressBar$.velocity("stop")
    progressBar$.width(0)
    progressBar$.removeClass('hide')

    for(var url of genUrlsToSave){
      progressInfo$.text(`Saving ${ url }`)
      $.Velocity.animate(progressBar$[0], {width: (progressStepAmount*(index+1))}, 4000, 'easeInOutCubic')
      index = index + 1
      var encodedUrl = encodeURIComponent(url)
      try{
        yield axios.post(`/frontendapi/scrapeAndAdd/${ encodedUrl }`, null, {headers: xhrHeaders})
      }
      catch(err){
        console.error(err)
        error = err
        /*****
        * Yeah this is bad
        */
        var errMessage = ''
        var errorMessageOnErrorObject = _.get(err, 'message')
        var errorMessageVersion1 = _.get(err, 'response.data.errorMessage')
        var errorMessageVersion2 =_.get(err, 'response.data.errMessage')
        if(errorMessageVersion1 && errorMessageVersion1.length){
          errMessage = errorMessageVersion1
        }
        else if(errorMessageVersion2 && errorMessageVersion2.length){
          errMessage = errorMessageVersion2
        }
        else if(errorMessageOnErrorObject && errorMessageOnErrorObject.length){
          errMessage = errorMessageOnErrorObject
        }
        urlsThatErrored.push({
          url: url,
          errMessage: errMessage
        })
      }
    }
    if(error){
      progressBar$.velocity("stop")
      progressBar$.width(progressBarContainerWidth)
      progressInfo$.text(``)
      progressInfo$.css(`overflow-y`, `scroll`)
      errorOKbutton$.width(progressBarContainerWidth)
      errorOKbutton$.removeClass('hide')
      progressBar$.addClass('hide')
      var ul$ = $('<ul>')
      var errorTextBeginning = ``
      if(urlsThatErrored.length !== genUrlsToSave.size){
        errorTextBeginning = `Most URLs Saved, However `
      }
      $(`<li>${ errorTextBeginning }Errors Occured While Saving The Following URLs:</li>`).appendTo(ul$)
      for(var errUrl of urlsThatErrored){
        $(`<li class="failedUrlInfo">${ errUrl.url } - reason: ${ errUrl.errMessage }</li>`).appendTo(ul$)
      }
      $(`<li>You can try to import these URLs manually from the <a class="externalLink" href="${ 'http://' + window.location.host }">MarkSearch search page</a>.</li>`).appendTo(ul$)
      progressInfo$.append(ul$)
      $('.externalLink').click(externalLinks)
    }
    else{
      progressBar$.velocity("stop")
      $.Velocity.animate(progressBar$[0], {width: progressBarContainerWidth}, 10, 'easeOutExpo')
      progressInfo$.text(`All URLs Saved`)
      window.setTimeout(() => {
        hidePageSubbarAndReset()
      }, 3500)
    }
  })(urlsToSave)
}

export { saveUrls }
