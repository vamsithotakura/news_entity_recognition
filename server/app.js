const cors = require("cors")
const express = require('express');
require('dotenv').config()

const apiErrorHandler = require('./errors/APIErrorHandlers')
const APIError = require('./errors/APIError')
const NewsService = require('./service/NewsService')

const PORT = process.env.PORT || 8080;

const newsApp = express()
const apiRouter = express.Router();
const newsAPIService = new NewsService()

apiRouter.use(cors());
newsApp.use(express.json());
newsApp.use('/api/v1', apiRouter);  // Mount base path


apiRouter.post('/news/articles/query', async (req, res, next) => {
  try {
    let queryTerm = req.body.term;
    // console.log('QUERY_TERM :: '+queryTerm)
    if (!queryTerm) {
      throw new APIError(400, 'Missing mandatory query-param - `term`')
    }
    const topNewsArticleHits = await newsAPIService.queryTopArticles(queryTerm, -1);
    // console.log('RESPONSE :: '+JSON.stringify(topNewsArticleHits))
    return res.json(topNewsArticleHits)
  } catch (error) {
    return next(error)
  }
})

apiRouter.post('/ping', (req, res, next) => {
  try {
    console.log(req.body)
    return res.json({'mesg': 'Hello World', 'ts': Date.now()})
  } catch (error) {
    return next(error)
  }
})

newsApp.use(apiErrorHandler)  // Register error handler.

newsApp.listen(PORT, () => {  // Start listening on port.
  console.log(`Server is listening on ${PORT}`);
});
