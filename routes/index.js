var express = require('express');
var router = express.Router();
const sql = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
require('dotenv').config();





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

const tableContact = "CREATE TABLE IF NOT EXISTS Contact(correo VARCHAR(255),nombre VARCHAR(255),comentario VARCHAR(255),fecha TEXT,clientIP VARCHAR(255),pais VARCHAR(255));";
sqlQuery.run(tableContact, err => {
  if (err) {
    console.log(err)
  }
})


router.post('/mensaje', async (req, res) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
  
  let today = new Date();
  let hours = today.getHours();
  let minutes = today.getMinutes();
  let hour = hours + ':' + minutes;
  let fecha = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear() + '' + '-' + '' + hour;

  const getApi = await fetch(`https://ipwho.is/${clientIP}`);
  const ipwhois = await getApi.json();
  let pais = ipwhois.country;

  const name_key = req.body.name;
  const response_key = req.body["g-recaptcha-response"];
  const secret_key = process.env.KEY_PRIVATE;
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;

  let correo = req.body.email;
  let nombre = req.body.nombre;
  let comentario = req.body.mensaje;
  const sql = "INSERT INTO Contact(correo, nombre, comentario, fecha, clientIP, pais) VALUES (?,?,?,?,?,?)";
  const query = [correo, nombre, comentario, fecha, clientIP, pais];
  const Recaptcha = await fetch(url, { method: "post", });
  const google_response = await Recaptcha.json();
  if (google_response.success == true) {


    let transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      secureConnection: false,
      port: 587,
      tls: {
        ciphers: 'SSLv3'
      },
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
      }
    });
    const customerMessage = `
					<h3>Información del Cliente</h3>
					<ul>
			  		<li>Email: ${correo}</li>
			  		<li>Nombre: ${nombre}</li>
			  		<li>Comentario: ${comentario}</li>
			  		<li>Fecha: ${fecha}</li>
					  <li>IP: ${clientIP}</li>
					  <li>Pais: ${pais}</li>
					  </ul>`;

    const receiverAndTransmitter = {
      from: process.env.EMAIL,
      to: 'programacion2ais@dispostable.com',
      subject: 'Informacion del contacto',
      html: customerMessage
    };
    transporter.sendMail(receiverAndTransmitter, (err, info) => {
      if (err)
        console.log(err)
      else
        console.log(info);
    })

    sqlQuery.run(sql, query, err => {
      if (err) {
        return console.error(err.message);
      }
      else {
        res.redirect("/");
      }
    })
  }
  else {
    res.redirect("/");
  }

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
