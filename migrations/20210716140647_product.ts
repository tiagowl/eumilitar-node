import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable('products');
    if (!exists) {
        await knex.schema.createTable('products', table => {
            table.specificType('product_id', 'int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY');
            table.string('product_name', 100).notNullable();
            table.integer('course_tag', 1).notNullable();
            table.integer('id_hotmart').unique()
                .notNullable().index('id_hotmart');
        });
    }
}


export async function down(knex: Knex): Promise<void> { }

