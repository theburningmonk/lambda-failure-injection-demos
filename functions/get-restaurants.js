const DocumentClient = require('aws-sdk/clients/dynamodb').DocumentClient
const dynamodb = new DocumentClient({
  maxRetries: 3
})
const failureLambda = require('failure-lambda')
const tableName = process.env.restaurants_table
let responseCache
const defaultRestaurants = require('../static/default_restaurants.json')

module.exports.handler = failureLambda(async (event, context) => {
  const restaurants = await getRestaurants(8).catch(err => {
    console.log("max retries exceeded... executing fallbacks")
    if (responseCache) {
      console.log("returning cached response")
      return responseCache
    } else {
      console.log("returning default restaurants")
      return defaultRestaurants
    }
  })

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

  responseCache = resp.Items
  return resp.Items
}