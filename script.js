import { uploadUrl } from "./file_api_service.js";

const toast = document.getElementById("toast");
const uploadForm = document.getElementById("upload-form");
const urlInput = document.getElementById("url-input");
const uploadBtn = document.getElementById("upload-btn");
const responseSection = document.getElementById("response-section");
const responseStatus = document.getElementById("response-status");
const responseBody = document.getElementById("response-body");

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

function formatResponseBody(data) {
    if (data.success && data.file !== undefined) {
        if (typeof data.file === "string") {
            return data.file;
        }
        return JSON.stringify(data.file, null, 2);
    }

    return JSON.stringify(data, null, 2);
}

function showResponse(data, status) {
    const isSuccess = data.success === true;

    responseSection.classList.remove("hidden", "success", "error");
    responseSection.classList.add(isSuccess ? "success" : "error");

    responseStatus.textContent = isSuccess
        ? `הצלחה (${status})`
        : `שגיאה (${status})`;

    responseBody.textContent = formatResponseBody(data);
}

uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = urlInput.value.trim();
    if (!url) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = "מעלה...";

    try {
        const { data, status } = await uploadUrl(url);
        showResponse(data, status);

        if (data.success) {
            showToast("הקובץ הועלה בהצלחה", "success");
            urlInput.value = "";
        } else {
            showToast(extractError(data), "error");
        }
    } catch (err) {
        responseSection.classList.remove("hidden", "success");
        responseSection.classList.add("error");
        responseStatus.textContent = "שגיאה";
        responseBody.textContent = err.message;
        showToast(err.message, "error");
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "העלה";
    }
});
