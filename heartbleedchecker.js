// Copyright (c) 2014 Tony Lee
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

var heartbleedChecker = {
  /**
   * Base web app url for checking domains against
   *
   * @type {string}
   * @private
   */
  baseURL: 'https://heartbleedchecker.herokuapp.com/check/',

  /**
   * Sends an XHR GET request to check current host for heartbleed vuln
   *
   * @param {string} host The host to check
   * @public
   */
  checkHost: function(host) {
    console.log(host);
    var url = this.baseURL + encodeURIComponent(host);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = this.checkResult.bind(this);
    xhr.send(null);
  },

  /**
   * Handle the 'onload' event of the checkHost XHR request.
   * Only displays a warning screen if host is vulnerable.
   * Caches result in local storage with 24h timeout to prevent
   * constant requerying.
   *
   * @param {ProgressEvent} e The XHR ProgressEvent.
   * @private
   */
  checkResult: function (e) {
    var xhr = e.target;
    if (xhr.readyState == 4) {
      var resp = JSON.parse(xhr.responseText);
      console.log(resp);
    }
  },
};

// Run our kitten generation script as soon as the document's DOM is ready.
heartbleedChecker.checkHost(window.location.hostname);
