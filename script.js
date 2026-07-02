import { uploadUrl, getFiles } from "./file_api_service.js";

const toast = document.getElementById("toast");
const uploadForm = document.getElementById("upload-form");
const urlInput = document.getElementById("url-input");
const uploadBtn = document.getElementById("upload-btn");
const refreshBtn = document.getElementById("refresh-btn");
const filesContainer = document.getElementById("files-container");

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

function normalizeFiles(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.files)) return data.files;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function renderFiles(data) {
    const files = normalizeFiles(data);

    if (files.length === 0) {
        filesContainer.innerHTML = '<p class="empty-state">אין קבצים להצגה</p>';
        return;
    }

    const list = document.createElement("ul");
    list.className = "files-list";

    for (const file of files) {
        const item = document.createElement("li");
        item.className = "file-item";

        const name = file.name || file.filename || file.url || file.link || "קובץ";
        const link = file.url || file.link || file.download_url || file.path;

        if (link) {
            const anchor = document.createElement("a");
            anchor.href = link;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            anchor.textContent = name;
            item.appendChild(anchor);
        } else {
            item.textContent = name;
        }

        list.appendChild(item);
    }

    filesContainer.innerHTML = "";
    filesContainer.appendChild(list);
}

async function loadFiles() {
    refreshBtn.disabled = true;
    filesContainer.innerHTML = '<p class="loading">טוען...</p>';

    try {
        const { data, ok } = await getFiles();

        if (!ok) {
            throw new Error(extractError(data));
        }

        renderFiles(data);
    } catch (err) {
        filesContainer.innerHTML = `<p class="empty-state">${err.message}</p>`;
    } finally {
        refreshBtn.disabled = false;
    }
}

uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = urlInput.value.trim();
    if (!url) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = "מעלה...";

    try {
        const { data, ok } = await uploadUrl(url);

        if (!ok) {
            throw new Error(extractError(data));
        }

        showToast("הקובץ הועלה בהצלחה", "success");
        urlInput.value = "";
        await loadFiles();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "העלה";
    }
});

refreshBtn.addEventListener("click", loadFiles);
loadFiles();
