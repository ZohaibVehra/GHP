import { Queue, QueueEvents }  from "bullmq"
import dotenv from "dotenv"

dotenv.config() 

if (!process.env.REDIS) throw new Error("Missing REDIS")
if (!process.env.TOKEN) throw new Error("Missing TOKEN")

export const redisConnection = {
  host: process.env.REDIS,
  password: process.env.TOKEN,
  port: 6379,
  tls: {},
}

export const myQueue = new Queue('github-webhooks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
        delay: 1000,
        type: "exponential"
    },
    removeOnComplete: true,
    removeOnFail: 1000
  }
});


myQueue.on("error", (err: Error) => console.log('Queue Error Found: ', err)
)


export const queueEvents = new QueueEvents("github-webhooks", {
    connection: redisConnection
})

queueEvents.on("completed", ({ jobId }) => console.log(`Job ${jobId} completed`))

queueEvents.on("failed", ({ jobId, failedReason }) => console.error(`Job ${jobId} failed: ${failedReason}`))

process.on("SIGINT", async () => {
  await myQueue.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await myQueue.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  await queueEvents.close()
  await myQueue.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  await queueEvents.close()
  await myQueue.close()
  process.exit(0)
})