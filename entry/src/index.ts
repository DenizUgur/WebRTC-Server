import * as express from "express";
import helmet from "helmet";
import * as path from "path";
import * as cors from "cors";

const PORT = process.env.PORT || 80;

const app = express();
app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "../client/build")));

app.use(helmet());
app.use(cors());

app.get("/", (req, res) => {
    const indexPagePath: string = path.join(
        __dirname,
        "../client/build/index.html"
    );
    res.sendFile(indexPagePath);
});

app.listen(PORT, () => console.log(`Listening on ${process.env.BASE_URL}`));
