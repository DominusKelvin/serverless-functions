import { TodoistApi } from "@doist/todoist-api-typescript"
import fetch from 'node-fetch';
import * as dotenv from 'dotenv'
dotenv.config()
// @ts-ignore
const todoistApi = new TodoistApi(process.env.TODOIST_USER_TOKEN)

function getTodoistProjectId(calendlyEventName, todoistProjects) {
  const todoistProjectName = calendlyEventName.includes('TKYT') ? 'TKYT' : 'Inbox'
  const todoistProject = todoistProjects.find((project) => project.name.includes(todoistProjectName))
  return todoistProject.id
}
export const handler = async (event) => {
  let webhookPayload = {} as any
  try {
    webhookPayload = JSON.parse(event.body)
    if (event.httpMethod === "POST" && webhookPayload && webhookPayload.event) {
      switch (webhookPayload.event) {
        case 'invitee.created':
          const eventUuid = webhookPayload.payload.uri.split('/')[4] // gets the UUID from the URI of the created event
          const response = await fetch(`https://api.calendly.com/scheduled_events/${eventUuid}`, {
            headers: {
              // @ts-ignore
              'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`
            }
          })
          const payload = await response.json() as any
          if (payload.resource) {
            const todoistProjects = await todoistApi.getProjects()
            const todoistProjectId = getTodoistProjectId(payload.resource.name, todoistProjects)
            todoistApi.addTask({
              content: `${payload.resource.name} with ${webhookPayload.payload.name}`,
              projectId: todoistProjectId,
              description: `You've got a ${payload.project}`,
              dueDate: payload.resource.start_time,
              priority: 2
            })
          }
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.log(error)
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Webhook event received successfully.' })
  }
}
