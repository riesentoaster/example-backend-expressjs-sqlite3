import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { nanoid } from 'nanoid';

const PORT = 3000

const app = express();
const db = new sqlite3.Database('./db.sqlite');
db.run('CREATE TABLE IF NOT EXISTS urls (id TEXT PRIMARY KEY, originalUrl TEXT NOT NULL)');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/shorten', (request: Request, response: Response) => {
  const url: string = request.body.url; // extracted from the request

  if (typeof url !== 'string')
    return response.status(400).send('Invalid URL');

  const id: string = nanoid(6);
  db.run('INSERT INTO urls (id, originalUrl) VALUES (?, ?)', [id, url], (err: Error | null) => {
    if (err)
      return response.status(500).send('Error creating shortened URL');
    else
      return response.send(`Shortened URL: <a href="/${id}">http://localhost:${PORT}/${id}</a>`);
  });
});

app.get('/all', (request: Request, response: Response) => {
  db.all('SELECT id, originalUrl FROM urls', (error: Error | null, rows: { id: string, originalUrl: string }[] | undefined) => {
    if (error || !rows || !Array.isArray(rows))
      return response.status(500).send('Error retrieving all URLs')
    else {
      rows.forEach(console.log)
      const rowsAsText = rows
      .map(({id, originalUrl}) => {
        const idAsLink = `<a href="http://localhost:${PORT}/${id}">${id}</a>`
        const fixedUrl = originalUrl.startsWith("http") ? originalUrl : "http://" + originalUrl
        const urlAsLink = `<a href="${fixedUrl}">${originalUrl}</a>`
        return `<li>${idAsLink}: ${urlAsLink}</li>`
      }).join("<br/>")
      const html = `<h1>All stored URLs</h1><ul>${rowsAsText}</ul>`
      return response.send(html)
    }
  });
})

app.get('/:id', (request: Request, response: Response) => {
  const id: string = request.params.id; // the :id part of the path that is matched against in this handler

  db.get('SELECT originalUrl FROM urls WHERE id = ?', id, (error: Error | null, row: { originalUrl: string } | undefined) => {
    if (error)
      return response.status(500).send('Error retrieving URL');
    else if (!row) 
      return response.status(404).send('URL not found');
    else if (row.originalUrl.startsWith("http"))
      return response.redirect(row.originalUrl);
    else
      return response.redirect("http://" + row.originalUrl);
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
