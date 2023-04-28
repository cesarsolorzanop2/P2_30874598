var express = require('express');
var router = express.Router();
const sql = require('sqlite3').verbose();
const path = require('path');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


const db = path.join(__dirname, "db", "contact.db");

const sqlQuery = new sql.Database(db, err => {
  if (err) {
    console.log(err)
  }
})

const tableContact = "CREATE TABLE IF NOT EXISTS Contact(correo VARCHAR(255),nombre VARCHAR(255),comentario VARCHAR(255),fecha TEXT,clientIP VARCHAR(255));";
sqlQuery.run(tableContact, err => {
  if (err) {
    console.log(err)
  }
})



router.post('/mensaje', (req, res) => {
  let clientIP = req.headers["x-forwarded-for"];
  if (clientIP) {
    let list = clientIP.split(",");
    clientIP = list[list.length - 1];
  }
  let today = new Date();
  let hours = today.getHours();
  let minutes = today.getMinutes();
  let hour = hours + ':' + minutes;
  let fecha = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear() + '' + '-' + '' + hour;

  let correo = req.body.email;
  let nombre = req.body.nombre;
  let comentario = req.body.mensaje;
  const sql = "INSERT INTO Contact(correo, nombre, comentario, fecha, clientIP) VALUES (?,?,?,?,?)";
  const query = [correo, nombre, comentario, fecha, clientIP];
  sqlQuery.run(sql, query, err => {
    if (err) {
      return console.error(err.message);
    }
    else {
      res.redirect("/");
    }
  })
})

router.get('/contactos', (req, res) => {
  const query = "SELECT * FROM Contact;";
  sqlQuery.all(query, [], (err, row) => {
    res.render("contactos.ejs", {
      contact: row
    })
  })
})




module.exports = router;
