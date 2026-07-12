import { downloadWebsite } from "../../file_api_service.js";

const toast = document.getElementById("toast");
const downloadForm = document.getElementById("download-form");
const urlInput = document.getElementById("url-input");
const tokenInput = document.getElementById("token-input");
const driveTokenInput = document.getElementById("drive-token-input");
const driveTokenName = document.getElementById("drive-token-name");
const downloadBtn = document.getElementById("download-btn");
const responseSection = document.getElementById("response-section");
const responseStatus = document.getElementById("response-status");
const responseBody = document.getElementById("response-body");

if (!downloadForm || !urlInput || !tokenInput || !driveTokenInput || !downloadBtn) {
    throw new Error("שגיאה בטעינת הדף. נסה לרענן עם Ctrl+Shift+R");
}

let toastTimer;

function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast visible ${type}`;
    toastTimer = setTimeout(() => {
        toast.classList.remove("visible");
    }, 4000);
}

function extractError(data) {
    if (typeof data === "string") return data;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    return "שגיאה לא ידועה";
}

function getNetworkErrorMessage(err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
        return "שגיאת רשת: לא ניתן להפעיל את הטריגר. בדוק CORS, GITHUB_TOKEN והרשאות ל-repo.";
    }
    return err.message;
}

function formatResponseBody(data, status) {
    return JSON.stringify({ status, ...data }, null, 2);
}

function showResponse(data, status) {
    const isSuccess = data.success === true;

    responseSection.classList.remove("hidden", "success", "error");
    responseSection.classList.add(isSuccess ? "success" : "error");

    responseStatus.textContent = isSuccess ? "הצלחה" : "שגיאה";
    responseBody.textContent = formatResponseBody(data, status);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

driveTokenInput.addEventListener("change", () => {
    const file = driveTokenInput.files?.[0];
    if (driveTokenName) {
        driveTokenName.textContent = file ? `נבחר: ${file.name}` : "";
    }
});

downloadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = urlInput.value.trim();
    const githubToken = tokenInput.value.trim();
    const driveTokenFile = driveTokenInput.files?.[0];

    if (!url || !githubToken || !driveTokenFile) return;

    let driveToken;
    try {
        driveToken = JSON.parse(await readFileAsText(driveTokenFile));
    } catch {
        showToast("קובץ token.json לא תקין", "error");
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = "שולח...";

    try {
        const { data, status } = await downloadWebsite(url, driveToken, githubToken);
        showResponse(data, status);

        if (data.success) {
            showToast(data.message || "הבקשה נשלחה בהצלחה", "success");
            urlInput.value = "";
            driveTokenInput.value = "";
            if (driveTokenName) driveTokenName.textContent = "";
        } else {
            showToast(extractError(data), "error");
        }
    } catch (err) {
        const message = getNetworkErrorMessage(err);

        if (responseSection && responseStatus && responseBody) {
            responseSection.classList.remove("hidden", "success");
            responseSection.classList.add("error");
            responseStatus.textContent = "שגיאה";
            responseBody.textContent = formatResponseBody({ error: message }, "—");
        }

        showToast(message, "error");
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "הורד לדרייב";
    }
});
