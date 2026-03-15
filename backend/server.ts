import express from "express"
import { App } from "octokit"
import fs from "fs"
import dotenv from "dotenv"
import crypto from "crypto"

dotenv.config()

const app = express()

app.use(express.json({
  verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf
  }
}))

const privateKey = fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH!, "utf8")

const githubApp = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey,
})

function verifyGitHubSignature(req: express.Request & { rawBody?: Buffer }) {
  const signature = req.header("x-hub-signature-256")
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

  if (!signature || !webhookSecret || !req.rawBody) {
    return false
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex")

  const signatureBuffer = Buffer.from(signature, "utf8")
  const expectedBuffer = Buffer.from(expectedSignature, "utf8")

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}

app.post("/webhook", async (req: express.Request & { rawBody?: Buffer }, res) => {
  try {
    const isValid = verifyGitHubSignature(req)

    if (!isValid) {
      console.log("invalid webhook signature")
      res.sendStatus(401)
      return
    }

    const event = req.headers["x-github-event"]
    console.log("verified event:", event)

    if (event === "push") {
      const installationId = req.body.installation?.id
      const owner = req.body.repository?.owner?.login
      const repo = req.body.repository?.name

      if (!installationId || !owner || !repo) {
        res.sendStatus(400)
        return
      }

      const auth = await githubApp.getInstallationOctokit(installationId)

      const authResult = await auth.auth({
        type: "installation"
      })

      if (!authResult || typeof authResult !== "object" || !("token" in authResult)) {
        throw new Error("Failed to get installation token")
      }

      console.log(
        "installation token:",
        String(authResult.token).substring(0, 20) + "..."
      )

      const repoInfo = await auth.request("GET /repos/{owner}/{repo}", {
        owner,
        repo,
      })

      console.log("repo:", repoInfo.data.full_name)
      console.log("default branch:", repoInfo.data.default_branch)
    }

    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.listen(3000, () => {
  console.log("listening on 3000")
})