"use strict";

const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { send } = require('node:process');
const { dir } = require('node:console');

const hostname = '127.0.0.1';
const port = 3000;

var codeFiles = {
    head : {path:"/html/head.html",data:""},
    header: {path:"html/header.html",data:""},
    body: {path:"html/body.html",data:""},
    style: {path:"html/style.css",data:""},
    javascript : {path:"html/script.js",data:""},
}

function refreshFiles(){ // function to allow for refreshing of files on the go
///read html files
    for (const [name,object] of Object.entries(codeFiles)){
        try {
        object.data = fs.readFileSync(path.join(__dirname,object.path),'utf-8');
        } catch(err){
            console.log("file fetch error, fetching ",name," : ",err);
        }
    }
}
refreshFiles();  ///fetch initial files


//make server
const server = createServer();


function createMSGFileTemplate(title){
    let object = {
        title: title,
        readable_title:"Chat without a name",
        timeOfCreation: Date.now(),
        messages: [],
        latest_sender:"",
        last_interact: Date.now(),
    }
    return object;
}

let dateFormat = Intl.DateTimeFormat("en-EN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });

function handleMessage(message,dir,timestamp,sender){
    ///// fetch chat data
    let data = "";
    if (!(dir==="")){
        try {
            data = fs.readFileSync(path.join(__dirname,"data","chats",[dir,".json"].join("")),"utf-8");
            console.log("did file read");
        } catch(error) {
            data = ""
            console.log(error);

        }
    }

    if(data==""){
        data = createMSGFileTemplate(Date.now().toString());
    } else {
        try {
            data=JSON.parse(data);
        } catch {
            return console.error("Failed to parse json");
        }
    }

    ////// append new msg

    let msgObject = {
        index:data.messages.length,
        sender:sender,
        timestamp:timestamp,
        readable_timestamp:dateFormat.format(timestamp),
        text:message,
    }
    data.messages.push(msgObject);

    data.latest_sender = sender;

    data.last_interact = Date.now();

    fs.writeFileSync(path.join(__dirname,"data","chats",[data.title,".json"].join("")),JSON.stringify(data));

    return data.title;
}




//server gets pinged
server.on("request",(req,res) => {

    if (req.url === "/favicon.ico") { res.statusCode = 204; return res.end(); }

    if(req.method === "POST"){
        let body = "";
        req.setEncoding('utf-8');
        req.on("data",chunk => body += chunk);
        req.on("end", () => {
            console.log("posted");
            console.log(req.url);
            console.log(body);
            let chatTitle = handleMessage(body,req.url.replace("/",""),Number(req.headers.timestamp),"user");
            res.statusCode=200;
            res.setHeader("Content-Type","text/plain");
            res.write(chatTitle);
            console.log(chatTitle);
            res.end();
        });
        return;
    }

    res.setHeader("Vary", "DataFetch");   

    if(req.headers['datafetch'] !== undefined){
        res.setHeader("Cache-Control", "no-store");
        let headerValue = req.headers.datafetch;
        if(headerValue === "messages"){ // if the client requests the messages in a chat
            // fetch chat data
            let chatDir = req.url.replace("/","");
            let messages = []; // declare messages list
            if(chatDir ==""){res.statusCode=200;res.setHeader("Content-Type","application/json");res.write("[]");res.end();return;} /// return nothing if no chat has been requested (New chat page)

            ///try fetching data
            try {
                const chat = JSON.parse(fs.readFileSync(path.join(__dirname,"data","chats",[chatDir,".json"].join("")),"utf-8"));
                messages = chat.messages;
            } catch {
                console.log("File read failed when attempring to send chat data for chat ",chatDir);
            }

            //Building the response
            res.statusCode=200;
            res.setHeader("Content-Type","application/json");
            res.write(JSON.stringify(messages));
            res.end();

        } else if (headerValue == "chats"){ /// if the client requests list of chats

            let chatsList = fs.readdirSync(path.join(__dirname,"data","chats"),"utf-8"); /// check for saved chats
            let returnList = [];
            for(const dirs of chatsList){ // iterate trough saved chats adding the relevant data to the list
                let chat = JSON.parse(fs.readFileSync(path.join(__dirname,"data","chats",dirs),"utf-8"));
                returnList.push({ //object containing the relevant data
                    name:chat.readable_title,
                    dir:chat.title,
                    timestamp:chat.last_interact
                });
            }

            // sorting the list
            returnList.sort(function(a,b){return b.timestamp - a.timestamp});

            //Building the response
            res.statusCode=200;
            res.setHeader("Content-Type","application/json");
            res.write(JSON.stringify(returnList));
            res.end();
        }
        return;
    }

    res.statusCode=200

    res.setHeader("Content-Type", "text/html")

    res.write("<!DOCTYPE html>\n")
    res.write("<html>\n")

    res.write(codeFiles.head.data);//write head

    res.write("<style>\n")
    res.write(codeFiles.style.data); // write css
    res.write("\n</style>\n")

    res.write("<body>\n");
    res.write(codeFiles.header.data); // write header
    res.write(codeFiles.body.data);// write body

    res.write("<script>"); //init javascript
    res.write(codeFiles.javascript.data); // instest javascript
    res.write("</script>"); //close script section

    res.write("\n</body>"); // close body
    
    res.end("\n</html>")

});

server.listen(port,hostname);

fs.watch(path.join(__dirname,"html"), () =>{
console.log("change detected, refreshing active files");
refreshFiles();
});