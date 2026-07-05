const GITHUB_OWNER = "hartkhartk";
const GITHUB_REPO = "server";
const DISPATCH_EVENT = "proxy_request";
const YOUTUBE_DISPATCH_EVENT = "youtube_request";
const GET_LIST_DISPATCH_EVENT = "get_list";
const GOOGLE_SEARCH_DISPATCH_EVENT = "google_search";
const GROQ_CHAT_DISPATCH_EVENT = "groq_chat";

async function dispatchUrl(url, token, eventType) {
    if (!token) {
        return {
            data: {
                success: false,
                error: "חסר GitHub Token",
            },
            ok: false,
            status: 0,
        };
    }
    const clientPayload =
        eventType === YOUTUBE_DISPATCH_EVENT
            ? { videos: url, token }
            : eventType === GET_LIST_DISPATCH_EVENT
              ? { url, token }
              : { url };

    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
        {
            method: "POST",
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
                event_type: eventType,
                client_payload: clientPayload,
            }),
        }
    );

    if (response.status === 204) {
        const data = {
            success: true,
            message: "הטריגר הופעל, הבקשה נשלחת לשרת דרך GitHub Actions",
        };
        if (eventType === YOUTUBE_DISPATCH_EVENT) {
            data.videos = url;
            data.token = token;
        } else if (eventType === GET_LIST_DISPATCH_EVENT) {
            data.url = url;
            data.token = token;
        } else {
            data.url = url;
        }
        return {
            data,
            ok: true,
            status: response.status,
        };
    }

    let errorData = {};
    try {
        errorData = await response.json();
    } catch {
        errorData = {};
    }

    return {
        data: {
            success: false,
            error: getDispatchErrorMessage(response.status, errorData.message),
            url,
        },
        ok: false,
        status: response.status,
    };
}

export const uploadUrl = (urls, token) => dispatchUrl(urls, token, DISPATCH_EVENT);
export const uploadYoutube = (videos, token) => dispatchUrl(videos, token, YOUTUBE_DISPATCH_EVENT);
export const getList = (url, token) => dispatchUrl(url, token, GET_LIST_DISPATCH_EVENT);
export const getYoutubeList = (url, token) => dispatchUrl(url, token, GET_LIST_DISPATCH_EVENT);

function getDispatchErrorMessage(status, message) {
    if (status === 403 && message === "Resource not accessible by personal access token") {
        return "ל-token חסרה הרשאת Contents (Read and write) ל-repo server. הרשאת Actions בלבד לא מספיקה.";
    }

    return message || "שגיאה בהפעלת הטריגר";
}

async function dispatchPayload(clientPayload, token, eventType) {
    if (!token) {
        return {
            data: { success: false, error: "חסר GitHub Token" },
            ok: false,
            status: 0,
        };
    }

    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
        {
            method: "POST",
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
                event_type: eventType,
                client_payload: clientPayload,
            }),
        }
    );

    if (response.status === 204) {
        return {
            data: {
                success: true,
                message: "הטריגר הופעל, הבקשה נשלחת לשרת דרך GitHub Actions",
                ...clientPayload,
            },
            ok: true,
            status: response.status,
        };
    }

    let errorData = {};
    try {
        errorData = await response.json();
    } catch {
        errorData = {};
    }

    return {
        data: {
            success: false,
            error: getDispatchErrorMessage(response.status, errorData.message),
            ...clientPayload,
        },
        ok: false,
        status: response.status,
    };
}

export async function googleSearch({ text, site, tag }, token) {
    if (!text?.trim()) {
        return {
            data: { success: false, error: "חסר טקסט חיפוש" },
            ok: false,
            status: 0,
        };
    }

    const clientPayload = { text: text.trim() };
    const siteValue = site?.trim();
    const tagValue = tag?.trim();
    if (siteValue) clientPayload.site = siteValue;
    if (tagValue) clientPayload.tag = tagValue;

    return dispatchPayload(clientPayload, token, GOOGLE_SEARCH_DISPATCH_EVENT);
}

export async function groqChat(prompt, token) {
    if (!prompt?.trim()) {
        return {
            data: { success: false, error: "חסר פרומפט" },
            ok: false,
            status: 0,
        };
    }

    return dispatchPayload({ prompt: prompt.trim() }, token, GROQ_CHAT_DISPATCH_EVENT);
}
