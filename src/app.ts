import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const app: Express = express();

app.use(express.json());
app.use(cookieParser());

app.use(routes);

app.use(errorHandler);

export default app;
