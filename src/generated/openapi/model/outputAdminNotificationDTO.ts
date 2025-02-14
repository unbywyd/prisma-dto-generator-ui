/**
 * WTP API Starter
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { InputAdminDTODeletedAt } from './inputAdminDTODeletedAt';
import { OutputAdminDTO } from './outputAdminDTO';
import { OutputAdminDTOCreatedAt } from './outputAdminDTOCreatedAt';


export interface OutputAdminNotificationDTO { 
    id: string;
    adminId: string;
    admin: OutputAdminDTO;
    email?: string;
    phoneNumber?: string;
    isRead: boolean;
    readAt?: InputAdminDTODeletedAt;
    message: string;
    subject?: string;
    createdAt: OutputAdminDTOCreatedAt;
    updatedAt: OutputAdminDTOCreatedAt;
}

