import express from "express";
import helmet from "helmet";
import path from "path";
import cors from "cors";

require("dotenv").config({ path: path.join(__dirname, "../.env") });
import aws from "./aws";

const PORT = process.env.PORT || 80;

const app = express();
app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "../client/build")));

app.use(helmet());
app.use(cors());

// AWS Controls
app.use("/aws", aws);

// Index Page
app.get("/", (req, res) => {
    const indexPagePath: string = path.join(
        __dirname,
        "../client/build/index.html"
    );
    res.sendFile(indexPagePath);
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
