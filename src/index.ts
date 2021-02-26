import fs from "fs";
import id from "short-uuid";

export default class CSSDatabase {
    private css: string;
    private cache: {
        [name: string]: {
            [namespace: string]: {
                [id: string]: string | number | boolean;
            };
        };
    } = {};

    constructor() {
        try {
            if (!fs.existsSync("./database.css")) fs.appendFileSync("./database.css", "", "utf-8");
        } catch (e) {
            throw new Error(`Failed to create database.json: ${e}`);
        }

        this.css = fs.readFileSync("./database.css", "utf8");

        this.parseCSS(this.css);
    }

    public parseCSS(css: string) {
        const documents = css.split(/\n*(?<=\w+\.[0-9a-zA-Z]+\s+\{.+\})\n*/s).filter(($) => $);

        documents.forEach((doc) => {
            const [name, id] = doc.split(/\s+/)[0].split(".");

            const parsed = this.parse(doc);

            if (this.cache[name]) this.cache[name][id] = parsed;
            else
                this.cache[name] = {
                    [id]: parsed,
                };
        });
    }

    public parse(doc: string) {
        const lines = doc
            .split("\n")
            .slice(1, -1)
            .map((l) => l.trim().split(/:\s+/))
            .map(([_, v]) => [_, v.slice(0, v.length - 1)]);

        const parsed: {
            [id: string]: string | number | boolean;
        } = {};

        lines.forEach(([key, value]) => {
            parsed[key] = /^\d*\.?\d*$/.test(value)
                ? parseFloat(value)
                : /^(true|false)$/.test(value)
                ? value === "true"
                : value;
        });

        return parsed;
    }

    public stringify(namespace: string, id: string, doc: { [id: string]: string | number | boolean }) {
        return `${namespace}.${id} {\n${Object.entries(doc)
            .map(([key, value]) => `${key}: ${value.toString()};`)
            .join("\n")}\n}\n`;
    }

    public new(
        namespace: string,
        doc: {
            [id: string]: string | number | boolean;
        }
    ) {
        if (this.cache[namespace]) this.cache[namespace][id.generate()] = doc;
        else
            this.cache[namespace] = {
                [id.generate()]: doc,
            };

        this.save();
    }

    public save() {
        let file = "";

        Object.entries(this.cache).forEach(([namespace, docs]) => {
            Object.entries(docs).forEach(([id, doc]) => {
                file += this.stringify(namespace, id, doc);
            });
        });

        console.log(file);

        //! append to db file
    }
}

const db = new CSSDatabase();

db.new("name", {
    string: "string",
});
