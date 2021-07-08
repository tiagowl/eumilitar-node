import { Knex } from "knex";

const questions = [
    'A letra está legível?',
    'Houve afastamento de margem para indicar parágrafo?',
    'Obedeceu às margens?',
    'Rasurou o texto definitivo?',
    'Quanto à ortografia?',
    'Aplicou devidamente a acentuação?',
    'Acertou na concordância?',
    'Repetiu palavras demais?',
    'Usou frases muito curtas?',
    'Compreendeu e desenvolveu o tema proposto?',
    'Seguiu o gênero proposto?',
    'Quanto à coesão?',
    'Organizou o texto de forma lógica?',
    'Conclusão finalizada com os termos que o tema pede?',
];

export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable('essay_grading');
    if (!exists) {
        return knex.schema.createTable('essay_grading', table => {
            table.increments('grading_id').index().notNullable();
            table.text('grading_comments').notNullable();
            table.integer('essay_id')
                .references('essay_id').inTable('essays')
                .onDelete('CASCADE').onUpdate('CASCADE')
                .notNullable();
            table.dateTime('grading_date').defaultTo(knex.fn.now())
                .notNullable();
            table.decimal('final_grading', 2, 1).notNullable();
            questions.forEach((question, index) => {
                table.string(`criteria${index + 1}`, 25).notNullable()
                    .comment(question);
            });
        });
    }
}


export async function down(knex: Knex): Promise<void> { }

