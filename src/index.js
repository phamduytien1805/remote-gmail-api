const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
// import bodyParser from 'body-parser';
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOPIC_NAME = "projects/test-gmail-382511/topics/gmail-watc";

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const userId = "me";
  const query = "from:phamduytien1805@gmail.com";

  const watchRequest = {
    userId: userId,
    resource: {
      labelIds: ["INBOX"],
      topicName: "projects/test-gmail-382511/topics/gmail-watc",
      labelFilterAction: "include",
      filter: query,
    },
  };
  const gmail = google.gmail({ version: "v1", auth });

  gmail.users.watch(watchRequest, (err, res) => {
    if (err) return console.log(err);
    console.log(res);
  });
}

app.get("/", (req, res) => {
  console.log("first");
  res.send("Hello World!");
});
app.post("/push", (req, res) => {
  try {
    console.log("first", req.body);
    // res.send("Hello World!");
    const decodedData = Buffer.from(req.body.message.data, "base64").toString(
      "utf-8"
    );
    console.log("decodedData", decodedData);
    return res.sendStatus(200);
  } catch (error) {
    console.log("error", error);
  }
});
app.listen(3003, () => {
  authorize().then(listLabels).catch(console.error);
  console.log("Server listening on port 3000");
});
