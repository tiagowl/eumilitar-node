const productsDatabase = new Array(5).fill(0).map((_, id) => new Product({
    id,
    code: id * 10,
    course: 'esa',
    name: faker.lorem.sentence(),
    expirationTime: 360 * 24 * 60 * 60 * 1000,
}));

class ProductTestRepository implements ProductRepositoryInterface {
    private database = productsDatabase;

    public async get(filter: Partial<ProductInterface>) {
        return this.database.find((correction => (Object.entries(filter) as [keyof ProductInterface, any][])
            .reduce((valid, [key, value]) => valid && (correction[key] === value), true as boolean))
        ) as Product;
    }

    public async create(data: ProductCreation) {
        const product = new Product({
            id: this.database.length,
            ...data,
        });
        this.database.push(product);
        return product;
    }

    public async filter(filter: Partial<ProductInterface>) {
        const fields = Object.entries(filter) as [keyof ProductInterface, any][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ))
    }

    public async update(id: number, data: Partial<ProductInterface>) {
        let product: Product;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                product = item;
            }
            return item;
        });
        // @ts-ignore
        return product;
    }
}



describe('#6 Produtos', () => {
    test('Recuperação', async done => {
        const repository = new ProductTestRepository();
        const useCase = new ProductCase(repository);
        const product = await useCase.get({ code: 10 });
        expect(product).toBeInstanceOf(Product);
        expect(product.id).toBe(1);
        done();
    });
})