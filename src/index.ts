import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as AdmZip from "adm-zip";
import * as httpServer from "http-server";
import * as glob from "glob";

const downloads = require("../data/downloads.json");

const VALID_EXTENSIONS = [
    'bmp', 'css', 'fx', 'gif', 'ico',
    'jpeg', 'jpg', 'js', 'json', 'md',
    'mem', 'node', 'png', 'svg', 'txt',
    'wasm', 'xml'
];

export function help (options: any) {
    console.log(`Usage:
    c3addon [command] [options] [--root dir]

    Available commands:
        init [${Object.keys(downloads).join("|")}]
        (Bootstrap an empty addon project)

        serve [--port 8080]
        (Start an http server for local development)

        pack
        (Pack your addon into addon.c3addon, to be uploaded on Construct 3 Addon Listing)

        docs
        (Generate docs.md file based on your aces.json)

    General help:
        - C3 Addon SDK Documentation: https://www.construct.net/br/make-games/manuals/addon-sdk
        - Enable developer mode on Construct 3: https://www.construct.net/br/make-games/manuals/addon-sdk/guide/using-developer-mode
        - Open the Addon Manager, click on "Add dev addon", and enter this URL: http://localhost:5432/addon.json
`);
}

export function init (options: any) {
    const type = options._[3];
    if (!downloads[type]) {
        console.error(`You must call "c3addon init [${Object.keys(downloads).join("|")}]"`);
        return;
    }

    const outputPath = getRootDir(options);
    const tmpZipPath = path.resolve('tmp.zip');

    const zipFile = fs.createWriteStream(tmpZipPath);
    const request = https.get(downloads[type], function (response) {
        response.pipe(zipFile);
    });

    zipFile.on('close', function () {
        // extract zip contents
        const zip = new AdmZip(tmpZipPath);
        zip.extractAllTo(outputPath);

        const entries = zip.getEntries(); // an array of ZipEntry records
        entries.forEach((zipEntry) => console.log("Added:", zipEntry.entryName));

        // remove temporary zip file
        fs.unlinkSync(tmpZipPath);

        console.log("Success!");
    });
}

export function serve (options: any) {
    const port = options.port || 5432;
    const server = httpServer.createServer({ cors: true });
    server.listen(port);
    console.log(`Development server running on: http://localhost:${port}`);
}

export function pack (options: any) {
    const pluginDir = getRootDir(options)
    const addonJson = require(pluginDir + "/addon.json");
    const filename = `${addonJson.id}.c3addon`;

    const output = fs.createWriteStream(`${path.resolve(".")}/${filename}`);
    const zipFile = new AdmZip();

    glob(`${pluginDir}/**/*.{${VALID_EXTENSIONS.join(',')}}`, (err, files) => {
        files.forEach(file => {
            if (file !== pluginDir) {
                const relativeFilename = file.replace(pluginDir, "");
                console.log("Packing...", relativeFilename);
                zipFile.addFile(relativeFilename, fs.readFileSync(file));
            }
        });

        output.write(zipFile.toBuffer());
        console.log("Done.");
        console.log(`Generated: '${filename}'`);
    });
}

export function docs (options: any) {
    console.log("Not implemented.");
}

function getRootDir (options) {
    return path.resolve(options.root || ".");
}
