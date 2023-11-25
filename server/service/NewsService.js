const axios = require('axios')
const NewsAPI = require('newsapi');

const APIError = require('../errors/APIError.js')
const NERService = require('./NERService.js')

class NewsService {

  #newsAPI;
  #nerService;

  constructor() {
    this.#newsAPI = new NewsAPI(process.env.NEWS_API_KEY);  // TODO : Externalize secret
    this.#nerService = new NERService();
  }

  queryTopArticles(queryTerm, page) {

    return this.#newsAPI.v2.topHeadlines({
      // sources: 'bbc-news, the-verge',
      q: queryTerm,
      category: 'general',
      language: 'en',
      country: 'us',
      'page': page === -1 ? 1 : page
    }).then(async response => {
      const documentsById = new Map();
      if (response.status === 'ok' && response.articles.length > 0) {
        response.articles.forEach((article, index) => {
          if (article.content && article.content.length > 5) {
            const document = {
              'title': article.title,
              'content': article.content.substring(0, 256),
              'link': article.url,
              'documentId': index + 1
            }
            documentsById.set(document.documentId, document)
          }
        })
      }

      if (documentsById.size > 0) {
        const nerDetections = await this.#nerService.detectEntities(Array.from(documentsById.values()))
        const nerDocuments = nerDetections['documents']

        if (nerDocuments) {
          const nerEntitiesMetadata = nerDetections['entityMetadata']

          nerDocuments.forEach(nerDocument => {
            if (documentsById.has(nerDocument.documentId)) {
              const document = documentsById.get(nerDocument.documentId)

              let documentNerContent = document.content
              for (const [detectedEntityKey, detectedEntities] of Object.entries(nerDocument.entities)) {
                if (nerEntitiesMetadata[detectedEntityKey]) {
                  detectedEntities.forEach(detectedEntity => {
                    const entityColor = nerEntitiesMetadata[detectedEntityKey].color
                    const entityTip = nerEntitiesMetadata[detectedEntityKey].tip
                    documentNerContent = documentNerContent.replaceAll(detectedEntity, `<span title="${entityTip}" style="color: ${entityColor}">${detectedEntity}</span>`)
                  })
                }
              }

              document.nerContent = documentNerContent
              document.entities = nerDocument.entities
            }
          });
        }
      }
      return Array.from(documentsById.values())
    }).catch(error => {
      this.checkHttpError(error)
      console.error('Unexpected-error while querying news articles ...\n'+JSON.stringify(error))
      // throw error
      return [] // Return empty data - handle on form rendering
    });

  }

  checkHttpError(error) {
    if (error && error instanceof axios.AxiosError) {
      const message = error.response.data ? error.response.data : error.code
      throw new APIError(error.response.status, message, error.response.statusText)
    }
  }
}

module.exports = NewsService;