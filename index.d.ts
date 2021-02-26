declare class CSSDatabase {
    private css;
    private cache;
    private schemas;
    constructor();
    private parseCSS;
    private parse;
    private stringify;
    private stringifySchema;
    private stringifySchemas;
    private save;
    create(namespace: string, doc: {
        [id: string]: string | number | boolean;
    }): {
        [id: string]: string | number | boolean;
    };
    schema(name: string, schema: {
        [id: string]: "string" | "number" | "boolean";
    }): void;
    find(name: string, query: {
        [id: string]: string | number | boolean;
    }): {
        id: string;
    }[];
    findOne(name: string, query: {
        [id: string]: string | number | boolean;
    }): {
        id: string;
    };
    findById(name: string, id: string): {
        [id: string]: string | number | boolean;
    };
    delete(name: string, query: {
        [id: string]: string | number | boolean;
    }): boolean[];
    deleteOne(name: string, query: {
        [id: string]: string | number | boolean;
    }): boolean;
    deleteById(name: string, id: string): boolean;
}
export default CSSDatabase;
