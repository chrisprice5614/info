require("dotenv").config() // Makes it so we can access .env file
const jwt = require("jsonwebtoken")//npm install jsonwebtoken dotenv
const bcrypt = require("bcrypt") //npm install bcrypt
const cookieParser = require("cookie-parser")//npm install cookie-parser
const express = require("express")//npm install express
const db = require("better-sqlite3")("data.db") //npm install better-sqlite3
const body_parser = require("body-parser")
const path = require('path');
const node_fetch = require("node-fetch")
const nodemailer = require("nodemailer")
const multer = require("multer")
const sharp = require('sharp');
const fs = require("fs");
const axios = require("axios");
const marked = require('marked');
const session = require('express-session');
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const mime = file.mimetype;
    if (mime === 'audio/mpeg') {
      cb(null, './public/audio');
    } else {
      cb(null, './public/img');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = mimeExtension(file.mimetype);
    cb(null, `${uniqueSuffix}.${ext}`);
  }
});

// Helper to ensure consistent extension naming
function mimeExtension(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
  };
  return map[mime] || 'file';
}

const upload = multer({
  storage: fileStorageEngine,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'image/jpeg',
      'image/png',
      'audio/mpeg' // mp3
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

const fileSizeLimiter = (req, res, next) => {
  const file = req.file;
  if (!file) return next();

  const limits = {
    'image/jpeg': 24 * 1024 * 1024,
    'image/png': 24 * 1024 * 1024,
    'video/mp4': 24 * 1024 * 1024,
    'audio/mpeg': 24 * 1024 * 1024
  };

  const limit = limits[file.mimetype];
  if (limit && file.size > limit) {
    return res.status(400).json({
      error: `File too large. Limit is ${limit / (1024 * 1024)}MB.`
    });
  }

  next();
};

module.exports = { upload, fileSizeLimiter };

//mailing function
async function sendEmail(to, subject, html) {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAILNAME,
            pass: process.env.MAILSECRET
        },
        tls: {
            rejectUnauthorized: false
        }
    });


    let info = await transporter.sendMail({
        from: '"Chris Price Music" <info@chrispricemusic.net>',
        to: to,
        subject: subject,
        html: `<html>
        <head>
            <title>Check it out!</title>
            <link rel="icon" type="image/x-icon" href="https://www.dropbox.com/scl/fi/cvyp68qqihaakktohzyt8/favicon.ico?dl=1">
            <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@200..700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://use.typekit.net/ayz5zyc.css">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, font, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, caption {
                    margin: 0;
                    padding: 0;
                    border: 0;
                    outline: 0;
                    vertical-align: baseline;
                    background: transparent;
                    font-family: "Open Sans", sans-serif;
                    font-weight: 400;
                    font-style: normal;
                    line-height: 1.4em;
                    word-wrap: break-word;
                }
                
                :root{

                --background-dark:rgb(0, 0, 0);
                --background-light:rgb(0, 0, 0);
                --color-light: #0d0b0e;
                --color-dark: #211825;
                --color-primary: #b026ff;
                --color-primary-active: #5d00b1;
                --color-secondary: #00d2b8;
                --color-secondary-active: #009784;
                --border-width: 1.5px;
                --color-reverse: #333;
                }

                body{
                    color: var(--color-light);
                }

                i {
                    font-style: italic;
                }


                h1, h2, h3, h4, h5{
                    margin: 12px;
                    font-family: "quicksand", sans-serif;
                    font-weight: 700;
                    font-style: normal;
                }

                a{
                    color: var(--color-light);
                    font-weight: 600;
                }

                a:hover{
                    color: var(--color-primary)
                }
                .card{
                    margin-top: 10px;
                    padding: 12px;
                    background-color: var(--color-primary);
                    box-shadow: 2px 2px 0px var(--color-dark);

                }

                .card a:hover{
                    color: var(--color-primary-active);
                }

                .card small{
                    color: var(--color-light);
                }

                hr{
                    width: 80%;
                    border-color: var(--color-primary)
                }

                .grid{
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                }

                @media only screen and (width<=1000px){
                    .grid{
                        grid-template-columns: 1fr;
                        margin-left: 8px;
                        margin-right: 8px;
                    }
                }

                p{
                    margin: 12px;
                }
            </style>
        </head>
        <header style="text-align: center;">
            <br>
            <img src="https://raw.githubusercontent.com/chrisprice5614/Form-Test/refs/heads/main/logoBlack.png" alt="Chris price music logo" >
            
        </header>
        <body>
            ${html}
        </body>
        <br>
        <hr>
        <footer style="text-align: center;">
            <br>
            <a href="chrispricemusic.net">chrispricemusic.net</a>
            <br>
        </footer>
    </html>
    `

    })

}


