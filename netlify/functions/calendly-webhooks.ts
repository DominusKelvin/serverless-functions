export const handler = async (event) => {
  const payload = JSON.parse(event.body)
  console.log(payload)
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Webhook event received successfully.'})
  }
}
