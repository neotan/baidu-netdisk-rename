// ==UserScript==
// @name         baidu-netdisk-rename
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  A tool for renaming files on web-based Baidu Netdisk 百度网盘网页版的文件重命名脚本
// @author       neotan
// @match        https://pan.baidu.com/disk/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @resource     purecss https://cdn.jsdelivr.net/npm/purecss@1.0.1/build/pure-min.min.css
// @resource     responsiveCss https://cdn.jsdelivr.net/npm/purecss@1.0.1/build/grids-responsive-min.css
// ==/UserScript==

;(async function() {
  'use strict'

  // ------------------- Utilities START ------------------- //

  var filemanagerUrl = 'https://pan.baidu.com/api/filemanager?opera=rename&async=2&onnest=fail&channel=chunlei&web=1&app_id=250528&bdstoken=19242d6d3971529615284f88b3e97255&logid=MTU4NDcwNjcxNjE5NzAuNDI5MDIyMzE5MjMwMzE3NzU=&clienttype=0'
  var taskqueryUrl ='https://pan.baidu.com/share/taskquery?taskid=139129799582709&channel=chunlei&web=1&app_id=250528&bdstoken=19242d6d3971529615284f88b3e97255&logid=MTU4NDcwNjcxNzk0NzAuMTg4MjI5NjY1MjE1NjQ0Nzc=&clienttype=0'

  function getFileNames() {
    var nodes = document.querySelectorAll('.file-name .text a')
    return [...nodes].map(n => n.textContent)
  }

  function createFileName(oldName, searchStr, replaceStr, applyToAll, caseSenstive) {
    var g = applyToAll ? 'g' : ''
    var i = caseSenstive ? '' : 'i'
    var rex = new RegExp(searchStr, g + i)

    return oldName.replace(rex, replaceStr)
  }

  function getCWD() {
    var addr = window.location.href
    var urlParams = new URLSearchParams(addr.substring(addr.indexOf('?') + 1))
    var cwd = urlParams.get('path')
    if (!cwd) {
      throw new Error("Can't get current working directory.")
    }
    return cwd
  }

  function getActions(cwd, fileNames, searchStr, replaceStr, applyToAll = true, caseSenstive = false) {
      return fileNames
      .map(name => {
        var path = cwd + '/' + name
        var newname = createFileName(name, searchStr, replaceStr, applyToAll, caseSenstive)

        return name !== newname ? { path, newname } : ''
      })
      .filter(action => action)
  }

  function getFormData(actions) {
    var formData = new FormData()
    formData.append('filelist', JSON.stringify(actions))

    return formData
  }

  function showMsg(msg){
    $('.msg').text(msg).show('slow').delay(10000).hide(500)
  }

  function postData(url, formData) {
    fetch(url, {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .catch(err => console.error('Error:', err))
      .then(res => console.log('Response:', res))
  }

  // ------------------- Utilities END ------------------- //

  // ------------------- Main Functions declaration START ------------------- //
  var msg = ''
  var customCss = `
        .pure-g {
          padding: 5px;
          display: flex;
          align-items: center;
          background: #f1f1f1;
        }
        .rename-form {
          width: 100%;
        }
        .rename-form > label:not(:first-child), button:not(:first-child) {
          margin-left: 5px;
        }
        .outter{
          display: flex;
        }
        .msg{
          background: #b1e279
        }
`
  var domHtml = `
<div class="outter">
      <button class="pure-button pure-button-primary toggle-btn">Toggle</button>
      <form class="pure-g pure-form rename-form">
          <label class="pure-u-1 pure-u-xl-4-24 pure-u-lg-8-24">Replace: <input type="text" name="searchStr" value=""/></label>
          <label class="pure-u-1 pure-u-xl-4-24 pure-u-lg-8-24">with: <input type="text" name="replaceStr" value=""/></label>
          <label class="pure-u-1 pure-u-xl-3-24 pure-u-lg-8-24">Extension: <input type="text" name="extention" size=10 value=".mp4" placeholder="all files"/></label>
          <label class="pure-u-1 pure-u-xl-3-24 pure-u-lg-8-24 pure-button">Case Senstive? <input type="checkbox" name="caseSenstive" checked></label>
          <label class="pure-u-1 pure-u-xl-3-24 pure-u-lg-8-24 pure-button">Apply to all? <input type="checkbox" name="applyToAll" checked></label>

          <button type="submit" class="pure-u-1 pure-u-xl-3-24 pure-u-lg-6-24 pure-button pure-button-primary">Rename!</button>
        <a class="pure-link author-label" href="https://greasyfork.org/en/scripts/398489-baidu-netdisk-rename">&#9784;</a>
      </form>
      <div class="msg">${msg}</div>
</div>
`

  function main() {
    GM_addStyle(GM_getResourceText('purecss'))
    GM_addStyle(GM_getResourceText('responsiveCss'))
    GM_addStyle(customCss)
    $('#layoutMain').prepend($(domHtml))

    // initiate listeners
    $('.toggle-btn').click(() => $('.rename-form').slideToggle('fast'))
    $('.rename-form').submit(function(event) {
      event.preventDefault()

      var urlParams = new URLSearchParams($(this).serialize())
      var searchStr = urlParams.get('searchStr')
      var replaceStr = urlParams.get('replaceStr')
      var extention = urlParams.get('extention')
      var applyToAll = urlParams.get('applyToAll')
      var caseSenstive = urlParams.get('caseSenstive')

      var fileNames = getFileNames().filter(name => name.endsWith(extention))

      var actions = getActions(getCWD(), fileNames, searchStr, replaceStr, applyToAll, caseSenstive)
      var formData = getFormData(actions)

      if (actions.length> 0) {
        postData(filemanagerUrl, formData)
        postData(taskqueryUrl, formData)
        showMsg(`${actions.length} files renamed! Please REFRESH the page.`)
      } else {
        showMsg('Nothing matched!')
      }
    })
    console.log('baidu-netdisk-rename initiated!')
  }

  // ------------------- Main Functions declaration END ------------------- //

  // ------------------- Main Functions execution START ------------------- //
  main()
})()
