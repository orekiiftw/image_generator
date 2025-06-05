import axios from "axios";


async function chatCompletion(model,query){
  
  const requestData = {
    "model": `${model}`,
    "messages": [
      {
        "role": "user",
        "content": `${query}`
      }
    ]
  }
  const response = await axios.post("https://api.paxsenix.biz.id/v1/chat/completions", requestData)
  const result = response.data.choices[0].message.content
  console.log(result)
}

chatCompletion("claude-3-5-sonnet", "which model i am interacting with, name the model?")