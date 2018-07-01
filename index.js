/**
 * To-do for homework on 28 Jun 2018
 * =================================
 * 1. Create the relevant tables.sql file
 * 2. New routes for user-creation
 * 3. Change the pokemon form to add an input for user id such that the pokemon belongs to the user with that id
 * 4. (FURTHER) Add a drop-down menu of all users on the pokemon form
 * 5. (FURTHER) Add a types table and a pokemon-types table in your database, and create a seed.sql file inserting relevant data for these 2 tables. Note that a pokemon can have many types, and a type can have many pokemons.
 */

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const pg = require('pg');
const cookieParser = require('cookie-parser');
const sha256 = require('js-sha256');

// Initialise postgres client
const config = {
  user: 'fupuchu',
  host: '127.0.0.1',
  database: 'pokemons',
  port: 5432,
}

const pool = new pg.Pool(config);

pool.on('error', function (err) {
  console.log('idle client error', err.message, err.stack);
});

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());


// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();
app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

/** Extra Functions **/

function addZero(arg){
  if (arg.length == 1) {
    return "00" + arg
  } else if (arg.length == 2) {
    return "0" + arg
  } else {
    return arg
  }
}

/**
 * ===================================
 * Routes
 * ===================================
 */
//Home
app.get('/cooks', (req,res) =>{
  res.cookie('greeter', 'hello')
  res.send('Henlo!')
})
app.get('/cookr', (req, res) => {
  console.log(req.cookies);
  res.send('getting cookies')
})

app.get('/register', (req,res) => {
  res.render('userreg', {msg: 'New User please register!'});
})

app.post('/registernew', (req,res) => {
  let hashbrowns = sha256(req.body.password)
  let insertString = 'INSERT into trainer(first_name, password_hash, email) VALUES ($1,$2,$3)'
  let insertValues = [req.body.first_name, hashbrowns, req.body.email]

  pool.query(insertString, insertValues, (err,res) => {
    if (err) {
      console.log(err);
    } else {
      console.log(res);
      res.redirect('/')
    }
  })
})

app.get('/login', (req, res) => {
  res.render('login', {msg: 'Login'})
})

app.post('/logmein', (req, res) => {
  let loginQuery = 'SELECT * FROM trainer WHERE email = $1'
  let loginEmail = [req.body.email]
  
  pool.query(loginQuery, loginEmail, (err, queryRes) => {
    if (err) {
      console.log(err)
    } else {
      const queryCheck = queryRes.rows;
      if (queryCheck.length < 1) {
        res.status(401).render('login', {msg:"invalid username gtfo"})
      } else {
        let loginHashbrown = sha256(req.body.password)
        let queryHashbrown = queryCheck[0].password_hash
        
        if (loginHashbrown === queryHashbrown) {
          res.cookie('is_logged_in', 'true')
          res.cookie('username', queryCheck[0].first_name)

          res.status(200).render('login', {msg:"you are logged in"})
        } else {
          res.status(401).render('login', {msg:"invalid username gtfo"})
        }
      }
    }
  })
  // res.status(200).render('login', {msg: 'Testing Login'})
})

app.get('/', (req, response) => {
  app.use((req,res) => {
    res.status(404).render('notfound')
  })
  console.log(req.cookies)
  const queryString = 'SELECT * FROM pokemon ORDER BY id ASC'
  //when doing UPDATE, the database order is mixed up
  pool.query(queryString, (err, result) => {
    if (err) {
      console.error('query error:', err.stack);
    } else {
      console.log("Getting all the pokemons");
      let pokemon = result.rows;
      response.render('home', {pokemon : pokemon})
    }
  });
});

//Search
app.get('/search/:name', (req, response) => {
  app.use((req,res) => {
    res.status(404).render('notfound')
  })
  let str = req.params.name
  let firstUpperCase = str.charAt(0).toUpperCase() + str.slice(1);
  firstUpperCase = '%' + firstUpperCase + '%'


  const queryValue = [firstUpperCase]
  pool.query('SELECT * FROM pokemon WHERE name LIKE $1', [firstUpperCase],(err, result) => {
    if (err) {
      console.error('query error:', err.stack);
    } else {
      console.log("Searching all the pokemons");
      let pokemon = result.rows;
      response.render('home', {pokemon : pokemon})
    }
  });
});

//Retrieve single pokemon
app.get('/pokemon/:id', (req, response) => {
  //https://stackoverflow.com/a/16558173/5866836
  app.use((req,res) => {
    res.status(404).render('notfound')
  })
  const convertString = addZero(req.params.id)
  const queryString = 'SELECT * FROM pokemon WHERE num = $1'
  const queryValue = [convertString]

  pool.query(queryString, queryValue, (err, result) => {
    if (err) {
      console.log("Tak boleh: " + err);
    } else {
      console.log("Displaying: " + result.rows[0].name);
      response.render('pokemon', {pokemon: result.rows[0]})
    }
  })
})

//Add new pokemon
app.get('/new', (request, response) => {
  const numFix = 'SELECT id FROM pokemon WHERE id = (SELECT MAX(id) FROM pokemon)'

  pool.query(numFix, (err,res) => {
    if (err){
      console.log(err);
    } else {
      let newNum = parseInt(res.rows[0].id) + 1
      response.render('new', {fixnum : newNum});
    }
  })
});

//Insert method for new pokemon
app.post('/pokemon', (req, response) => {
  let params = req.body;
  const queryString = 'INSERT INTO pokemon(num, name, img, height, weight) VALUES($1, $2, $3, $4, $5)'
  const values = [params.num, params.name, params.img, params.height, params.weight];
  pool.query(queryString, values, (err, res) => {
    if (err) {
      console.log('query error:', err.stack);
    } else {
      console.log('query result:', res);
      response.redirect('/');
    }
  });
});

//Edit page
app.get('/pokemon/:id/edit', (req, response) => {
  const convertString = addZero(req.params.id)
  const queryString = 'SELECT * FROM pokemon WHERE id = $1'
  const queryValue = [convertString]

  pool.query(queryString, queryValue, (err, result) => {
    if (err) {
      console.log("Tak boleh: " + err);
    } else {
      console.log("Editing: " + result.rows[0].name);
      response.render('edit', {pokemon: result.rows[0]})
    }
  })
})
//Edit method
app.put('/pokemon/edit/:id', (req, response) => {
  const updateParams = req.body
  const convertString = addZero(req.params.id)
  const queryString = 'UPDATE pokemon SET name = $1, img = $2, height = $3, weight= $4  WHERE id = $5'
  const queryValue = [updateParams.name, updateParams.img, updateParams.height, updateParams.weight, convertString]

  pool.query(queryString, queryValue, (err, result) => {
    if (err) {
      console.log("Tak boleh: " + err);
    } else {
      console.log(result);
      response.redirect('/');
    }
  })
})
//Delete method
app.delete('/pokemon/edit/:id', (req, response) => {
  const deleteMe = req.body
  const queryString = 'DELETE from pokemon WHERE num = $1'
  const queryValue = [deleteMe.num]

  console.log(queryValue);
  pool.query(queryString, queryValue, (err, result) => {
    if (err) {
      console.log("Tak boleh: " + err);
    } else {
      console.log(result);
      response.redirect('/')
    }
  })
})
/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
app.listen(8080, () => console.log('~~~ Tuning in to the waves of port 8080 ~~~'));