db.pragma("journal_mode = WAL") //Makes it faster
const createTables = db.transaction(() => {
    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title STRING,
        description STRING,
        datetime STRING,
        location STRING,
        image STRING,
        link STRING,
        slug STRING
        )
        `
    ).run()

    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title STRING,
        link STRING,
        ensemble STRING,
        type STRING
        )
        `
    ).run()

    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            slug TEXT UNIQUE,
            content TEXT,
            author TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            hero TEXT
        );
        `
    ).run()

    db.prepare(
        `
        CREATE TABLE IF NOT EXISTS programming (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            slug TEXT UNIQUE,
            content TEXT,
            hero TEXT
        );
        `
    ).run()

    db.prepare(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      slug TEXT,
      description TEXT,
      type TEXT,           -- 'knowledge' or 'personality'
      heroImage TEXT       -- path or URL to hero image for quiz
    )
  `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT,
      lastname TEXT,
      email TEXT,
      phone TEXT,
      address TEXT
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT,
      client_id INTEGER,
      issue_date INTEGER,
      due_date INTEGER,
      status TEXT,
      subtotal INTEGER,
      tax INTEGER,
      total INTEGER,
      notes TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `).run();

    db.prepare(`
      CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      description STRING,
      quantity INTEGER,
      unit_price INTEGER,
      total INTEGER,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
      )
    `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER,
      text TEXT,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER,
      text TEXT,
      value TEXT,          -- for personality quiz: category or trait, else NULL
      is_correct INTEGER DEFAULT 0, -- 1 if correct answer (knowledge quiz), else 0
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS personality_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER,
      value TEXT,          -- category/trait (matches options.value)
      description TEXT,
      image TEST,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `).run();
})

createTables();

const app = express()
app.use(express.json())
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public")) //Using public folder
app.use(cookieParser())
app.use(express.static('/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(body_parser.json())
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));



function getChannelIdentifier(url) {
    try {
        const parsed = new URL(url);
        const path = parsed.pathname;
        if (path.startsWith('/@')) return path.slice(1);
        if (path.startsWith('/channel/')) return path.split('/channel/')[1];
        if (path.startsWith('/user/')) return path.split('/user/')[1];
        return path.slice(1);
    } catch {
        return url;
    }
}

app.use(function (req, res, next) {

    try {
        const decoded = jwt.verify(req.cookies.chris, process.env.JWTSECRET)
        req.user = decoded
    } catch {
        req.user = false
    }

    res.locals.user = req.user;

    next()
})

function mustBeLoggedIn(req, res, next){
    if(req.user) {
        return next()
    }
    else
    {
        return res.redirect("/")
    }
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')           // replace spaces with dashes
    .replace(/[^\w\-]+/g, '')       // remove special characters
    .replace(/\-\-+/g, '-')         // collapse multiple dashes
    .replace(/^-+|-+$/g, '');       // trim dashes from start/end
}

app.get("/quizzes", (req,res) => {
  const getQuizzes = db.prepare("SELECT * FROM quizzes ORDER BY id DESC")
  const quizzes = getQuizzes.all();

  return res.render("quizzes", {quizzes})
})

// Adjust this if your DB object uses async/await
app.post("/add-event", mustBeLoggedIn, upload.single("image"), fileSizeLimiter, async (req, res) => {
    try {
        const { title, description, datetime, location, link } = req.body;
        let webpImageFilename = null;

        // Generate slug from title
        const slug = slugify(title); // assuming slugify is already defined

        if (req.file) {
            const uploadsDir = path.join(__dirname, "public", "img");
            const inputPath = path.join(uploadsDir, req.file.filename);
            const outputFilename = path.parse(req.file.filename).name + ".webp";
            const outputPath = path.join(uploadsDir, outputFilename);

            // Convert to webp
            await sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath);

            // Delete the original file
            fs.unlinkSync(inputPath);

            // Save just the filename for DB, not the full path
            webpImageFilename = outputFilename;
        }

        // Save to DB
        const stmt = db.prepare(`INSERT INTO events 
            (title, description, datetime, location, image, link, slug)
            VALUES (?, ?, ?, ?, ?, ?, ?)`);

        stmt.run(title, description, datetime, location, webpImageFilename, link, slug);

        res.redirect("/edit-events"); // Adjust redirect as needed
    } catch (err) {
        console.error("Error in /add-event:", err);
        res.status(500).send("Failed to add event.");
    }
});

app.get("/add-quiz", mustBeLoggedIn, (req,res) => {
  return res.render("add-quiz")
})

