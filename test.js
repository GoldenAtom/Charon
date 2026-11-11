const { createServer } = require('node:http');
const fs = require('node:fs');
const { dirname } = require('node:path');
const { blob } = require('node:stream/consumers');

const hostname = '127.0.0.1';
const port = 3000;

var codeFiles = [
    {   
        name:"header",
        path:"/html/header.html",
        data:""
    },
    {   
        name:"body",
        path:"/html/body.html",
        data:""
    },
    {   
        name:"style",
        path:"/html/style.css",
        data:""
    },
]

function refreshFiles(){ // function to allow for refreshing of files on the go
///read html files
    for (block in codeFiles){
        try {
        codeFiles[block].data = fs.readFileSync(__dirname + codeFiles[block].path,'utf-8');
        } catch(err){
            console.log("file fetch error, fetching ",codeFiles[block].name," : ",err);
        }
    }
}
refreshFiles();  ///fetch initial files


function FetchFirstOfName(name,list){
    for (block in list){
        if (list[block].name == name){
            return list[block];
        }
    }
    console.log("couldnt find ",name,"in list ",list);
}

//make server
const server = createServer();

//server gets pinged
server.on("request",(req,res) => {

    refreshFiles();

    res.statusCode=200
    res.setHeader('Content-Type', 'text/html');
    res.write("<!DOCTYPE html>")
    res.write("<html>")

    res.write(FetchFirstOfName("header",codeFiles).data); // write header
    res.write(FetchFirstOfName("style",codeFiles).data); // write css
    res.write(FetchFirstOfName("body",codeFiles).data); //write body
    
    res.end("</html>")

});

server.listen(port,hostname);