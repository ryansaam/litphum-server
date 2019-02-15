let express = require('express')
let request = require('request')
let querystring = require('querystring')

let app = express()

let redirect_uri = 
  process.env.REDIRECT_URI || 
  'http://localhost:8888/callback'

app.get('/login', function(req, res) {
  const scope = 'user-read-private user-read-email user-top-read'
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri
    }))
})

app.get('/callback', function(req, res) {
  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token
    let postInfo = {
      url: 'https://api.spotify.com/v1/me',
      headers: {
	"Authoriztion": "Bearer " + access_token
      },
      json: true
    }
    request.post(postInfo, function(error, response, body) {
      const route = body.type
      const current_user_id = body.id
      console.log(response)
      console.log(body)
      let uri = process.env.FRONTEND_URI || `http://localhost:3000/${route}/${current_user_id}`
      res.redirect(uri + '?access_token=' + access_token)
    })
  })
})

let port = process.env.PORT || 8888
console.log(`Listening on port ${port}. Go /login to initiate authentication flow.`)
app.listen(port)
