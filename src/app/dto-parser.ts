import { OutputEnumDTO, OutputFieldDTO, OutputModelDTO, OutputSchemaDTO } from "../generated/openapi";

export type ModelType = OutputModelDTO & {
    type?: "input" | "output" | "extra";
    isExluded?: boolean;
}

export type ModelField = OutputFieldDTO & {
    isExtra?: boolean;
}

interface PrismaClassDTOGeneratorModelConfig {
    excludeFields?: string[]; // Поля, которые нужно исключить из модели
    excludeModels?: string[]; // Модели, которые нужно исключить
    makeFieldsOptional?: boolean; // Сделать все поля опциональными
    excludeModelFields?: {
        [modelName: string]: string[]; // Исключенные поля для каждой модели
    };
    includeModelFields?: {
        [modelName: string]: Array<string | OutputFieldDTO>; // Включенные поля для каждой модели
    };
    includeRelations?: boolean; // Включать ли реляционные связи
    extendModels?: {
        [modelName: string]: {
            fields: Array<OutputFieldDTO>; // Поля, расширяющие модель
        };
    };
}

interface PrismaClassDTOGeneratorListModelConfig {
    pagination?: boolean; // Включить пагинацию
    outputModelName?: string; // Название модели для массива элементов
    filters?: Array<string | OutputFieldDTO>; // Фильтры для списка
    orderable?: boolean | string[]; // Возможность сортировки или список сортируемых полей
}

interface PrismaClassDTOGeneratorExtraOptions {
    skipExtraPrefix?: boolean; // Пропустить дополнительный префикс
}

interface PrismaClassDTOGeneratorExtraEnums {
    [enumName: string]: {
        values: string[]; // Список значений для перечисления
    };
}

interface PrismaClassDTOGeneratorExtraModels {
    [modelName: string]: {
        type: 'input' | 'output'; // Тип модели: входная или выходная
        fields: Array<OutputFieldDTO>; // Поля модели
    };
}

interface PrismaClassDTOGeneratorExtraConfig {
    options?: PrismaClassDTOGeneratorExtraOptions; // Дополнительные опции
    enums?: PrismaClassDTOGeneratorExtraEnums; // Перечисления
    models?: PrismaClassDTOGeneratorExtraModels; // Дополнительные модели
}

export interface PrismaClassDTOGeneratorConfig {
    input: PrismaClassDTOGeneratorModelConfig; // Конфигурация для входных моделей
    output: PrismaClassDTOGeneratorModelConfig; // Конфигурация для выходных моделей
    strictMode?: boolean; // Строгий режим
    excludeModels?: string[]; // Модели, которые нужно исключить
    lists?: {
        [modelName: string]: PrismaClassDTOGeneratorListModelConfig; // Конфигурация для списка моделей
    };
    extra?: PrismaClassDTOGeneratorExtraConfig; // Дополнительные модели, перечисления и опции
}


export type ListItem = {
    pagination?: boolean,
    model?: ModelType,
    modelName?: string,
    filters?: Array<OutputFieldDTO>,
    orderable?: Array<string> | boolean,
    outputModelName?: string,
    orderableList?: Array<string>,
}

export type ParsedDTOResult = {
    extraEnums: Array<OutputEnumDTO>;
    extraModels: Array<ModelType>;
    inputModels: Array<ModelType>;
    outputModels: Array<ModelType>;
    lists: Array<ListItem>;
};

export function parseDtoSchema(
    dtoSchema: PrismaClassDTOGeneratorConfig,
    prismaSchema: OutputSchemaDTO
): ParsedDTOResult {
    const extraEnums: Array<OutputEnumDTO> = [];
    const extraModels: Array<ModelType> = [];
    const inputModels: Array<ModelType> = [];
    const outputModels: Array<ModelType> = [];
    const lists: Array<ListItem> = [];

    const prismaModels = prismaSchema.models.reduce((acc, model) => {
        acc[model.name] = model.fields;
        return acc;
    }, {} as Record<string, OutputFieldDTO[]>);

    // Extra models
    if (dtoSchema.extra?.models) {
        for (const [modelName, modelConfig] of Object.entries(
            dtoSchema.extra.models
        )) {
            extraModels.push({
                name: modelName,
                fields: modelConfig?.fields || [],
                type: modelConfig.type
            });
        }
    }

    // Extra enums
    if (dtoSchema.extra?.enums) {
        for (const [enumName, enumConfig] of Object.entries(dtoSchema.extra.enums)) {
            extraEnums.push({
                name: enumName,
                values: enumConfig.values,
            });
        }
    }

    // Input and Output models
    const processModels = (
        config: PrismaClassDTOGeneratorModelConfig,
        type: 'input' | 'output'
    ) => {
        for (const [modelName, fieldsConfig] of Object.entries(
            config?.includeModelFields || {}
        )) {
            const prismaFields = prismaModels[modelName] || [];
            const modelFields: OutputFieldDTO[] = fieldsConfig.map(fieldConfig => {
                const fieldName = typeof fieldConfig === 'string' ? fieldConfig : fieldConfig.name;

                const prismaField = prismaFields.find(f => f.name === fieldName);

                if (typeof fieldConfig === 'string' && prismaField) {
                    return prismaField
                } else if (typeof fieldConfig !== 'string') {
                    return {
                        ...prismaField,
                        ...fieldConfig,
                    }
                } else {
                    return null;
                }

            }) as any;

            const model: ModelType = {
                name: modelName,
                fields: modelFields.filter(f => f) as any,
                type,
            };

            if (type === 'input') {
                inputModels.push(model);
            } else {
                outputModels.push(model);
            }
        }
    };

    processModels(dtoSchema.input, 'input');
    processModels(dtoSchema.output, 'output');

    // Lists
    if (dtoSchema.lists) {
        for (const [modelName, listConfig] of Object.entries(
            dtoSchema.lists
        )) {
            let sourceOutputModelName = listConfig?.outputModelName || modelName;

            let model = outputModels.find(m => m.name === sourceOutputModelName);
            if (!model) {
                model = extraModels.find(m => m.name === sourceOutputModelName);
            }
            const prismaFields = model?.fields || [];
            const filters = (listConfig?.filters || []).map(filter => {

                const fieldName = typeof filter === 'string' ? filter : filter.name;
                const prismaField = prismaFields.find(f => f.name === fieldName);
                if (typeof filter === 'string') {
                    return prismaField || null;
                } else {
                    return {
                        ...prismaField,
                        ...filter,
                    }
                }
            });

            // extraModels.find(m => m.name === modelName) : outputModels.find(m => m.name === modelName)
            let outputModelName = listConfig?.outputModelName ? listConfig?.outputModelName : `Output${modelName}`;

            const orderable = listConfig?.orderable == true || Array.isArray(listConfig?.orderable) && listConfig?.orderable.length > 0;
            lists.push({
                pagination: listConfig?.pagination || false,
                model: model,
                outputModelName: outputModelName,
                modelName: modelName,
                filters: filters?.filter(f => f) as any,
                orderable: orderable || false,
                orderableList: typeof listConfig?.orderable === 'boolean' ? [] : listConfig?.orderable,
            });
        }
    }

    return {
        extraEnums,
        extraModels,
        inputModels,
        outputModels,
        lists,
    };
}
