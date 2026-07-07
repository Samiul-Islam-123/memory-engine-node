const LLMProvider = require("../LLMProviders/LLMProvider");
const { extractJSON } = require("../utils/UtilityFunctions");
const VectorEngine = require("./VectorEngine");
const fsp = require("fs/promises");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class LongTermStorage {

    constructor({ storagePath, analyzer_model_config, embedding_model_config }) {
        this.analyzer_model = new LLMProvider({
            model: analyzer_model_config.model,
            provider: analyzer_model_config.provider,
            apiKey: analyzer_model_config.apiKey
        })

        this.vector_engine = new VectorEngine({
            embedding_model_config: embedding_model_config
        })

        // Default storage directory
        const defaultDir = path.join(process.cwd(), ".memory-engine");

        this.storagePath = storagePath || defaultDir;

        // Create directory automatically
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }

        // Memory file
        this.memoryFile = path.join(
            this.storagePath,
            "memory.json"
        );

        // Create file if needed
        if (!fs.existsSync(this.memoryFile)) {
            fs.writeFileSync(
                this.memoryFile,
                JSON.stringify({ memories: [] }, null, 4)
            );
        }

    }

    async analyze(conversation) {
        // analyze the conversation with analyzer model
        const system_prompt = `
You are the Memory Analyzer of an AI Memory Engine.

Your job is to observe a conversation between a User and an AI Assistant from a completely neutral third-person perspective.

You are NOT the assistant.
You are NOT the user.
You are an impartial observer.

Your responsibility is to determine what durable knowledge was created, modified, or reinforced during this conversation.

Your output will later be stored as long-term memory and retrieved in future conversations.

==========================
WHAT TO STORE
==========================

Store information that is likely to remain useful across future conversations.

Examples:

• Personal facts
• Identity
• Preferences
• Goals
• Long-term plans
• Ongoing projects
• Strategies
• Decisions
• Instructions
• Skills
• Relationships
• Project architecture
• Technical decisions
• Important conclusions
• Artifacts created during the conversation
• Plans agreed upon

==========================
WHAT NOT TO STORE
==========================

Do NOT store:

• Greetings
• Small talk
• Temporary questions
• Random chit-chat
• Generic AI explanations
• Information that has no future value
• Repeated information unless it changes existing knowledge

==========================
MEMORY TYPES
==========================

Possible types:

fact
preference
goal
project
strategy
instruction
artifact
decision
relationship
skill
event
architecture
other

==========================
ENTITY
==========================

Every memory should belong to an entity.

Examples:

"user"

"assistant"

"MemoryEngine"

"SaaS Factory"

"Marketing Strategy"

"Authentication System"

"Project Roadmap"

If no clear entity exists, use:

"conversation"

==========================
OUTPUT FORMAT
==========================

Return ONLY valid JSON.

{
    "memories":[
        {
            "store": true,
            "importance": 0.95,
            "entity": "...",
            "type": "...",
            "category": "...",
            "summary": "...",
            "reason": "..."
        }
    ]
}

==========================
RULES
==========================

- A conversation may produce ZERO, ONE or MANY memories.

- Extract every important memory independently.

- Importance must be between 0.0 and 1.0.

- Summary should be concise and self-contained.

- Never duplicate memories.

- If no important memory exists:

{
    "memories":[]
}

Return ONLY JSON.

Never return markdown.

Never explain anything.
`;
        const prompt = `
Analyze the following conversation and extract all durable long-term memories.

Conversation:

User:
${conversation.user}

Assistant:
${conversation.model}
`;

        const response = await this.analyzer_model.generate(prompt, system_prompt);
        return extractJSON(response);
        //await this.resolveMemory(JSON.stringify(extractJSON(response)));
    }

    async resolveMemory(analysis) {

        try {

            const resolved = {
                memories: []
            };

            for (const memory of analysis.memories) {

                const embeddingText = JSON.stringify({
                    entity: memory.entity,
                    type: memory.type,
                    category: memory.category,
                    summary: memory.summary
                });

                const embedding =
                    await this.vector_engine.generateEmbeddings(embeddingText);


                // Search vector DB for similar memories.
                // await this.vector_engine.findDuplicate({
                //     memory : memory,
                // })
                // Decide whether this should be:
                // insert / update / ignore

                const action = "insert";

                resolved.memories.push({
                    ...memory,
                    embedding,
                    action
                });

            }

            //find memory action
            const existing_data = (await fsp.readFile(this.memoryFile, "utf8"));
            let existing_memories;
            try {
                existing_memories = JSON.parse(existing_data);
            } catch (e) {
                console.warn("[MemoryEngine] Corrupted memory file during resolveMemory. Starting fresh.");
                existing_memories = { memories: [] };
            }
            let existing_embeddings = [];
            // console.log(existing_memories)
            for (const existing_item of existing_memories.memories) {
                existing_embeddings.push(existing_item.embedding)
            }
            // console.log(existing_embeddings)
            for (const resolved_item of resolved.memories) {

                // const similarity_result = await this.vector_engine.findDuplicate({
                //     memory: resolved_item.embedding,
                //     memories: existing_embeddings
                // })

                // if(!similarity_result.found){
                //     await this.store(resolved_item)
                // }

                // else{
                //     console.log("i know bro ");
                //     console.log(similarity_result)
                // }

                const desicion = await this.vector_engine.resolveMemoryAction({
                    memory: resolved_item.embedding,
                    memories: existing_embeddings
                })

                switch (desicion.action) {
                    case "insert":
                        await this.store(resolved_item)
                        break;

                    case "update":
                        await this.update(desicion.index, resolved_item)
                        break;

                    //ignore do nothing
                }
            }


        } catch (error) {
            throw error;
        }

    }

    async store(resolvedMemory) {

        try {

            const filePath = this.memoryFile;

            let data = {
                memories: []
            };

            if (!fs.existsSync(filePath)) {

                await fsp.writeFile(
                    filePath,
                    JSON.stringify(data, null, 4),
                    "utf8"
                );

            }

            const file = await fsp.readFile(filePath, "utf8");

            try {
                data = JSON.parse(file);
            } catch (e) {
                console.warn("[MemoryEngine] Corrupted memory file during store. Starting fresh.");
                data = { memories: [] };
            }

            data.memories.push({
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                accessCount: 0,
                ...resolvedMemory
            });


            // for (const memory of resolvedMemory.memories) {

            //     data.memories.push({
            //         id: crypto.randomUUID(),
            //         createdAt: new Date().toISOString(),
            //         updatedAt: new Date().toISOString(),
            //         accessCount: 0,
            //         ...memory
            //     });

            // }

            await fsp.writeFile(
                filePath,
                JSON.stringify(data, null, 4),
                "utf8"
            );

        } catch (error) {

            throw error;

        }

    }

    async update(index, resolvedMemory) {

        try {

            const filePath = this.memoryFile;

            if (!fs.existsSync(filePath)) {
                throw new Error("Memory storage file not found.");
            }

            const file = await fsp.readFile(filePath, "utf8");
            let data;
            try {
                data = JSON.parse(file);
            } catch (e) {
                console.warn("[MemoryEngine] Corrupted memory file during update. Cannot update.");
                throw new Error("Memory file corrupted");
            }

            if (
                index < 0 ||
                index >= data.memories.length
            ) {
                throw new Error("Invalid memory index.");
            }

            const existing = data.memories[index];

            data.memories[index] = {
                ...existing,
                ...resolvedMemory,
                id: existing.id,
                createdAt: existing.createdAt,
                updatedAt: new Date().toISOString(),
                accessCount: existing.accessCount
            };

            await fsp.writeFile(
                filePath,
                JSON.stringify(data, null, 4),
                "utf8"
            );

        } catch (error) {
            throw error;
        }

    }

   async RetrieveLongTermMemory(user_message) {

    try {

        const existingData = await fsp.readFile(
            this.memoryFile,
            "utf8"
        );

        let existingMemories;
        try {
            existingMemories = JSON.parse(existingData);
        } catch (e) {
            console.warn("[MemoryEngine] Corrupted memory file during retrieval. Returning empty.");
            return [];
        }

        const similarMemories = await this.vector_engine.search({
            query: user_message,
            memories: existingMemories.memories
        });


        return similarMemories.map(result => {

            const cleanMemory = { ...result.memory };

            delete cleanMemory.embedding;
            delete cleanMemory.action;

            return {
                similarity: result.similarity,
                memory: cleanMemory
            };

        });

    } catch (error) {
        throw error;
    }

}
}

module.exports = LongTermStorage