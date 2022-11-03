import Dexie from "https://cdn.jsdelivr.net/npm/dexie@3.0.3/dist/dexie.mjs";

export class IndexedDB {

    #db = null;
    #name = '';
    #collection = '';
    #version = 1;
    #properties = '';

    constructor(name, collection, version, properties) {

        this.#db = new Dexie(name);
        this.#name = name;
        this.#collection =  collection;
        this.#version = version;

        this.#db.version(version).stores({ [collection]: properties });

        this.#db.open();
    }
    
    async getAll() {
        return await this.#db[this.#collection].toArray();
    }

    async getByProperty(property, value) {
        return await this.#db[this.#collection].where(property).equals(value).toArray();
    }

    async getByOnePropertyOrAnother(property, anotherProperty, value) {
        const data = await this.#db[this.#collection].where(property).equals(value).toArray();

        if (data && data.length !== 0) return data;

        return await this.#db[this.#collection].where(anotherProperty).equals(value).toArray();
    }

    async add(data) {
        await this.#db[this.#collection].add(data);
    }    

    async bulkAdd(data) {
        await this.#db[this.#collection].bulkPut(data);
    }

    async update(property, value, data) {
        const oldData = await this.#db[this.#collection].where(property).equals(value).toArray();

        if (oldData && oldData.length !== 0)
            await this.delete(property, value).then(async () => await this.add(data));
    }

    async delete(property, value) {
        this.#db[this.#collection].where(property).equals(value).delete().then((count) => { return count });
    }

}

export async function checkIfDatabaseExists(dbName) {
    return Dexie.exists(dbName);
}
