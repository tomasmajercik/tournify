import * as FileSystem from 'expo-file-system';

export const getCachedImageUri = async (url: string, token?: string): Promise<string> => {
    const fileName = url.split('/').pop();
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
        return fileUri;
    }

    try {
        const downloaded = await FileSystem.downloadAsync(url, fileUri, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return downloaded.uri;
    } catch (err) {
        console.error(`Failed to cache image: ${url}`, err);
        return url; // fallback to original if download fails
    }
};
