import { Worker, Job} from 'bullmq'
import dotenv from "dotenv"
import { redisConnection } from "./queue.js"

dotenv.config()

interface GitHubWebhookJobData {
  event?: string
  deliveryId?: string
  payload?: unknown
}

const worker = new Worker('github-webhooks',
    async (job: Job<GitHubWebhookJobData>) => {
        console.log("starting job: ", job.id)

        const { event, deliveryId } = job.data

        if(!event) throw new Error("Missing event in job data")

        console.log("delivery id: ", deliveryId)
        console.log("event: ", event)

        if(event === 'push') console.log("push event detected")
        else console.log("non-push event detected: ", event)

        return "fini"
    },
{
    connection: redisConnection,
    concurrency: 5
  }
)

worker.on("failed", (job, err) => {
  console.error("failed", job?.id, err.message)
})

worker.on("error", (err) => {
  console.error("worker error:", err)
})

process.on("SIGINT", async () => {
  await worker.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await worker.close()
  process.exit(0)
})