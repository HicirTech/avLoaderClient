import { sleep } from "https://deno.land/x/sleep@v1.3.0/mod.ts";
import { converToNfo } from "./convertToNfo.ts";

const dofetch = async (host: string, targetPath: string, cookie?: string) => {
    const finsihed = [] as string[];

    const fin2 = Deno.readDirSync(targetPath);

    for (const dirEntry of fin2) {
        if (dirEntry.isDirectory) {
            continue;
        }
        const fileName = dirEntry.name;
        const [name, ext] = fileName.split(".");
        if (ext.includes("nfo")) {
            finsihed.push(name!);
        }
    }

    const fin = Deno.readDirSync(".\\output");
    for (const dirEntry of fin) {
        const fileName = dirEntry.name;
        const noExtName = fileName.split(".").shift();
        finsihed.push(noExtName!);
    }

    const templateByte = await Deno.readFile("./template.txt");
    const template = new TextDecoder().decode(templateByte);

    const errors = [] as string[];
    const rest = Deno.readDirSync(targetPath);


    for (const dirEntry of rest) {
        const fileName = dirEntry.name;
        const noExtName = fileName.split(".").shift();
        if (!noExtName) {
            continue;
        }
        const notAFile = dirEntry.isDirectory;
        if (
            finsihed.includes(noExtName!) || notAFile
        ) {
            continue;
        }

        try {
            const rest = await fetch(`${host}?name=${noExtName}`, {
                method: "POST",
                body: JSON.stringify({
                    name: noExtName,
                    cookie
                })
            });

            const resultJson = (await rest.json()) as {
                [key: string]: string[] | string;
            };

            const insertTarget = await converToNfo(resultJson);

            const resultNfoContent = template.replace("TO_INSERT", insertTarget);
            await Deno.writeTextFile(`./output/${noExtName}.nfo`, resultNfoContent);
            console.log(`finished ${fileName} successfully`);
            await sleep(5);
        } catch (err) {
            console.log(err);
            console.log(`${dirEntry.name} in error`);
            errors.push(fileName);
        }
    }
    console.log(`${errors}`);
}

export { dofetch }