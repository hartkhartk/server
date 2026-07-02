const GITHUB_OWNER = "hartkhartk";
const GITHUB_REPO = "server";
const DISPATCH_EVENT = "proxy_request";

export const uploadUrl = async (url, token) => {
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
                event_type: DISPATCH_EVENT,
                client_payload: { url },
            }),
        }
    );

    if (response.status === 204) {
        return {
            data: {
                success: true,
                message: "הטריגר הופעל, הבקשה נשלחת לשרת דרך GitHub Actions",
                url,
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
            url,
        },
        ok: false,
        status: response.status,
    };
};

function getDispatchErrorMessage(status, message) {
    if (status === 403 && message === "Resource not accessible by personal access token") {
        return "ל-token חסרה הרשאת Contents (Read and write) ל-repo server. הרשאת Actions בלבד לא מספיקה.";
    }

    return message || "שגיאה בהפעלת הטריגר";
}
