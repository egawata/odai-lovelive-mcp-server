import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs"
import path from "path"

/*
    Database は、json ファイルを読み込んで、その内容を返すクラス。
*/
class Database {
    private data: {
        series: Array<{ id: string, name: string }>,
        characters: Array<{ id: string, name: string, series: string, [key: string]: any }>
    };

    constructor(dataPath: string) {
        try {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            this.data = JSON.parse(rawData);
        } catch (error) {
            console.error('Failed to load data.json:', error);
            // 初期化エラー時は空のデータ構造を用意
            this.data = { series: [], characters: [] };
        }
    }

    // series の id と名称を返す
    getSeries() {
        return this.data.series;
    }

    // 条件に合う character のデータをすべて返す。
    // 条件は、seriesIDs で指定する(複数指定可能)。指定がない場合はすべてのデータを返す。
    // 指定がある場合、各 character の series が一致するもののみを返す。
    getCharacters(seriesIDs?: string[]) {
        if (!seriesIDs || seriesIDs.length === 0) {
            return this.data.characters;
        }

        return this.data.characters.filter(character =>
            seriesIDs.includes(character.series)
        );
    }
}

async function generateOdai(num: number, seriesIDs?: string[]) {
    return {
        content: [
            {
                type: "text" as const,
                text: `テスト`,
            },
        ],
    }
}

const server = new McpServer({
    name: "odai-lovelive",
    version: "0.0.1",
    capabilities: {
        resources: {},
        tools: {},
    },
});

server.tool(
    "get-odai",
    "generate drawing themes(odai) for creating illustrations inspired by Love Live!",
    {
        num: z.number().min(1).max(10).describe("Number of characters. Default is 1"),
        seriesIDs: z.array(z.enum(["1", "2", "3", "4", "5"]))
            .optional()
            .describe("series ID. Default is all series. 1: μ’ｓ, 2: Aqours, 3: 虹ヶ咲, 4: "),
    },
    async ({ num = 1, seriesIDs }, extra) => {
        const odai = await generateOdai(num, seriesIDs);
        return odai;
    },
)

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Server started");
}

main().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});
