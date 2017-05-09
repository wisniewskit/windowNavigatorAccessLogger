"use strict";

let I18NMessage = browser.i18n.getMessage("consoleMessage");

// Content script is called before any other page scripts,
// so we can override the wrapped window's properties here.
window.wrappedJSObject.eval(`(function(I18NMessage) {
  let origConsole = console;
  for (let key in navigator) {
    let origValue = navigator[key];
    Object.defineProperty(navigator, key, {
      get: function() {
        // console.trace doesn't get the full trace here, so we
        // force-throw an exception manually and log it.
        try {
          let i = Proxy(); // Guaranteed to throw per-spec (needs "new").
        } catch(_) {
          origConsole.error(I18NMessage.replace("KEY", key) + "\\n" + _.stack);
        }
        return origValue.constructor === Function ?
                 origValue.call(null, arguments) : origValue;
      },
      configurable: true // So reloading the addon doesn't throw an error.
    });
  }
}("${I18NMessage}"));`);

