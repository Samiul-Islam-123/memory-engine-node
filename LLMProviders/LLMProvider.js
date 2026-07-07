const AnthropicProvider = require("./AnthropicProvider");
const GeminiProvider = require("./GeminiProvider");
const OllamaProvider = require("./OllamaProvider");
const OpenAIProvider = require("./OpenAIProvider");

const PROVIDERS = {
    openai: OpenAIProvider,
    google: GeminiProvider,
    anthropic: AnthropicProvider,
    ollama: OllamaProvider
};

class LLMProvider {

    constructor(config) {

        const Provider = PROVIDERS[config.provider];

        if (!Provider) {
            throw new Error(`Unsupported provider: ${config.provider}`);
        }

        this.llm = new Provider(config);
    }

    async generate(prompt, systemPrompt) {
        try{

            return await this.llm.generate({
                prompt,
                systemPrompt
            });
        }catch(error){
            throw error
        }

    }

    async generateEmbeddings(text){
        try{

            return await this.llm.embed(text);
        }catch(error){
            throw error
        }
    }

}

module.exports = LLMProvider;