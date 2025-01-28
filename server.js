const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar SQLite
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error("Error abriendo la base de datos", err.message);
  } else {
    console.log("Conexión a la base de datos SQLite...");
    db.run(`CREATE TABLE users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              firstName TEXT,
              lastName TEXT,
              ci TEXT,
              email TEXT UNIQUE,
              password TEXT
            )`);
    db.run(`CREATE TABLE products (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT,
              price REAL,
              stock INTEGER,
              image TEXT
            )`);
  }
});

// Ruta de registro
app.post("/register", (req, res) => {
  const { firstName, lastName, ci, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    `INSERT INTO users (firstName, lastName, ci, email, password) VALUES (?, ?, ?, ?, ?)`,
    [firstName, lastName, ci, email, hashedPassword],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Usuario registrado con éxito." });
    }
  );
});

// Ruta de inicio de sesión
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    const token = jwt.sign({ email }, "secretkey");
    res.status(200).json({ token });
  });
});

// Ruta para la raíz del servidor
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// CRUD de productos

// Crear producto
app.post("/products", (req, res) => {
  const { name, price, stock, image } = req.body;
  db.run(
    `INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)`,
    [name, price, stock, image],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Producto creado con éxito." });
    }
  );
});

// Leer productos
app.get("/products", (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ products: rows });
  });
});

// Actualizar producto
app.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, price, stock, image } = req.body;
  db.run(
    `UPDATE products SET name = ?, price = ?, stock = ?, image = ? WHERE id = ?`,
    [name, price, stock, image, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "Producto actualizado con éxito." });
    }
  );
});

// Eliminar producto
app.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM products WHERE id = ?`, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: "Producto eliminado con éxito." });
  });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/');
});