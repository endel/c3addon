import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";
import * as AdmZip from "adm-zip";
import * as httpServer from "http-server";

const downloads = require("../data/downloads.json");

const VALID_EXTENSIONS = [
    'bmp', 'css', 'fx', 'gif', 'ico',
    'jpeg', 'jpg', 'js', 'json', 'md',
    'mem', 'node', 'png', 'svg', 'txt',
    'wasm', 'xml'
];

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
    const filename = 'addon.c3addon';
    const pluginDir = getRootDir(options)

    const output = fs.createWriteStream(`${pluginDir}/${filename}`);
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
    });

    const archive = archiver('zip', { zlib: { level: 9 } });

    // catch warnings and errors
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            console.error(err);
        } else {
            throw err;
        }
    });

    archive.on('error', (err) => { throw err });

    archive.pipe(output);
    archive.glob(`**/*.{${VALID_EXTENSIONS.join(',')}}`);
    archive.finalize();
}

export function docs (options: any) {
    console.log("Not implemented.");
}

function getRootDir (options) {
    return path.resolve(options.root || ".");
}