app.post(
  '/add-quiz',
  mustBeLoggedIn,
  upload.any(),  // accept all files because resultImages are dynamic
  fileSizeLimiter,
  (req, res) => {
    try {
      const { title, description, type } = req.body;

      // Find heroImage file from uploaded files
      const heroFile = req.files.find(f => f.fieldname === 'heroImage');
      const heroImage = heroFile ? '/img/' + heroFile.filename : '';

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Insert quiz
      const quizStmt = db.prepare(`
        INSERT INTO quizzes (title, description, type, heroImage, slug)
        VALUES (?, ?, ?, ?, ?)
      `);
      const quizResult = quizStmt.run(title, description, type, heroImage, slug);
      const quizId = quizResult.lastInsertRowid;

      // Insert questions & options
      const questions = req.body.questions || {};
      const insertQuestion = db.prepare(`INSERT INTO questions (quiz_id, text) VALUES (?, ?)`);
      const insertOption = db.prepare(`
        INSERT INTO options (question_id, text, value, is_correct)
        VALUES (?, ?, ?, ?)
      `);

      for (const qIndex in questions) {
        const q = questions[qIndex];
        const qResult = insertQuestion.run(quizId, q.text);
        const questionId = qResult.lastInsertRowid;

        const options = q.options || {};
        for (const oIndex in options) {
          const opt = options[oIndex];
          insertOption.run(
            questionId,
            opt.text || '',
            opt.value || '',
            opt.is_correct ? 1 : 0
          );
        }
      }

      // Build map of resultImages keyed by index from dynamic fieldnames like resultImages[1], resultImages[2], ...
      const resultImagesMap = {};
      for (const file of req.files) {
        const match = file.fieldname.match(/^resultImages\[(\d+)\]$/);
        if (match) {
          resultImagesMap[match[1]] = file;
        }
      }

      // Insert personality results if personality quiz
      if (type === 'personality' && req.body.results) {
        const results = req.body.results;
        const insertResult = db.prepare(`
          INSERT INTO personality_results (quiz_id, value, description, image)
          VALUES (?, ?, ?, ?)
        `);

        for (const rIndex in results) {
          const resData = results[rIndex];
          const imageFile = resultImagesMap[rIndex];
          const imagePath = imageFile ? '/img/' + imageFile.filename : '';

          insertResult.run(
            quizId,
            resData.value || '',
            resData.description || '',
            imagePath
          );
        }
      }

      res.redirect(`/quiz/${slug}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      res.status(500).send('Failed to create quiz.');
    }
  }
);



app.get('/quiz/:slug', (req, res) => {
  const answers = {};

// Iterate req.body keys:
for (const key in req.body) {
  if (key.startsWith('answers_')) {
    const questionId = key.split('_')[1];
    answers[questionId] = req.body[key];
  }
}

  const { slug } = req.params;

  // Get the quiz by slug
  const quiz = db.prepare('SELECT * FROM quizzes WHERE slug = ?').get(slug);
  if (!quiz) return res.redirect("/404");

  // Get all questions for this quiz
  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quiz.id);

  // Get all options for all questions
  const getOptions = db.prepare('SELECT * FROM options WHERE question_id = ?');
  const questionsWithOptions = questions.map(q => ({
    ...q,
    options: getOptions.all(q.id)
  }));

  // If it's a personality quiz, also get possible outcomes
  let resultOptions = [];
  if (quiz.type === 'personality') {
    resultOptions = db.prepare('SELECT * FROM personality_results WHERE quiz_id = ?').all(quiz.id);
  }

  // Render the quiz
  res.render('quiz-view', {
    quiz,
    questions: questionsWithOptions,
    resultOptions
  });
});

app.post('/quiz/:slug/submit', (req, res) => {
  const { slug } = req.params;

  // Fetch quiz
  const quiz = db.prepare('SELECT * FROM quizzes WHERE slug = ?').get(slug);
  if (!quiz) return res.redirect("/404");

  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quiz.id);
  const answers = req.body.answers;

  if (quiz.type === 'knowledge') {
    let correct = 0;
    const correctOptionStmt = db.prepare(`
      SELECT id FROM options WHERE question_id = ? AND is_correct = 1
    `);

    let iterator = 0;
    for (const q of questions) {
      const submitted = answers[iterator];
      const correctOption = correctOptionStmt.get(q.id);
      if (submitted && correctOption && Number(submitted) === correctOption.id) {
        correct++;
      }
      iterator++;
    }

    const scoreString = `${correct}-${questions.length}`; // e.g., "3-5"
    return res.redirect(`/quiz/${slug}/result/${scoreString}?from=submit`);
  }

  else if (quiz.type === 'personality') {
    const valueCounts = {};
    let iterator = 0;

    for (const q of questions) {
      const selectedValue = answers[iterator];
      if (selectedValue) {
        valueCounts[selectedValue] = (valueCounts[selectedValue] || 0) + 1;
      }
      iterator++;
    }

    const topValue = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topValue) {
      return res.redirect(`/quiz/${slug}/result/none?from=submit`);
    }

    return res.redirect(`/quiz/${slug}/result/${encodeURIComponent(topValue)}?from=submit`);
  }

  return res.status(400).send('Unsupported quiz type.');
});

app.get('/quiz/:slug/result/:variable', (req, res) => {
  const showResult = req.query.from === 'submit';
  const { slug } = req.params;
  const variable = decodeURIComponent(req.params.variable); // <- this line is key

  const quiz = db.prepare('SELECT * FROM quizzes WHERE slug = ?').get(slug);
  if (!quiz) return res.redirect("/404");

  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quiz.id);

  if (quiz.type === 'knowledge') {
    const [correct, total] = variable.split('-').map(Number);

    return res.render('quiz-result', {
      quiz,
      type: 'knowledge',
      result: '',
      windowRedirect: !showResult,
      score: `${correct} / ${total}`,
      correct,
      total
    });
  }

  if (quiz.type === 'personality') {
    if (variable === 'none') {
      return res.render('quiz-result', {
        quiz,
        type: 'personality',
        score: 0,
        windowRedirect: !showResult,
        result: null,
        error: 'No dominant personality detected. Please complete the quiz.'
      });
    }

    const result = db.prepare(`
      SELECT * FROM personality_results WHERE quiz_id = ? AND value = ?
    `).get(quiz.id, variable);

    return res.render('quiz-result', {
      quiz,
      windowRedirect: !showResult,
      type: 'personality',
      score: 0,
      result
    });
  }

  return res.status(400).send('Unsupported quiz type.');
});


app.get("/edit-quizzes", mustBeLoggedIn, (req,res) => {

  const quizStatement = db.prepare("SELECT * FROM quizzes");
  const quizzes = quizStatement.all();

  return res.render("edit-quizzes", {quizzes})
})

app.get("/delete-quiz/:id", mustBeLoggedIn, (req,res) => {
  const deleteStatement = db.prepare("DELETE from quizzes WHERE id = ?")
  deleteStatement.run(req.params.id);

  return res.redirect("/edit-quizzes")
})

app.post("/edit-event/:id", mustBeLoggedIn, upload.single("image"), fileSizeLimiter, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, description, datetime, location, link } = req.body;

    // Get the existing event to check the old image filename
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);
    if (!event) {
      return res.redirect("/404").send("Event not found");
    }

    let webpImageFilename = event.image; // default to old image

    if (req.file) {
      const uploadsDir = path.join(__dirname, "public", "img");
      const inputPath = path.join(uploadsDir, req.file.filename);
      const outputFilename = path.parse(req.file.filename).name + ".webp";
      const outputPath = path.join(uploadsDir, outputFilename);

      // Convert to webp
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Delete the original uploaded file (non-webp)
      fs.unlinkSync(inputPath);

      // Delete old image file if it exists and is different from new one
      if (event.image && event.image !== outputFilename) {
        const oldImagePath = path.join(uploadsDir, event.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      webpImageFilename = outputFilename;
    }

    // Generate slug from new title
    const slug = slugify(title); // assuming slugify is already defined

    // Update event in DB
    const stmt = db.prepare(`UPDATE events SET
      title = ?, description = ?, datetime = ?, location = ?, image = ?, link = ?, slug = ?
      WHERE id = ?`);
    stmt.run(title, description, datetime, location, webpImageFilename, link, slug, eventId);

    res.redirect("/edit-events"); // Adjust redirect as needed
  } catch (err) {
    console.error("Error in /edit-event/:id:", err);
    res.status(500).send("Failed to update event.");
  }
});


app.post("/add-music", mustBeLoggedIn, upload.single("link"), fileSizeLimiter, (req, res) => {
  try {
    const { title, ensemble, type } = req.body;
    let audioFilename = null;

    if (req.file) {
      audioFilename = req.file.filename; // Already processed and renamed by multer
    } else {
      return res.status(400).send("No audio file uploaded.");
    }

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO portfolio (title, ensemble, type, link)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(title, ensemble, type, audioFilename);

    return res.redirect("/edit-portfolio");
  } catch (err) {
    console.error("Error in /add-music:", err);
    return res.status(500).send("Failed to upload music.");
  }
});

app.post("/add-project", mustBeLoggedIn, upload.single("heroImage"), fileSizeLimiter, (req, res) => {
  try {
    const title = req.body.title;
    const content = req.body.content;

    if (!title || !content) {
      return res.render("add-project", { error: "Title and content are required." });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const hero = req.file ? "/img/" + req.file.filename : null;

    const statement = db.prepare(`
      INSERT INTO programming (title, slug, content, hero)
      VALUES (?, ?, ?, ?)
    `);

    statement.run(title, slug, content, hero);

    return res.redirect("/edit-programming");
  } catch (err) {
    console.error("Error adding project:", err);
    return res.status(500).render("add-project", { error: "An error occurred while saving your project." });
  }
});

app.post("/edit-project/:id", mustBeLoggedIn, upload.single("heroImage"), fileSizeLimiter, (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.render("edit-project", {
        project: { id: projectId, title, content, hero: req.body.currentHero || null },
        error: "Title and content are required."
      });
    }

    const slug = slugify(title, { lower: true, strict: true });

    // Fetch current hero from DB
    const existing = db.prepare("SELECT hero FROM programming WHERE id = ?").get(projectId);
    const currentHero = existing?.hero;

    let newHero = currentHero;

    if (req.file) {
      // Remove old hero if it exists
      if (currentHero && currentHero.startsWith("/img/")) {
        const filePath = path.join(__dirname, "public", currentHero);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      newHero = "/img/" + req.file.filename;
    }

    const statement = db.prepare(`
      UPDATE programming
      SET title = ?, slug = ?, content = ?, hero = ?
      WHERE id = ?
    `);

    statement.run(title, slug, content, newHero, projectId);

    return res.redirect("/edit-programming");
  } catch (err) {
    console.error("Error updating project:", err);
    return res.status(500).render("edit-project", {
      project: { id: req.params.id, title: req.body.title, content: req.body.content, hero: req.body.currentHero || null },
      error: "An error occurred while updating the project."
    });
  }
});

app.get("/programming-portfolio", (req,res) => {

    const projectsStatement = db.prepare("SELECT * FROM programming ORDER BY id DESC")
    const projects = projectsStatement.all();

    return res.render("programming-portfolio", {projects})
})

app.get("/view-project/:slug", (req,res) => {
    const projectStatement = db.prepare("SELECT * FROM programming WHERE slug = ?")
    const project = projectStatement.get(req.params.slug)

    return res.render("project", {project})
})



app.get("/add-project", mustBeLoggedIn, (req,res) => {
    return res.render("add-project")
})

app.get("/edit-project/:id",mustBeLoggedIn, (req,res) => {
    const projectStatement = db.prepare("SELECT * FROM programming WHERE id = ?")
    const project = projectStatement.get(req.params.id);

    return res.render("edit-project",{project})
})

app.get("/events", (req,res) => {

    const eventStatement = db.prepare("SELECT * FROM events ORDER BY datetime");
    const events = eventStatement.all()

    return res.render("events",{events})
})

app.get("/edit-programming", mustBeLoggedIn, (req,res) => {
    const programmingStatement = db.prepare("SELECT * FROM programming")
    const projects = programmingStatement.all();

    return res.render("edit-programming", {projects})
})


app.get("/edit-events", mustBeLoggedIn, (req,res) => {

    const eventStatement = db.prepare("SELECT * FROM events ORDER BY datetime");
    const events = eventStatement.all()

    return res.render("edit-events",{events})
})

app.get("/event/:slug", (req,res) => {

    const eventStatement = db.prepare("SELECT * FROM events WHERE slug = ?")
    const event = eventStatement.get(req.params.slug);

    return res.render("event",{event})
})

app.get("/edit-blog", mustBeLoggedIn, (req,res) => {
    const blogStatement = db.prepare("SELECT * FROM blogs")
    const blogs = blogStatement.all()

    return res.render("edit-blog", {blogs})
})

app.get("/add-blog", mustBeLoggedIn, (req,res) => {
    
    return res.render("add-blog")
})

app.post("/add-blog", mustBeLoggedIn, upload.single("heroImage"), fileSizeLimiter, (req, res) => {
  try {
    const title = req.body.title;
    const content = req.body.content;

    if (!title || !content) {
      return res.render("add-blog", { error: "Title and content are required." });
    }

    const slug = slugify(title, { lower: true, strict: true });
    const hero = req.file ? "/img/" + req.file.filename : null;

    const statement = db.prepare(`
      INSERT INTO blogs (title, content, author, slug, hero)
      VALUES (?, ?, ?, ?, ?)
    `);

    statement.run(title, content, "Chris Price", slug, hero);

    return res.redirect("/edit-blog");
  } catch (err) {
    console.error("Error adding blog:", err);
    return res.status(500).render("add-blog", { error: "An error occurred while saving your blog post." });
  }
});


app.post("/edit-blog/:id", mustBeLoggedIn, upload.single("heroImage"), fileSizeLimiter, (req, res) => {
  try {
    const blogId = req.params.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.render("edit-blog", {
        blog: { id: blogId, title, content, hero: req.body.currentHero || null },
        error: "Title and content are required."
      });
    }

    const slug = slugify(title, { lower: true, strict: true });

    // Fetch current hero from DB
    const existing = db.prepare("SELECT hero FROM blogs WHERE id = ?").get(blogId);
    const currentHero = existing?.hero;

    let newHero = currentHero;

    if (req.file) {
      // Remove old hero if it exists
      if (currentHero && currentHero.startsWith("/img/")) {
        const filePath = path.join(__dirname, "public", currentHero);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      newHero = "/img/" + req.file.filename;
    }

    const statement = db.prepare(`
      UPDATE blogs
      SET title = ?, slug = ?, content = ?, hero = ?
      WHERE id = ?
    `);

    statement.run(title, slug, content, newHero, blogId);

    return res.redirect("/edit-blog");
  } catch (err) {
    console.error("Error updating blog:", err);
    return res.status(500).render("edit-blog", {
      blog: { id: req.params.id, title: req.body.title, content: req.body.content, hero: req.body.currentHero || null },
      error: "An error occurred while updating the blog post."
    });
  }
});



app.get("/edit-blog/:id", mustBeLoggedIn, (req,res) => {
    const blogStatement = db.prepare("SELECT * FROM blogs WHERE id = ?")
    const blog = blogStatement.get(req.params.id)

    return res.render("edit-single-blog", {blog})
})

app.get("/delete-blog/:id", (req,res) => {


    const deleteStatement = db.prepare("DELETE FROM blogs WHERE id = ?")
    deleteStatement.run(req.params.id)

    return res.redirect("/edit-blog")
})

app.get("/blog", (req,res) => {
    const blogStatement = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC")
    const blogs = blogStatement.all();

    return res.render("blog", {blogs})
})

app.get("/blog/:slug", (req,res) => {

    const blogStatement = db.prepare("SELECT * FROM blogs WHERE slug = ?")
    const blog = blogStatement.get(req.params.slug)

    if(!blog){
        return res.render("404")
    }

    return res.render("single-blog", {blog})
})

app.post("/upload-image", mustBeLoggedIn, upload.single("image"), fileSizeLimiter, (req, res) => {
  if (!req.file) {
    
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  let subDir = "img";
  if (req.file.mimetype === "audio/mpeg") {
    subDir = "audio";
  }

  // Correct URL path, no "/public" prefix
  const fileUrl = `/${subDir}/${req.file.filename}`;

  return res.json({ url: fileUrl });
});

app.get("/add-music", mustBeLoggedIn, (req,res) => {
    return res.render("add-music")
})

app.get("/add-event", mustBeLoggedIn, (req,res) => {
    return res.render("add-event")
})

app.get("/edit-event/:id", mustBeLoggedIn, (req,res) => {
    const eventStatement = db.prepare("SELECT * FROM events WHERE id = ?")
    const event = eventStatement.get(req.params.id);

    return res.render("edit-event", {event})
})

app.get("/", (req,res) => {
    return res.render("home")
})

app.get("/lessons", (req,res) => {
    return res.render("lessons")
})

app.post("/lessons", async (req,res) => {

    const { name, country_state, email, phone, year, message } = req.body;
    const token = req.body["g-recaptcha-response"];

  if (!token) {
    return res.render("lessons", {error: "CAPTCHA verification failed"});
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLEKEY}&response=${token}`
    );

    if (!response.data.success) {
      return res.render("lessons", {error: "CAPTCHA verification failed"});
    }

    const html = `
        <h1>New Music Lesson Inquiry</h1><br>
        <h2>Contact Info</h2><br>
        <p><strong>Name:</strong> ${name}</p><br>
        <p><strong>Country/State:</strong> ${country_state}</p><br>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><br>
        <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p><br>
        <p><strong>Year in School:</strong> ${year}</p><br>
        <h2>Message</h2><br>
        <p>${message.replace(/\n/g, '<br>')}</p><br>
    `;

    sendEmail("chrisprice5614@gmail.com","Lessons Inquiery",html);

    return res.redirect("thank-you")

    } catch (err) {
    return res.render("lessons", {error: "CAPTCHA verification failed"});
  }
})

