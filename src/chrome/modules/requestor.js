var EXPORTED_SYMBOLS = ["Requestor"];

var Requestor = {
  config: null,
  fire: false,
  count: 0,
  requestTimer: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),

  startInterval: function(config) {
    var isRequested = (this.config != null);
    this.config = config;
    if (!isRequested) {
      this._request();
      this.requestTimer.initWithCallback({
        notify: this._request
      }, this.config.interval * 60000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
    }
  },

  stopInterval: function() {
    this.config = null;
    this.requestTimer.cancel();
  },

  _request: function() {
    var timeoutTimer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "LDRNotifierTopic", "begin");

    var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
    req.QueryInterface(Components.interfaces.nsIDOMEventTarget);
    req.addEventListener("load", function() {
      timeoutTimer.cancel();

      if (!(req.readyState == 4 && req.status == 200)) {
        notifyError();
        return;
      }

      var count = parseInt(req.responseText.split("|")[1]);
      count = isNaN(count) ? -1 : count;
      Requestor.count = count;
      Requestor.fire = (count < Requestor.config.visibleCount) ? false : Requestor.fire;

      observerService.notifyObservers(null, "LDRNotifierTopic", "receive");
      if (Requestor.config.visibleCount > 0 &&
          count >= Requestor.config.visibleCount &&
          !Requestor.fire) {
        notifyFire(count);
      }
    }, false);

    if (!("@mozilla.org/extensions/manager;1" in Components.classes)) {
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID("ldrnotifier@pshared.net", function(addon) {
        request(addon);
      });
    } else {
      var addon = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager).getItemForID("ldrnotifier@pshared.net");
      request(addon);
    }

    function request(addon) {
      req.QueryInterface(Components.interfaces.nsIXMLHttpRequest);
      req.open("GET", "http://rpc.reader.livedoor.com/notify?user=" + Requestor.config.user, true);
      req.setRequestHeader("User-Agent", addon.name + "/" + addon.version, false);
      req.send(null);

      timeoutTimer.initWithCallback({
        notify: function() {
          req.abort();
          notifyError();
        }
      }, 10000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    }

    function notifyFire(count) {
      var bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
      var bundle = bundleService.createBundle("chrome://ldrnotifier/locale/ldrnotifier.properties");

      var alertService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
      alertService.showAlertNotification(
        "chrome://ldrnotifier/skin/icon.png",
        "LDR Notifier",
        bundle.formatStringFromName("unread_entries", [count], 1),
        true,
        "",
        {
          observe: function(aSubject, aTopic, aData) {
            if (aTopic == "alertclickcallback") {
              Requestor.openLDR();
            }
          }
        }
      );

      Requestor.fire = true;
    }

    function notifyError() {
      Requestor.count = -1;
      observerService.notifyObservers(null, "LDRNotifierTopic", "receive");
    }
  },

  observe: function(aSubject, aTopic, aData) {
    switch (aTopic) {
    case "quit-application-requested":
      Requestor.observerService.removeObserver(Requestor, "quit-application-requested");
      Requestor.stopInterval();
      break;
    }
  },

  openLDR: function() {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    var window = wm.getMostRecentWindow("navigator:browser");
    if (!window) {
      return;
    }

    var tab = window.gBrowser.addTab("http://reader.livedoor.com/reader/");
    window.gBrowser.selectedTab = tab;
  }
};
