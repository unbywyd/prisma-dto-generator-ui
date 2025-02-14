import { OutputEnumDTO, OutputFieldDTO, OutputModelDTO, OutputSchemaDTO } from "../generated/openapi";

export type ModelType = OutputModelDTO & {
    type?: "input" | "output" | "extra";
}

export type ModelField = OutputFieldDTO & {
    isExtra?: boolean;
}

interface PrismaClassDTOGeneratorModelConfig {
    excludeFields?: string[]; // Поля, которые нужно исключить из модели
    excludeModels?: string[]; // Модели, которые нужно исключить
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
    pagination?: true; // Включить пагинацию
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
    excludeModels?: string[]; // Модели, которые нужно исключить
    list?: {
        models: {
            [modelName: string]: PrismaClassDTOGeneratorListModelConfig; // Конфигурация для списка моделей
        };
    };
    extra?: PrismaClassDTOGeneratorExtraConfig; // Дополнительные модели, перечисления и опции
}


export type ListItem = {
    pagination?: boolean,
    model?: ModelType,
    modelName?: string,
    filters?: Array<OutputFieldDTO>,
    orderable?: Array<string> | boolean
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
                if (typeof fieldConfig === 'string') {
                    const prismaField = prismaFields.find(f => f.name === fieldConfig);
                    return prismaField
                        ? prismaField
                        : {
                            name: fieldConfig,
                            type: 'String',
                            isRequired: false
                        };
                } else {
                    return fieldConfig
                }
            }) as any;

            const model: ModelType = {
                name: modelName,
                fields: modelFields,
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
    if (dtoSchema.list?.models) {
        for (const [modelName, listConfig] of Object.entries(
            dtoSchema.list.models
        )) {
            const prismaFields = prismaModels[modelName] || [];
            const filters = (listConfig.filters || []).map(filter =>
                typeof filter === 'string'
                    ? prismaFields.find(f => f.name === filter) || {
                        name: filter,
                        type: 'String'
                    }
                    : filter
            );
            const outputModelName = listConfig.outputModelName || modelName;
            const model = listConfig.outputModelName ? extraModels.find(m => m.name === modelName) : outputModels.find(m => m.name === modelName);
            lists.push({
                pagination: listConfig.pagination || false,
                model: model,
                modelName: outputModelName,
                filters: filters as any,
                orderable: listConfig.orderable || false,
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
