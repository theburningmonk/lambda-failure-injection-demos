const fs = require("fs")
const Mustache = require('mustache')
const http = require('axios')
const failureLambda = require('failure-lambda')
const Promise = require('bluebird')

const restaurantsApiRoot = process.env.restaurants_api
const ordersApiRoot = process.env.orders_api

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const template = fs.readFileSync('static/index.html', 'utf-8')
let responseCache
const resolvedTime = 100
const defaultRestaurants = require('../static/default_restaurants.json')

module.exports.handler = failureLambda(async (event, context) => {
  global.context = context

  const restaurants = await getRestaurants()
  console.log(`found ${restaurants.length} restaurants`)  
  const dayOfWeek = days[new Date().getDay()]
  const view = {
    dayOfWeek,
    restaurants,
    searchUrl: `${restaurantsApiRoot}/search`,
    placeOrderUrl: `${ordersApiRoot}`
  }
  const html = Mustache.render(template, view)
  return {
    statusCode: 200,
    headers: {
      'content-type': 'text/html; charset=UTF-8'
    },
    body: html
  }
})

async function getRestaurants() {
  console.log(`loading restaurants from ${restaurantsApiRoot}...`)

  const timeout = global.context.getRemainingTimeInMillis() - resolvedTime
  return await Promise.resolve(http.get(restaurantsApiRoot))
    .timeout(timeout)
    .then(resp => {
      responseCache = resp.data
      return resp.data
    })
    .catch(err => {
      if (err.name === "TimeoutError") {
        console.log("request timed out, executing fallbacks")
        if (responseCache) {
          console.log("returning cached response")
          return responseCache
        } else {
          console.log("returning default response")
          return defaultRestaurants
        }
      } else {
        throw err
      }
    })
}