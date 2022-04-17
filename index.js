const StreamZip = require('node-stream-zip');
const fs = require('fs')
const xml2Json = require('xml-js');
const formidable = require('formidable');

const express = require('express')
const http = require('http')
const app = express()

app.get('/', (request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end('<html><head><title>Flow identifier</title>' +
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous"></head>' +
        '<body>' +
        '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)"><form action="upload" method="post" enctype="multipart/form-data">' +
        '<div class="mb-3">' +
        '  <input class="form-control" type="file" name="uploadedFile">' +
        '</div>' +
        '<input class="btn btn-success" type="submit"></form></div></body></html>');
})

app.post('/upload', (request, response) => {

    response.writeHead(200, { "content-type": "text/html" })

    const form = new formidable.IncomingForm()

    form.parse(request, (err, fields, files) => {

        const zip = new StreamZip({
            file: `${files.uploadedFile.filepath}`,
            storeEntries: true
        });

        zip.on('ready', () => {

            let resultString = ''
            let renderedTab = `<html><head><title>Flow identifier</title>
                        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
                        </head>
                        <body>
                        <div>
                        <table class="table table-striped"><thead>
                        <tr><th scope="col">Nom du flow</th><th scope="col">Objet declancheur</th><th scope="col">Type de flow</th></tr></thead><tbody>`

            for (const entry of Object.values(zip.entries())) {
                if (!entry.isDirectory) {
                    const data = zip.entryDataSync(entry.name);
                    try {
                        const xmlData = fs.readFileSync(data, 'utf8')
                        //console.log(xmlData)
                    } catch (err) {
                        const jsonFile = xml2Json.xml2json(err.path + '', {compact: true, spaces: 4});
                        //console.log(jsonFile)
                        const obj = JSON.parse(jsonFile)
                        if (obj.Flow?.processType._text) {
                            if (obj.Flow?.processType._text.match(/flow/i) && obj.Flow?.processType._text !== 'WorkFlow') {
                                if (obj.Flow?.start?.object?._text)
                                    renderedTab += `<tr><td>${obj.Flow?.label._text}</td><td>${obj.Flow?.start?.object?._text}</td><td>${obj.Flow?.processType._text}</td></tr>`
                                else
                                    renderedTab += `<tr><td>${obj.Flow?.label._text}</td><td>${obj.Flow?.recordLookups?.object?._text}</td><td>${obj.Flow?.processType._text}</td></tr>`
                            }
                        }
                    }
                }
            }
            renderedTab += `</tbody></table></div></body></html>`
            response.end(renderedTab)
            zip.close();
        });
    });
})

http.createServer(app).listen(process.env.PORT || 3000);
