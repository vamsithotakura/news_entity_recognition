
const OpenAI = require("openai");


class NERService {

  #openAI;
  #INSTRUCTION_SET;

  constructor() {
    this.entitiesMetadata = {
      PERSON: {'color': '#ffff00', 'tip': 'person'},
      DATE: {'color': '#66ffff', 'tip': 'date'},
      LOC: {'color': '#ffccff', 'tip': 'location'}
    }

    this.#openAI = new OpenAI({
      apiKey: process.env.OPEN_AI_API_KEY,  // TODO : Externalize secret
    });

    this.#INSTRUCTION_SET = `
    1. PERSON: Short name or full name of a person from any geographic regions.
    2. DATE: Any format of dates. Dates can also be in natural language.
    3. LOC: Name of any geographic location, like cities, countries, continents, districts etc.

    OUTPUT FORMAT:
    {{'PERSON': [list of entities present], 'DATE': [list of entities present], 'LOC': [list of entities present]}}
    If no entities are presented in any categories keep it None

    INPUT: \n      
    `
  }

  async detectEntities(documents) {
    const documentEntities = {}
    try {
      let template = this.#INSTRUCTION_SET
      documents.forEach(document => {
        const documentIndex = 'DOCUMENT-'+document.documentId;
        const documentBody = document.content;
        template = template.concat(documentIndex+ ': '+documentBody+ '\n')
      })

      // console.log('TEMPLATE : '+template)
      const completionPrompts= this.#openAI.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system",
            "content": "You are a super-smart and intelligent Named Entity Recognition (NER) service. I will provide you random news-article descriptions and your task is to extract named-entities."
          },
          {
            "role": "user",
            "content": "Your task is to detect entities within provided DOCUMENT news articles. Is the task clear ? "
          },
          {
            "role": "assistant",
            "content": "Yes, the task is clear. As a Named Entity Recognition (NER) system, my job is to extract named entities from the news-article descriptions you provide."
          },
          {
            "role": "user",
            "content": `
             1. PERSON: Short name or full name of a person from any geographic regions.
             2. DATE: Any format of dates. Dates can also be in natural language.
             3. LOC: Name of any geographic location, like cities, countries, continents, districts etc.

             OUTPUT FORMAT:
             {'DOCUMENT-ID': {'PERSON': [list of entities present], 'DATE': [list of entities present], 'LOC': [list of entities present]}}
             If no entities are presented in any categories keep it None

             DOCUMENT:
             DOCUMENT-1:  Mr. Jacob lives in Madrid since 12th January 2015.

             DOCUMENT-2: Sentence: Mr. Rajeev Mishra and Sunita Roy are friends and they meet each other on 24/03/1998.
            `
          },
          {
            "role": "assistant",
            "content": '{"DOCUMENT":{"DOCUMENT-1":{"PERSON":["Mr. Jacob"],"DATE":["12th January 2015"],"LOC":["Madrid"]},"DOCUMENT-2":{"PERSON":["Mr. Rajeev Mishra","Sunita Roy"],"DATE":["24/03/1998"],"LOC":["None"]}}}'
          },
          {
            "role": "user",
            "content": `
             1. PERSON: Short name or full name of a person from any geographic regions.
             2. DATE: Any format of dates. Dates can also be in natural language.
             3. LOC: Name of any geographic location, like cities, countries, continents, districts etc.

             OUTPUT FORMAT:
             {{'PERSON': [list of entities present], 'DATE': [list of entities present], 'LOC': [list of entities present]}}
             If no entities are presented in any categories keep it None

            DOCUMENT:
            DOCUMENT-1: Thanksgiving week is here. No byes. No days off, except for Saturday.\\r\\n' +
            'Six stand-alone games. Sixteen games in all. Simms and I have picked a winner in each one.\\r\\n' +
            'Last week, Simms swept the three str… [+2997 chars]

            DOCUMENT-2: Why not celebrate Thanksgiving Eve with the first mock draft at The Overhang! Thirty-two picks to fill you up before you venture out to see everyone back in town and e… [+34156 chars]

            DOCUMENT-3: Why Gennaro is taking the Chiefs: One of the biggest surprises of the 2023 season: Kansas City's offense ISN'T extraordinary. Shoot, lately, it isn't even ordinary. The Chiefs haven't scored a single… [+776 chars]
            `
          },
          {
            "role": "assistant",
            "content": '{"OUTPUT":{"DOCUMENT-1":{"PERSON":["Simms"],"DATE":["Thanksgiving week"],"LOC":["None"]},"DOCUMENT-2":{"PERSON":["The Overhang"],"DATE":["Thanksgiving Eve"],"LOC":["None"]},"DOCUMENT-3":{"PERSON":["Gennaro"],"DATE":["2023"],"LOC":["Kansas City"]}}}'
          },
          {
            "role": "user",
            "content": template
          }
        ],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const completionPromptRes = await completionPrompts;
      const autoResponse = completionPromptRes &&
        completionPromptRes.choices &&
        completionPromptRes.choices.length >= 1 &&
        completionPromptRes.choices[0].message
      if (autoResponse) {
        const autoContent = JSON.parse(autoResponse.content)['OUTPUT']

        const detectedEntities = []
        for (const contentId in autoContent) {
          const documentId = Number(contentId.split('-')[1]);
          detectedEntities.push({
            documentId: documentId,
            entities: autoContent[contentId]
          })
        }
        documentEntities['documents'] = detectedEntities
        documentEntities['entityMetadata'] = this.entitiesMetadata
      }
      // console.log('ENTITIES :: '+JSON.stringify(documentEntities))
      return documentEntities;
    } catch (error) {
      console.error('Unexpected-error while detecting news entities ... \n'+JSON.stringify(error))
      return documentEntities
    }
  }
}

module.exports = NERService;
