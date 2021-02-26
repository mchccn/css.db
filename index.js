"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const short_uuid_1 = __importDefault(require("short-uuid"));
class CSSDatabase {
    constructor() {
        this.cache = {};
        this.schemas = {};
        try {
            if (!fs_1.default.existsSync("./database.css"))
                fs_1.default.appendFileSync("./database.css", "", "utf-8");
        }
        catch (e) {
            throw new Error(`Failed to create database.json: ${e}`);
        }
        this.css = fs_1.default.readFileSync("./database.css", "utf8");
        this.parseCSS(this.css.trim());
    }
    parseCSS(css) {
        const documents = css.split(/\n*(?<=\w+\.[0-9a-zA-Z]+\s+\{.+\})\n*/s).filter(($) => $);
        documents.forEach((doc) => {
            const [name, id] = doc.split(/\s+/)[0].split(".");
            const parsed = this.parse(doc);
            if (this.cache[name])
                this.cache[name][id] = parsed;
            else
                this.cache[name] = {
                    [id]: parsed,
                };
        });
    }
    parse(doc) {
        const lines = doc
            .split("\n")
            .slice(1, -1)
            .map((l) => l.trim().split(/:\s+/))
            .map(([_, v]) => [_, v.slice(0, v.length - 1)]);
        const parsed = {};
        lines.forEach(([key, value]) => {
            parsed[key] = /^\d*\.?\d*$/.test(value)
                ? parseFloat(value)
                : /^(true|false)$/.test(value)
                    ? value === "true"
                    : value;
        });
        return parsed;
    }
    stringify(namespace, id, doc) {
        return `${namespace}.${id} {\n${Object.entries(doc)
            .map(([key, value]) => `    ${key}: ${value.toString()};`)
            .join("\n")}\n}\n\n`;
    }
    stringifySchema(namespace, schema) {
        return `${namespace} {\n${Object.entries(schema)
            .map(([key, value]) => `    ${key}: ${value};`)
            .join("\n")}\n}\n`;
    }
    stringifySchemas(schemas) {
        return Object.entries(schemas).map(([name, schema]) => this.stringifySchema(name, schema));
    }
    save() {
        fs_1.default.writeFileSync("./database.css", `${this.stringifySchemas(this.schemas)}\n${Object.entries(this.cache)
            .map(([namespace, docs]) => Object.entries(docs)
            .map(([id, doc]) => this.stringify(namespace, id, doc))
            .join(""))
            .join("")}`);
    }
    create(namespace, doc) {
        const schema = this.schemas[namespace];
        if (schema) {
            Object.entries(schema).forEach(([key, type]) => {
                if (typeof doc[key] !== "undefined" && typeof doc[key] !== type)
                    throw new Error(`Expected a ${type} but got a ${typeof doc[key]} for property '${key}'.`);
            });
        }
        if (this.cache[namespace])
            this.cache[namespace][short_uuid_1.default.generate()] = doc;
        else
            this.cache[namespace] = {
                [short_uuid_1.default.generate()]: doc,
            };
        this.save();
        return doc;
    }
    schema(name, schema) {
        if (!/^\w+$/.test(name))
            throw new Error("Schema name must match regex /^w+$/.");
        Object.entries(schema).forEach(([key, value]) => {
            if (!/^[0-9a-zA-Z_-]+$/.test(key))
                throw new Error(`Invalid property name '${key}'.`);
            if (!["string", "number", "boolean"].includes(value))
                throw new Error("Only string, number, and boolean are supported types.");
        });
        this.schemas[name] = schema;
    }
    find(name, query) {
        const docs = Object.entries(this.cache[name] || {});
        return docs
            .filter(([id, doc]) => Object.entries(query).every(([key, value]) => doc[key] === value))
            .map(([id, doc]) => (Object.assign({ id }, doc)));
    }
    findOne(name, query) {
        return this.find(name, query)[0];
    }
    findById(name, id) {
        return (this.cache[name] || {})[id];
    }
    delete(name, query) {
        const docs = Object.entries(this.cache[name] || {});
        const bs = docs
            .filter(([id, doc]) => Object.entries(query).every(([key, value]) => doc[key] === value))
            .map(([id, doc]) => delete this.cache[name][id]);
        this.save();
        return bs;
    }
    deleteOne(name, query) {
        const doc = this.findOne(name, query);
        const b = delete (this.cache[name] || {})[doc.id];
        this.save();
        return b;
    }
    deleteById(name, id) {
        const b = delete (this.cache[name] || {})[id];
        this.save();
        return b;
    }
}
exports.default = CSSDatabase;
module.exports = CSSDatabase;
exports = CSSDatabase;
