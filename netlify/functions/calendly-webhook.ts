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
          fetch(`https://api.calendly.com/scheduled_events/${eventUuid}`, {
            headers: {
              // @ts-ignore
              'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`
            }
          }).then((response) => response.json() as any)
            .then((payload) => {
              if (payload.resource) {
                todoistApi.getProjects()
                  .then(todoistProjects => {
                    const todoistProjectId = getTodoistProjectId(payload.resource.name, todoistProjects)
                    todoistApi.addTask({
                      content: `${payload.resource.name} with ${webhookPayload.payload.name}.`,
                      projectId: todoistProjectId,
                      description: `You've got a ${payload.resource.name} meeting. ${payload.resource.location.join_url || 'Send an Ecamm Live link'}`,
                      dueDate: payload.resource.start_time,
                      priority: 4
                    }).then(task => console.log(`New todoist task \`${task.content}\` created 🚀`))
                  })
              }
            })
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
