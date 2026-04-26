import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";

const containsChinese = (text: string): boolean => {
    const fileName = text.split("\\").pop()!;
    const hasChinese = Boolean(fileName.match(/[\u3400-\u9FBF]/));
    return hasChinese;
}



// Function to find files with a specific extension
const findFilesWithExtension = async (directory: string, extension: string) => {
    const files = [];
    for await (const entry of walk(directory, { includeDirs: false, exts: [extension] })) {
        const pathName = entry.path;
        const pathHasChinese = containsChinese(pathName);
        if (!pathHasChinese) {
            files.push(entry.path);
        } else {
            console.log(`Ignore ${entry.path}`)
        }
    }
    return files;
}
export { findFilesWithExtension };
