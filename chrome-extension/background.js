chrome.commands.onCommand.addListener((command) => {
    if (command === "_execute_action") {
        chrome.action.openPopup();
    }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));