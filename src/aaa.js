const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// Replace with your own client ID and secret
const CLIENT_ID =
  "648297080091-bihukjtjv86aj960vg4eg01nof13ge04.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI =
  "http://localhost:3000/1.0/organization/third-party/google-oauth-callback";

// Replace with your own email address and sender email address
const SENDER_EMAIL = "phamduytien1805@gmail.com";

// Create a new OAuth2 client
const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate the authentication URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/gmail.readonly"],
});

// Print the authentication URL to the console
console.log(`Authorize this app by visiting this URL: ${authUrl}`);

// Listen for incoming requests on port 3000
const http = require("http");
http
  .createServer((req, res) => {
    // Parse the authorization code from the query string
    const qs = require("querystring");
    const code = qs.parse(req.url.substring(2)).code;

    // Exchange the authorization code for an access token and refresh token
    oauth2Client.getToken(code, (err, tokens) => {
      if (err) {
        console.error("Error getting token", err);
        res.end("Error getting token");
        return;
      }

      // Set the access token and refresh token on the OAuth2 client
      oauth2Client.setCredentials(tokens);

      // Create a new Gmail API client
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      // Watch for new messages from the sender email address
      gmail.users.watch(
        {
          userId: "me",
          labelIds: ["INBOX"],
          topicName: "projects/your-project-name/topics/gmail",
          labelFilterAction: "include",
          q: `from:${SENDER_EMAIL}`,
        },
        (err, response) => {
          if (err) {
            console.error("Error watching messages", err);
            res.end("Error watching messages");
            return;
          }

          // Print the response to the console
          console.log(response);
          res.end("Watch successful");
        }
      );
    });
  })
  .listen(3000);

console.log("Server listening on port 3000");
