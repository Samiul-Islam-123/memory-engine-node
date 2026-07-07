const LLMProvider = require("./LLMProviders/LLMProvider");
const LongTermStorage = require("./StorageProvider/LongTermStorage");
const WorkingMemory = require("./StorageProvider/WorkingMemory");

class MemoryEngine{

    constructor(base_model_config, embedding_model_config, analyzer_model_config= base_model_config , storagePath) {
        if (!base_model_config || !embedding_model_config || !analyzer_model_config) {
            throw new Error("[MemoryEngine] Missing model configurations. Ensure base_model, embedding_model, and analyzer_model configs are provided.");
        }

        this.base_model_config = base_model_config,
        this.embedding_model_config = embedding_model_config;
        this.analyzer_model_config = analyzer_model_config ;

        this.llm = new LLMProvider({
           model : this.base_model_config.model,
           provider : this.base_model_config.provider,
           apiKey : this.base_model_config.apiKey,
           baseURL : this.base_model_config.baseURL
        });

        this.working_mem = new WorkingMemory({
            maxTokens : 2000
        });

        this.long_term_mem = new LongTermStorage({
            storagePath : storagePath,
            analyzer_model_config : analyzer_model_config,
            embedding_model_config : embedding_model_config
        })
    }

    async chat(user_message) {

    // Working memory
    const workingMemory = this.working_mem.readWorkingMemory();

    // Long-term retrieval
    let longTermMemory = [];
    try {
        longTermMemory = await this.long_term_mem.RetrieveLongTermMemory(user_message);
    } catch (e) {
        console.warn("[MemoryEngine] Long-term memory retrieval failed. Proceeding with working memory only.", e.message);
    }

    const enhancedPrompt = `
You have access to two different memory systems.

==============================
WORKING MEMORY
==============================

This contains the recent conversation history.
Use it to maintain conversational continuity.

${JSON.stringify(workingMemory, null, 2)}

==============================
LONG TERM MEMORY
==============================

These are important memories retrieved because they are relevant to the current user message.

Use them only if they help answer the current message.
if u want u can mention them as per date, something like : "you have told me about this on this date" as the memory contains a date also

${JSON.stringify(longTermMemory, null, 2)}

==============================
CURRENT USER MESSAGE
==============================

${user_message}

==============================
YOUR TASK
==============================

1. Read the working memory to understand recent context.
2. Read the retrieved long-term memories.
3. Answer naturally.
4. If long-term memories are relevant, use them.
5. Never say "According to your memory..."
6. Respond as if you naturally remember these things.

Assistant:
`;

// console.log(`prompt`);
// console.log(enhancedPrompt)

    const response = await this.llm.generate(
        enhancedPrompt,
        this.base_model_config.system_prompt
    );

    const currentConversation = {
        user: user_message,
        model: response
    };

    // Run background tasks safely
    try {
        const analysis = await this.long_term_mem.analyze(currentConversation);
        await this.long_term_mem.resolveMemory(analysis);
    } catch (e) {
        console.warn("[MemoryEngine] Background analysis and storage failed. Memory may not be updated.", e.message);
    }

    try {
        this.working_mem.writeWorkingMemory(currentConversation);
    } catch (e) {
        console.warn("[MemoryEngine] Failed to write to working memory.", e.message);
    }

    return response;
}
}

module.exports = MemoryEngine