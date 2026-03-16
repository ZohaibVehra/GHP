import express from "express"
import dotenv from "dotenv"
import crypto from "crypto"
import { myQueue } from "./queue.js"

dotenv.config()

const app = express()

interface GitHubWebhookJobData {
  event?: string
  deliveryId?: string
  payload?: unknown
}

app.use(express.json({
  verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf
  }
}))


if (!process.env.GITHUB_WEBHOOK_SECRET) {
  throw new Error("Missing GITHUB_WEBHOOK_SECRET")
}

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

    const eventHeader = req.headers["x-github-event"]
    const deliveryHeader = req.headers["x-github-delivery"]

    const event = typeof eventHeader === "string" ? eventHeader : undefined
    const deliveryId = typeof deliveryHeader === "string" ? deliveryHeader : undefined

    if (!event || !deliveryId) {
      res.sendStatus(400)
      return
    }

    console.log("From server, verified event:", event)
    console.log("From server, delivery id:", deliveryId)

    const jobData: GitHubWebhookJobData = {
      event,
      deliveryId,
      payload: req.body,
    }

    await myQueue.add("github-webhook", jobData, {
      jobId: deliveryId,
    })
  
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.sendStatus(500)
  }
})

app.listen(3000, () => {
  console.log("listening on 3000")
})