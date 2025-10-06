import openai
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

EMBEDDINGS = OpenAIEmbeddings()
INDEX_NAME = "developer-quickstart-py"
MODEL = "gpt-4o-mini"

client = openai.AsyncOpenAI()
llm = ChatOpenAI(temperature=0.7, model=MODEL)
memory = ConversationBufferMemory(
    memory_key="chat_history", return_messages=True, output_key="answer"
)
