chrome.runtime.onInstalled.addListener(() => {
    console.log("Article Summarizer Extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        fetch(`https://gemini.googleapis.com/v1/summarize`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer AIzaSyDdxeA8CniX51-H8erxReeo6n38t2571sA`
            },
            body: JSON.stringify({
                url: request.url
            })
        })
            .then(response => response.json())
            .then(data => {
                sendResponse({ summary: data.summary }); // Adjust based on the API's response structure
            })
            .catch(error => {
                console.error("Error fetching summary:", error);
                sendResponse({ summary: "Error fetching summary." });
            });
        return true; // Keep the message channel open for sendResponse
    }
});