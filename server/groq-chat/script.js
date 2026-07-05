import { groqChat } from "../../file_api_service.js";

const toast = document.getElementById("toast");
const chatForm = document.getElementById("chat-form");
const promptInput = document.getElementById("prompt-input");
const zipInput = document.getElementById("zip-input");
const tokenInput = document.getElementById("token-input");
const chatBtn = document.getElementById("chat-btn");
const responseSection = document.getElementById("response-section");
const responseStatus = document.getElementById("response-status");
const responseBody = document.getElementById("response-body");

if (!chatForm || !promptInput || !tokenInput || !chatBtn) {
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

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const prompt = promptInput.value.trim();
    const zip = zipInput?.checked ?? false;
    const token = tokenInput.value.trim();
    if (!prompt || !token) return;

    chatBtn.disabled = true;
    chatBtn.textContent = "שולח...";

    try {
        const { data, status } = await groqChat({ prompt, zip }, token);
        showResponse(data, status);

        if (data.success) {
            showToast(data.message || "הבקשה נשלחה בהצלחה", "success");
            promptInput.value = "";
            if (zipInput) zipInput.checked = false;
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
        chatBtn.disabled = false;
        chatBtn.textContent = "שלח";
    }
});
