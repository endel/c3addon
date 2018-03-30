import * as httpServer from "http-server";
import * as archiver from "archiver";
import * as fs from "fs";
import * as path from "path";

const VALID_EXTENSIONS = [
    'bmp', 'css', 'fx', 'gif', 'ico',
    'jpeg', 'jpg', 'js', 'json', 'md',
    'mem', 'node', 'png', 'svg', 'txt',
    'wasm', 'xml'
];

export function init () {
    console.log("INIT!");
}

export function serve () {
    let server = httpServer.createServer({ cors: true });
    server.listen(5432);
    console.log("Local server is running on http://localhost:5432");
}

export function pack () {
    const filename = 'addon.c3addon';
    const pluginDir = path.resolve('.');

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

export function docs () {
    console.log("DOCS!");
}