export class NotFoundMaterialException extends Error {
    material: string;

    constructor(material: string) {
        super(`Error material price not found: ${material}`);
        this.material = material;
    };
}