app.post("/commission", async (req, res) => {
  const { name, email, phone, organization, budget, message } = req.body;
  const token = req.body["g-recaptcha-response"];

  if (!token) {
    return res.render("commission", { error: "CAPTCHA verification failed" });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLEKEY}&response=${token}`
    );

    if (!response.data.success) {
      return res.render("commission", { error: "CAPTCHA verification failed" });
    }

    const html = `
      <h1>New Commission Inquiry</h1><br>
      <h2>Contact Info</h2><br>
      <p><strong>Name:</strong> ${name}</p><br>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><br>
      <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p><br>
      <p><strong>School/Organization:</strong> ${organization}</p><br>
      <p><strong>Budget:</strong> ${budget}</p><br>
      <h2>Message</h2><br>
      <p>${message.replace(/\n/g, '<br>')}</p><br>
    `;

    sendEmail("chrisprice5614@gmail.com", "Commission Inquiry", html);

    return res.redirect("thank-you");
  } catch (err) {
    return res.render("commission", { error: "CAPTCHA verification failed" });
  }
});

app.get("/set-paid/:id", mustBeLoggedIn, (req,res) => {
  const updateStatement = db.prepare("UPDATE invoices SET status = ? WHERE id = ?")
  updateStatement.run("paid", req.params.id)

  return res.redirect(`/invoice/${req.params.id}`)
})

app.get("/edit-invoices", mustBeLoggedIn, (req,res) => {
  const invoiceStatement = db.prepare("SELECT * FROM invoices")
  const invoices = invoiceStatement.all();

  invoices.forEach(invoice => {
    const thisClientStatement = db.prepare("SELECT * FROM clients WHERE id = ?")
    const thisClient = thisClientStatement.get(invoice.client_id);
    invoice.clientName = thisClient.firstname + " " + thisClient.lastname;
  })

  const clientStatement = db.prepare("SELECT * FROM clients")
  const clients = clientStatement.all();

  return res.render("edit-invoices",{invoices,clients})
})

app.get("/add-client", mustBeLoggedIn, (req,res) => {
  return res.render("add-client")
})

app.post("/add-client", mustBeLoggedIn, (req,res) => {

  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const phone = req.body.phone;
  const address = req.body.address;

  const clientAddStatement = db.prepare("INSERT INTO clients (firstname, lastname, email, phone, address) VALUES (? , ? , ? , ? , ?)")
  clientAddStatement.run(firstname, lastname, email, phone, address);

  return res.redirect("/edit-invoices")
})

app.get("/add-invoice", mustBeLoggedIn, (req,res) => {
  const clients = db.prepare('SELECT id, firstname, lastname FROM clients').all();
  return res.render("add-invoice", {clients})
})

app.post('/create-invoice', mustBeLoggedIn, (req, res) => {
  try {
    const {
      client_id,
      issue_date,
      due_date,
      notes,
      subtotal,
      tax,
      total,
      items_json
    } = req.body;

    // Validate required fields (basic)
    if (!client_id || !issue_date || !due_date || !items_json) {
      console.log("missing fields.");
      return res.status(400).send('Missing required fields');
    }

    const items = JSON.parse(items_json);

    const invoiceCount = db.prepare(`SELECT COUNT(*) AS count FROM invoices`).get().count;
    const nextNumber = invoiceCount + 1;
    const paddedNumber = String(nextNumber).padStart(6, '0');
    const invoice_number = `INV_${paddedNumber}`;

    // Use transaction to ensure consistency
    const insertInvoice = db.prepare(`
      INSERT INTO invoices
      (client_id, issue_date, due_date, status, subtotal, tax, total, notes, created_at, updated_at, invoice_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO invoice_items
      (invoice_id, description, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?)
    `);

    const now = Date.now();

    const status = 'sent'; // or 'sent' depending on your workflow

    const result = db.transaction(() => {
      // Insert invoice
      const info = insertInvoice.run(
        client_id,
        new Date(issue_date).getTime(),
        new Date(due_date).getTime(),
        status,
        parseInt(subtotal),
        parseInt(tax),
        parseInt(total),
        notes || '',
        now,
        now,
        invoice_number
      );

      const invoice_id = info.lastInsertRowid;

      // Insert items
      for (const item of items) {
        insertItem.run(
          invoice_id,
          item.description,
          item.quantity,
          item.unit_price,
          item.total
        );
      }

      return invoice_id;
    })();

    // Redirect to invoice view page
    res.redirect(`/invoice/${result}`);

  } catch (err) {
    console.log('Error creating invoice:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/invoice/:id", mustBeLoggedIn, (req,res) => {
  const invoiceStatement = db.prepare("SELECT * FROM invoices WHERE id = ?")
  const invoice = invoiceStatement.get(req.params.id);

  const itemStatement = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
  const items = itemStatement.all(req.params.id)

  const clientStatement = db.prepare("SELECT * FROM clients WHERE id = ?")
  const thisClient = clientStatement.get(invoice.client_id)

  return res.render("view-invoice", {invoice, items, thisClient})
})



app.get("/commission", (req,res) => {
    return res.render("commission")
})

app.get("/thank-you",(req,res) => {
    return res.render("thank-you")
})

app.get("/portfolio", (req,res) => {
    const portfolioStatement = db.prepare("SELECT * FROM portfolio")
    const musicList = portfolioStatement.all()

    return res.render("portfolio", {musicList});
})

app.get("/contact", (req,res) => {
    return res.render("contact")
})

app.post("/contact", async (req,res) => {

    const { name, email, message } = req.body;
    const token = req.body["g-recaptcha-response"];

  if (!token) {
    return res.render("contact", {error: "CAPTCHA verification failed"});
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLEKEY}&response=${token}`
    );

    if (!response.data.success) {
      return res.render("contact", {error: "CAPTCHA verification failed"});
    }

    const html = `
        <h1>Contact Form</h1><br>
        <h2>Contact Info</h2><br>
        <p><strong>Name:</strong> ${name}</p><br>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><br>
        <h2>Message</h2><br>
        <p>${message.replace(/\n/g, '<br>')}</p><br>
    `;

    sendEmail("chrisprice5614@gmail.com","Contact Form",html);

    return res.redirect("thank-you")

    } catch (err) {
    return res.render("lessons", {error: "CAPTCHA verification failed"});
  }
})

