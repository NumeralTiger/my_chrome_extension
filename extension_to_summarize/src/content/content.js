function extractText() {
    let bodyText = document.body.innerText;
    return bodyText;
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        const textToSummarize = extractText();
        sendResponse({ text: textToSummarize });
    }
});