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

  cacheKey: window.location.hostname + "-heartbleed-settings-cache",
  rememberKey: window.location.hostname + "-heartbleed-settings-remember",

  /**
   * Sends an XHR GET request to check current host for heartbleed vuln
   *
   * @param {string} host The host to check
   * @public
   */
  checkHost: function(host) {
    var _this = this;
    chrome.storage.sync.get(this.cacheKey, function(items) {
      if (!items.hasOwnProperty(_this.cacheKey)) {
        var url = _this.baseURL + encodeURIComponent(host);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = _this.checkResult.bind(_this);
        xhr.send(null);
      } else {
        _this.processResult(items[_this.cacheKey], _this);
      }
    });
  },

  /**
   * Handle the 'onload' event of the checkHost XHR request.
   * Only displays a warning screen if host is vulnerable.
   * Caches result in local storage to prevent constant
   * requerying.
   *
   * @param {ProgressEvent} e The XHR ProgressEvent.
   * @private
   */
  checkResult: function (e) {
    var xhr = e.target;
    if (xhr.readyState == 4) {
      this.processResult(JSON.parse(xhr.responseText));
    }
  },

  /**
   * Actually process a result string.
   * Allows processing directly from local cache.
   *
   * @param {Object} result Result of request from server
   * @private
   */
  processResult: function(result) {
    if (/^SECURE/.test(result.data)) {
      // Do nothing, site secure
    } else if (/^INSECURE/.test(result.data)) {
      console.log("Current host is vulnerable to Heartbleed OpenSSL bug CVE-2014-0160");
      this.displayWarning();
    } else {
      console.log("Error determining Heartbleed vulnerability: " + result.data);
    }

    // Cache result permanently
    var _this = this;
    chrome.storage.sync.get(this.cacheKey, function(items) {
      if (!items.hasOwnProperty(_this.cacheKey)) {
        var obj = {};
        obj[_this.cacheKey] = result;
        chrome.storage.sync.set(obj);
      }
    });
  },

  displayWarning: function() {
    var _this = this;
    chrome.storage.sync.get(this.rememberKey, function(items) {
      // Make sure we haven't shown this page and been told not to again
      if (items[_this.rememberKey]) return;

      var div = document.createElement('div');
      div.style.backgroundImage = "url('" + chrome.extension.getURL("images/semi-transparent.png") + "')";
      div.style.width = "100%";
      div.style.height = "100%";
      div.style.position = "absolute";
      div.style.left = "0";
      div.style.top = "0";
      div.style.zIndex = "9999";
      div.id = "heartbleed-blackout";

      // Load page content in from local store
      var url = chrome.extension.getURL("insecure.html");
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Content-Type", "text/html");
      xhr.onreadystatechange = function (e) {
        var xhr = e.target;
        if (xhr.readyState == 4) {
          div.innerHTML = xhr.responseText;
        }
      };
      xhr.send(null);

      // Append to body
      document.body.appendChild(div);

      _this.bindWarning();
    });
  },

  /**
   * Binds acceptClick to accept warning button. Ensures element exists first.
   *
   * @public
   */
  bindWarning: function(e) {
    if (document.getElementById("heartbleed-accept") === null) {
      setTimeout(this.bindWarning, 50);
      return;
    }

    document.getElementById("heartbleed-accept").addEventListener("click", function (e) {
      // Hide display and remember that we hid it for future checks
      document.getElementById("heartbleed-blackout").style.display = "none";

      if (document.getElementById("heartbleed-remember").checked) {
        var obj = {};
        // setTimeout above loses context so this doesn't work
        obj[heartbleedChecker.rememberKey] = true;
        chrome.storage.sync.set(obj);
      }
    });
  },
};

// Run our kitten generation script as soon as the document's DOM is ready.
heartbleedChecker.checkHost(window.location.hostname);
