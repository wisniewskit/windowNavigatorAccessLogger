"use strict";

let I18NMessage = browser.i18n.getMessage("consoleMessage");

// Content script is called before any other page scripts,
// so we can override the wrapped window's properties here.
window.wrappedJSObject.eval(`(function(I18NMessage) {
  let origConsole = console;

  function trace(obj, stripFirst=2) {
    // console.trace doesn't get the full trace here, so we
    // force-throw an exception manually and log it.
    try {
      let i = Proxy(); // Guaranteed to throw per-spec (needs "new").
    } catch(_) {
      // Use a timeout so that the browser doesn't lock up as badly
      // if the tab carelessly calls methods over and over.
      setTimeout(function() {
        origConsole.error(I18NMessage.replace("OBJECT", obj) + "\\n" +
                          _.stack.split("\\n").splice(stripFirst).join("\\n"));
      }, 0);
    }
  }

  for (let key in navigator) {
    let origValue = navigator[key];
    Object.defineProperty(navigator, key, {
      get: function() {
        trace("navigator." + key);
        return origValue.constructor === Function ?
                 origValue.call(null, arguments) : origValue;
      },
      configurable: true // So reloading the addon doesn't throw an error.
    });
  }

  function overrideFn(obj, name, replacement) {
    let original = obj[name];
    replacement.toString = original.toString;
    replacement.toSource = original.toSource;
    obj[name] = function() {
      replacement.call(this, arguments);
      return original.call(this, arguments);
    }
    return replacement;
  }

  overrideFn(XMLHttpRequest.prototype, "send", function() {
    trace("XMLHttpRequest.send", 3);
  });

  overrideFn(window, "fetch", function() {
    trace("fetch", 3);
  });
}("${I18NMessage}"));`);

