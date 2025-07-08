/**
 * Base Model class with common CRUD operations
 */

class BaseModel {
    constructor(db, tableName) {
        this.db = db;
        this.tableName = tableName;
    }

    /**
     * Find record by ID
     */
    async findById(id) {
        return await this.db.get(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
    }

    /**
     * Find all records with optional conditions
     */
    async findAll(where = '', params = []) {
        let sql = `SELECT * FROM ${this.tableName}`;
        if (where) {
            sql += ` WHERE ${where}`;
        }
        sql += ` ORDER BY id DESC`;
        
        return await this.db.all(sql, params);
    }

    /**
     * Find one record with conditions
     */
    async findOne(where, params = []) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${where} LIMIT 1`;
        return await this.db.get(sql, params);
    }

    /**
     * Create new record
     */
    async create(data) {
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(data);

        const sql = `
            INSERT INTO ${this.tableName} (${fields.join(', ')})
            VALUES (${placeholders})
        `;

        const result = await this.db.run(sql, values);
        return await this.findById(result.lastID);
    }

    /**
     * Update record by ID
     */
    async update(id, data) {
        // Add updated_at timestamp if table has this field
        if (data.updated_at === undefined) {
            data.updated_at = new Date().toISOString();
        }

        const fields = Object.keys(data);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(data), id];

        const sql = `
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = ?
        `;

        await this.db.run(sql, values);
        return await this.findById(id);
    }

    /**
     * Delete record by ID
     */
    async delete(id) {
        const result = await this.db.run(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return result.changes > 0;
    }

    /**
     * Count records with optional conditions
     */
    async count(where = '', params = []) {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        if (where) {
            sql += ` WHERE ${where}`;
        }
        
        const result = await this.db.get(sql, params);
        return result.count;
    }

    /**
     * Check if record exists
     */
    async exists(where, params = []) {
        const count = await this.count(where, params);
        return count > 0;
    }
}

module.exports = BaseModel;