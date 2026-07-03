const GITHUB_OWNER = "hartkhartk";
const GITHUB_REPO = "server";
const DISPATCH_EVENT = "proxy_request";
const YOUTUBE_DISPATCH_EVENT = "youtube_request";

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
        eventType === YOUTUBE_DISPATCH_EVENT ? { videos: url, token } : { url };

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

export const uploadUrl = (url, token) => dispatchUrl(url, token, DISPATCH_EVENT);
export const uploadYoutube = (videos, token) => dispatchUrl(videos, token, YOUTUBE_DISPATCH_EVENT);

function getDispatchErrorMessage(status, message) {
    if (status === 403 && message === "Resource not accessible by personal access token") {
        return "ל-token חסרה הרשאת Contents (Read and write) ל-repo server. הרשאת Actions בלבד לא מספיקה.";
    }

    return message || "שגיאה בהפעלת הטריגר";
}
