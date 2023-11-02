import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "capstone3",
  password: "0162",
  port: 5432,
});
db.connect();

app.use(express.static("public"));



// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Write your code here//

app.get("/", async (req, res) => {

  let posts = await db.query("SELECT libri.id, titolo, testo, punteggio FROM libri INNER JOIN recensione as rec ON libri.id = rec.id_libro order by libri.id desc");
//console.log(posts.rows);
  try {
    res.render("index.ejs", {
       posts: posts.rows ,
      ordine : "id",});
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching posts",
     });
  }
});
app.post("/", async (req, res) => {
  let ordine = req.body["ord"];

  let posts = await db.query("SELECT libri.id, titolo, testo, punteggio FROM libri INNER JOIN recensione as rec ON libri.id = rec.id_libro order by "+ordine+" desc");
  try {
    res.render("index.ejs", {
       posts: posts.rows,
      ordine : ordine, });
  } catch (error) {
    res.status(500).json({
       message: "Error fetching posts",
       
      });
  }
});


// Route to render the edit page
app.get("/new", (req, res) => {
  res.render("modify.ejs", { heading: "Nuovo inserimento", submit: "Aggiungi" });
});

app.post("/new", async (req, res) => {
  try {
   let titolo = req.body["title"];
   let testo = req.body["content"];
   let punti = req.body["punti"];

    const resultInsert =  await db.query("INSERT INTO libri (titolo) VALUES ($1)  RETURNING id",
    [titolo]
    );
    //console.log(resultInsert.rows[0].id);
    let lastId =  resultInsert.rows[0].id;
    
    
    await db.query("INSERT INTO recensione (testo, punteggio, id_libro) VALUES ($1,$2,$3)",
    [testo, punti, lastId]
    ); 
   
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error creating post" });
  }
});

app.get("/edit/:id", async (req, res) => {
  try {
    //console.log(req.params.id);
    let posts = await db.query("SELECT libri.id, titolo, testo, punteggio FROM libri INNER JOIN recensione as rec ON libri.id = rec.id_libro where libri.id = $1",
    [req.params.id]
    );
//console.log(posts.rows);
  ;
    res.render("modify.ejs", { 
      heading: "Modifica", 
      submit: "Aggiorna", 
      dettaglio:  posts.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching post" });
  }
});

app.post("/edit/:id", async (req, res) => {
  try {
    let titolo = req.body["title"];
    let id = req.params.id;
    let testo = req.body["content"];
    let punti = req.body["punti"];


    db.query("UPDATE libri SET titolo = $1 WHERE id = $2",
    [titolo,id]
    )
    db.query("UPDATE recensione SET testo = $1, punteggio = $2 WHERE id_libro = $3",
    [testo,punti,id]
    )

    res.redirect("/");
    
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
});


//CHALLENGE 5: DELETE a specific post by providing the post id.
app.post("/", (req, res) => {
  const id = parseInt(req.body.id);

  db.query("DELETE FROM recensione WHERE id_libro = $1",
  [id])
  db.query("DELETE FROM libri WHERE id = $1",
  [id])

  res.redirect("/");
});


app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
