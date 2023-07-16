import puppeteer from 'puppeteer';

export interface PublishOptions {
  addonUrl?: string,
  uploadFile?: string,
  version?: string,
  authUser?: string,
  authPassword?: string,
  releaseNotes?: string,
}

export async function publish(options: PublishOptions = {}) {
  const addonUrl = options.addonUrl || process.env.ADDON_URL;
  const uploadFile = options.uploadFile || process.env.UPLOAD_FILE;
  const version = options.version || process.env.VERSION;
  const authUser = options.authUser || process.env.USERNAME;
  const authPassword = options.authPassword || process.env.PASSWORD;
  const releaseNotes = options.releaseNotes || process.env.RELEASE_NOTES || "Released via c3addon (https://npmjs.com/package/c3addon)";

  if (!addonUrl) throw new Error(`Please provide an Addon URL (received ${addonUrl})`);
  if (!uploadFile) throw new Error(`Please provide a file to upload (received ${uploadFile})`);
  if (!version) throw new Error(`Please provide a version (received ${version})`);
  if (!authUser) throw new Error(`Please provide an auth user (received ${authUser})`);
  if (!authPassword) throw new Error(`Please provide an auth password (received ${authPassword})`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  // fake user agent
  page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36");

  // first, login.
  console.log("Logging in...");
  await page.goto("https://www.construct.net/en/login");
  await page.type("#Username", authUser);
  await page.type("#Password", authPassword);
  await Promise.all([
    page.waitForNavigation(),
    page.click("#BtnLogin")
  ]);

  // first, create the release.
  console.log("Creating release number...");
  await page.goto(addonUrl + "/edit/releases");
  await page.type("#ReleaseVersion", version);
  console.info(`Creating release ${version}`);
  await Promise.all([
    page.waitForNavigation(),
    page.click("#BtnCreateRelease"),
  ]);

  // update the release notes.
  console.log("Updating release notes...");
  await page.type("#RichContent", releaseNotes);
  await Promise.all([
    page.waitForNavigation(),
    page.click("#BtnUpdateRelease"),
  ])

  // upload the file.
  console.log("Uploading file...");
  await page.click("#UploadReleaseButton");
  const fileInput = await page.$("input[type=file]");
  if (fileInput) {
    await fileInput.uploadFile(uploadFile);
    // submit the upload.
    console.info(`Uploading file ${uploadFile}...`);
    await Promise.all([
      page.waitForNavigation(),
      page.click('.ui-dialog .ui-dialog-buttonset button:last-child')
    ]);
  } else {
    throw new Error("failed to find file input");
  }


  // publish the release.
  await Promise.all([
    page.waitForNavigation(),
    page.click("#BtnPublishRelease"),
  ]);

  // wait for "This release is now published!" to appear
  await page.waitForSelector('.notification.success', { timeout: 10000 });

  // close the browser!
  await browser.close();
}
