/**
 * WTP API Starter
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { OutputMediaDTO } from './outputMediaDTO';
import { InputAdminDTODeletedAt } from './inputAdminDTODeletedAt';
import { OutputAdminDTO } from './outputAdminDTO';
import { OutputAdminDTOCreatedAt } from './outputAdminDTOCreatedAt';


export interface OutputPageDTO { 
    id: string;
    slug: string;
    title: string;
    content?: string;
    updatedById?: string;
    updatedBy?: OutputAdminDTO;
    media: Array<OutputMediaDTO>;
    isActive: boolean;
    deletedAt?: InputAdminDTODeletedAt;
    isDeleted: boolean;
    createdAt: OutputAdminDTOCreatedAt;
    updatedAt: OutputAdminDTOCreatedAt;
}

