const StreamZip = require('node-stream-zip');
const fs = require('fs')
const xml2Json = require('xml-js');
const formidable = require('formidable');

const express = require('express')
const http = require('http')
const app = express()

app.get('/', (request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end('<form action="upload" method="post" enctype="multipart/form-data">' +
        '<input type="file" name="uploadedFile"><br>' +
        '<input type="submit"></form>');
})

app.post('/upload', (request, response) => {

    const form = new formidable.IncomingForm();

    let resultString = ''

    let renderedTab = `<table><thead><tr><td>Objet declancheur</td><td>Type de flow</td></tr></thead><tbody>`

    form.parse(request, (err, fields, files) => {

        const zip = new StreamZip({
            file: `${files.uploadedFile.filepath}`,
            storeEntries: true
        });

        zip.on('ready', () => {
            for (const entry of Object.values(zip.entries())) {
                if (!entry.isDirectory) {
                    const data = zip.entryDataSync(entry.name);
                    fs.readFile(data, 'utf8' , (err, data) => {
                        if (err) {
                            const jsonFile = xml2Json.xml2json(err.path + '', {compact: true, spaces: 4});
                            const obj = JSON.parse(jsonFile)

                            if (obj.Flow?.start?.object?._text)
                                console.log('isObject')
                                //renderedTab += '<tr><td>'+obj.Flow?.start?.object?._text+'</td>'
                            else
                                console.log('notObject')
                                //renderedTab += '<tr><td>'+null+'</td>'

                            if (obj.Flow?.processType._text)
                                console.log('isType')
                                // += '<td>'+obj.Flow?.processType._text+'</td></tr>'
                            else
                                console.log('notType')
                                //renderedTab += '<td>'+null+'</td></tr></tbody></table>'

                            resultString += `Objet declancheur: ${obj.Flow?.start?.object?._text} | Type de flow: ${obj.Flow?.processType._text}\n`
                            return
                        }
                        console.log(data)
                    })
                }
            }
            zip.close();
        });
    });

    response.writeHead(200, { "content-type": "text/html" })
    response.end('Processed')
})

http.createServer(app).listen(process.env.PORT || 3000);
