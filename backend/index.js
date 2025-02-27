import {app} from "./app.js"
import connectDB from "./DB/database.js"
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

connectDB().then(()=>{
    app.get("/", (req, res) => {
        res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>App Status</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f4f4f4;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        font-size: 2rem;
                    }
                    .emoji {
                        font-size: 3rem;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>App is Live! <span class="emoji">🚀</span></h1>
                </div>
            </body>
            </html>
        `);
    });
    app.listen(8080,()=>{
        console.log("App listening on port 8080")
    })
}).catch((err)=>{
    console.log("Error while connecting DB",err)
})