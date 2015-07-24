chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'innerBounds': {
      'width': 1340,
      'height': 830,
      'minWidth': 1340,
      'minHeight': 650,
    }
  });
});
