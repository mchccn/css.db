import fs from "fs";
import id from "short-uuid";

class CSSDatabase {
    private css: string;
    private cache: {
        [name: string]: {
            [namespace: string]: {
                [id: string]: string | number | boolean;
            };
        };
    } = {};
    private schemas: {
        [name: string]: {
            [id: string]: "string" | "number" | "boolean";
        };
    } = {};

    constructor() {
        try {
            if (!fs.existsSync("./database.css")) fs.appendFileSync("./database.css", "", "utf-8");
        } catch (e) {
            throw new Error(`Failed to create database.json: ${e}`);
        }

        this.css = fs.readFileSync("./database.css", "utf8");

        this.parseCSS(this.css.trim());
    }

    private parseCSS(css: string) {
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

    private parse(doc: string) {
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

    private stringify(namespace: string, id: string, doc: { [id: string]: string | number | boolean }) {
        return `${namespace}.${id} {\n${Object.entries(doc)
            .map(([key, value]) => `    ${key}: ${value.toString()};`)
            .join("\n")}\n}\n\n`;
    }

    private stringifySchema(
        namespace: string,
        schema: {
            [id: string]: "string" | "number" | "boolean";
        }
    ) {
        return `${namespace} {\n${Object.entries(schema)
            .map(([key, value]) => `    ${key}: ${value};`)
            .join("\n")}\n}\n`;
    }

    private stringifySchemas(schemas: {
        [name: string]: {
            [id: string]: "string" | "number" | "boolean";
        };
    }) {
        return Object.entries(schemas).map(([name, schema]) => this.stringifySchema(name, schema));
    }

    private save() {
        fs.writeFileSync(
            "./database.css",
            `${this.stringifySchemas(this.schemas)}\n${Object.entries(this.cache)
                .map(([namespace, docs]) =>
                    Object.entries(docs)
                        .map(([id, doc]) => this.stringify(namespace, id, doc))
                        .join("")
                )
                .join("")}`
        );
    }

    public create(
        namespace: string,
        doc: {
            [id: string]: string | number | boolean;
        }
    ) {
        const schema = this.schemas[namespace];

        if (schema) {
            Object.entries(schema).forEach(([key, type]) => {
                if (typeof doc[key] !== "undefined" && typeof doc[key] !== type)
                    throw new Error(`Expected a ${type} but got a ${typeof doc[key]} for property '${key}'.`);
            });
        }

        if (this.cache[namespace]) this.cache[namespace][id.generate()] = doc;
        else
            this.cache[namespace] = {
                [id.generate()]: doc,
            };

        this.save();

        return doc;
    }

    public schema(
        name: string,
        schema: {
            [id: string]: "string" | "number" | "boolean";
        }
    ) {
        if (!/^\w+$/.test(name)) throw new Error("Schema name must match regex /^w+$/.");

        Object.entries(schema).forEach(([key, value]) => {
            if (!/^[0-9a-zA-Z_-]+$/.test(key)) throw new Error(`Invalid property name '${key}'.`);

            if (!["string", "number", "boolean"].includes(value))
                throw new Error("Only string, number, and boolean are supported types.");
        });

        this.schemas[name] = schema;
    }

    public find(
        name: string,
        query: {
            [id: string]: string | number | boolean;
        }
    ) {
        const docs = Object.entries(this.cache[name] || {});

        return docs
            .filter(([id, doc]) => Object.entries(query).every(([key, value]) => doc[key] === value))
            .map(([id, doc]) => ({ id, ...doc }));
    }

    public findOne(
        name: string,
        query: {
            [id: string]: string | number | boolean;
        }
    ) {
        return this.find(name, query)[0];
    }

    public findById(name: string, id: string) {
        return (this.cache[name] || {})[id];
    }

    public delete(
        name: string,
        query: {
            [id: string]: string | number | boolean;
        }
    ) {
        const docs = Object.entries(this.cache[name] || {});

        const bs = docs
            .filter(([id, doc]) => Object.entries(query).every(([key, value]) => doc[key] === value))
            .map(([id, doc]) => delete this.cache[name][id]);

        this.save();

        return bs;
    }

    public deleteOne(
        name: string,
        query: {
            [id: string]: string | number | boolean;
        }
    ) {
        const doc = this.findOne(name, query);

        const b = delete (this.cache[name] || {})[doc.id];

        this.save();

        return b;
    }

    public deleteById(name: string, id: string) {
        const b = delete (this.cache[name] || {})[id];

        this.save();

        return b;
    }
}

export default CSSDatabase;
module.exports = CSSDatabase;
exports = CSSDatabase;
