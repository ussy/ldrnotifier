var LDRNotifier = {
  observerService: null,
  config: {
    enabled: true,
    interval: 5,
    visibleCount: 0,
    user: ""
  },

  setPref: function(prefName, value) {
    var prefs = Components.classes["@mozilla.org/preferences;1"].getService(Components.interfaces.nsIPrefBranch);
    var type = prefs.getPrefType(prefName);
    switch (type) {
     case Components.interfaces.nsIPrefBranch.PREF_STRING:
      prefs.setCharPref(prefName, value);
      break;
     case Components.interfaces.nsIPrefBranch.PREF_INT:
      prefs.setIntPref(prefName, value);
      break;
     case Components.interfaces.nsIPrefBranch.PREF_BOOL:
    default:
      prefs.setBoolPref(prefName, value);
      break;
    }
  },

  getPref: function(prefName, defaultValue) {
    var prefs = Components.classes["@mozilla.org/preferences;1"].getService(Components.interfaces.nsIPrefBranch);
    var type = prefs.getPrefType(prefName);

    try {
      switch (type) {
       case Components.interfaces.nsIPrefBranch.PREF_STRING:
        return prefs.getCharPref(prefName);
       case Components.interfaces.nsIPrefBranch.PREF_INT:
        return prefs.getIntPref(prefName);
       case Components.interfaces.nsIPrefBranch.PREF_BOOL:
      default:
        return prefs.getBoolPref(prefName);
      }
    } catch (x) {
      return defaultValue;
    }
  },

  loadConfig: function() {
    var enabled = this.getPref("extensions.LDRNotifier.enabled", true);
    var user = this.getPref("extensions.LDRNotifier.user", "");
    var interval = this.getPref("extensions.LDRNotifier.interval", 5);
    if (interval < 1) {
      interval = 5;
    }

    var visibleCount = this.getPref("extensions.LDRNotifier.visibleCount", 0);
    if (visibleCount < 0) {
      visibleCount = 0;
    }

    return {
      "enabled": enabled,
      "user": user,
      "interval": interval,
      "visibleCount": visibleCount
    };
  },

  saveConfig: function(config) {
    this.setPref("extensions.LDRNotifier.enabled", config.enabled);
    this.setPref("extensions.LDRNotifier.user", config.user);
    this.setPref("extensions.LDRNotifier.interval", config.interval);
    this.setPref("extensions.LDRNotifier.visibleCount", config.visibleCount);
  },

  onLoad: function() {
    this.observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    this.observerService.addObserver(this, "LDRNotifierTopic", false);

    var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    this._branch = prefService.getBranch("extensions.LDRNotifier.");
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this._branch.addObserver("", this, false);

    this.config = this.loadConfig();
    this.drawPanel();

    var count = Requestor.count;
    this._visibleIcon(count);

    if (this.config.enabled) {
      Requestor.startInterval(this.config);
    }
  },

  onUnload: function() {
    this.observerService.removeObserver(this, "LDRNotifierTopic");
    this._branch.removeObserver("", this);
  },

  handleEvent: function(evt) {
    switch (evt.type) {
     case "load":
      window.removeEventListener("load", this, false);
      this.onLoad(evt);
      break;
     case "unload":
      window.removeEventListener("unload", this, false);
      this.onUnload(evt);
      break;
    }
  },

  observe: function(aSubject, aTopic, aData) {
    switch (aTopic) {
     case "nsPref:changed":
      this.config = this.loadConfig();
      this.drawPanel();

      if (this.config.enabled) {
        Requestor.stopInterval();
        var self = this;
        setTimeout(function() {
          Requestor.startInterval(self.config);
        }, 0);
      } else {
        Requestor.stopInterval();
      }

      break;
     case "LDRNotifierTopic":
      var panel = document.getElementById("LDRNotifierPanel");
      if (aData == "begin") {
        panel.setAttribute("class", "check");
      } else if(aData == "receive") {
        var count = Requestor.count;
        this._visibleIcon(count);
        panel.removeAttribute("class");
      }
    }
  },

  switchEnabled: function() {
    this.config.enabled = !this.config.enabled;
    this.saveConfig(this.config);
  },

  onMouseClick: function(e) {
    if (e.button == 0) {
      Requestor.openLDR();
    }
  },

  drawPanel: function() {
    var panel = document.getElementById("LDRNotifierPanel");
    var label = document.getElementById("LDRNotifierPanelLabel");
    var contextEnabled = document.getElementById("LDRNotifierContextEnabled");

    contextEnabled.setAttribute("checked", this.config.enabled);

    var count = parseInt(label.value || 0);
    this._visibleIcon(count);

    panel.className = "";
    panel.setAttribute("status", (this.config.enabled ? "enabled" : "disabled"));
  },

  _visibleIcon: function(count) {
    var panel = document.getElementById("LDRNotifierPanel");
    if (count != -1 && count < this.config.visibleCount) {
      panel.style.display = "none";
    } else if (count != -1 && panel.style.display == "none") {
      panel.style.display = "";
    }

    document.getElementById("LDRNotifierPanelLabel").value = count;
  }
};
