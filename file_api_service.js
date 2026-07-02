const FILE_API_URL = "https://drive-ygsv.onrender.com";

export const uploadUrl = async (url) => {
    const response = await fetch(`${FILE_API_URL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
    });
    return { data: await response.json(), ok: response.ok, status: response.status };
};

export const getFiles = async () => {
    const response = await fetch(`${FILE_API_URL}/files`);
    return { data: await response.json(), ok: response.ok, status: response.status };
};
