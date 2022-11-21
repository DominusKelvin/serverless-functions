export const handler = async (event) => {
 let payload = {}
 try {
  payload = JSON.parse(event.body)
 } catch (error) {
  console.log("Could not parse JSON")
 }
  console.log(payload)
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Webhook event received successfully.'})
  }
}