app.get("/hire-me", (req,res) => {
    return res.render("hire-me")
})

app.post("/hire-me", async (req, res) => {
  const { name, email, phone, budget, message } = req.body;
  const token = req.body["g-recaptcha-response"];

  if (!token) {
    return res.render("commission", { error: "CAPTCHA verification failed" });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLEKEY}&response=${token}`
    );

    if (!response.data.success) {
      return res.render("commission", { error: "CAPTCHA verification failed" });
    }

    const html = `
      <h1>New Programming Inquiry</h1><br>
      <h2>Contact Info</h2><br>
      <p><strong>Name:</strong> ${name}</p><br>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><br>
      <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p><br>
      <p><strong>Budget:</strong> ${budget}</p><br>
      <h2>Message</h2><br>
      <p>${message.replace(/\n/g, '<br>')}</p><br>
    `;

    sendEmail("chrisprice5614@gmail.com", "Programming Inquiry", html);

    return res.redirect("thank-you");
  } catch (err) {
    return res.render("commission", { error: "CAPTCHA verification failed" });
  }
});


app.get("/music", (req,res) => {
    const eventStatement = db.prepare("SELECT * FROM events ORDER BY datetime LIMIT 3");
    const events = eventStatement.all()
    
    const blogStatement = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC LIMIT 5")
    const blogs = blogStatement.all();

    const quizStatements = db.prepare("SELECT * FROM quizzes ORDER BY id DESC LIMIT 5")
    const quizzes = quizStatements.all();

    return res.render("music",{events, blogs, quizzes})
})

app.get("/programming", (req,res) => {

    const projectStatement = db.prepare("SELECT * FROM programming ORDER BY id DESC LIMIT 5")
    const projects = projectStatement.all();

    const blogStatement = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC LIMIT 5")
    const blogs = blogStatement.all();

    return res.render("programming", {blogs,projects})
})

app.get("/delete-project/:id", mustBeLoggedIn, (req,res) => {

    const deleteStatement = db.prepare("DELETE FROM programming WHERE id = ?")
    deleteStatement.run(req.params.id)

    return res.redirect("/edit-programming")
})

app.get("/admin", (req,res) => {

    return res.render("admin-login")
})

app.get("/edit-portfolio", mustBeLoggedIn, (req,res) => {

    const portfolioStatement = db.prepare("SELECT * FROM portfolio")
    const portfolio = portfolioStatement.all()

    return res.render("edit-portfolio", {portfolio})
})

app.get("/delete-event/:id", (req,res) => {

    const eventStatement = db.prepare("SELECT * FROM events WHERE id = ?")
    const event = eventStatement.get(req.params.id)

    const filePath = __dirname+"/public/img/"+event.image

    fs.unlinkSync(filePath);

    const deleteStatement = db.prepare("DELETE FROM events WHERE id = ?")
    deleteStatement.run(req.params.id)

    return res.redirect("/edit-events")
})

app.get("/delete-piece/:id", mustBeLoggedIn, (req,res) => {

    const pieceStatement = db.prepare("SELECT * FROM portfolio WHERE id = ?")
    const piece = pieceStatement.get(req.params.id)

    const filePath = __dirname+"/public/audio/"+piece.link

    const deleteStatement = db.prepare("DELETE FROM portfolio WHERE id = ?")
    deleteStatement.run(req.params.id)

    fs.unlinkSync(filePath);

    return res.redirect("/edit-portfolio")
})

app.post("/login", (req,res) => {
    const matchOrNot = bcrypt.compareSync(req.body.password, process.env.ADMIN_PASSWORD_HASH);

    if(matchOrNot)
    {
        const ourTokenValue = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60*60*24)}, process.env.JWTSECRET) //Creating a token for logging in

        res.cookie("chris",ourTokenValue, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24
        }) //name, string to remember,

        return res.redirect("/")
    }
    else
    {
        return res.redirect("/admin")
    }
})

app.get("/logout", (req,res) => {
    res.clearCookie("chris")
    res.redirect("/")
})

app.get("/youtube", async (req,res) => {

    const urls = [
        'https://www.youtube.com/@ChrisPriceMusicSamples',
        'https://www.youtube.com/@ChrisPriceMusicComposer',
        'https://www.youtube.com/@SibeliusScholar'
    ];

    try {
        const channelData = [];

        for (const url of urls) {
            const identifier = getChannelIdentifier(url);

            // Search for the channel to get the ID
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(identifier)}&key=${process.env.API_KEY}`;
            const searchRes = await fetch(searchUrl);
            const searchJson = await searchRes.json();
            if (!searchJson.items || !searchJson.items.length) continue;

            const channelId = searchJson.items[0].snippet.channelId;

            // Get full channel data
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${process.env.API_KEY}`;
            const channelRes = await fetch(channelUrl);
            const channelJson = await channelRes.json();
            const channel = channelJson.items[0];

            channelData.push({
                title: channel.snippet.title,
                image: channel.snippet.thumbnails.high.url,
                subs: Number(channel.statistics.subscriberCount).toLocaleString(),
                videos: Number(channel.statistics.videoCount).toLocaleString(),
                url: url
            });
        }

        return res.render('youtube', { channels: channelData });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading channel data.');
    }
})

app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(3009)


//npm install jsonwebtoken dotenv bcrypt cookie-parser express ejs better-sqlite3 nodemailer sharp multer fs nodemon
//npm init -y
//"dev": "nodemon server",