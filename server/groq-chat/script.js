import { groqChat } from "../../file_api_service.js";

const toast = document.getElementById("toast");
const chatForm = document.getElementById("chat-form");
const textInputWrap = document.getElementById("text-input-wrap");
const fileInputWrap = document.getElementById("file-input-wrap");
const promptInput = document.getElementById("prompt-input");
const fileInput = document.getElementById("file-input");
const fileName = document.getElementById("file-name");
const zipInput = document.getElementById("zip-input");
const tokenInput = document.getElementById("token-input");
const chatBtn = document.getElementById("chat-btn");
const responseSection = document.getElementById("response-section");
const responseStatus = document.getElementById("response-status");
const responseBody = document.getElementById("response-body");

if (
    !chatForm ||
    !textInputWrap ||
    !fileInputWrap ||
    !promptInput ||
    !fileInput ||
    !zipInput ||
    !tokenInput ||
    !chatBtn
) {
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

function updateInputMode() {
    const useFile = zipInput.checked;

    textInputWrap.hidden = useFile;
    fileInputWrap.hidden = !useFile;
    promptInput.required = !useFile;
    fileInput.required = useFile;

    if (!useFile) {
        fileInput.value = "";
        if (fileName) fileName.textContent = "";
    } else {
        promptInput.value = "";
    }
}

zipInput.addEventListener("change", updateInputMode);

fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (fileName) {
        fileName.textContent = file ? `נבחר: ${file.name}` : "";
    }
});

updateInputMode();

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const zip = zipInput.checked;
    const token = tokenInput.value.trim();
    if (!token) return;

    let prompt = "";
    let filename;

    if (zip) {
        const file = fileInput.files?.[0];
        if (!file) {
            showToast("נא לבחור קובץ md", "error");
            return;
        }
        if (!file.name.toLowerCase().endsWith(".md")) {
            showToast("יש לבחור קובץ עם סיומת .md", "error");
            return;
        }

        try {
            prompt = (await readFileAsText(file)).trim();
        } catch {
            showToast("שגיאה בקריאת הקובץ", "error");
            return;
        }

        if (!prompt) {
            showToast("הקובץ ריק", "error");
            return;
        }

        filename = file.name;
    } else {
        prompt = promptInput.value.trim();
        if (!prompt) {
            showToast("נא להזין פרומפט", "error");
            return;
        }
    }

    chatBtn.disabled = true;
    chatBtn.textContent = "שולח...";

    try {
        const { data, status } = await groqChat({ prompt, zip, filename }, token);
        showResponse(data, status);

        if (data.success) {
            showToast(data.message || "הבקשה נשלחה בהצלחה", "success");
            promptInput.value = "";
            fileInput.value = "";
            if (fileName) fileName.textContent = "";
            zipInput.checked = false;
            updateInputMode();
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
