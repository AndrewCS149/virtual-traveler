'use strict';

///////////////////LIBRARIES/////////////////////////////////
const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const app = express();
const pg = require('pg');
const PORT = process.env.PORT || 3001;
const client = new pg.Client(process.env.DATABASE_URL);
require('ejs');
// allows ejs to work - look in views folder for your template
app.set('view engine', 'ejs');

// this allows us to see the request.body
app.use(express.urlencoded({
  extended: true
}));

// serve files from public folder
app.use(express.static('./public'));

////////////////////////MODULES//////////////////////////////
const info = require('./libs/info.js');
const help = require('./libs/helper.js');

///////////////////ROUTES//////////////////////
app.get('/', searchForm);
app.get('/searches', info.handler);
app.post('/pages', addToDatabase);
app.get('/favorites', locationRequest)

// function to display the home page when the user opens the website.
function searchForm(request, response) {
  response.render('pages/index.ejs');
}

// function to add the selected location to the favorites page. 
// When the user selected 'add to favorites', the location name and 
// img url will be pushed into the database. 
function addToDatabase(request, response) {
  console.log(request.body.name)
  let name = request.body.name;
  let sql = 'SELECT * FROM travel WHERE name = $1;';
  let safeValue = [name];
  client.query(sql, safeValue)
    .then(result => {
      console.log(result);
      if (result.rowCount < 1) {
        let {
          name,
          imgUrl
        } = request.body;
        let sqlAdd = 'INSERT INTO travel (name, image_url) VALUES ($1, $2) RETURNING id;';
        let safeValues = [name, imgUrl];
        client.query(sqlAdd, safeValues)
          .then(store => {
            let id = store.rows[0].id;
            response.status(200).redirect(`/searches`)
          }).catch(error => console.log(error))
      } else {
        response.status(200).redirect(`/searches`)
      }
    }).catch(error => console.log(error))
}

function locationRequest(request, response) {

  let sql = 'SELECT * FROM travel;';
  client.query(sql)
    .then(display => {
      response.status(200).render('./pages/favorites.ejs', {
        favorites: display.rows
      });
    }).catch(err => help.err(err, response));
}
///////////////////CONNECT//////////////////////
client.on('error', err => console.log(err));
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })

module.exports.client = client;