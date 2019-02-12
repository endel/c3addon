import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as AdmZip from "adm-zip";
import * as httpServer from "http-server";
import * as glob from "glob";
import * as opn from "opn";

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

    C3 Addon SDK Documentation: https://www.construct.net/br/make-games/manuals/addon-sdk
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

    const server = httpServer.createServer({
        root: getRootDir(options),
        cors: true
    });

    server.listen(port);

    opn("https://editor.construct.net", { app: [getChromeName(), "--disable-web-security", "--disable-extensions", "--disable-plugins"] });

    console.log(`Development server started.`);
    console.log('');
    console.log(`1. Click on "Menu" > "View" > "Addon manager"`);
    console.log(`2. Click on "Add dev addon". Enter this URL: http://localhost:${port}/addon.json`);
    console.log('');
    console.warn(`How to enable Developer Mode:\nhttps://www.construct.net/br/make-games/manuals/addon-sdk/guide/using-developer-mode`);
}

export function pack (options: any) {
    const pluginDir = getRootDir(options)
    const addonJson = require(pluginDir + "/addon.json");
    const filename = `${addonJson.id}.c3addon`;

    const zipFile = new AdmZip();

    glob(`${pluginDir}/**/*.{${VALID_EXTENSIONS.join(',')}}`, (err, files) => {
        files.forEach(file => {
            if (file !== pluginDir) {
                const relativeFilename = file.replace(pluginDir, "").substr(1);
                console.log("Packing...", relativeFilename);
                zipFile.addFile(relativeFilename, fs.readFileSync(file));
            }
        });

        console.log("Done.");
        console.log(`Generated: '${filename}'`);
        zipFile.writeZip(`${path.resolve(".")}/${filename}`);
    });
}

export function docs (options: any) {
    const inputPath = getRootDir(options);
    const langFilePath = path.resolve(inputPath, "lang", "en-US.json");

    if (!fs.existsSync(langFilePath)) {
        console.error(`File not found: '${langFilePath}'`);
        process.exit();
    }
    const langFile = JSON.parse(fs.readFileSync(langFilePath).toString());
    let markdownOutput = "";

    for (const pluginName in langFile.text.plugins) {
        const plugin = langFile.text.plugins[pluginName];
        markdownOutput += `# ${pluginName}\n\n`;

        if (Object.keys(plugin.properties).length > 0) {
            markdownOutput += "## Properties\n\n"

            for (const propertyName in plugin.properties) {
                const property = plugin.properties[propertyName];
                markdownOutput += `### ${property.name}\n`
                markdownOutput += `${property.desc}\n\n`;
            }
        }

        ['Actions', 'Conditions', 'Expressions'].forEach(aclName => {
            const acl = aclName.toLowerCase();

            if (Object.keys(plugin[acl]).length > 0) {
                markdownOutput += `## ${aclName}\n\n`

                for (const name in plugin[acl]) {
                    const child = plugin[acl][name];
                    markdownOutput += `### ${child['display-text'] || child['translated-name']}\n`
                    markdownOutput += `${child['description']}\n\n`;
                }
            }
        });
    }

    console.log(markdownOutput);
}

function getRootDir (options) {
    return path.resolve(options.root || ".");
}

function getChromeName() {
  const platform: any = process.platform;
  let app = "";

  if (platform == "darwin") {
    app = "google chrome";

  } else if (platform === "win32" || platform === "win64") {
    app = "chrome"

  } else if (platform == "linux") {
    app = "google-chrome";
  }

  return app;
}
