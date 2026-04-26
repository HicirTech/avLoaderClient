import * as path from "jsr:@std/path";

function removeUrls(text: string): string {
    // // Regular expression to match any URL-like prefix followed by an "@" or "]"
    // const prefixRegex = /^(?:\S+[@\]]+)?/;
    // // Replace the matched prefix with an empty string
    // return text.replace(prefixRegex, '').trim();
    const originalFileExtension= text.split(".").pop();

    // Regular expression to match any prefix and suffix
    const prefixAndSuffixRegex = /^(?:\S+[@\]]+)?(.*?)(?:-[CU]{1,2})?\.mp4$/;
    // Extract the main file name without prefix or suffix
    const match = text.match(prefixAndSuffixRegex);
    return match ? `${match[1]}.${originalFileExtension}` : text;
}

// Function to find files with a specific extension
const moveTo = async (formPaths: string[], to: string) => {
    const newFileLocations = [];
    for (const formPath of formPaths) {

        const fileName = formPath.split('\\').pop()!;
        const cleanedFileName = removeUrls(fileName);
        const targetPath = path.join(to, cleanedFileName);
        await Deno.rename(formPath, targetPath)
        newFileLocations.push(targetPath)
    }
    return newFileLocations;

}
export { moveTo };
