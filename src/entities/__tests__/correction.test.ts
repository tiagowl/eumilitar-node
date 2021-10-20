import faker from "faker";
import Correction from "../Correction";

test('Entidade da correção', () => {
    const correction = new Correction({
        'id': 4,
        'essay': 3,
        'accentuation': "Sim",
        'agreement': "Sim",
        'cohesion': "Sim",
        'comment': faker.lorem.lines(5),
        'conclusion': "Sim",
        'correctionDate': new Date(),
        'erased': "Não",
        'followedGenre': "Sim",
        'hasMarginSpacing': "Sim",
        'isReadable': "Sim",
        'obeyedMargins': "Sim",
        'organized': "Sim",
        'orthography': "Sim",
        'points': 10,
        'repeated': "Não",
        'understoodTheme': "Sim",
        'veryShortSentences': "Não",
    });
    expect(correction.id).toBe(4);
    expect(() => {
        // @ts-ignore
        correction.id = 5;
    }).toThrowError();
});
