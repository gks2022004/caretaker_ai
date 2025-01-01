import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";

// Configuration
const config = {
  configurable: {
    thread_id: uuidv4(),
  },
};

// Initialize LLM
const llm = new ChatGroq({
  modelName: "Llama3-8b-8192",
  apiKey: process.env.API_KEY,
});

// Create prompt template
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a friendly and empathetic healthcare advisor. Speak in a natural, human-like way. 
      Ask thoughtful questions to understand the user's symptoms, circumstances, and medical history but dont ask more than 3 questions at a time . 
      Offer helpful suggestions and practical advice based on the information provided. 
      Remind the user that you are not a licensed medical professional and cannot provide an official diagnosis or prescription. 
      Encourage them to consult a healthcare provider for personalized care when necessary. 
      When appropriate, provide educational information about symptoms, potential causes, and preventive measures. but make it short and simple.
      once you have enough information, you can provide a summary of the user's symptoms and suggest possible next steps.`,
  ],
  ["placeholder", "{messages}"],
]);

// Define the function that calls the model
const callModel = async (state: typeof MessagesAnnotation.State) => {
  const prompt = await promptTemplate.invoke(state);
  const response = await llm.invoke(prompt);
  return { messages: response };
};

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Add memory and compile
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // For now, allow all origins
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Handle POST requests
export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || "Explain the importance of fast language models";

    // Invoke LLM (returns the full response object)
    const input = [
      {
        role: "user",
        content: message,
      },
    ];
    const response = await app.invoke({ messages: input }, config);
    console.log(response);

    // Safely extract the AI's reply from the response
    let lastAIMessageContent = null;

    // Loop backward until we find a message that looks like an AIMessage
    for (let i = response.messages.length - 1; i >= 0; i--) {
      const msg = response.messages[i];

      // A common heuristic is to check if it has "tokenUsage" or "finish_reason"
      // in its "response_metadata", which typically only AI messages have
      if (
        msg.response_metadata &&
        msg.response_metadata.tokenUsage &&
        typeof msg.response_metadata.finish_reason !== "undefined"
      ) {
        lastAIMessageContent = msg.content;
        break;
      }
    }

    // Return the extracted content
    return new Response(
      JSON.stringify({
        message: lastAIMessageContent,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // For now, allow all origins
        },
      }
    );
  } catch (error) {
    console.error("Error processing API request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process the request",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // For now, allow all origins
        },
      }
    );
  }
}
