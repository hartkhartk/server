const FILE_API_URL = "https://drive-ygsv.onrender.com";

export const uploadUrl = async (url) => {
    const response = await fetch(`${FILE_API_URL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { url },
    });
    return { data: await response.json(), ok: response.ok, status: response.status };
};
