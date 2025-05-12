import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs"
import path from "path"

type Series = {
    id: number;
    name: string;
    link: string;
}

type Character = {
    name: string;
    link: string;
    series: number;
}

/*
    Database は、json ファイルを読み込んで、その内容を返すクラス。
*/
class Database {
    private data: {
        series: Array<{ id: string, name: string }>,
        characters: Array<Character>,
        places: Array<string>,
        times: Array<string>,
        actions: Array<string>,
        items: Array<string>,
    };

    constructor(dataPath: string) {
        try {
            const rawData = fs.readFileSync(dataPath, 'utf8');
            this.data = JSON.parse(rawData);
        } catch (error) {
            console.error('Failed to load data.json:', error);
            // 初期化エラー時は空のデータ構造を用意
            this.data = {
                series: [],
                characters: [],
                places: [],
                times: [],
                actions: [],
                items: [],
            };
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

        // seriesIDs を数値に変換
        const seriesIDsNum = seriesIDs.map(id => parseInt(id, 10));

        return this.data.characters.filter(character =>
            seriesIDsNum.includes(character.series)
        );
    }

    getPlaces() {
        return this.data.places;
    }

    getTimes() {
        return this.data.times;
    }

    getActions() {
        return this.data.actions;
    }

    getItems() {
        return this.data.items;
    }
}

function getRandomPlace(): string {
    const places = database?.getPlaces();
    if (!places) {
        return "";
    }
    const randomIndex = Math.floor(Math.random() * places.length);
    return places[randomIndex];
}

function getTime(): string {
    const times = database?.getTimes();
    if (!times) {
        return "";
    }
    const randomIndex = Math.floor(Math.random() * times.length);
    return times[randomIndex];
}

function getAction(): string {
    const actions = database?.getActions();
    if (!actions) {
        return "";
    }
    const randomIndex = Math.floor(Math.random() * actions.length);
    return actions[randomIndex];
}

function getItem(): string {
    const items = database?.getItems();
    if (!items) {
        return "";
    }
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
}

async function generateOdai(num: number, seriesIDs?: string[]) {
    var chars = database?.getCharacters(seriesIDs);
    if (!chars) {
        return {
            content: [
                {
                    type: "text" as const,
                    text: `failed to get characters.`,
                },
            ],
        }
    }

    const selectedChars = [];
    const charsLength = chars.length;
    if (num > charsLength) {
        num = charsLength;
    }
    // chars をシャッフル
    for (let i = charsLength - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    // num 個のキャラクターを選択
    for (let i = 0; i < num; i++) {
        selectedChars.push(chars[i]);
    }

    const resp = {
        "characters": selectedChars.map((char) => {
            return {
                "name": char.name,
                "link": char.link,
            }
        }),
        "place": getRandomPlace(),
        "time": getTime(),
        "action": getAction(),
        "item": getItem(),
    }

    return {
        content: [
            {
                type: "text" as const,
                text: JSON.stringify(resp),
            },
        ],
    }
}

const svr = new McpServer({
    name: "odai-lovelive",
    version: "0.0.1",
    capabilities: {
        resources: {},
        tools: {},
    },
});

var database: Database | undefined

svr.tool(
    "get-odai",
    "generate drawing themes(odai) for creating illustrations inspired by Love Live!",
    {
        num: z.number().min(1).max(10).describe("Number of characters. Default is 1"),
        seriesIDs: z.array(z.enum(["1", "2", "3", "4", "5", "6"]))
            .optional()
            .describe("series ID. Default is all series. 1: μ’ｓ, 2: Aqours, 3: 虹ヶ咲, 4: Liella!, 5: 蓮ノ空, 6: イキヅライブ"),
    },
    async ({ num = 1, seriesIDs }, extra) => {
        const odai = await generateOdai(num, seriesIDs);
        return odai;
    },
)

async function initDatabase() {
    const dataPath = process.argv[2];
    if (!dataPath) {
        console.error("json file path is required.");
        process.exit(1);
    }

    const absolutePath = path.resolve(dataPath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Data path does not exist: ${absolutePath}`);
        process.exit(1);
    }

    database = new Database(absolutePath);
}

async function main() {
    await initDatabase();

    const transport = new StdioServerTransport();
    await svr.connect(transport);
    console.error("Server started");
}

main().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});
