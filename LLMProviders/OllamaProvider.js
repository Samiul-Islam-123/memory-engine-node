class OllamaProvider {

    constructor({
        model,
        baseURL 
    }) {


        if (!model) {
            throw new Error("Ollama model is required.");
        }

        this.model = model;
        this.baseURL = baseURL ? baseURL.replace(/\/$/, "") : "http://localhost:11434";
    }

    async generate({ prompt, systemPrompt = "" }) {

        try {

            if (!prompt || typeof prompt !== "string") {
                throw new Error("Prompt must be a non-empty string.");
            }

            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    system: systemPrompt,
                    stream: false
                })
            });

            if (!response.ok) {
                await this.#handleError(response);
            }

            const data = await response.json();

            return data.response || "";

        } catch (error) {

            throw new Error(`Ollama Error: ${error.message}`);

        }

    }

    async embed(text) {

        try {

            if (!text || typeof text !== "string") {
                throw new Error("Text must be a non-empty string.");
            }

            const response = await fetch(`${this.baseURL}/api/embed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.model,
                    input: text
                })
            });

            if (!response.ok) {
                await this.#handleError(response);
            }

            const data = await response.json();

            return data.embeddings[0];

        } catch (error) {

            throw new Error(`Ollama Embedding Error: ${error.message}`);

        }

    }

    async #handleError(response) {

        let message = response.statusText;

        try {
            const body = await response.json();
            message = body.error || body.message || message;
        } catch {}

        switch (response.status) {

            case 400:
                throw new Error(message);

            case 404:
                throw new Error(`Model "${this.model}" not found.`);

            case 500:
                throw new Error("Ollama server error.");

            default:
                throw new Error(message);

        }

    }

}

module.exports = OllamaProvider;