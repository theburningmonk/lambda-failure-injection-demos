const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient()
const failureLambda = require('failure-lambda')
const tableName = process.env.restaurants_table

module.exports.handler = failureLambda(async (event, context) => {
  const restaurants = await getRestaurants(8)
  return {
    statusCode: 200,
    body: JSON.stringify(restaurants)
  }
})

async function getRestaurants(count) {
  console.log(`fetching ${count} restaurants from ${tableName}...`)
  const req = {
    TableName: tableName,
    Limit: count
  }

  const resp = await dynamodb.scan(req).promise()
  console.log(`found ${resp.Items.length} restaurants`)
  return resp.Items
}