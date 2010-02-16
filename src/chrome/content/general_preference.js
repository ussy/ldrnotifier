var LDRNotifierGeneralPreference = {
  disableChange: function(id) {
    var nodes = document.evaluate("id('" + id + "')//*", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    return function(disabled) {
      for (var i = 0; i < nodes.snapshotLength; i++) {
        nodes.snapshotItem(i).disabled = disabled;
      }
    };
  },

  mouseScroll: function(element, options) {
    options = options || {};
    var step = options["step"] || 1;
    var minimum = options["minimum"] || 0;
    var maximum = options["maximum"] || Number.MAX_VALUE;
    var maxlength = parseInt(element.getAttribute("maxlength") || String(Number.MAX_VALUE).length - 1);
    return function(e) {
      if (element.value == "" || isNaN(element.value)) {
        return false;
      }

      var current = parseInt(element.value);
      var next = e.detail > 0 ? current + step : current - step;

      if (String(next).length <= maxlength) {
        element.value = next < minimum ? minimum : next < maximum ? next : maximum;
      }

      return false;
    };
  },

  load: function() {
    this.config = LDRNotifier.loadConfig();

    var enabled = document.getElementById("LDRNotifierEnabled");
    var user = document.getElementById("LDRNotifierUser");
    var interval = document.getElementById("LDRNotifierInterval");
    var visibleCount = document.getElementById("LDRNotifierVisibleCount");

    var configDisableChange = this.disableChange("LDRNotifierConfig");
    enabled.addEventListener("click", function() {
      configDisableChange(!enabled.checked);
    }, false);
    interval.addEventListener("DOMMouseScroll", this.mouseScroll(interval, {
      minimum: 1
    }), false);
    visibleCount.addEventListener("DOMMouseScroll", this.mouseScroll(visibleCount, {
      step: 10
    }), false);

    enabled.checked = this.config.enabled;
    user.value = this.config.user;
    interval.value = this.config.interval;
    visibleCount.value = this.config.visibleCount;

    configDisableChange(!enabled.checked);
  },

  show: function() {
    window.openDialog(
      "chrome://ldrnotifier/content/general_preference.xul",
      "LDRNotifier Dialog",
      "chrome, centerscreen"
    ).focus();
  },

  accept: function() {
    var enabled = document.getElementById("LDRNotifierEnabled").checked;
    var user = document.getElementById("LDRNotifierUser").value;
    var interval = document.getElementById("LDRNotifierInterval").value;
    var visibleCount = document.getElementById("LDRNotifierVisibleCount").value;

    this.config.enabled = enabled;
    this.config.user = user;
    this.config.interval = parseInt(interval);
    this.config.visibleCount = parseInt(visibleCount);
    LDRNotifier.saveConfig(this.config);
    return true;
  },
};
